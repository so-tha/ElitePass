import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { tierSchema } from "../lib/eventTiers";
import { AuthenticatedRequest } from "../middlewares/requireAuth";

const createEventSchema = z.object({
  title:       z.string().min(3, "Título deve ter ao menos 3 caracteres"),
  description: z.string().optional(),
  category:    z.string().min(1, "Categoria é obrigatória"),
  type:        z.enum(["SHOW", "MOVIE"]).default("SHOW"),
  imageUrl:    z.string().url().optional().or(z.literal("")),
  venue:       z.string().min(1, "Local do evento é obrigatório"),
  city:        z.string().min(1, "Cidade é obrigatória"),
  date:        z.string().transform((str) => new Date(str)),
  capacity:    z.number().int().positive("Capacidade deve ser maior que zero"),
  tiers:       z.array(tierSchema).min(1, "Ao menos um setor/tier deve ser definido"),
});

const updateEventSchema = createEventSchema.partial();

export async function createEvent(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const parse = createEventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const data = parse.data;

  const event = await prisma.event.create({
    data: {
      organizerId: userId,
      title:       data.title,
      description: data.description,
      category:    data.category,
      type:        data.type,
      imageUrl:    data.imageUrl || null,
      venue:       data.venue,
      city:        data.city,
      date:        data.date,
      capacity:    data.capacity,
      tiers:       data.tiers,
      status:      "PUBLISHED",
    },
  });

  res.status(201).json({ event });
}

/** GET /events — Lista eventos disponíveis no sistema */
export async function getEvents(req: Request, res: Response): Promise<void> {
  const { search, category, type } = req.query;

  const where: any = {
    status: "PUBLISHED",
  };

  if (search && typeof search === "string") {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { city:  { contains: search, mode: "insensitive" } },
      { venue: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category && typeof category === "string") {
    where.category = { equals: category, mode: "insensitive" };
  }

  if (type === "SHOW" || type === "MOVIE") {
    where.type = type;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ events });
}

/** GET /events/:id — Busca detalhes do evento */
export async function getEventById(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
    },
  });

  if (!event) {
    res.status(404).json({ error: "Evento não encontrado." });
    return;
  }

  res.json({ event });
}

/** GET /events/organizer/mine — Lista eventos criados pelo organizador logado */
export async function getMyEvents(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    orderBy: { createdAt: "desc" },
  });

  res.json({ events });
}

/** PUT /events/:id — Atualiza evento (ORGANIZER) */
export async function updateEvent(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const id         = req.params.id as string;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Evento não encontrado." });
    return;
  }

  if (existing.organizerId !== userId) {
    res.status(403).json({ error: "Acesso não autorizado para este evento." });
    return;
  }

  const parse = updateEventSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.flatten().fieldErrors });
    return;
  }

  const updated = await prisma.event.update({
    where: { id },
    data:  parse.data,
  });

  res.json({ event: updated });
}

/** DELETE /events/:id — Cancela um evento (ORGANIZER) */
export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const id         = req.params.id as string;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ error: "Evento não encontrado." });
    return;
  }

  if (existing.organizerId !== userId) {
    res.status(403).json({ error: "Acesso não autorizado para este evento." });
    return;
  }

  const cancelled = await prisma.event.update({
    where: { id },
    data:  { status: "CANCELLED" },
  });

  res.json({ message: "Evento cancelado com sucesso.", event: cancelled });
}

/** GET /events/:id/stats — Métricas e vendas em tempo real do evento (ORGANIZER) */
export async function getEventStats(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;
  const id         = req.params.id as string;

  const event = (await prisma.event.findUnique({
    where: { id },
    include: {
      orders: {
        where: { status: "CONFIRMED" },
        include: { tickets: true },
      },
    },
  })) as any;

  if (!event) {
    res.status(404).json({ error: "Evento não encontrado." });
    return;
  }

  if (event.organizerId !== userId) {
    res.status(403).json({ error: "Acesso não autorizado." });
    return;
  }

  const totalOrders = event.orders.length;
  const totalRevenue = event.orders.reduce((sum: number, order: { totalAmount: number }) => sum + order.totalAmount, 0);
  const totalTicketsSold = event.soldCount;

  const remainingCapacity = Math.max(0, event.capacity - event.soldCount);
  const occupancyPercentage = Math.min(100, Math.round((event.soldCount / event.capacity) * 100));

  const tierStats: Record<string, { label: string; sold: number; revenue: number }> = {};
  for (const order of event.orders) {
    if (!tierStats[order.tierId]) {
      tierStats[order.tierId] = { label: order.tierLabel, sold: 0, revenue: 0 };
    }
    tierStats[order.tierId].sold += order.quantity;
    tierStats[order.tierId].revenue += order.totalAmount;
  }

  res.json({
    eventId: event.id,
    title: event.title,
    capacity: event.capacity,
    soldCount: totalTicketsSold,
    remainingCapacity,
    occupancyPercentage: `${occupancyPercentage}%`,
    totalOrders,
    totalRevenue,
    tierStats: Object.values(tierStats),
  });
}

const EVENT_STATUS_LABEL: Record<string, "ATIVO" | "AGUARDANDO" | "CANCELADO"> = {
  PUBLISHED: "ATIVO",
  CANCELLED: "CANCELADO",
  DRAFT: "AGUARDANDO",
  COMPLETED: "ATIVO",
};

/** GET /events/organizer/dashboard — Relatórios do organizador logado (ORGANIZER) */
export async function getOrganizerDashboard(req: Request, res: Response): Promise<void> {
  const { userId } = (req as AuthenticatedRequest).user;

  try {
    const events = await prisma.event.findMany({
      where: { organizerId: userId },
      include: {
        orders: {
          where: { status: "CONFIRMED" },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const allOrders = events
      .flatMap((e) => e.orders)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const totalSales = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const ticketsSold = allOrders.reduce((sum, o) => sum + o.quantity, 0);
    const activeEventsCount = events.filter((e) => e.status === "PUBLISHED").length;

    const formattedEvents = events.map((e) => {
      const revenue = e.orders.reduce((sum, o) => sum + o.totalAmount, 0);
      return {
        id: e.id,
        title: e.title,
        date: e.date ? e.date.toLocaleDateString("pt-BR") : "Data a definir",
        venue: e.venue,
        city: e.city,
        imageUrl: e.imageUrl,
        capacity: e.capacity,
        soldCount: e.soldCount,
        revenue,
        status: EVENT_STATUS_LABEL[e.status] ?? "AGUARDANDO",
      };
    });

    const recentActivities = allOrders.slice(0, 10).map((o) => ({
      id: o.id,
      type: "SALE",
      title: "Venda de Ingresso",
      sub: `${o.quantity} x ${o.tierLabel} — ${o.eventName}`,
      time: o.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    }));

    res.json({
      totalSales,
      ticketsSold,
      activeEventsCount,
      conversionRate: 3.8,
      events: formattedEvents,
      recentActivities,
    });
  } catch (err) {
    res.status(500).json({ error: "Erro ao carregar relatórios do banco de dados." });
  }
}


