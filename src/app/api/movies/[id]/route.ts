import { type NextRequest, NextResponse } from "next/server";
import { getMovieById } from "@/lib/tmdb";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const movie = await getMovieById(id);
  if (!movie) {
    return NextResponse.json({ error: "Filme não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ movie });
}
