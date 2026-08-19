import { NextRequest, NextResponse } from "next/server";

export interface ValidateTicketPayload {
  qrData?: string;
  eventId?: string;
}

export interface ValidateTicketResponse {
  ok: boolean;
  reason: "VALID" | "NOT_FOUND" | "FORBIDDEN" | "WRONG_EVENT" | "CANCELLED" | "ALREADY_USED" | "INVALID_QR";
  error?: string;
  code?: string;
  validatedAt?: string | null;
  holder?: string;
  eventName?: string;
  tierLabel?: string;
  usedAt?: string | null;
  ticketEventName?: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { code } = await params;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const body = await req.text();
    const res = await fetch(`${backendUrl}/api/tickets/validate/${encodeURIComponent(code)}`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: authHeader },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/tickets/validate/[code]]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
