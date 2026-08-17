import { Request, Response } from "express";
import { prisma } from "../prisma";
import { verifyQrData } from "../lib/ticketCode";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

export async function getTicketByCode(req: Request, res: Response): Promise<void> {
  const { code } = req.params;

  const ticket = await prisma.ticket.findUnique({
    where:   { code },
    include: {
      order: {
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ingresso não encontrado." });
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
  const { token } = req.params;

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
export async function validateTicket(req: Request, res: Response): Promise<void> {
  const { code } = req.params;
  const { qrData } = req.body as { qrData?: string };

  if (qrData) {
    const { valid, code: qrCode } = verifyQrData(qrData);
    if (!valid || qrCode !== code) {
      res.status(400).json({ error: "QR Code inválido ou adulterado." });
      return;
    }
  }

  try {
    const ticket = await prisma.$transaction(async (tx) => {
      // Busca o ticket com lock para evitar dupla validação concorrente
      const found = await tx.ticket.findUnique({
        where:   { code },
        include: {
          order: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      });

      if (!found) throw new Error("NOT_FOUND");
      if (found.status === "USED")      throw new Error("ALREADY_USED");
      if (found.status === "CANCELLED") throw new Error("CANCELLED");

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
      ok:        true,
      code:      ticket.code,
      validatedAt: ticket.usedAt,
      holder:    ticket.order.user.name,
      eventName: ticket.order.eventName,
      tierLabel: ticket.order.tierLabel,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "NOT_FOUND")   { res.status(404).json({ error: "Ingresso não encontrado." }); return; }
      if (err.message === "ALREADY_USED"){ res.status(409).json({ error: "Ingresso já utilizado.", ok: false }); return; }
      if (err.message === "CANCELLED")   { res.status(403).json({ error: "Ingresso cancelado.", ok: false }); return; }
    }
    throw err;
  }
}
