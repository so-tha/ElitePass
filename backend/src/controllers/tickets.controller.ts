import { Request, Response } from "express";
import { prisma } from "../prisma";
import { stripe } from "../lib/stripe";
import { verifyQrData } from "../lib/ticketCode";
import { broadcastSeatUpdate } from "../lib/socket";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import type { Prisma } from "../generated/client/client";

function organizerOwnsTicket(
  ticket: { order: { event: { organizerId: string } | null } },
  user: { userId: string; role: string }
): boolean {
  if (user.role !== "ORGANIZER") return true;
  if (!ticket.order.event) return true;
  return ticket.order.event.organizerId === user.userId;
}

export async function getTicketByCode(req: Request, res: Response): Promise<void> {
  const code = req.params.code as string;
  const { user } = req as AuthenticatedRequest;

  const ticket = await prisma.ticket.findUnique({
    where:   { code },
    include: {
      order: {
        include: {
          user:  { select: { name: true, email: true } },
          event: { select: { organizerId: true } },
        },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ingresso não encontrado." });
    return;
  }

  if (!organizerOwnsTicket(ticket, user)) {
    res.status(403).json({ error: "Acesso não autorizado para este ingresso." });
    return;
  }

  res.json({
    code:      ticket.code,
    status:    ticket.status,
    usedAt:    ticket.usedAt,
    eventName: ticket.order.eventName,
    eventDate: ticket.order.eventDate,
    tierLabel: ticket.order.tierLabel,
    holder:    ticket.order.user.name,
  });
}

export async function getTicketByShareToken(req: Request, res: Response): Promise<void> {
  const token = req.params.token as string;

  const ticket = await prisma.ticket.findUnique({
    where:   { shareToken: token },
    include: {
      order: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Link de ingresso inválido ou expirado." });
    return;
  }

  res.json({
    code:        ticket.code,
    qrData:      ticket.qrData,
    status:      ticket.status,
    eventName:   ticket.order.eventName,
    eventDate:   ticket.order.eventDate,
    eventVenue:  ticket.order.eventVenue,
    tierLabel:   ticket.order.tierLabel,
    holder:      ticket.order.user.name,
  });
}

/** Erro tipado para os desfechos de validação (mapeado para reason no JSON de resposta). */
class ValidationError extends Error {
  constructor(public reason: string, public status: number, public extra?: Record<string, unknown>) {
    super(reason);
  }
}

const REASON_MESSAGES: Record<string, string> = {
  NOT_FOUND:    "Ingresso não encontrado.",
  FORBIDDEN:    "Acesso não autorizado para este ingresso.",
  CANCELLED:    "Ingresso cancelado.",
  ALREADY_USED: "Ingresso já utilizado.",
};

export async function validateTicket(req: Request, res: Response): Promise<void> {
  const code = req.params.code as string;
  const { qrData } = req.body as { qrData?: string };
  const { user } = req as AuthenticatedRequest;

  if (qrData) {
    const { valid, code: qrCode } = verifyQrData(qrData);
    if (!valid || qrCode !== code) {
      res.status(400).json({ error: "QR Code inválido ou adulterado.", ok: false, reason: "INVALID_QR" });
      return;
    }
  }

  try {
    const ticket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // O identificador vindo da portaria pode ser o código legível (QR / digitação) ou o
      // shareToken (quando o link público do ingresso é colado no campo de código manual).
      const found = await tx.ticket.findFirst({
        where:   { OR: [{ code }, { shareToken: code }] },
        include: {
          order: {
            include: {
              user:  { select: { name: true, email: true } },
              event: { select: { organizerId: true } },
            },
          },
        },
      });

      if (!found) throw new ValidationError("NOT_FOUND", 404);
      if (!organizerOwnsTicket(found, user)) throw new ValidationError("FORBIDDEN", 403);
      if (found.status === "CANCELLED") throw new ValidationError("CANCELLED", 403);
      if (found.status === "USED") {
        throw new ValidationError("ALREADY_USED", 409, { usedAt: found.usedAt, holder: found.order.user.name });
      }

      return tx.ticket.update({
        where:   { id: found.id },
        data:    { status: "USED", usedAt: new Date() },
        include: {
          order: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });
    });

    res.json({
      ok:          true,
      reason:      "VALID",
      code:        ticket.code,
      validatedAt: ticket.usedAt,
      holder:      ticket.order.user.name,
      eventName:   ticket.order.eventName,
      tierLabel:   ticket.order.tierLabel,
    });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(err.status).json({
        ok:     false,
        reason: err.reason,
        error:  REASON_MESSAGES[err.reason] ?? "Não foi possível validar o ingresso.",
        ...err.extra,
      });
      return;
    }
    throw err;
  }
}

/** Erro tipado para os desfechos de cancelamento (mapeado para reason no JSON de resposta). */
class CancelError extends Error {
  constructor(public reason: string, public status: number) {
    super(reason);
  }
}

const CANCEL_REASON_MESSAGES: Record<string, string> = {
  NOT_FOUND:          "Ingresso não encontrado.",
  ALREADY_CANCELLED:  "Este ingresso já foi cancelado.",
  ALREADY_USED:       "Ingressos já validados na portaria não podem ser cancelados.",
  EVENT_PASSED:       "Não é possível cancelar o ingresso de um evento que já ocorreu.",
  REFUND_FAILED:      "Não foi possível estornar o pagamento. Tente novamente em instantes.",
};

/**
 * POST /tickets/:id/cancel — Cliente cancela um ingresso próprio.
 *
 * Estorna o pagamento proporcional na Stripe, devolve a vaga ao estoque do evento (soldCount ou
 * assento reservado) e marca o ingresso como CANCELLED. Se todos os ingressos do pedido forem
 * cancelados, o pedido também é marcado como CANCELLED.
 */
export async function cancelTicket(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const { userId } = (req as AuthenticatedRequest).user;

  try {
    const ticket = await prisma.ticket.findUnique({
      where:   { id },
      include: { order: { include: { event: true } } },
    });

    if (!ticket || ticket.order.userId !== userId) throw new CancelError("NOT_FOUND", 404);
    if (ticket.status === "CANCELLED") throw new CancelError("ALREADY_CANCELLED", 409);
    if (ticket.status === "USED") throw new CancelError("ALREADY_USED", 409);

    const eventDate = ticket.order.event?.date ?? (ticket.order.eventDate ? new Date(ticket.order.eventDate) : null);
    if (eventDate && eventDate.getTime() < Date.now()) throw new CancelError("EVENT_PASSED", 409);

    let refunded = false;
    if (ticket.order.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: ticket.order.paymentIntentId,
          amount:         Math.round((ticket.order.totalAmount / ticket.order.quantity) * 100),
        });
        refunded = true;
      } catch {
        throw new CancelError("REFUND_FAILED", 502);
      }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.ticket.update({
        where: { id },
        data:  { status: "CANCELLED", cancelledAt: new Date() },
      });

      if (ticket.order.localEventId) {
        await tx.event.update({
          where: { id: ticket.order.localEventId },
          data:  { soldCount: { decrement: 1 } },
        });
      }

      if (ticket.seatLabel) {
        await tx.seat.deleteMany({
          where: { eventId: ticket.order.eventId, label: ticket.seatLabel },
        });
      }

      const remainingActive = await tx.ticket.count({
        where: { orderId: ticket.orderId, status: { not: "CANCELLED" } },
      });
      if (remainingActive === 0) {
        await tx.order.update({ where: { id: ticket.orderId }, data: { status: "CANCELLED" } });
      }
    });

    if (ticket.seatLabel) {
      broadcastSeatUpdate(ticket.order.eventId, { label: ticket.seatLabel, status: "AVAILABLE" });
    }

    res.json({ message: "Ingresso cancelado com sucesso.", refunded });
  } catch (err) {
    if (err instanceof CancelError) {
      res.status(err.status).json({ error: CANCEL_REASON_MESSAGES[err.reason], reason: err.reason });
      return;
    }
    throw err;
  }
}

