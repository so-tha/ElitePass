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


export default function Home() {
  const router = useRouter();
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [featured, setFeatured] = useState<TMEvent | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const moviesRef = useRef<HTMLDivElement>(null);

  // Movies state
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [moviesError, setMoviesError] = useState<string | null>(null);

  // Hero carousel state
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  type HeroItem =
    | { type: "event"; data: TMEvent }
    | { type: "movie"; data: TMDBMovie };

  const heroItems = useMemo<HeroItem[]>(() => {
    const eventItems: HeroItem[] = events.slice(0, 5).map(e => ({ type: "event", data: e }));
    const movieItems: HeroItem[] = movies.slice(0, 5).map(m => ({ type: "movie", data: m }));
    // Interleave: event, movie, event, movie...
    const result: HeroItem[] = [];
    const len = Math.max(eventItems.length, movieItems.length);
    for (let i = 0; i < len; i++) {
      if (eventItems[i]) result.push(eventItems[i]);
      if (movieItems[i]) result.push(movieItems[i]);
    }
    return result.slice(0, 8);
  }, [events, movies]);

  useEffect(() => {
    if (heroItems.length <= 1 || heroPaused) return;
    heroTimerRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 5000);
    return () => { if (heroTimerRef.current) clearInterval(heroTimerRef.current); };
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
      if (list.length > 0) setFeatured(list[0]);
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
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <a href="/" className={styles.logo} id="logo-home">
            <span className={styles.logoText}>ElitePass</span>
          </a>

          <nav className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ""}`}>
            <a href="#shows" className={styles.navLink} id="nav-shows">Shows</a>
            <a href="#filmes" className={styles.navLink} id="nav-filmes">Filmes</a>
            <a href="#festivais" className={styles.navLink} id="nav-festivais">Festivais</a>
            <a href="#esportes" className={styles.navLink} id="nav-esportes">Esportes</a>
            <a href="#teatro" className={styles.navLink} id="nav-teatro">Teatro</a>
          </nav>

          <a href="#auth" className={styles.btnAuth} id="btn-entrar-cadastrar">
            Entrar / Cadastrar
          </a>

          <button
            className={styles.menuToggle}
            id="btn-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {/* ───── BUSCA ───── */}
        <section className={styles.searchSection}>
          <h1 className={styles.searchHeading}>
            Encontre seu próximo <span className={styles.highlight}>show</span>
          </h1>
          <div className={styles.searchBar}>
            <input
              id="input-busca"
              type="text"
              className={styles.searchInput}
              placeholder="Buscar shows, artistas ou locais..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <button
                className={styles.searchClear}
                id="btn-limpar-busca"
                onClick={() => setSearch("")}
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </section>

        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* ── HERO CAROUSEL ── */}
        <section
          className={styles.heroCarousel}
          onMouseEnter={() => setHeroPaused(true)}
          onMouseLeave={() => setHeroPaused(false)}
        >
          {loading && moviesLoading ? (
            <div className={`${styles.heroSlide} ${styles.skeleton}`} />
          ) : heroItems.length === 0 ? null : (
            <>
              {heroItems.map((item, idx) => {
                const isEvent = item.type === "event";
                const ev = isEvent ? (item.data as TMEvent) : null;
                const mv = !isEvent ? (item.data as TMDBMovie) : null;

                const imgUrl = isEvent
                  ? getBestImage(ev!.images)
                  : `https://image.tmdb.org/t/p/w1280${mv!.backdrop_path ?? mv!.poster_path ?? ""}`;
                const badge  = isEvent ? getCategory(ev!) : (GENRE_MAP[mv!.genre_ids?.[0]] ?? "Filme");
                const artist = isEvent ? getArtistName(ev!) : "";
                const title  = isEvent ? ev!.name : mv!.title;
                const meta1  = isEvent
                  ? `📅 ${formatDate(ev!.dates.start.localDate)}`
                  : `⭐ ${mv!.vote_average.toFixed(1)} · ${mv!.vote_count.toLocaleString()} avaliações`;
                const meta2  = isEvent ? `📍 ${getVenue(ev!)}` : `📅 ${formatMovieDate(mv!.release_date)}`;
                const price  = isEvent ? formatPrice(ev!) : formatMoviePrice(mv!);
                const href   = isEvent ? `/events/${ev!.id}` : `/movies/${mv!.id}`;
                const typeLabel = isEvent ? "🎵 Show" : "🎬 Filme";

                return (
                  <div
                    key={idx}
                    className={`${styles.heroSlide} ${idx === heroIndex ? styles.heroSlideActive : ""}`}
                    aria-hidden={idx !== heroIndex}
                  >
                    <div className={styles.heroSlideBg} style={{ backgroundImage: `url(${imgUrl})` }} />
                    <div className={styles.heroSlideOverlay} />
                    <div className={styles.heroSlideContent}>
                      <div className={styles.heroSlideType}>{typeLabel}</div>
                      <span className={styles.featuredBadge}>{badge}</span>
                      {artist && <p className={styles.featuredArtist}>{artist}</p>}
                      <h2 className={styles.featuredTitle}>{title}</h2>
                      <div className={styles.featuredMeta}>
                        <span>{meta1}</span>
                        <span>{meta2}</span>
                      </div>
                      <div className={styles.featuredFooter}>
                        <div>
                          <p className={styles.priceLabel}>A partir de</p>
                          <p className={styles.priceValue}>{price}</p>
                        </div>
                        <button
                          className={styles.btnEmbarcar}
                          id={`btn-hero-${idx}`}
                          onClick={() => router.push(href)}
                        >
                          Comprar Ingresso
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Dot indicators */}
              <div className={styles.heroDots}>
                {heroItems.map((_, idx) => (
                  <button
                    key={idx}
                    className={`${styles.heroDot} ${idx === heroIndex ? styles.heroDotActive : ""}`}
                    onClick={() => { setHeroIndex(idx); setHeroPaused(true); setTimeout(() => setHeroPaused(false), 8000); }}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Arrow controls */}
              <button
                className={`${styles.heroArrow} ${styles.heroArrowLeft}`}
                onClick={() => { setHeroIndex(i => (i - 1 + heroItems.length) % heroItems.length); }}
                aria-label="Anterior"
              >‹</button>
              <button
                className={`${styles.heroArrow} ${styles.heroArrowRight}`}
                onClick={() => { setHeroIndex(i => (i + 1) % heroItems.length); }}
                aria-label="Próximo"
              >›</button>
            </>
          )}
        </section>

        {!error && (
          <section className={styles.showsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {search ? `Resultados para "${search}"` : "Shows em Cartaz"}
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
                        style={{ cursor: "pointer" }}
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
                              onClick={(e) => { e.stopPropagation(); router.push(`/events/${event.id}`); }}
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
            <h2 className={styles.sectionTitle}>🎬 Filmes em Cartaz</h2>
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
                      style={{ cursor: "pointer" }}
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
                          {movie.genre_ids?.[0] ? (GENRE_MAP[movie.genre_ids[0]] ?? "Filme") : "Filme"}
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
                            onClick={(e) => { e.stopPropagation(); router.push(`/movies/${movie.id}`); }}
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
