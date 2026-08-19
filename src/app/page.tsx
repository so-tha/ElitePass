"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import {
  SearchIcon,
  XIcon,
  MapPinIcon,
  CalendarIcon,
  FilmIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
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

const TYPE_OPTIONS = [
  { label: "Todos", desc: "Todos os tipos de eventos" },
  { label: "Shows & Festivais", desc: "Música ao vivo e festivais" },
  { label: "Teatro & Dança", desc: "Apresentações teatrais e de dança" },
  { label: "Comédia & Stand-up", desc: "Comediantes e shows de humor" },
  { label: "Cinema & Mostras", desc: "Filmes e mostras de cinema" },
];

const DATE_OPTIONS = [
  { label: "Todas as Datas", desc: "Qualquer data" },
  { label: "Hoje", desc: "Eventos de hoje" },
  { label: "Este Fim de Semana", desc: "Sábado e domingo" },
  { label: "Próximos 30 Dias", desc: "Próximo mês" },
];

const SORT_OPTIONS = [
  { label: "Mais Recente", desc: "Eventos mais próximos" },
  { label: "Menor Preço", desc: "Ingressos mais baratos" },
  { label: "Maior Preço", desc: "Ingressos mais caros" },
];

type CategoryGroupKey = "SHOWS" | "TEATRO" | "COMEDIA" | "PALESTRA" | "CINEMA" | "OTHER";

