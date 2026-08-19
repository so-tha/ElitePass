import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import { ALL_SEAT_LABELS, HOLD_DURATION_MS, SEAT_ROWS, SEATS_PER_ROW, isValidSeatLabel } from "../lib/seatLayout";
import { broadcastSeatUpdate } from "../lib/socket";

/**
 * Libera (apaga) reservas HELD expiradas. Assentos livres não têm linha na tabela, então
 * "liberar" é simplesmente remover a linha. Retorna os assentos liberados para quem quiser
 * avisar os clientes conectados via socket.
 */
export async function releaseExpiredHolds(eventId?: string): Promise<{ eventId: string; label: string }[]> {
  const now = new Date();
  const expired = await prisma.seat.findMany({
    where: { status: "HELD", holdExpiresAt: { lt: now }, ...(eventId ? { eventId } : {}) },
    select: { id: true, eventId: true, label: true },
  });

  if (expired.length === 0) return [];

  await prisma.seat.deleteMany({ where: { id: { in: expired.map((s) => s.id) } } });

  return expired.map(({ eventId, label }) => ({ eventId, label }));
}

/** GET /api/seats/:eventId — mapa completo de assentos (livres + reservados + vendidos) */
export async function getSeatMap(req: Request, res: Response): Promise<void> {
  const eventId = req.params.eventId as string;

  await releaseExpiredHolds(eventId);

  const seats = await prisma.seat.findMany({ where: { eventId } });
  const byLabel = new Map(seats.map((s) => [s.label, s]));

  const map = ALL_SEAT_LABELS.map((label) => {
    const seat = byLabel.get(label);
    if (!seat) return { label, status: "AVAILABLE" as const };
    return {
      label,
      status: seat.status,
      heldByUserId: seat.status === "HELD" ? seat.heldByUserId : undefined,
      holdExpiresAt: seat.status === "HELD" ? seat.holdExpiresAt : undefined,
    };
  });

  res.json({ eventId, rows: SEAT_ROWS, seatsPerRow: SEATS_PER_ROW, seats: map });
}

const seatLabelBodySchema = z.object({ label: z.string().min(1) });

/** POST /api/seats/:eventId/hold — reserva temporariamente um assento para o usuário logado */
export async function holdSeat(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const eventId = req.params.eventId as string;

  const parse = seatLabelBodySchema.safeParse(req.body);
  if (!parse.success || !isValidSeatLabel(parse.data.label)) {
    res.status(400).json({ error: "Assento inválido." });
    return;
  }
  const { label } = parse.data;

  await releaseExpiredHolds(eventId);

  try {
    const seat = await prisma.$transaction(async (tx) => {
      const existing = await tx.seat.findUnique({ where: { eventId_label: { eventId, label } } });
      const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS);

      if (existing) {
        if (existing.status === "SOLD") throw new Error("SEAT_SOLD");
        if (existing.heldByUserId !== userId) throw new Error("SEAT_HELD");
        return tx.seat.update({ where: { id: existing.id }, data: { holdExpiresAt } });
      }

      return tx.seat.create({
        data: { eventId, label, status: "HELD", heldByUserId: userId, holdExpiresAt },
      });
    });

    broadcastSeatUpdate(eventId, {
      label,
      status: "HELD",
      heldByUserId: userId,
      holdExpiresAt: seat.holdExpiresAt,
    });

    res.json({ label, status: "HELD", holdExpiresAt: seat.holdExpiresAt });
  } catch (err) {
    if (err instanceof Error && err.message === "SEAT_SOLD") {
      res.status(409).json({ error: "Este assento já foi vendido." });
      return;
    }
    if (err instanceof Error && err.message === "SEAT_HELD") {
      res.status(409).json({ error: "Este assento já está sendo selecionado por outra pessoa." });
      return;
    }
    throw err;
  }
}

/** POST /api/seats/:eventId/release — libera um assento reservado pelo próprio usuário */
export async function releaseSeat(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const eventId = req.params.eventId as string;

  const parse = seatLabelBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: "Assento inválido." });
    return;
  }
  const { label } = parse.data;

  const existing = await prisma.seat.findUnique({ where: { eventId_label: { eventId, label } } });
  if (existing && existing.status === "HELD" && existing.heldByUserId === userId) {
    await prisma.seat.delete({ where: { id: existing.id } });
    broadcastSeatUpdate(eventId, { label, status: "AVAILABLE" });
  }

  res.json({ label, status: "AVAILABLE" });
}
