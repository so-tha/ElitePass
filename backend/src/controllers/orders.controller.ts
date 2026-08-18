import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { generateTicketCode, generateQrData } from "../lib/ticketCode";
import { tiersArraySchema } from "../lib/eventTiers";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import type { Prisma } from "../generated/client/client";

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

export async function createOrder(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { eventId, eventType, eventName, eventDate, eventVenue, tierId, quantity } = parse.data;

  let { tierLabel, priceUnit } = parse.data;

  try {
    const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

      const localEvent = await tx.event.findUnique({ where: { id: eventId } });
      if (localEvent) {
        if (localEvent.status !== "PUBLISHED") {
          throw new Error("EVENT_NOT_AVAILABLE");
        }

        const tiers = tiersArraySchema.parse(localEvent.tiers);
        const tier  = tiers.find((t) => t.id === tierId);
        if (!tier) {
          throw new Error("TIER_NOT_FOUND");
        }

        tierLabel = tier.label;
        priceUnit = tier.priceUnit;

        if (localEvent.soldCount + quantity > localEvent.capacity) {
          throw new Error("CAPACITY_EXCEEDED");
        }

        await tx.event.update({
          where: { id: eventId },
          data:  { soldCount: { increment: quantity } },
        });
      }

      const fee         = Math.round(priceUnit * quantity * 0.12 * 100) / 100;
      const totalAmount = Math.round(priceUnit * quantity * 100) / 100 + fee;

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
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "EVENT_NOT_AVAILABLE") {
        res.status(400).json({ error: "Este evento não está disponível para vendas." });
        return;
      }
      if (err.message === "TIER_NOT_FOUND") {
        res.status(400).json({ error: "Setor/tier inválido para este evento." });
        return;
      }
      if (err.message === "CAPACITY_EXCEEDED") {
        res.status(409).json({ error: "Ingressos esgotados para a quantidade solicitada." });
        return;
      }
    }
    throw err;
  }
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
  const id         = req.params.id as string;

  const order = await prisma.order.findUnique({
    where:   { id },
    include: { tickets: true },
  });


  if (!order) {
    res.status(404).json({ error: "Pedido não encontrado." });
    return;
  }

  if (order.userId !== userId) {
    res.status(403).json({ error: "Acesso não autorizado." });
    return;
  }

  res.json({ order });
}
