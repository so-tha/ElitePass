import { NextRequest, NextResponse } from "next/server";

export interface DashboardEventItem {
  id: string;
  title: string;
  date: string;
  venue: string;
  city: string;
  imageUrl?: string;
  capacity: number;
  soldCount: number;
  revenue: number;
  status: "ATIVO" | "PAUSADO" | "AGUARDANDO" | "CANCELADO";
}

export interface ActivityItem {
  id: string;
  type: "SALE" | "EVENT_PUBLISHED";
  title: string;
  sub: string;
  time: string;
}

export interface DashboardData {
  totalSales: number;
  ticketsSold: number;
  activeEventsCount: number;
  avgTicketPrice: number;
  salesTrendPct: number;
  ticketsTrendPct: number;
  eventsTrendDelta: number;
  events: DashboardEventItem[];
  recentActivities: ActivityItem[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl}/api/events/organizer/dashboard`, {
      cache: "no-store",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/organizer/dashboard]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
