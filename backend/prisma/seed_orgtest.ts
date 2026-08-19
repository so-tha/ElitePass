import { prisma } from "../src/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🚀 Criando/atualizando a conta do organizador organizador@teste.local...");

  const email = "organizador@teste.local";
  const passwordPlain = "OrgTest123!";
  const name = "Organizador Teste";

  let organizer = await prisma.user.findUnique({
    where: { email },
  });

  if (!organizer) {
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    organizer = await prisma.user.create({
      data: {
        name,
        email,
        cpf: "888.777.666-55",
        password: hashedPassword,
        role: "ORGANIZER",
      },
    });
    console.log(`✅ Criado organizador: ${organizer.name} (${organizer.email})`);
  } else {
    // Garantir que a senha e role estejam corretos
    const hashedPassword = await bcrypt.hash(passwordPlain, 10);
    organizer = await prisma.user.update({
      where: { email },
      data: {
        name,
        password: hashedPassword,
        role: "ORGANIZER",
      },
    });
    console.log(`🔄 Atualizada senha e perfil do organizador: ${organizer.email}`);
  }

  // Obter um usuário cliente para os pedidos de teste
  let clientUser = await prisma.user.findFirst({
    where: { role: "CLIENT" },
  });

  if (!clientUser) {
    const hashedPassword = await bcrypt.hash("123456", 10);
    clientUser = await prisma.user.create({
      data: {
        name: "Cliente Exemplo",
        email: "cliente.exemplo@teste.local",
        cpf: "333.444.555-66",
        password: hashedPassword,
        role: "CLIENT",
      },
    });
  }

  // 5 Novos Eventos cadastrados para organizador@teste.local
  const newEvents = [
    {
      title: "Coldplay — Music of the Spheres Tour 2026",
      description: "A espetacular turnê sustentável do Coldplay retorna ao Brasil para um show inesquecível.",
      category: "Shows e Festivais",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80",
      venue: "Estádio do MorumBIS",
      city: "São Paulo — SP",
      date: new Date("2026-10-10T21:00:00Z"),
      capacity: 800,
      soldCount: 650,
      tiers: [
        { id: "tier-1", label: "Pista Premium A", priceUnit: 480, capacity: 400 },
        { id: "tier-2", label: "Cadeira Inferior", priceUnit: 290, capacity: 400 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Duna: Parte 3 (Sessão Especial de Cinema IMAX)",
      description: "Exibição exclusiva de estréia da terceira parte da saga com áudio Dolby Atmos.",
      category: "Cinema e Mostras",
      type: "MOVIE" as const,
      imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80",
      venue: "UCI Xplus Shopping Anália Franco",
      city: "São Paulo — SP",
      date: new Date("2026-11-20T20:00:00Z"),
      capacity: 300,
      soldCount: 240,
      tiers: [
        { id: "tier-1", label: "Poltrona VIP Reclinável", priceUnit: 75, capacity: 100 },
        { id: "tier-2", label: "Ingresso Inteiro IMAX", priceUnit: 50, capacity: 200 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Festival Primavera Sound São Paulo 2026",
      description: "Dois dias do maior festival de música indie, eletrônica e pop do mundo no Autódromo de Interlagos.",
      category: "Shows e Festivais",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80",
      venue: "Autódromo de Interlagos",
      city: "São Paulo — SP",
      date: new Date("2026-12-05T14:00:00Z"),
      capacity: 1200,
      soldCount: 980,
      tiers: [
        { id: "tier-1", label: "Passaporte 2 Dias VIP", priceUnit: 890, capacity: 400 },
        { id: "tier-2", label: "Passaporte 2 Dias Pista", priceUnit: 520, capacity: 800 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Thiago Ventura — Stand-up Comedy Especial",
      description: "Novo solo de humor de Thiago Ventura no maior teatro da América Latina.",
      category: "Teatro e Espetáculos",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&auto=format&fit=crop&q=80",
      venue: "Teatro Bradesco",
      city: "São Paulo — SP",
      date: new Date("2026-09-28T21:00:00Z"),
      capacity: 450,
      soldCount: 390,
      tiers: [
        { id: "tier-1", label: "Plateia VIP A", priceUnit: 140, capacity: 150 },
        { id: "tier-2", label: "Balcão Nobre", priceUnit: 80, capacity: 300 },
      ],
      status: "PUBLISHED" as const,
    },
    {
      title: "Feira Internacional de Gastronomia & Vinhos 2026",
      description: "Degustação com renomados chefs internacionais e vinícolas premiadas do Chile e Itália.",
      category: "Eventos Gastronômicos",
      type: "SHOW" as const,
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      venue: "Bienal do Ibirapuera",
      city: "São Paulo — SP",
      date: new Date("2026-10-24T18:00:00Z"),
      capacity: 600,
      soldCount: 420,
      tiers: [
        { id: "tier-1", label: "Convite Degustação Premium", priceUnit: 250, capacity: 200 },
        { id: "tier-2", label: "Entrada Geral + Taça Brinde", priceUnit: 150, capacity: 400 },
      ],
      status: "PUBLISHED" as const,
    },
  ];

  for (const item of newEvents) {
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

    console.log(`🎉 Criado evento [${event.category}]: ${event.title}`);

    // Adicionar pedido de vendas confirmado para o painel de estatísticas
    const orderAmount = item.tiers[0].priceUnit * 3;
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
        quantity: 3,
        fee: orderAmount * 0.12,
        totalAmount: orderAmount * 1.12,
        status: "CONFIRMED",
        tickets: {
          create: [
            {
              code: `ORG-${event.title.substring(0, 3).toUpperCase()}-101`,
              qrData: `ELITEPASS-${event.id}-101`,
              status: "VALID",
            },
            {
              code: `ORG-${event.title.substring(0, 3).toUpperCase()}-102`,
              qrData: `ELITEPASS-${event.id}-102`,
              status: "VALID",
            },
            {
              code: `ORG-${event.title.substring(0, 3).toUpperCase()}-103`,
              qrData: `ELITEPASS-${event.id}-103`,
              status: "VALID",
            },
          ],
        },
      },
    });
  }

  console.log("✨ Finalizado! 5 novos eventos atribuídos a organizador@teste.local com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
