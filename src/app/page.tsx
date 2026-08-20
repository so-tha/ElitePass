"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import EventCard from "@/components/EventCard";
import {
  AlertTriangleIcon,
  TicketIcon,
  PlayIcon,
} from "@/components/icons";
import {
  TMEvent,
  getBestImage,
  formatPrice,
  formatDate,
  getVenue,
  getCategory,
  getEventMinPrice,
  parseLocalDate,
} from "@/lib/ticketmaster";
import {
  TMDBMovie,
  tmdbPoster,
  formatMoviePrice,
  formatMovieDate,
  GENRE_MAP,
  getMovieMinPrice,
  parseReleaseDate,
} from "@/lib/tmdb";

function CardSkeleton() {
  return (
    <div className={styles.showCard} style={{ pointerEvents: "none" }}>
      <div className={`${styles.cardImage} ${styles.skeleton}`} />
      <div className={styles.cardBody}>
        <div className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonFull}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonMid}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonMid}`} />
      </div>
    </div>
  );
}

const PROGRAM_FILTERS = [
  { label: "Todos", value: "Todos" },
  { label: "Shows", value: "Shows & Festivais" },
  { label: "Teatro", value: "Teatro & Dança" },
  { label: "Comédia", value: "Comédia & Stand-up" },
  { label: "Filmes", value: "Cinema & Mostras" },
];

type CategoryGroupKey = "SHOWS" | "TEATRO" | "COMEDIA" | "PALESTRA" | "CINEMA" | "OTHER";

function getCategoryGroupKey(categoryStr: string): CategoryGroupKey {
  const cat = categoryStr.toUpperCase();
  if (cat === "OTHER") return "OTHER";
  if (cat.includes("COMÉDIA") || cat.includes("COMEDY") || cat.includes("STAND-UP")) return "COMEDIA";
  if (cat.includes("TEATRO") || cat.includes("ESPETÁCULO") || cat.includes("THEATRE") || cat.includes("THEATER") || cat.includes("DANÇA") || cat.includes("DANCE")) return "TEATRO";
  if (cat.includes("PALESTRA") || cat.includes("CURSO") || cat.includes("WORKSHOP") || cat.includes("EDUCAÇÃO")) return "PALESTRA";
  if (cat.includes("CINEMA") || cat.includes("FILME") || cat.includes("MOVIE") || cat.includes("FILM")) return "CINEMA";
  if (cat.includes("POP") || cat.includes("MPB") || cat.includes("ROCK") || cat.includes("SHOW") || cat.includes("MUSIC") || cat.includes("MÚSICA") || cat.includes("SPORT") || cat.includes("ESPORTE")) return "SHOWS";
  return "OTHER";
}

function getCategoryBadge(categoryStr: string) {
  const key = getCategoryGroupKey(categoryStr);
  switch (key) {
    case "COMEDIA":
      return { key, label: "COMÉDIA", bg: "#FFB22C", color: "#000000", border: "none" };
    case "TEATRO":
      return { key, label: "TEATRO", bg: "#EF4444", color: "#ffffff", border: "none" };
    case "PALESTRA":
      return { key, label: "PALESTRA", bg: "#10B981", color: "#000000", border: "none" };
    case "SHOWS":
      return { key, label: "MPB/POP", bg: "#3B82F6", color: "#ffffff", border: "none" };
    case "CINEMA":
      return { key, label: "CINEMA", bg: "#A855F7", color: "#ffffff", border: "none" };
    default:
      return { key, label: categoryStr.toUpperCase().substring(0, 10), bg: "#FFB22C", color: "#000000", border: "none" };
  }
}

const TYPE_TO_GROUP: Partial<Record<string, CategoryGroupKey>> = {
  "Todos": undefined,
  "Shows & Festivais": "SHOWS",
  "Teatro & Dança": "TEATRO",
  "Comédia & Stand-up": "COMEDIA",
  "Cinema & Mostras": "CINEMA",
};

function matchesTypeFilter(event: TMEvent, selectedType: string): boolean {
  const wanted = TYPE_TO_GROUP[selectedType];
  if (!wanted) return true;
  return getCategoryGroupKey(getCategory(event)) === wanted;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isWithinWeekend(date: Date, now: Date): boolean {
  const day = now.getDay();
  const diffToSaturday = day === 0 ? -1 : 6 - day;
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToSaturday);
  const sunday = new Date(saturday.getFullYear(), saturday.getMonth(), saturday.getDate() + 1);
  return isSameDay(date, saturday) || isSameDay(date, sunday);
}

function isWithinNext30Days(date: Date, now: Date): boolean {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in30 = new Date(startOfToday);
  in30.setDate(startOfToday.getDate() + 30);
  return date >= startOfToday && date <= in30;
}

function matchesDateFilter(date: Date | null, selectedDate: string): boolean {
  if (selectedDate === "Todas as Datas") return true;
  if (!date) return false;
  const now = new Date();
  if (selectedDate === "Hoje") return isSameDay(date, now);
  if (selectedDate === "Este Fim de Semana") return isWithinWeekend(date, now);
  if (selectedDate === "Próximos 30 Dias") return isWithinNext30Days(date, now);
  return true;
}

function sortEventList(list: TMEvent[], sortLabel: string): TMEvent[] {
  const arr = [...list];
  const byDate = (a: TMEvent, b: TMEvent) =>
    parseLocalDate(a.dates.start.localDate).getTime() - parseLocalDate(b.dates.start.localDate).getTime();
  const byPriceAsc = (a: TMEvent, b: TMEvent) => getEventMinPrice(a) - getEventMinPrice(b);

  switch (sortLabel) {
    case "Menor Preço":
      return arr.sort(byPriceAsc);
    case "Maior Preço":
      return arr.sort((a, b) => byPriceAsc(b, a));
    case "Mais Recente":
      return arr.sort(byDate);
    default: // "Mais Recente • Menor Preço"
      return arr.sort((a, b) => byDate(a, b) || byPriceAsc(a, b));
  }
}

function movieDateTime(movie: TMDBMovie): number {
  const d = parseReleaseDate(movie.release_date);
  return d ? d.getTime() : Infinity;
}

/** Verifica se um filme está em cartaz (lançado há no máximo 30 dias e já foi lançado). */
function isMovieInTheaters(movie: TMDBMovie): boolean {
  const releaseDate = parseReleaseDate(movie.release_date);
  if (!releaseDate) return false;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  return releaseDate <= now && releaseDate >= thirtyDaysAgo;
}

function sortMovieList(list: TMDBMovie[], sortLabel: string): TMDBMovie[] {
  const arr = [...list];
  const byDate = (a: TMDBMovie, b: TMDBMovie) => movieDateTime(a) - movieDateTime(b);
  const byPriceAsc = (a: TMDBMovie, b: TMDBMovie) => getMovieMinPrice(a) - getMovieMinPrice(b);

  switch (sortLabel) {
    case "Menor Preço":
      return arr.sort(byPriceAsc);
    case "Maior Preço":
      return arr.sort((a, b) => byPriceAsc(b, a));
    case "Mais Recente":
      return arr.sort(byDate);
    default: // "Mais Recente • Menor Preço"
      return arr.sort((a, b) => byDate(a, b) || byPriceAsc(a, b));
  }
}

type SearchResultItem =
  | { type: "event"; data: TMEvent }
  | { type: "movie"; data: TMDBMovie };

function searchItemPrice(item: SearchResultItem): number {
  return item.type === "event" ? getEventMinPrice(item.data) : getMovieMinPrice(item.data);
}

function searchItemDateTime(item: SearchResultItem): number {
  return item.type === "event" ? parseLocalDate(item.data.dates.start.localDate).getTime() : movieDateTime(item.data);
}

function sortSearchResults(list: SearchResultItem[], sortLabel: string): SearchResultItem[] {
  const arr = [...list];
  const byDate = (a: SearchResultItem, b: SearchResultItem) => searchItemDateTime(a) - searchItemDateTime(b);
  const byPriceAsc = (a: SearchResultItem, b: SearchResultItem) => searchItemPrice(a) - searchItemPrice(b);

  switch (sortLabel) {
    case "Menor Preço":
      return arr.sort(byPriceAsc);
    case "Maior Preço":
      return arr.sort((a, b) => byPriceAsc(b, a));
    case "Mais Recente":
      return arr.sort(byDate);
    default: // "Mais Recente • Menor Preço"
      return arr.sort((a, b) => byDate(a, b) || byPriceAsc(a, b));
  }
}

export default function Home() {
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState("Todos");
  const selectedDate = "Todas as Datas";
  const selectedSort = "Mais Recente";

  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  const fetchMovies = useCallback(async (keyword = "") => {
    setMoviesLoading(true);
    setMoviesError(null);
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);

      const res = await fetch(`/api/movies?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao carregar filmes.");
      setMovies(data.movies ?? []);
    } catch (err) {
      setMoviesError(err instanceof Error ? err.message : "Erro ao carregar filmes.");
    } finally {
      setMoviesLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (keyword = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ countryCode: "BR", size: "20" });
      if (keyword) params.set("keyword", keyword);

      const res = await fetch(`/api/events?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      const list: TMEvent[] = data.events ?? [];
      setEvents(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar eventos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
      fetchMovies();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents, fetchMovies]);

  useEffect(() => {
    if (!search) {
      const timer = setTimeout(() => {
        fetchEvents();
        fetchMovies();
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      fetchEvents(search);
      fetchMovies(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search, fetchEvents, fetchMovies]);

  const showMoviesSection = selectedType === "Todos" || selectedType === "Cinema & Mostras";

  const filteredEvents = useMemo(() => {
    const filtered = events.filter(
      (event) =>
        matchesTypeFilter(event, selectedType) &&
        matchesDateFilter(parseLocalDate(event.dates.start.localDate), selectedDate)
    );
    return sortEventList(filtered, selectedSort);
  }, [events, selectedType, selectedDate, selectedSort]);

  const filteredMovies = useMemo(() => {
    if (!showMoviesSection) return [];
    const inTheaters = movies.filter(isMovieInTheaters);
    const filtered = inTheaters.filter((movie) => matchesDateFilter(parseReleaseDate(movie.release_date), selectedDate));
    return sortMovieList(filtered, selectedSort);
  }, [movies, selectedDate, selectedSort, showMoviesSection]);

  const displayResults = useMemo<SearchResultItem[]>(() => {
    const eventItems: SearchResultItem[] = filteredEvents.map((e) => ({ type: "event", data: e }));
    const movieItems: SearchResultItem[] = filteredMovies.map((m) => ({ type: "movie", data: m }));
    const combined = sortSearchResults([...eventItems, ...movieItems], selectedSort);
    if (!search && selectedType === "Todos") {
      return combined.slice(0, 20);
    }
    return combined;
  }, [filteredEvents, filteredMovies, selectedSort, search, selectedType]);

  const heroStats = useMemo(() => {
    const cities = new Set(
      events
        .map((e) => e._embedded?.venues?.[0]?.city?.name)
        .filter((c): c is string => Boolean(c) && c !== "undefined")
    );
    const categories = new Set(events.map((e) => getCategoryGroupKey(getCategory(e))));
    const moviesInTheaters = movies.filter(isMovieInTheaters).length;

    return {
      events: events.length,
      movies: moviesInTheaters,
      cities: cities.size,
      categories: categories.size,
    };
  }, [events, movies]);

  const renderEventCard = (event: TMEvent) => {
    const catInfo = getCategoryBadge(getCategory(event));
    return (
      <EventCard
        key={event.id}
        id={event.id}
        title={event.name}
        image={getBestImage(event.images)}
        category={getCategory(event)}
        categoryBadge={catInfo}
        date={formatDate(event.dates.start.localDate)}
        time={event.dates.start.localTime?.slice(0, 5)}
        venue={getVenue(event)}
        price={formatPrice(event)}
        rating={4.8}
      />
    );
  };

  const renderMovieCard = (movie: TMDBMovie) => {
    const genreName = movie.genre_ids?.[0] ? GENRE_MAP[movie.genre_ids[0]] ?? "Cinema" : "Cinema";
    const catInfo = getCategoryBadge(genreName);
    return (
      <EventCard
        key={movie.id}
        id={String(movie.id)}
        title={movie.title}
        image={tmdbPoster(movie.poster_path)}
        category="CINEMA"
        categoryBadge={catInfo}
        date={formatMovieDate(movie.release_date)}
        venue="Cinemark & UCI IMAX"
        price={formatMoviePrice(movie)}
        ticketsRemaining={150}
        rating={movie.vote_average ? Number((movie.vote_average / 2).toFixed(1)) : 4.5}
      />
    );
  };

  return (
    <div className={styles.root}>
      <Navbar searchValue={search} onSearchChange={setSearch} />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroBeams} />
        <div className={styles.heroContent}>
          <div className={styles.heroEyebrow}>
            <span className={styles.heroEyebrowLine} />
            <span>Experiências Exclusivas</span>
          </div>
          <h1 className={styles.heroTitle}>
            Sua Experiência
            <br />
            <span className={styles.heroTitleGold}>Premium</span>
            <br />
            Começa Aqui
          </h1>

          <div className={styles.heroActions}>
            <a href="#programacao" className={styles.heroBtnPrimary}>
              <TicketIcon size={15} />
              Explorar Ingressos
            </a>
            <a href="#programacao" className={styles.heroBtnSecondary}>
              <PlayIcon size={12} />
              Ver Calendário
            </a>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{heroStats.events}</span>
              <span className={styles.heroStatLabel}>Eventos Ativos</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{heroStats.movies}</span>
              <span className={styles.heroStatLabel}>Filmes em Cartaz</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{heroStats.cities}</span>
              <span className={styles.heroStatLabel}>Cidades</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>{heroStats.categories}</span>
              <span className={styles.heroStatLabel}>Categorias</span>
            </div>
          </div>
        </div>
      </section>

      <main className={styles.main}>
        <section className={styles.programSection} id="programacao">
          <div className={styles.programEyebrow}>
            <span className={styles.programEyebrowLine} />
            <span>Programação</span>
          </div>
          <h2 className={styles.programTitle}>O Que Está Acontecendo</h2>

          <div className={styles.programPills}>
            {PROGRAM_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.pillButton} ${selectedType === opt.value ? styles.pillButtonActive : ""}`}
                onClick={() => setSelectedType(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {(error || moviesError) && (
          <div className={styles.errorBanner}>
            <AlertTriangleIcon size={14} />
            {error || moviesError}
          </div>
        )}

        <section id="resultados" className={styles.showsSection}>
          {loading || moviesLoading ? (
            <div className={styles.showsGrid}>
              {Array.from({ length: 10 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : displayResults.length === 0 ? (
            <p className={styles.noResults}>
              {search
                ? `Nenhum resultado encontrado para "${search}".`
                : "Nenhum evento encontrado."}
            </p>
          ) : (
            <div className={styles.showsGrid}>
              {displayResults.map((item) =>
                item.type === "event"
                  ? renderEventCard(item.data as TMEvent)
                  : renderMovieCard(item.data as TMDBMovie)
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
