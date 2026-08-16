"use client";

import { useState } from "react";
import styles from "./page.module.css";

/* ---------- Dados de exemplo ---------- */
const shows = [
  {
    id: 1,
    title: "The Weeknd — After Hours Tour",
    artist: "The Weeknd",
    date: "22 Set 2025",
    venue: "Allianz Parque, SP",
    price: "R$ 380",
    category: "Pop",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80",
  },
  {
    id: 2,
    title: "Metallica — M72 World Tour",
    artist: "Metallica",
    date: "05 Out 2025",
    venue: "Estádio Nilton Santos, RJ",
    price: "R$ 520",
    category: "Rock",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80",
  },
  {
    id: 3,
    title: "Beyoncé — Renaissance World Tour",
    artist: "Beyoncé",
    date: "18 Out 2025",
    venue: "Arena BRB, DF",
    price: "R$ 450",
    category: "R&B",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80",
  },
  {
    id: 4,
    title: "Dua Lipa — Future Nostalgia Tour",
    artist: "Dua Lipa",
    date: "30 Out 2025",
    venue: "Pedreira Paulo Leminski, PR",
    price: "R$ 290",
    category: "Pop",
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80",
  },
  {
    id: 5,
    title: "Arctic Monkeys — The Car Tour",
    artist: "Arctic Monkeys",
    date: "12 Nov 2025",
    venue: "Vibra São Paulo, SP",
    price: "R$ 340",
    category: "Rock",
    image: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&q=80",
  },
  {
    id: 6,
    title: "Rosalía — Motomami World Tour",
    artist: "Rosalía",
    date: "28 Nov 2025",
    venue: "Teatro Opus, SP",
    price: "R$ 260",
    category: "Alternativo",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80",
  },
  {
    id: 7,
    title: "Post Malone — F-1 Trillion Tour",
    artist: "Post Malone",
    date: "10 Dez 2025",
    venue: "Jeunesse Arena, RJ",
    price: "R$ 420",
    category: "Hip-Hop",
    image: "https://images.unsplash.com/photo-1571266028243-3ead19709b55?w=600&q=80",
  },
];

const featured = shows[0];

export default function Home() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const filtered = shows.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.artist.toLowerCase().includes(search.toLowerCase()) ||
      s.venue.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.root}>
      {/* ───── NAVBAR ───── */}
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
            <span className={styles.searchIcon}>🔍</span>
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

        {/* ───── SHOW EM DESTAQUE ───── */}
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Show em Destaque</h2>

          <div className={styles.featuredCard}>
            <div
              className={styles.featuredBg}
              style={{ backgroundImage: `url(${featured.image})` }}
            />
            <div className={styles.featuredOverlay} />

            <div className={styles.featuredContent}>
              <span className={styles.featuredBadge}>{featured.category}</span>
              <p className={styles.featuredArtist}>{featured.artist}</p>
              <h3 className={styles.featuredTitle}>{featured.title}</h3>

              <div className={styles.featuredMeta}>
                <span>📅 {featured.date}</span>
                <span>📍 {featured.venue}</span>
              </div>

              <div className={styles.featuredFooter}>
                <div>
                  <p className={styles.priceLabel}>A partir de</p>
                  <p className={styles.priceValue}>{featured.price}</p>
                </div>
                <button className={styles.btnEmbarcar} id="btn-embarcar-destaque">
                  Embarcar 🎟️
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ───── SHOWS HORIZONTAIS ───── */}
        <section className={styles.showsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {search ? `Resultados para "${search}"` : "Shows em Cartaz"}
            </h2>
            <a href="#" className={styles.seeAll} id="link-ver-todos">
              Ver todos →
            </a>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.noResults}>Nenhum show encontrado para essa busca.</p>
          ) : (
            <div className={styles.showsTrack}>
              {filtered.map((show) => (
                <div key={show.id} className={styles.showCard} id={`card-show-${show.id}`}>
                  <div className={styles.cardImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={show.image} alt={show.title} className={styles.cardImg} />
                    <span className={styles.cardBadge}>{show.category}</span>
                  </div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardArtist}>{show.artist}</p>
                    <p className={styles.cardTitle}>{show.title}</p>
                    <p className={styles.cardDate}>📅 {show.date}</p>
                    <p className={styles.cardVenue}>📍 {show.venue}</p>
                    <div className={styles.cardFooter}>
                      <span className={styles.cardPrice}>{show.price}</span>
                      <button className={styles.btnCard} id={`btn-embarcar-${show.id}`}>
                        Embarcar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
