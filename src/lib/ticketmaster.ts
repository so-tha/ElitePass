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

// ─── Mock price generation ──────────────────────────────────────────────────
//
// A Ticketmaster Discovery API removeu `priceRanges` em mar/2025.
// Para simulação de compra (portfolio / demo), geramos preços realistas
// determinísticos — o mesmo evento sempre produz o mesmo preço.
//
export interface MockPriceRange {
  min: number;
  mid: number;
  max: number;
  currency: string;
  isMock: true;
}

/**
 * Gera um número pseudo-aleatório determinístico a partir de uma string seed.
 * Garante que o mesmo evento sempre produza o mesmo preço entre renders.
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // converte para int 32-bit
  }
  // normaliza para [0, 1)
  return Math.abs(hash) / 2147483647;
}

/**
 * Retorna faixas de preço simuladas em BRL baseadas na categoria do evento.
 * Os valores refletem o mercado brasileiro de shows e eventos.
 */
export function generateMockPrices(event: TMEvent): MockPriceRange {
  const segment = event.classifications?.[0]?.segment?.name?.toLowerCase() ?? "";
  const genre   = event.classifications?.[0]?.genre?.name?.toLowerCase() ?? "";
  const seed    = event.id;
  const rand    = seededRandom(seed); // [0, 1)

  // Tabela de faixas de base por segmento/gênero (valores em BRL)
  let baseMin = 80;
  let baseMax = 350;

  if (segment.includes("music") || segment.includes("música")) {
    if (genre.includes("pop") || genre.includes("rock"))  { baseMin = 120; baseMax = 500; }
    else if (genre.includes("sertanejo") || genre.includes("country")) { baseMin = 80;  baseMax = 380; }
    else if (genre.includes("eletrônica") || genre.includes("electronic")) { baseMin = 100; baseMax = 450; }
    else if (genre.includes("jazz") || genre.includes("blues")) { baseMin = 60; baseMax = 220; }
    else { baseMin = 100; baseMax = 400; }
  } else if (segment.includes("sport")) {
    baseMin = 50; baseMax = 300;
  } else if (segment.includes("art") || segment.includes("theatre") || segment.includes("theater")) {
    baseMin = 60; baseMax = 280;
  } else if (segment.includes("film") || segment.includes("cinema")) {
    baseMin = 40; baseMax = 150;
  } else if (segment.includes("family")) {
    baseMin = 60; baseMax = 250;
  }

  // Adiciona variação dentro da faixa usando seed do evento
  const spread = baseMax - baseMin;
  const min    = Math.round((baseMin + rand * spread * 0.35) / 5) * 5;   // Pista
  const mid    = Math.round((baseMin + spread * 0.45 + rand * spread * 0.2) / 5) * 5; // Premium
  const max    = Math.round((baseMin + spread * 0.7  + rand * spread * 0.3) / 5) * 5; // VIP

  return { min, mid, max, currency: "BRL", isMock: true };
}

export function formatPrice(event: TMEvent): string {
  // Usa preço real da API se disponível
  if (event.priceRanges?.length) {
    const { min, currency } = event.priceRanges[0];
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(min);
  }

  // Fallback: preço simulado para fins de demonstração
  const mock = generateMockPrices(event);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: mock.currency,
    maximumFractionDigits: 0,
  }).format(mock.min);
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

  const venueName = venue.name && venue.name !== "undefined" ? venue.name : "Local a confirmar";
  const cityName = venue.city?.name && venue.city.name !== "undefined" ? venue.city.name : null;
  const stateName = venue.state?.name && venue.state.name !== "undefined" ? venue.state.name : null;

  const location = cityName || stateName;
  return location ? `${venueName}, ${location}` : venueName;
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
