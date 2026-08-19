import { NextRequest, NextResponse } from "next/server";

export interface CancelTicketResponse {
  message?: string;
  error?: string;
  reason?: "NOT_FOUND" | "ALREADY_CANCELLED" | "ALREADY_USED" | "EVENT_PASSED" | "REFUND_FAILED";
  refunded?: boolean;
}

/**
 * POST /api/tickets/[id]/cancel
 *
 * Cancela um ingresso do próprio cliente: estorna o pagamento proporcional na Stripe e devolve
 * a vaga ao estoque do evento (soldCount ou assento reservado).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
  }

  const { id } = await params;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

  try {
    const res = await fetch(`${backendUrl}/api/tickets/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      headers: { authorization: authHeader },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/tickets/[id]/cancel]", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
