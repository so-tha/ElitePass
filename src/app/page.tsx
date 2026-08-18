"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
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

const CITIES = [
  "Todos os lugares",
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Salvador, BA",
  "Curitiba, PR",
  "Recife, PE",
  "Brasília, DF",
];

export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todos os lugares");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);

  // Movies state
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  // Coverflow carousel state
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  type HeroItem =
    | { type: "event"; data: TMEvent }
    | { type: "movie"; data: TMDBMovie };

  const heroItems = useMemo<HeroItem[]>(() => {
    const eventItems: HeroItem[] = events.slice(0, 5).map((e) => ({ type: "event", data: e }));
    const movieItems: HeroItem[] = movies.slice(0, 5).map((m) => ({ type: "movie", data: m }));
    const result: HeroItem[] = [];
    const len = Math.max(eventItems.length, movieItems.length);
    for (let i = 0; i < len; i++) {
      if (eventItems[i]) result.push(eventItems[i]);
      if (movieItems[i]) result.push(movieItems[i]);
    }
    return result.slice(0, 7);
  }, [events, movies]);

  useEffect(() => {
    if (heroItems.length <= 1 || heroPaused) return;
    heroTimerRef.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % heroItems.length);
    }, 4500);
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    };
  }, [heroItems.length, heroPaused]);

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

  // 3D Coverflow positioning
  const getCardStyle = (idx: number, activeIdx: number, total: number) => {
    let diff = idx - activeIdx;
    if (diff < -Math.floor(total / 2)) diff += total;
    if (diff > Math.floor(total / 2)) diff -= total;

    const absDiff = Math.abs(diff);

    if (absDiff > 3) {
      return {
        transform: `translateX(${diff * 180}px) translateZ(-400px) scale(0.5)`,
        opacity: 0,
        pointerEvents: "none" as const,
        zIndex: 0,
      };
    }

    const rotateY = diff === 0 ? 0 : diff > 0 ? -28 : 28;
    const translateX = diff * 185;
    const translateZ = diff === 0 ? 120 : -absDiff * 90;
    const scale = diff === 0 ? 1.05 : Math.max(0.7, 1 - absDiff * 0.15);
    const opacity = diff === 0 ? 1 : Math.max(0.4, 1 - absDiff * 0.22);
    const zIndex = 20 - absDiff * 5;
    const filter = diff === 0 ? "brightness(1.05)" : `brightness(${Math.max(0.4, 0.75 - absDiff * 0.15)})`;

    return {
      transform: `perspective(1000px) translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      filter,
    };
  };

  const activeItem = heroItems[heroIndex];
  const isActiveEvent = activeItem?.type === "event";
  const activeEv = isActiveEvent ? (activeItem.data as TMEvent) : null;
  const activeMv = !isActiveEvent && activeItem ? (activeItem.data as TMDBMovie) : null;

  return (
    <div className={styles.root}>
      {/* ── SYMPLA-ADAPTED HEADER (ESTABLISHED DARK & GOLD PALETTE) ── */}
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo} id="logo-home">
            <div className={styles.logoBadge}>EP</div>
            <span className={styles.logoText}>ElitePass</span>
          </a>

          {/* Sympla-style Header Search + Location Container */}

          {/* Sympla-style Nav Actions */}
          <div className={styles.navActions}>
            <a href="#criar" className={styles.navActionItem} id="link-criar-evento">
              <span className={styles.navActionIcon}>⊕</span>
              <span>Criar evento</span>
            </a>
            <a href="#meus-eventos" className={styles.navActionItem} id="link-meus-eventos">
              <span className={styles.navActionIcon}></span>
              <span>Meus eventos</span>
            </a>
            <a href="#meus-ingressos" className={styles.navActionItem} id="link-meus-ingressos">
              <span className={styles.navActionIcon}></span>
              <span>Meus ingressos</span>
            </a>
            <a href="#auth" className={styles.btnAuth} id="btn-entrar-cadastrar">
              Entrar / Cadastrar
            </a>
          </div>

          <button className={styles.menuToggle} id="btn-menu-toggle" aria-label="Abrir menu">
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ── PRESERVED MAIN SEARCH HERO BANNER ── */}
        <section className={styles.searchSection}>
          <h1 className={styles.searchHeading}>
            Encontre seu próximo <span className={styles.highlight}>evento</span>
          </h1>
          <div className={styles.searchBar}>
            <span className={styles.searchIcon}>🔍</span>
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
                ✕
              </button>
            )}
          </div>
        </section>

        {error && <div className={styles.errorBanner}>⚠️ {error}</div>}

        {/* ── 3D COVERFLOW HERO CAROUSEL (SYMPLA-STYLE ADAPTATION) ── */}
        <section
          className={styles.coverflowSection}
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
        >
          {loading && moviesLoading ? (
            <div className={`${styles.coverflowCard} ${styles.skeleton}`} style={{ position: "relative" }} />
          ) : heroItems.length === 0 ? null : (
            <>
              {/* Coverflow Track */}
              <div className={styles.coverflowTrack}>
                {heroItems.map((item, idx) => {
                  const isEvent = item.type === "event";
                  const ev = isEvent ? (item.data as TMEvent) : null;
                  const mv = !isEvent ? (item.data as TMDBMovie) : null;

                  const imgUrl = isEvent
                    ? getBestImage(ev!.images)
                    : `https://image.tmdb.org/t/p/w780${mv!.poster_path ?? mv!.backdrop_path ?? ""}`;
                  const badge = isEvent ? getCategory(ev!) : GENRE_MAP[mv!.genre_ids?.[0]] ?? "Filme";
                  const title = isEvent ? ev!.name : mv!.title;
                  const typeLabel = isEvent ? "SHOW" : "FILME";
                  const isActive = idx === heroIndex;
                  const cardStyle = getCardStyle(idx, heroIndex, heroItems.length);

                  return (
                    <div
                      key={idx}
                      className={`${styles.coverflowCard} ${isActive ? styles.coverflowCardActive : ""}`}
                      style={cardStyle}
                      onClick={() => setHeroIndex(idx)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={title} className={styles.coverflowCardImg} loading="lazy" />
                      <div className={styles.coverflowCardOverlay}>
                        <div className={styles.cardTopBadges}>
                          <span className={styles.coverflowBadge}>{badge}</span>
                          <span className={styles.coverflowTypeBadge}>{typeLabel}</span>
                        </div>
                        <h3 className={styles.cardCardTitle}>{title}</h3>
                      </div>
                    </div>
                  );
                })}

                {/* Left/Right Arrow Controls */}
                <button
                  className={`${styles.coverflowArrow} ${styles.coverflowArrowLeft}`}
                  onClick={() => setHeroIndex((i) => (i - 1 + heroItems.length) % heroItems.length)}
                  aria-label="Anterior"
                >
                  ‹
                </button>
                <button
                  className={`${styles.coverflowArrow} ${styles.coverflowArrowRight}`}
                  onClick={() => setHeroIndex((i) => (i + 1) % heroItems.length)}
                  aria-label="Próximo"
                >
                  ›
                </button>
              </div>

              {/* Coverflow Dots & Active Item Details */}
              {activeItem && (
                <div className={styles.coverflowFooter}>
                  <div className={styles.dotsContainer}>
                    {heroItems.map((_, idx) => (
                      <button
                        key={idx}
                        className={`${styles.dot} ${idx === heroIndex ? styles.dotActive : ""}`}
                        onClick={() => setHeroIndex(idx)}
                        aria-label={`Ir para slide ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <h2 className={styles.activeTitle}>
                    {isActiveEvent ? activeEv!.name : activeMv!.title}
                  </h2>

                  <div className={styles.activeMeta}>
                    {isActiveEvent ? (
                      <>
                        <span className={styles.metaItem}>📍 {getVenue(activeEv!)}</span>
                        <span className={styles.metaItem}>📅 {formatDate(activeEv!.dates.start.localDate)}</span>
                        <span className={styles.metaItem}>🎟️ {formatPrice(activeEv!)}</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.metaItem}>🎬 Nos cinemas</span>
                        <span className={styles.metaItem}>⭐ {activeMv!.vote_average.toFixed(1)} / 10</span>
                        <span className={styles.metaItem}>📅 Lançamento: {formatMovieDate(activeMv!.release_date)}</span>
                      </>
                    )}
                  </div>

                  <button
                    className={styles.btnBuyHero}
                    onClick={() =>
                      router.push(isActiveEvent ? `/events/${activeEv!.id}` : `/movies/${activeMv!.id}`)
                    }
                  >
                    Comprar Ingresso
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* ── SHOWS IN CAROUSEL ── */}
        {!error && (
          <section className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {search ? `Resultados para "${search}"` : "Shows e Eventos em Cartaz"}
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
                  ‹
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
                            <p className={styles.cardDate}>📅 {formatDate(event.dates.start.localDate)}</p>
                            <p className={styles.cardVenue}>📍 {getVenue(event)}</p>
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
                  ›
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── MOVIES IN THEATRES ── */}
        <section id="filmes" className={styles.showsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Filmes em Cartaz</h2>
            {moviesLoading && <span className={styles.loadingDot}>Carregando...</span>}
          </div>

          {moviesError ? (
            <p className={styles.noResults}>⚠️ {moviesError}</p>
          ) : !moviesLoading && movies.length === 0 ? (
            <p className={styles.noResults}>Nenhum filme encontrado.</p>
          ) : (
            <div className={styles.carouselWrapper}>
              <button
                className={`${styles.sideNavBtn} ${styles.sideNavLeft}`}
                onClick={() => scroll(moviesRef, "left")}
                aria-label="Ver filmes anteriores"
              >
                ‹
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
                          <p className={styles.cardArtist}>⭐ {movie.vote_average.toFixed(1)}</p>
                          <p className={styles.cardTitle}>{movie.title}</p>
                          <p className={styles.cardDate}>📅 {formatMovieDate(movie.release_date)}</p>
                          <p className={styles.cardVenue}>🎬 No cinema</p>
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
                ›
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
