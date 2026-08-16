import { NextRequest, NextResponse } from "next/server";
import { searchEvents } from "@/lib/ticketmaster";

/**
 * GET /api/events
 *
 * Query params aceitos:
 *   keyword       — texto de busca
 *   countryCode   — ex: BR, US (padrão: BR)
 *   classificationName — ex: music, sports
 *   size          — quantidade de resultados (padrão: 20)
 *   page          — página (padrão: 0)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const events = await searchEvents({
      keyword: searchParams.get("keyword") ?? undefined,
      countryCode: searchParams.get("countryCode") ?? "BR",
      classificationName: searchParams.get("classificationName") ?? undefined,
      size: Number(searchParams.get("size") ?? 20),
      page: Number(searchParams.get("page") ?? 0),
    });

    return NextResponse.json({ events });
  } catch (err) {
    console.error("[/api/events]", err);
    return NextResponse.json(
      { error: "Erro ao buscar eventos. Verifique a chave da API." },
      { status: 500 }
    );
  }
}
