import { NextRequest, NextResponse } from "next/server";

export interface OrderTicketItem {
  id: string;
  code: string;
  qrData: string;
  status: "VALID" | "USED" | "CANCELLED";
}

export interface OrderItem {
  id: string;
  eventName: string;
  eventDate: string | null;
  eventVenue: string | null;
  eventType: "SHOW" | "MOVIE";
  tierLabel: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  event: { imageUrl: string | null } | null;
  tickets: OrderTicketItem[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl}/api/orders/mine`, {
      cache: "no-store",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/orders/mine]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
