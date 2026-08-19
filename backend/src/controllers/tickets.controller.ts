import { Request, Response } from "express";
import { prisma } from "../prisma";
import { verifyQrData } from "../lib/ticketCode";
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
  WRONG_EVENT:  "Este ingresso pertence a outro evento.",
  CANCELLED:    "Ingresso cancelado.",
  ALREADY_USED: "Ingresso já utilizado.",
};

export async function validateTicket(req: Request, res: Response): Promise<void> {
  const code = req.params.code as string;
  const { qrData, eventId } = req.body as { qrData?: string; eventId?: string };
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
      const found = await tx.ticket.findUnique({
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

      if (!found) throw new ValidationError("NOT_FOUND", 404);
      if (!organizerOwnsTicket(found, user)) throw new ValidationError("FORBIDDEN", 403);
      if (eventId && found.order.eventId !== eventId) {
        throw new ValidationError("WRONG_EVENT", 409, { ticketEventName: found.order.eventName });
      }
      if (found.status === "CANCELLED") throw new ValidationError("CANCELLED", 403);
      if (found.status === "USED") {
        throw new ValidationError("ALREADY_USED", 409, { usedAt: found.usedAt, holder: found.order.user.name });
      }

      return tx.ticket.update({
        where:   { code },
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

