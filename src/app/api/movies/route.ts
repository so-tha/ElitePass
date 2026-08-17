import { NextRequest, NextResponse } from "next/server";
import { getNowPlayingMovies, searchMovies } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const keyword = searchParams.get("keyword") ?? "";
  const page    = parseInt(searchParams.get("page") ?? "1", 10);

  try {
    const movies = keyword
      ? await searchMovies({ keyword, page })
      : await getNowPlayingMovies({ page });

    return NextResponse.json({ movies });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar filmes." },
      { status: 500 }
    );
  }
}
