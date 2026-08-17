import { NextRequest, NextResponse } from "next/server";
import { getEventById } from "@/lib/ticketmaster";

/**
 * GET /api/events/[id]
 *
 * Retorna os detalhes completos de um evento pelo ID do Ticketmaster.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Evento não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (err) {
    console.error("[/api/events/[id]]", err);
    return NextResponse.json(
      { error: "Erro ao buscar evento." },
      { status: 500 }
    );
  }
}
