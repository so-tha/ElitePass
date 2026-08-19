"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import {
  SearchIcon,
  XIcon,
  MapPinIcon,
  CalendarIcon,
  TicketIcon,
  StarIcon,
  FilmIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";
import {
  TMEvent,
  getBestImage,
  formatPrice,
  formatDate,
  getArtistName,
  getVenue,
  getCategory,
} from "@/lib/ticketmaster";
import {
  TMDBMovie,
  tmdbPoster,
  formatMoviePrice,
  formatMovieDate,
  GENRE_MAP,
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

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);

  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  const [sliderScroll, setSliderScroll] = useState({ canLeft: false, canRight: false });
  const [showsScroll, setShowsScroll] = useState({ canLeft: false, canRight: false });
  const [moviesScroll, setMoviesScroll] = useState({ canLeft: false, canRight: false });

  const checkScroll = useCallback((
    ref: React.RefObject<HTMLDivElement | null>,
    setter: React.Dispatch<React.SetStateAction<{ canLeft: boolean; canRight: boolean }>>
  ) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      const canLeft = scrollLeft > 10;
      const canRight = scrollLeft + clientWidth < scrollWidth - 10;
      setter({ canLeft, canRight });
    }
  }, []);

  const scroll = (
    ref: React.RefObject<HTMLDivElement | null>,
    direction: "left" | "right",
    setter: React.Dispatch<React.SetStateAction<{ canLeft: boolean; canRight: boolean }>>
  ) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -480 : 480,
        behavior: "smooth",
      });
      setTimeout(() => checkScroll(ref, setter), 350);
    }
  };

  type FeaturedItem =
    | { type: "event"; data: TMEvent }
    | { type: "movie"; data: TMDBMovie };

  const featuredItems = useMemo<FeaturedItem[]>(() => {
    const eventItems: FeaturedItem[] = events.slice(0, 6).map((e) => ({ type: "event", data: e }));
    const movieItems: FeaturedItem[] = movies.slice(0, 6).map((m) => ({ type: "movie", data: m }));
    const result: FeaturedItem[] = [];
    const len = Math.max(eventItems.length, movieItems.length);
    for (let i = 0; i < len; i++) {
      if (eventItems[i]) result.push(eventItems[i]);
      if (movieItems[i]) result.push(movieItems[i]);
    }
    return result.slice(0, 10);
  }, [events, movies]);

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

  useEffect(() => {
    const updateAll = () => {
      checkScroll(sliderRef, setSliderScroll);
      checkScroll(trackRef, setShowsScroll);
      checkScroll(moviesRef, setMoviesScroll);
    };
    updateAll();
    const timer = setTimeout(updateAll, 300);
    window.addEventListener("resize", updateAll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateAll);
    };
  }, [events, movies, checkScroll]);

  type SearchResultItem =
    | { type: "event"; data: TMEvent }
    | { type: "movie"; data: TMDBMovie };

  const searchResults = useMemo<SearchResultItem[]>(() => {
    const eventItems: SearchResultItem[] = events.map((e) => ({ type: "event", data: e }));
    const movieItems: SearchResultItem[] = movies.map((m) => ({ type: "movie", data: m }));
    return [...eventItems, ...movieItems];
  }, [events, movies]);

