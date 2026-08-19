import { NextRequest, NextResponse } from "next/server";

export interface SharedTicketResponse {
  code: string;
  qrData: string;
  status: "VALID" | "USED" | "CANCELLED";
  eventName: string;
  eventDate: string | null;
  eventVenue: string | null;
  tierLabel: string;
  holder: string;
}

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  try {
    const res = await fetch(`${backendUrl}/api/tickets/share/${encodeURIComponent(token)}`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/tickets/share/[token]] GET", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
