import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { stripe } from "../lib/stripe";
import { generateTicketCode, generateQrData } from "../lib/ticketCode";
import { tiersArraySchema } from "../lib/eventTiers";
import { AuthenticatedRequest } from "../middlewares/requireAuth";
import type { Prisma } from "../generated/client/client";
import { ORDER_HOLD_EXTENSION_MS } from "../lib/seatLayout";
import { broadcastSeatUpdate } from "../lib/socket";

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
  seatLabels: z.array(z.string().min(1)).max(10).optional(),
});

export async function createOrder(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const { eventId, eventType, eventName, eventDate, eventVenue, tierId, quantity, seatLabels } = parse.data;

  let { tierLabel, priceUnit } = parse.data;

  try {
    if (seatLabels && seatLabels.length > 0) {
      if (seatLabels.length !== quantity) {
        res.status(400).json({ error: "A quantidade de assentos deve ser igual à quantidade de ingressos." });
        return;
      }
      if (new Set(seatLabels).size !== seatLabels.length) {
        res.status(400).json({ error: "Assentos duplicados na seleção." });
        return;
      }

      const seatRows = await prisma.seat.findMany({ where: { eventId, label: { in: seatLabels } } });
      const now = new Date();
      for (const label of seatLabels) {
        const row = seatRows.find((s) => s.label === label);
        if (!row || row.status !== "HELD" || row.heldByUserId !== userId || !row.holdExpiresAt || row.holdExpiresAt < now) {
          res.status(409).json({ error: `O assento ${label} não está mais reservado para você. Selecione novamente.` });
          return;
        }
      }

      await prisma.seat.updateMany({
        where: { eventId, label: { in: seatLabels }, heldByUserId: userId },
        data: { holdExpiresAt: new Date(Date.now() + ORDER_HOLD_EXTENSION_MS) },
      });
    }

    const localEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (localEvent) {
      if (localEvent.status !== "PUBLISHED") {
        res.status(400).json({ error: "Este evento não está disponível para vendas." });
        return;
      }

      const tiers = tiersArraySchema.parse(localEvent.tiers);
      const tier  = tiers.find((t) => t.id === tierId);
      if (!tier) {
        res.status(400).json({ error: "Setor/tier inválido para este evento." });
        return;
      }

      tierLabel = tier.label;
      priceUnit = tier.priceUnit;

      if (localEvent.soldCount + quantity > localEvent.capacity) {
        res.status(409).json({ error: "Ingressos esgotados para a quantidade solicitada." });
        return;
      }
    }

    const fee         = Math.round(priceUnit * quantity * 0.12 * 100) / 100;
    const totalAmount = Math.round(priceUnit * quantity * 100) / 100 + fee;

    const order = await prisma.order.create({
      data: {
        userId,
        eventId, localEventId: localEvent ? eventId : null,
        eventType, eventName, eventDate, eventVenue,
        tierId, tierLabel, priceUnit, quantity, fee, totalAmount,
        seatLabels: seatLabels && seatLabels.length > 0 ? seatLabels : undefined,
        status: "PENDING",
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount:              Math.round(totalAmount * 100),
      currency:            "brl",
      payment_method_types: ["card"],
      metadata:            { orderId: order.id, userId },
    });

    // O checkout de filmes usa um formulário de pagamento simulado (sem Stripe Elements no
    // cliente), então confirmamos aqui mesmo, em modo de teste, com o cartão de teste padrão
    // da Stripe — isso permite que /orders/:id/confirm emita os ingressos normalmente.
    const confirmedIntent =
      eventType === "MOVIE"
        ? await stripe.paymentIntents.confirm(paymentIntent.id, { payment_method: "pm_card_visa" })
        : paymentIntent;

    await prisma.order.update({
      where: { id: order.id },
      data:  { paymentIntentId: confirmedIntent.id },
    });

    res.status(201).json({
      order: { ...order, tickets: [] },
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "TIER_NOT_FOUND") {
      res.status(400).json({ error: "Setor/tier inválido para este evento." });
      return;
    }
    throw err;
  }
}

/** POST /orders/:id/confirm — Verifica o pagamento na Stripe e emite os ingressos */
export async function confirmOrderPayment(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const orderId    = req.params.id as string;

  const order = await prisma.order.findUnique({
    where:   { id: orderId },
    include: { tickets: true },
  });

  if (!order || order.userId !== userId) {
    res.status(404).json({ error: "Pedido não encontrado." });
    return;
  }

  if (order.status === "CONFIRMED") {
    res.json({ order });
    return;
  }

  if (order.status !== "PENDING" || !order.paymentIntentId) {
    res.status(409).json({ error: "Este pedido não está pendente de pagamento." });
    return;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    res.status(402).json({
      error: paymentIntent.last_payment_error?.message ?? "Pagamento não aprovado.",
    });
    return;
  }

  const seatLabels = Array.isArray(order.seatLabels) ? (order.seatLabels as string[]) : [];

  try {
    const confirmedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (order.localEventId) {
        const localEvent = await tx.event.findUnique({ where: { id: order.localEventId } });
        if (!localEvent || localEvent.soldCount + order.quantity > localEvent.capacity) {
          throw new Error("CAPACITY_EXCEEDED");
        }
        await tx.event.update({
          where: { id: order.localEventId },
          data:  { soldCount: { increment: order.quantity } },
        });
      }

      if (seatLabels.length > 0) {
        const seatRows = await tx.seat.findMany({ where: { eventId: order.eventId, label: { in: seatLabels } } });
        const now = new Date();
        for (const label of seatLabels) {
          const row = seatRows.find((s) => s.label === label);
          if (!row || row.status === "SOLD" || row.heldByUserId !== order.userId || !row.holdExpiresAt || row.holdExpiresAt < now) {
            throw new Error("SEAT_UNAVAILABLE");
          }
        }
      }

      const ticketData = Array.from({ length: order.quantity }, (_, i) => {
        const code   = generateTicketCode(order.eventName, order.tierLabel);
        const qrData = generateQrData(code);
        return { orderId: order.id, code, qrData, seatLabel: seatLabels[i] ?? null };
      });
      await tx.ticket.createMany({ data: ticketData });

      if (seatLabels.length > 0) {
        await tx.seat.updateMany({
          where: { eventId: order.eventId, label: { in: seatLabels } },
          data: { status: "SOLD", heldByUserId: null, holdExpiresAt: null, orderId: order.id },
        });
      }

      await tx.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });

      return tx.order.findUnique({ where: { id: order.id }, include: { tickets: true } });
    });

    for (const label of seatLabels) {
      broadcastSeatUpdate(order.eventId, { label, status: "SOLD" });
    }

    res.json({ order: confirmedOrder });
  } catch (err) {
    if (err instanceof Error && err.message === "SEAT_UNAVAILABLE") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      res.status(409).json({ error: "Um ou mais assentos escolhidos não estão mais disponíveis. Entre em contato com o suporte para reembolso." });
      return;
    }
    if (err instanceof Error && err.message === "CAPACITY_EXCEEDED") {
      await prisma.order.update({ where: { id: order.id }, data: { status: "FAILED" } });
      res.status(409).json({ error: "Ingressos esgotados durante o pagamento. Entre em contato com o suporte para reembolso." });
      return;
    }
    throw err;
  }
}


/** GET /orders/mine — Lista pedidos do usuário logado */
export async function getMyOrders(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const orders = await prisma.order.findMany({
    where:   { userId },
    include: { tickets: true, event: true },
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
