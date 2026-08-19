"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";
import { PlusIcon, TicketIcon, UserIcon, HeartIcon, GridIcon, LogOutIcon } from "./icons";
import { AuthModal } from "./AuthModal";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const close = () => setOpen(false);

  const openAuth = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    close();
  };

  return (
    <>
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
            <Link href="/tickets" className={styles.navActionItem}>
              <TicketIcon size={15} />
              <span>Meus ingressos</span>
            </Link>
            {user ? (
              <UserMenu />
            ) : (
              <button
                type="button"
                className={styles.btnAuth}
                onClick={() => openAuth("login")}
              >
                Entrar / Cadastrar
              </button>
            )}
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
          <Link href="/tickets" className={styles.mobileLink} onClick={close}>Meus ingressos</Link>

          {user ? (
            <>
              <Link href="/account" className={styles.mobileLink} onClick={close}>
                <UserIcon size={15} /> Minha conta
              </Link>
              {user.role === "ORGANIZER" && (
                <>
                  <Link href="/dashboard" className={styles.mobileLink} onClick={close}>
                    <GridIcon size={15} /> Dashboard
                  </Link>
                </>
              )}
              <button
                type="button"
                className={styles.mobileLink}
                style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
                onClick={() => {
                  close();
                  logout();
                }}
              >
                <LogOutIcon size={15} /> Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.mobileLink}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
              onClick={() => openAuth("login")}
            >
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
