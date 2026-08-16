"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [featured, setFeatured] = useState<TMEvent | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
  }, [fetchEvents]);

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
            <a href="#" className={styles.navLink} id="nav-shows">Shows</a>
            <a href="#" className={styles.navLink} id="nav-festivais">Festivais</a>
            <a href="#" className={styles.navLink} id="nav-esportes">Esportes</a>
            <a href="#" className={styles.navLink} id="nav-teatro">Teatro</a>
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

        {!error && (
          <section className={styles.featuredSection}>
            <h2 className={styles.sectionTitle}>Show em Destaque</h2>

            {loading || !featured ? (
              <div className={`${styles.featuredCard} ${styles.skeleton}`} style={{ minHeight: 420 }} />
            ) : (
              <div className={styles.featuredCard}>
                <div
                  className={styles.featuredBg}
                  style={{ backgroundImage: `url(${getBestImage(featured.images)})` }}
                />
                <div className={styles.featuredOverlay} />

                <div className={styles.featuredContent}>
                  <span className={styles.featuredBadge}>{getCategory(featured)}</span>
                  <p className={styles.featuredArtist}>{getArtistName(featured)}</p>
                  <h3 className={styles.featuredTitle}>{featured.name}</h3>

                  <div className={styles.featuredMeta}>
                    <span>📅 {formatDate(featured.dates.start.localDate)}</span>
                    <span>📍 {getVenue(featured)}</span>
                  </div>

                  <div className={styles.featuredFooter}>
                    <div>
                      <p className={styles.priceLabel}>A partir de</p>
                      <p className={styles.priceValue}>{formatPrice(featured)}</p>
                    </div>
                    <a
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnEmbarcar}
                      id="btn-embarcar-destaque"
                    >
                      Confira
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

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
              <div className={styles.showsTrack}>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                  : events.map((event) => (
                    <div
                      key={event.id}
                      className={styles.showCard}
                      id={`card-show-${event.id}`}
                      onClick={() => setFeatured(event)}
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
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.btnCard}
                            id={`btn-confira-${event.id}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Confira
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
