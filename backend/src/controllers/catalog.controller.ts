import { Request, Response } from "express";

/** GET /catalog/shows — Catálogo de shows via Ticketmaster */
export async function getShows(req: Request, res: Response): Promise<void> {
  const apiKey = process.env.TICKETMASTER_API_KEY || "dummy_key";
  const keyword = (req.query.keyword as string) || "";
  const page = (req.query.page as string) || "0";

  try {
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.set("apikey", apiKey);
    url.searchParams.set("countryCode", "BR");
    url.searchParams.set("classificationName", "Music");
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set("size", "20");
    url.searchParams.set("page", page);
    if (keyword) url.searchParams.set("keyword", keyword);

    const response = await fetch(url.toString());
    if (!response.ok) {
      res.status(response.status).json({ error: "Falha ao buscar catálogo da Ticketmaster" });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao conectar com API Ticketmaster" });
  }
}

/** GET /catalog/movies — Catálogo de filmes via TMDB */
export async function getMovies(req: Request, res: Response): Promise<void> {
  const apiKey = process.env.TMDB_API_KEY;
  const page = (req.query.page as string) || "1";

  try {
    const url = new URL("https://api.themoviedb.org/3/movie/now_playing");
    url.searchParams.set("language", "pt-BR");
    url.searchParams.set("page", page);
    if (apiKey) url.searchParams.set("api_key", apiKey);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: process.env.TMDB_READ_ACCESS_TOKEN ? `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` : "",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({ error: "Falha ao buscar catálogo do TMDB" });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Erro ao conectar com API TMDB" });
  }
}
