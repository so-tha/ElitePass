import { prisma } from "../src/prisma";
import bcrypt from "bcryptjs";

async function main() {

  let organizer = await prisma.user.findFirst({
    where: { role: "ORGANIZER" },
  });

  if (!organizer) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    organizer = await prisma.user.create({
      data: {
        name: "Maria Silva (Organizador Elite)",
        email: "organizador@elitepass.com",
        cpf: "999.888.777-66",
        password: hashedPassword,
        role: "ORGANIZER",
      },
    });
    console.log(`Criado novo organizador: ${organizer.email}`);
  } else {
    console.log(`Usando organizador existente: ${organizer.email} (${organizer.id})`);
  }

  let clientUser = await prisma.user.findFirst({
    where: { role: "CLIENT" },
  });

  if (!clientUser) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    clientUser = await prisma.user.create({
      data: {
        name: "João Cliente",
        email: "cliente@elitepass.com",
        cpf: "111.222.333-44",
        password: hashedPassword,
        role: "CLIENT",
      },
    });
  }

  let doorman = await prisma.user.findFirst({
    where: { role: "DOORMAN" },
  });

  if (!doorman) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    doorman = await prisma.user.create({
      data: {
        name: "Portaria ElitePass",
        email: "portaria@elitepass.com",
        cpf: "555.444.333-22",
        password: hashedPassword,
        role: "DOORMAN",
      },
    });
    console.log(`🚪 Criado novo usuário de portaria: ${doorman.email}`);
  }

  // 3. Criar os 5 Eventos (3 Shows e 2 Cinema)
  const eventsData = [
    {
      title: "Arctic Monkeys — World Tour 2026",
      description: "A turnê mundial da lendária banda britânica de indie rock chega a Curitiba com show histórico.",
      category: "Rock",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&auto=format&fit=crop&q=80",
      venue: "Pedreira Paulo Leminski",
      city: "Curitiba — PR",
      date: new Date("2026-07-20T21:00:00Z"),
      capacity: 500,
      soldCount: 412,
      tiers: [
        { id: "tier-1", label: "Pista Premium", priceUnit: 290, capacity: 200 },
        { id: "tier-2", label: "Pista Comum", priceUnit: 180, capacity: 300 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Tame Impala — Live Experience",
      description: "Show psicodélico imersivo com luzes e projeções 3D exclusivas em Salvador.",
      category: "Indie Pop",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80",
      venue: "Arena Fonte Nova",
      city: "Salvador — BA",
      date: new Date("2026-08-02T20:30:00Z"),
      capacity: 400,
      soldCount: 295,
      tiers: [
        { id: "tier-1", label: "Camarote Executivo", priceUnit: 350, capacity: 100 },
        { id: "tier-2", label: "Pista", priceUnit: 160, capacity: 300 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Avatar 3: Fogo e Cinzas (Pré-Estreia Cinema)",
      description: "Sessão especial de pré-estreia em IMAX 3D com óculos inclusos e brinde colecionável.",
      category: "Cinema / Ficção",
      type: "MOVIE" as const,
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
      venue: "Cinemark Prime IMAX",
      city: "São Paulo — SP",
      date: new Date("2026-09-15T19:00:00Z"),
      capacity: 250,
      soldCount: 180,
      tiers: [
        { id: "tier-1", label: "Cadeira D-BOX VIP", priceUnit: 85, capacity: 50 },
        { id: "tier-2", label: "Poltrona Reclinável", priceUnit: 55, capacity: 200 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Interstellar — Edição Especial 10 Anos Cinema 70mm",
      description: "Exibição especial do clássico de Christopher Nolan em cópia original de filme 70mm.",
      category: "Cinema / Sci-Fi",
      type: "MOVIE" as const,
      imageUrl: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80",
      venue: "Cine Sesc Augusta",
      city: "São Paulo — SP",
      date: new Date("2026-10-05T20:00:00Z"),
      capacity: 180,
      soldCount: 140,
      tiers: [
        { id: "tier-1", label: "Entrada Geral + Pipoca", priceUnit: 45, capacity: 180 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "The 1975 — Still... At Their Very Best Tour",
      description: "A aclamada banda britânica em apresentação única no Brasil.",
      category: "Pop Rock",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      venue: "Espaço das Américas",
      city: "São Paulo — SP",
      date: new Date("2026-11-12T21:30:00Z"),
      capacity: 350,
      soldCount: 88,
      tiers: [
        { id: "tier-1", label: "Pista Premium", priceUnit: 320, capacity: 150 },
        { id: "tier-2", label: "Mezanino VIP", priceUnit: 450, capacity: 200 },
      ],
      status: "PUBLISHED" as const,
    },
  ];

  for (const item of eventsData) {
    const event = await prisma.event.create({
      data: {
        organizerId: organizer.id,
        title: item.title,
        description: item.description,
        category: item.category,
        type: item.type,
        imageUrl: item.imageUrl,
        venue: item.venue,
        city: item.city,
        date: item.date,
        capacity: item.capacity,
        soldCount: item.soldCount,
        tiers: item.tiers,
        status: item.status,
      },
    });

    console.log(`✅ Evento criado [${event.type}]: ${event.title}`);

    const orderAmount = item.tiers[0].priceUnit * 2;
    await prisma.order.create({
      data: {
        userId: clientUser.id,
        eventId: event.id,
        localEventId: event.id,
        eventType: event.type,
        eventName: event.title,
        eventDate: event.date.toISOString().split("T")[0],
        eventVenue: event.venue,
        tierId: item.tiers[0].id,
        tierLabel: item.tiers[0].label,
        priceUnit: item.tiers[0].priceUnit,
        quantity: 2,
        fee: orderAmount * 0.12,
        totalAmount: orderAmount * 1.12,
        status: "CONFIRMED",
        tickets: {
          create: [
            {
              code: `${event.title.substring(0, 3).toUpperCase()}-TKT-101`,
              qrData: `ELITEPASS-${event.id}-101`,
              status: "VALID",
            },
            {
              code: `${event.title.substring(0, 3).toUpperCase()}-TKT-102`,
              qrData: `ELITEPASS-${event.id}-102`,
              status: "VALID",
            },
          ],
        },
      },
    });
  }

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
