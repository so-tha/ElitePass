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

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: "left" | "right") => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction === "left" ? -480 : 480,
        behavior: "smooth",
      });
    }
  };

  const fetchMovies = useCallback(async () => {
    setMoviesLoading(true);
    setMoviesError(null);
    try {
      const res = await fetch("/api/movies");
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
    fetchEvents();
    fetchMovies();
  }, [fetchEvents, fetchMovies]);

  useEffect(() => {
    if (!search) {
      fetchEvents();
      return;
    }
    const timer = setTimeout(() => fetchEvents(search), 500);
    return () => clearTimeout(timer);
  }, [search, fetchEvents]);

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

        
        <section className={styles.cardSliderSection}>
          <div className={styles.sliderHeader}>
            <h2 className={styles.sliderTitle}>Destaques em Cartaz</h2>
            {(loading || moviesLoading) && <span className={styles.loadingDot}>Carregando...</span>}
          </div>

          <div className={styles.sliderWrapper}>
            <button
              className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
              onClick={() => scroll(sliderRef, "left")}
              aria-label="Anterior"
            >
              <ChevronLeftIcon size={22} />
            </button>
            <div className={styles.sliderTrack} ref={sliderRef}>
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
            <button
              className={`${styles.sideNavBtn} ${styles.sideNavRight}`}
              onClick={() => scroll(sliderRef, "right")}
              aria-label="Próximo"
            >
              <ChevronRightIcon size={22} />
            </button>
          </div>
        </section>

        {!error && (
          <section id="shows" className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {search ? `Resultados para "${search}"` : "Shows e Eventos"}
              </h2>
              {loading && <span className={styles.loadingDot}>Buscando...</span>}
            </div>

            {!loading && events.length === 0 ? (
              <p className={styles.noResults}>Nenhum show encontrado para essa busca.</p>
            ) : (
              <div className={styles.carouselWrapper}>
                <button
                  className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
                  onClick={() => scroll(trackRef, "left")}
                  aria-label="Anterior"
                >
                  <ChevronLeftIcon size={22} />
                </button>
                <div className={styles.showsTrack} ref={trackRef}>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                    : events.map((event) => (
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
                            <span className={styles.cardBadge}>{getCategory(event)}</span>
                          </div>
                          <div className={styles.cardBody}>
                            <p className={styles.cardArtist}>{getArtistName(event)}</p>
                            <p className={styles.cardTitle}>{event.name}</p>
                            <p className={styles.cardDate}><CalendarIcon size={12} />{formatDate(event.dates.start.localDate)}</p>
                            <p className={styles.cardVenue}><MapPinIcon size={12} />{getVenue(event)}</p>
                            <div className={styles.cardFooter}>
                              <span className={styles.cardPrice}>{formatPrice(event)}</span>
                              <button
                                className={styles.btnCard}
                                id={`btn-confira-${event.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/events/${event.id}`);
                                }}
                              >
                                Comprar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                </div>
                <button
                  className={`${styles.sideNavBtn} ${styles.sideNavRight}`}
                  onClick={() => scroll(trackRef, "right")}
                  aria-label="Próximo"
                >
                  <ChevronRightIcon size={22} />
                </button>
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
            <div className={styles.carouselWrapper}>
              <button
                className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
                onClick={() => scroll(moviesRef, "left")}
                aria-label="Ver filmes anteriores"
              >
                <ChevronLeftIcon size={22} />
              </button>
              <div className={styles.showsTrack} ref={moviesRef}>
                {moviesLoading
                  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                  : movies.map((movie) => (
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
                          <span className={styles.cardBadge}>
                            {movie.genre_ids?.[0] ? GENRE_MAP[movie.genre_ids[0]] ?? "Filme" : "Filme"}
                          </span>
                        </div>
                        <div className={styles.cardBody}>
                          <p className={styles.cardArtist}><StarIcon size={11} />{movie.vote_average.toFixed(1)}</p>
                          <p className={styles.cardTitle}>{movie.title}</p>
                          <p className={styles.cardDate}><CalendarIcon size={12} />{formatMovieDate(movie.release_date)}</p>
                          <p className={styles.cardVenue}><FilmIcon size={12} />No cinema</p>
                          <div className={styles.cardFooter}>
                            <span className={styles.cardPrice}>{formatMoviePrice(movie)}</span>
                            <button
                              className={styles.btnCard}
                              id={`btn-comprar-movie-${movie.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/movies/${movie.id}`);
                              }}
                            >
                              Comprar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
              </div>
              <button
                className={`${styles.sideNavBtn} ${styles.sideNavRight}`}
                onClick={() => scroll(moviesRef, "right")}
                aria-label="Ver próximos filmes"
              >
                <ChevronRightIcon size={22} />
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
