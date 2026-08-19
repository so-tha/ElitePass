import { NextRequest, NextResponse } from "next/server";

export type SeatStatus = "AVAILABLE" | "HELD" | "SOLD";

export interface SeatMapEntry {
  label: string;
  status: SeatStatus;
  heldByUserId?: string;
  holdExpiresAt?: string;
}

export interface SeatMapResponse {
  eventId: string;
  rows: string[];
  seatsPerRow: number;
  seats: SeatMapEntry[];
}

const backendUrl = process.env.BACKEND_URL || "http://localhost:3001";

export async function GET(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;

  try {
    const res = await fetch(`${backendUrl}/api/seats/${encodeURIComponent(eventId)}`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[/api/seats/[eventId]] GET", err);
    return NextResponse.json(
      { error: "Não foi possível conectar ao servidor. Tente novamente em instantes." },
      { status: 502 }
    );
  }
}
