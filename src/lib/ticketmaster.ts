// ============================================================
// Ticketmaster Discovery API — Service
// Documentação: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
// ============================================================

const BASE_URL = "https://app.ticketmaster.com/discovery/v2";
const API_KEY = process.env.TICKETMASTER_API_KEY;

if (!API_KEY) {
  console.warn("⚠️  TICKETMASTER_API_KEY não definida no .env.local");
}

export interface TMImage {
  url: string;
  width: number;
  height: number;
  ratio?: string;
}

export interface TMEvent {
  id: string;
  name: string;
  url: string;
  images: TMImage[];
  dates: {
    start: {
      localDate: string;
      localTime?: string;
    };
  };
  priceRanges?: {
    min: number;
    max: number;
    currency: string;
  }[];
  classifications?: {
    segment?: { name: string };
    genre?: { name: string };
  }[];
  _embedded?: {
    venues?: {
      name: string;
      city?: { name: string };
      state?: { name: string };
      country?: { name: string };
    }[];
    attractions?: {
      name: string;
    }[];
  };
}

export interface TMSearchParams {
  keyword?: string;
  countryCode?: string;
  classificationName?: string;
  size?: number;
  page?: number;
  sort?: string;
  startDateTime?: string;
}

export function getBestImage(images: TMImage[]): string {
  if (!images?.length) return "/placeholder-event.jpg";

  const preferred = images.find(
    (img) => img.ratio === "16_9" && img.width >= 1024
  );
  if (preferred) return preferred.url;

  return images.sort((a, b) => b.width - a.width)[0].url;
}

export function formatPrice(event: TMEvent): string {
  if (!event.priceRanges?.length) return "Consultar";
  const { min, currency } = event.priceRanges[0];
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(min);
}

export function formatDate(localDate: string): string {
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getArtistName(event: TMEvent): string {
  return event._embedded?.attractions?.[0]?.name ?? event.name;
}

export function getVenue(event: TMEvent): string {
  const venue = event._embedded?.venues?.[0];
  if (!venue) return "Local a confirmar";
  return `${venue.name}${venue.city ? `, ${venue.city.name}` : ""}`;
}

export function getCategory(event: TMEvent): string {
  const classification = event.classifications?.[0];
  return classification?.genre?.name ?? classification?.segment?.name ?? "Evento";
}

export async function searchEvents(params: TMSearchParams = {}): Promise<TMEvent[]> {
  const query = new URLSearchParams({
    apikey: API_KEY!,
    size: String(params.size ?? 20),
    page: String(params.page ?? 0),
    sort: params.sort ?? "date,asc",
    ...(params.keyword && { keyword: params.keyword }),
    ...(params.countryCode && { countryCode: params.countryCode }),
    ...(params.classificationName && { classificationName: params.classificationName }),
    ...(params.startDateTime && { startDateTime: params.startDateTime }),
  });

  const res = await fetch(`${BASE_URL}/events.json?${query}`, {
    next: { revalidate: 300 }, // cache de 5 minutos
  });

  if (!res.ok) {
    throw new Error(`Ticketmaster API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data._embedded?.events ?? [];
}

export async function getEventById(id: string): Promise<TMEvent | null> {
  const res = await fetch(
    `${BASE_URL}/events/${id}.json?apikey=${API_KEY}`,
    { next: { revalidate: 300 } }
  );

  if (!res.ok) return null;
  return res.json();
}