function getCategoryBadge(categoryStr: string) {
  const cat = categoryStr.toUpperCase();
  if (cat.includes("COMÉDIA") || cat.includes("STAND-UP")) {
    return { label: "COMÉDIA", bg: "rgba(255, 178, 44, 0.18)", color: "#FFB22C", border: "1px solid #FFB22C" };
  }
  if (cat.includes("TEATRO") || cat.includes("ESPETÁCULO")) {
    return { label: "TEATRO", bg: "rgba(239, 68, 68, 0.18)", color: "#EF4444", border: "1px solid #EF4444" };
  }
  if (cat.includes("PALESTRA") || cat.includes("CURSO") || cat.includes("WORKSHOP") || cat.includes("EDUCAÇÃO")) {
    return { label: "PALESTRA", bg: "rgba(16, 185, 129, 0.18)", color: "#10B981", border: "1px solid #10B981" };
  }
  if (cat.includes("POP") || cat.includes("MPB") || cat.includes("ROCK") || cat.includes("SHOW")) {
    return { label: "MPB/POP", bg: "rgba(59, 130, 246, 0.18)", color: "#3B82F6", border: "1px solid #3B82F6" };
  }
  if (cat.includes("CINEMA") || cat.includes("FILME") || cat.includes("MOVIE")) {
    return { label: "CINEMA", bg: "rgba(139, 92, 246, 0.18)", color: "#A855F7", border: "1px solid #A855F7" };
  }
  return { label: categoryStr.toUpperCase().substring(0, 10), bg: "rgba(255, 178, 44, 0.18)", color: "#FFB22C", border: "1px solid #FFB22C" };
}

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
        <section className={styles.cardSliderSection}>
          <div className={styles.sliderHeader}>
            <h2 className={styles.sliderTitle}>Destaques em Cartaz</h2>
            {(loading || moviesLoading) && <span className={styles.loadingDot}>Carregando...</span>}
          </div>

          <div className={styles.sliderWrapper}>
            {sliderScroll.canLeft && (
              <button
                className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
                onClick={() => scroll(sliderRef, "left", setSliderScroll)}
                aria-label="Anterior"
              >
                <ChevronLeftIcon size={22} />
              </button>
            )}

            <div
              className={styles.sliderTrack}
              ref={sliderRef}
              onScroll={() => checkScroll(sliderRef, setSliderScroll)}
            >
              {loading && moviesLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`${styles.sliderCard} ${styles.skeleton}`} />
                  ))
                : featuredItems.map((item, idx) => {
                    const isEvent = item.type === "event";
                    const ev = isEvent ? (item.data as TMEvent) : null;
                    const mv = !isEvent ? (item.data as TMDBMovie) : null;

                    const imgUrl = isEvent
                      ? getBestImage(ev!.images)
                      : `https://image.tmdb.org/t/p/w780${mv!.poster_path ?? mv!.backdrop_path ?? ""}`;
                    const badge = isEvent ? getCategory(ev!) : GENRE_MAP[mv!.genre_ids?.[0]] ?? "Filme";
                    const title = isEvent ? ev!.name : mv!.title;
                    const typeLabel = isEvent ? "SHOW" : "FILME";
                    const price = isEvent ? formatPrice(ev!) : formatMoviePrice(mv!);
                    const href = isEvent ? `/events/${ev!.id}` : `/movies/${mv!.id}`;

                    return (
                      <div
                        key={idx}
                        className={styles.sliderCard}
                        onClick={() => router.push(href)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgUrl} alt={title} className={styles.sliderCardImg} loading="lazy" />
                        <div className={styles.sliderCardOverlay}>
                          <div className={styles.cardHeaderBadges}>
                            <span className={styles.sliderBadge}>{badge}</span>
                            <span className={styles.sliderTypeBadge}>{typeLabel}</span>
                          </div>
                          <div className={styles.cardFooterContent}>
                            <h3 className={styles.sliderCardTitle}>{title}</h3>
                            <div className={styles.sliderMetaRow}>
                              {isEvent ? (
                                <>
                                  <span className={styles.metaItem}><MapPinIcon size={12} />{getVenue(ev!)}</span>
                                  <span className={styles.metaItem}><CalendarIcon size={12} />{formatDate(ev!.dates.start.localDate)}</span>
                                </>
                              ) : (
                                <>
                                  <span className={styles.metaItem}><StarIcon size={12} />{mv!.vote_average.toFixed(1)} / 10</span>
                                  <span className={styles.metaItem}><CalendarIcon size={12} />{formatMovieDate(mv!.release_date)}</span>
                                </>
                              )}
                            </div>
                            <div className={styles.sliderActionRow}>
                              <span className={styles.sliderPrice}>{price}</span>
                              <button
                                className={styles.btnSliderBuy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(href);
                                }}
                              >
                                Comprar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {sliderScroll.canRight && (
              <button
                className={`${styles.sideNavBtn} ${styles.sideNavRight}`}
                onClick={() => scroll(sliderRef, "right", setSliderScroll)}
                aria-label="Próximo"
              >
                <ChevronRightIcon size={22} />
              </button>
            )}
          </div>
        </section>

        {!error && (
          <section id="shows" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Shows e Eventos</h2>
              {loading && <span className={styles.loadingDot}>Buscando...</span>}
            </div>

            {!loading && events.length === 0 ? (
              <p className={styles.noResults}>Nenhum show encontrado para essa busca.</p>
            ) : (
              <div className={styles.showsGrid}>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                  : events.slice(0, 6).map((event) => renderEventCard(event))}
              </div>
            )}
          </section>
        )}

        <section id="filmes" className={styles.showsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Filmes</h2>
            {moviesLoading && <span className={styles.loadingDot}>Carregando...</span>}
          </div>

          {moviesError ? (
            <p className={styles.noResults}><AlertTriangleIcon size={13} /> {moviesError}</p>
          ) : !moviesLoading && movies.length === 0 ? (
            <p className={styles.noResults}>Nenhum filme encontrado.</p>
          ) : (
            <div className={styles.showsGrid}>
              {moviesLoading
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : movies.slice(0, 6).map((movie) => renderMovieCard(movie))}
            </div>
          )}
        </section>
          </>
        )}
      </main>
    </div>
  );
}
