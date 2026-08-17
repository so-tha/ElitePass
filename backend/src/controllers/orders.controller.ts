import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { generateTicketCode, generateQrData } from "../lib/ticketCode";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

// ─── Schema ───────────────────────────────────────────────────

const createOrderSchema = z.object({
  eventId:    z.string().min(1),
  eventType:  z.enum(["SHOW", "MOVIE"]),
  eventName:  z.string().min(1),
  eventDate:  z.string().optional(),
  eventVenue: z.string().optional(),
  tierId:     z.string().min(1),
  tierLabel:  z.string().min(1),
  priceUnit:  z.number().positive(),
  quantity:   z.number().int().min(1).max(10),
});

// ─── Controllers ──────────────────────────────────────────────

/** POST /orders — Cria pedido e emite ingressos (CLIENT) */
export async function createOrder(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const {
    eventId, eventType, eventName, eventDate, eventVenue,
    tierId, tierLabel, priceUnit, quantity,
  } = parse.data;

  const fee         = Math.round(priceUnit * quantity * 0.12 * 100) / 100;
  const totalAmount = Math.round(priceUnit * quantity * 100) / 100 + fee;

  // Transação: cria Order + Tickets atomicamente
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        eventId, eventType, eventName, eventDate, eventVenue,
        tierId, tierLabel, priceUnit, quantity, fee, totalAmount,
        status: "CONFIRMED",
      },
    });

    const ticketData = Array.from({ length: quantity }, () => {
      const code   = generateTicketCode(eventName, tierLabel);
      const qrData = generateQrData(code);
      return { orderId: newOrder.id, code, qrData };
    });

    await tx.ticket.createMany({ data: ticketData });

    return tx.order.findUnique({
      where: { id: newOrder.id },
      include: { tickets: true },
    });
  });

  res.status(201).json({ order });
}

/** GET /orders/mine — Lista pedidos do usuário logado */
export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const orders = await prisma.order.findMany({
    where:   { userId },
    include: { tickets: true },
    orderBy: { createdAt: "desc" },
  });

  res.json({ orders });
}

/** GET /orders/:id — Detalhe de um pedido */
export async function getOrderById(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const { id }     = req.params;

  const order = await prisma.order.findUnique({
    where:   { id },
    include: { tickets: true },
  });

  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado." });
    return;
  }

  // Garante que o usuário só veja seus próprios pedidos
  if (order.userId !== userId) {
    res.status(403).json({ error: "Acesso não autorizado." });
    return;
  }

  res.json({ order });
}
