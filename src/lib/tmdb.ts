// ============================================================
// TMDB — The Movie Database API Service
// Documentação: https://developer.themoviedb.org/docs/getting-started
// Autenticação: Bearer token (API Read Access Token)
// Imagens: https://image.tmdb.org/t/p/{size}/{file_path}
// ============================================================

const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";
const READ_TOKEN = process.env.TMDB_READ_TOKEN;

if (!READ_TOKEN) {
  console.warn("⚠️  TMDB_READ_TOKEN não definido no .env.local");
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;       // "YYYY-MM-DD"
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;       // 0–10
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  adult: boolean;
}

export interface TMDBMovieDetail extends TMDBMovie {
  runtime: number | null;           // minutos
  tagline: string | null;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  status: string;
  budget: number;
  revenue: number;
  homepage: string | null;
  credits?: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
    crew: { id: number; name: string; job: string }[];
  };
  videos?: {
    results: {
      id: string;
      key: string;
      site: string; // "YouTube"
      type: string; // "Trailer", "Teaser"
      official: boolean;
    }[];
  };
}

export interface TMDBSearchParams {
  keyword?: string;
  page?: number;
  language?: string;
  region?: string;
}

// ─── Helpers de imagem ────────────────────────────────────────────────────────

export function tmdbPoster(path: string | null, size: "w342" | "w500" | "w780" | "original" = "w500"): string {
  if (!path) return "/placeholder-movie.jpg";
  return `${IMAGE_BASE}/${size}${path}`;
}

export function tmdbBackdrop(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "/placeholder-movie.jpg";
  return `${IMAGE_BASE}/${size}${path}`;
}

// ─── Geração de preço simulado (igual ao Ticketmaster: determinístico por ID) ──
// A TMDB não fornece preços de exibição; os valores são simulados para fins demo.

export function generateMoviePrice(movie: TMDBMovie): { min: number; max: number; currency: string } {
  // Seed determinístico baseado no ID do filme
  let seed = movie.id % 1000;
  const tiers = [
    { min: 32, max: 55 },   // sessão normal
    { min: 45, max: 70 },   // VIP / IMAX
    { min: 55, max: 90 },   // IMAX + poltrona premium
  ];
  const tier = tiers[seed % tiers.length];
  // Variação de centavos baseada no ID
  const offset = (movie.id % 10) * 0.5;
  return { min: tier.min + offset, max: tier.max + offset, currency: "BRL" };
}

export function formatMoviePrice(movie: TMDBMovie): string {
  const { min, currency } = generateMoviePrice(movie);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(min);
}

export function formatMovieDate(date: string): string {
  if (!date) return "Data a confirmar";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getMovieGenre(movie: TMDBMovie, genreMap: Record<number, string>): string {
  if (movie.genre_ids?.length) {
    const g = genreMap[movie.genre_ids[0]];
    if (g) return g;
  }
  return "Filme";
}

// Mapa de gêneros mais comuns do TMDB (pt-BR)
export const GENRE_MAP: Record<number, string> = {
  28: "Ação",
  12: "Aventura",
  16: "Animação",
  35: "Comédia",
  80: "Crime",
  99: "Documentário",
  18: "Drama",
  10751: "Família",
  14: "Fantasia",
  36: "História",
  27: "Terror",
  10402: "Música",
  9648: "Mistério",
  10749: "Romance",
  878: "Ficção Científica",
  10770: "Telefilme",
  53: "Thriller",
  10752: "Guerra",
  37: "Faroeste",
};

// ─── Fetch central (Bearer token) ─────────────────────────────────────────────

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const query = new URLSearchParams({
    language: "pt-BR",
    ...params,
  }).toString();

  const res = await fetch(`${BASE_URL}${path}?${query}`, {
    headers: {
      Authorization: `Bearer ${READ_TOKEN}`,
      accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`TMDB API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ─── Funções de dados ──────────────────────────────────────────────────────────

/** Filmes em cartaz nos cinemas */
export async function getNowPlayingMovies(params: TMDBSearchParams = {}): Promise<TMDBMovie[]> {
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/movie/now_playing", {
    page: String(params.page ?? 1),
    region: params.region ?? "BR",
  });
  return data.results;
}

/** Busca filmes por palavra-chave */
export async function searchMovies(params: TMDBSearchParams = {}): Promise<TMDBMovie[]> {
  if (!params.keyword?.trim()) return getNowPlayingMovies(params);
  const data = await tmdbFetch<{ results: TMDBMovie[] }>("/search/movie", {
    query: params.keyword,
    page: String(params.page ?? 1),
    include_adult: "false",
    region: params.region ?? "BR",
  });
  return data.results;
}

/** Detalhes de um filme, com créditos e trailers */
export async function getMovieById(id: number | string): Promise<TMDBMovieDetail | null> {
  try {
    const data = await tmdbFetch<TMDBMovieDetail>(`/movie/${id}`, {
      append_to_response: "credits,videos",
    });
    return data;
  } catch {
    return null;
  }
}
