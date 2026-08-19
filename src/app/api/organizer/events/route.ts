import { NextRequest, NextResponse } from "next/server";

export interface EventTierInput {
  id: string;
  label: string;
  priceUnit: number;
  capacity: number;
}

export interface EventFormPayload {
  title: string;
  description?: string;
  category: string;
  type: "SHOW" | "MOVIE";
  imageUrl?: string;
  venue: string;
  city: string;
  date: string;
  capacity: number;
  tiers: EventTierInput[];
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/events`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/organizer/events]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