const CATEGORY_GROUPS: { key: CategoryGroupKey; title: string }[] = [
  { key: "SHOWS", title: "Shows & Festivais" },
  { key: "TEATRO", title: "Teatro & Dança" },
  { key: "COMEDIA", title: "Comédia & Stand-up" },
  { key: "PALESTRA", title: "Palestras & Cursos" },
  { key: "CINEMA", title: "Cinema & Mostras" },
  { key: "OTHER", title: "Outros Eventos" },
];

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
      return { key, label: "COMÉDIA", bg: "rgba(255, 178, 44, 0.18)", color: "#FFB22C", border: "1px solid #FFB22C" };
    case "TEATRO":
      return { key, label: "TEATRO", bg: "rgba(239, 68, 68, 0.18)", color: "#EF4444", border: "1px solid #EF4444" };
    case "PALESTRA":
      return { key, label: "PALESTRA", bg: "rgba(16, 185, 129, 0.18)", color: "#10B981", border: "1px solid #10B981" };
    case "SHOWS":
      return { key, label: "MPB/POP", bg: "rgba(59, 130, 246, 0.18)", color: "#3B82F6", border: "1px solid #3B82F6" };
    case "CINEMA":
      return { key, label: "CINEMA", bg: "rgba(139, 92, 246, 0.18)", color: "#A855F7", border: "1px solid #A855F7" };
    default:
      return { key, label: categoryStr.toUpperCase().substring(0, 10), bg: "rgba(255, 178, 44, 0.18)", color: "#FFB22C", border: "1px solid #FFB22C" };
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
  const router = useRouter();
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState("Todos");
  const [selectedDate, setSelectedDate] = useState("Todas as Datas");
  const [selectedSort, setSelectedSort] = useState("Mais Recente");

  const [openDropdown, setOpenDropdown] = useState<"type" | "date" | "sort" | null>(null);

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
    const filtered = movies.filter((movie) => matchesDateFilter(parseReleaseDate(movie.release_date), selectedDate));
    return sortMovieList(filtered, selectedSort);
  }, [movies, selectedDate, selectedSort, showMoviesSection]);

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const eventItems: SearchResultItem[] = filteredEvents.map((e) => ({ type: "event", data: e }));
    const movieItems: SearchResultItem[] = filteredMovies.map((m) => ({ type: "movie", data: m }));
    return sortSearchResults([...eventItems, ...movieItems], selectedSort);
  }, [filteredEvents, filteredMovies, selectedSort]);

  const eventsByGroup = useMemo(() => {
    const map = new Map<CategoryGroupKey, TMEvent[]>();
    for (const event of filteredEvents) {
      const key = getCategoryGroupKey(getCategory(event));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [filteredEvents]);

  const moviesByGenre = useMemo(() => {
    const map = new Map<string, TMDBMovie[]>();
    const order: string[] = [];
    for (const movie of filteredMovies) {
      const genreName = movie.genre_ids?.[0] ? GENRE_MAP[movie.genre_ids[0]] ?? "Outros" : "Outros";
      if (!map.has(genreName)) {
        map.set(genreName, []);
        order.push(genreName);
      }
      map.get(genreName)!.push(movie);
    }
    return { map, order };
  }, [filteredMovies]);

  const renderEventCard = (event: TMEvent) => {
    const catInfo = getCategoryBadge(getCategory(event));
    return (
      <div
        key={event.id}
        className={styles.showCard}
        id={`card-show-${event.id}`}
        onClick={() => router.push(`/events/${event.id}`)}
      >
        <div className={styles.cardImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getBestImage(event.images)}
            alt={event.name}
            className={styles.cardImg}
            loading="lazy"
          />
          <span className={styles.cardPosterBadge}>{getCategory(event)}</span>
        </div>

        <div className={styles.cardBody}>
          <div>
            <div className={styles.cardHeaderRow}>
              <span className={styles.cardTitle} title={event.name}>{event.name}</span>
              <span
                className={styles.cardCategoryBadge}
                style={{ background: catInfo.bg, color: catInfo.color, border: catInfo.border }}
              >
                {catInfo.label}
              </span>
            </div>

            <div className={styles.cardMetaGroup}>
              <span className={styles.cardDateText}>
                <CalendarIcon size={11} />
                {formatDate(event.dates.start.localDate)}
              </span>
              <span className={styles.cardVenueText}>
                <MapPinIcon size={11} />
                <span>{getVenue(event)}</span>
              </span>
            </div>
          </div>

          <div>
            <div className={styles.cardFooterRow}>
              <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>A partir de</span>
                <span className={styles.priceAmount}>{formatPrice(event)}</span>
              </div>
              <button
                className={styles.btnComprarCard}
                id={`btn-confira-${event.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/events/${event.id}`);
                }}
              >
                Comprar Ingressos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMovieCard = (movie: TMDBMovie) => {
    const genreName = movie.genre_ids?.[0] ? GENRE_MAP[movie.genre_ids[0]] ?? "Cinema" : "Cinema";
    const catInfo = getCategoryBadge(genreName);
    return (
      <div
        key={movie.id}
        className={styles.showCard}
        id={`card-movie-${movie.id}`}
        onClick={() => router.push(`/movies/${movie.id}`)}
      >
        <div className={styles.cardImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tmdbPoster(movie.poster_path)}
            alt={movie.title}
            className={styles.cardImg}
            loading="lazy"
          />
          <span className={styles.cardPosterBadge}>IMAX 3D</span>
        </div>

        <div className={styles.cardBody}>
          <div>
            <div className={styles.cardHeaderRow}>
              <span className={styles.cardTitle} title={movie.title}>{movie.title}</span>
              <span
                className={styles.cardCategoryBadge}
                style={{ background: catInfo.bg, color: catInfo.color, border: catInfo.border }}
              >
                {catInfo.label}
              </span>
            </div>

            <div className={styles.cardMetaGroup}>
              <span className={styles.cardDateText}>
                <CalendarIcon size={11} />
                {formatMovieDate(movie.release_date)}
              </span>
              <span className={styles.cardVenueText}>
                <FilmIcon size={11} />
                <span>Cinemark & UCI IMAX</span>
              </span>
            </div>
          </div>

          <div>
            <p className={styles.ticketsAvailableTag}>Ingressos disponíveis: ~150</p>

            <div className={styles.cardFooterRow}>
              <div className={styles.priceBlock}>
                <span className={styles.priceLabel}>A partir de</span>
                <span className={styles.priceAmount}>{formatMoviePrice(movie)}</span>
              </div>
              <button
                className={styles.btnComprarCard}
                id={`btn-comprar-movie-${movie.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/movies/${movie.id}`);
                }}
              >
                Comprar Ingressos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        <section className={styles.searchSection}>
          <h1 className={styles.searchHeading}>
            Encontre seu próximo <span className={styles.highlight}>evento</span>
          </h1>
          <div className={styles.searchBar}>
            <SearchIcon size={15} className={styles.searchIcon} />
            <input
              id="input-busca-main"
              type="text"
              className={styles.searchInput}
              placeholder="Buscar eventos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button
                className={styles.searchClear}
                id="btn-limpar-busca-main"
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
              >
                <XIcon size={12} />
              </button>
            )}
          </div>

          <div className={styles.filterBar}>
            {/* Filter 1: Tipos */}
            <div className={styles.filterBoxContainer}>
              <button
                type="button"
                className={`${styles.filterBox} ${openDropdown === "type" ? styles.filterBoxActive : ""}`}
                onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
              >
                <div className={styles.filterBoxTextGroup}>
                  <span className={styles.filterBoxTitle}>{selectedType}</span>
                  <span className={styles.filterBoxDesc}>
                    {TYPE_OPTIONS.find((t) => t.label === selectedType)?.desc ?? "Shows, Festivais, Teatro, Comédia, Cinema, Etc."}
                  </span>
                </div>
                <ChevronDownIcon size={16} className={styles.filterChevron} />
              </button>

              {openDropdown === "type" && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setOpenDropdown(null)} />
                  <div className={styles.dropdownMenu}>
                    {TYPE_OPTIONS.map((opt) => (
                      <div
                        key={opt.label}
                        className={`${styles.dropdownItem} ${selectedType === opt.label ? styles.dropdownItemActive : ""}`}
                        onClick={() => {
                          setSelectedType(opt.label);
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.dropdownItemLabel}>{opt.label}</span>
                        <span className={styles.dropdownItemDesc}>{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filter 2: Datas */}
            <div className={styles.filterBoxContainer}>
              <button
                type="button"
                className={`${styles.filterBox} ${openDropdown === "date" ? styles.filterBoxActive : ""}`}
                onClick={() => setOpenDropdown(openDropdown === "date" ? null : "date")}
              >
                <div className={styles.filterBoxTextGroup}>
                  <span className={styles.filterBoxTitle}>{selectedDate}</span>
                  <span className={styles.filterBoxDesc}>
                    {DATE_OPTIONS.find((d) => d.label === selectedDate)?.desc ?? "Hoje, Este Fim de Semana, Próximos 30 Dias, Etc."}
                  </span>
                </div>
                <ChevronDownIcon size={16} className={styles.filterChevron} />
              </button>

              {openDropdown === "date" && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setOpenDropdown(null)} />
                  <div className={styles.dropdownMenu}>
                    {DATE_OPTIONS.map((opt) => (
                      <div
                        key={opt.label}
                        className={`${styles.dropdownItem} ${selectedDate === opt.label ? styles.dropdownItemActive : ""}`}
                        onClick={() => {
                          setSelectedDate(opt.label);
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.dropdownItemLabel}>{opt.label}</span>
                        <span className={styles.dropdownItemDesc}>{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Filter 3: Ordenação */}
            <div className={styles.filterBoxContainer}>
              <button
                type="button"
                className={`${styles.filterBox} ${openDropdown === "sort" ? styles.filterBoxActive : ""}`}
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
              >
                <div className={styles.filterBoxTextGroup}>
                  <span className={styles.filterBoxTitle}>{selectedSort}</span>
                  <span className={styles.filterBoxDesc}>
                    {SORT_OPTIONS.find((s) => s.label === selectedSort)?.desc ?? "Mais Recente • Menor Preço"}
                  </span>
                </div>
                <ChevronDownIcon size={16} className={styles.filterChevron} />
              </button>

              {openDropdown === "sort" && (
                <>
                  <div className={styles.dropdownBackdrop} onClick={() => setOpenDropdown(null)} />
                  <div className={styles.dropdownMenu}>
                    {SORT_OPTIONS.map((opt) => (
                      <div
                        key={opt.label}
                        className={`${styles.dropdownItem} ${selectedSort === opt.label ? styles.dropdownItemActive : ""}`}
                        onClick={() => {
                          setSelectedSort(opt.label);
                          setOpenDropdown(null);
                        }}
                      >
                        <span className={styles.dropdownItemLabel}>{opt.label}</span>
                        <span className={styles.dropdownItemDesc}>{opt.desc}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangleIcon size={14} />
            {error}
          </div>
        )}

        {search ? (
          <section id="resultados-busca" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Resultado da pesquisa</h2>
              {(loading || moviesLoading) && <span className={styles.loadingDot}>Buscando...</span>}
            </div>

            {!loading && !moviesLoading && searchResults.length === 0 ? (
              <p className={styles.noResults}>Nenhum resultado encontrado para &quot;{search}&quot;.</p>
            ) : (
              <div className={styles.showsGrid}>
                {loading || moviesLoading
                  ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
                  : searchResults.map((item) =>
                      item.type === "event"
                        ? renderEventCard(item.data as TMEvent)
                        : renderMovieCard(item.data as TMDBMovie)
                    )}
              </div>
            )}
          </section>
        ) : (
          <>
        {!error && loading && (
          <section id="shows" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shows e Eventos</h2>
              <span className={styles.loadingDot}>Buscando...</span>
            </div>
            <div className={styles.showsGrid}>
              {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </section>
        )}

        {!error && !loading && filteredEvents.length === 0 && (
          <section id="shows" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shows e Eventos</h2>
            </div>
            <p className={styles.noResults}>Nenhum show encontrado para essa busca.</p>
          </section>
        )}

        {!error && !loading &&
          CATEGORY_GROUPS.map((group) => {
            const groupEvents = eventsByGroup.get(group.key) ?? [];
            if (groupEvents.length === 0) return null;
            return (
              <section key={group.key} id={`shows-${group.key.toLowerCase()}`} className={styles.showsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{group.title}</h2>
                </div>
                <div className={styles.showsGrid}>
                  {groupEvents.slice(0, 9).map((event) => renderEventCard(event))}
                </div>
              </section>
            );
          })}

        {showMoviesSection && moviesError && (
          <section id="filmes" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Filmes</h2>
            </div>
            <p className={styles.noResults}><AlertTriangleIcon size={13} /> {moviesError}</p>
          </section>
        )}

        {showMoviesSection && !moviesError && moviesLoading && (
          <section id="filmes" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Filmes</h2>
              <span className={styles.loadingDot}>Carregando...</span>
            </div>
            <div className={styles.showsGrid}>
              {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          </section>
        )}

        {showMoviesSection && !moviesError && !moviesLoading && filteredMovies.length === 0 && (
          <section id="filmes" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Filmes</h2>
            </div>
            <p className={styles.noResults}>Nenhum filme encontrado.</p>
          </section>
        )}

        {showMoviesSection && !moviesError && !moviesLoading &&
          moviesByGenre.order.map((genreName) => {
            const genreMovies = moviesByGenre.map.get(genreName) ?? [];
            if (genreMovies.length === 0) return null;
            return (
              <section key={genreName} id={`filmes-${genreName.toLowerCase()}`} className={styles.showsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Filmes — {genreName}</h2>
                </div>
                <div className={styles.showsGrid}>
                  {genreMovies.slice(0, 9).map((movie) => renderMovieCard(movie))}
                </div>
              </section>
            );
          })}
          </>
        )}
      </main>
    </div>
  );
}
