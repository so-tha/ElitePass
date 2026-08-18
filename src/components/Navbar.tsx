"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { PlusIcon, TicketIcon } from "./icons";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.logo} onClick={close}>
          <div className={styles.logoBadge}>EP</div>
          <span className={styles.logoText}>ElitePass</span>
        </Link>

        <nav className={styles.navLinks}>
          <Link href="/#shows" className={styles.navLink}>Shows</Link>
          <Link href="/#filmes" className={styles.navLink}>Filmes</Link>
        </nav>

        <div className={styles.navActions}>
          <a href="#criar" className={styles.navActionItem}>
            <PlusIcon size={15} />
            <span>Criar evento</span>
          </a>
          <a href="#meus-ingressos" className={styles.navActionItem}>
            <TicketIcon size={15} />
            <span>Meus ingressos</span>
          </a>
          <a href="#auth" className={styles.btnAuth}>Entrar / Cadastrar</a>
        </div>

        <button
          className={`${styles.menuToggle} ${open ? styles.menuToggleOpen : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`${styles.mobilePanel} ${open ? styles.mobilePanelOpen : ""}`}>
        <Link href="/#shows" className={styles.mobileLink} onClick={close}>Shows</Link>
        <Link href="/#filmes" className={styles.mobileLink} onClick={close}>Filmes</Link>
        <a href="#criar" className={styles.mobileLink} onClick={close}>Criar evento</a>
        <a href="#meus-ingressos" className={styles.mobileLink} onClick={close}>Meus ingressos</a>
        <a href="#auth" className={styles.mobileLink} onClick={close}>Entrar / Cadastrar</a>
      </div>
    </header>
  );
}
