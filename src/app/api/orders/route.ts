import { NextRequest, NextResponse } from "next/server";

export interface CreateOrderPayload {
  eventId: string;
  eventType: "SHOW" | "MOVIE";
  eventName: string;
  eventDate?: string;
  eventVenue?: string;
  tierId: string;
  tierLabel: string;
  priceUnit: number;
  quantity: number;
  seatLabels?: string[];
}

export interface CreateOrderResponse {
  order: {
    id: string;
    eventName: string;
    tierLabel: string;
    quantity: number;
    totalAmount: number;
    createdAt: string;
    tickets: { id: string; code: string; qrData: string; seatLabel?: string | null }[];
  };
  clientSecret: string;
}

export interface ConfirmOrderResponse {
  order: CreateOrderResponse["order"];
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/orders]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
