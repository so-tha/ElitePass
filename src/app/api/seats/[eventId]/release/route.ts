import { NextRequest, NextResponse } from "next/server";

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/seats/${encodeURIComponent(eventId)}/release`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/seats/[eventId]/release] POST", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
