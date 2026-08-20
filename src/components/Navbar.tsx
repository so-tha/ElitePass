"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./Navbar.module.css";
import { PlusIcon, TicketIcon, UserIcon, GridIcon, LogOutIcon, SunIcon, MoonIcon, SearchIcon } from "./icons";
import { AuthModal } from "./AuthModal";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ConfirmModal } from "./ConfirmModal";

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

function LoginParamHandler({
  setAuthModalOpen,
  setAuthMode,
}: {
  setAuthModalOpen: (open: boolean) => void;
  setAuthMode: (mode: "login" | "register") => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openLoginHandledRef = useRef(false);

  useEffect(() => {
    const openLogin = searchParams.get("openLogin");
    if (openLogin === "true" && !openLoginHandledRef.current) {
      openLoginHandledRef.current = true;
      setAuthModalOpen(true);
      setAuthMode("login");
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("openLogin");
      const newUrl = newParams.toString() ? `?${newParams}` : "/";
      router.replace(newUrl);
    }
  }, [searchParams, router, setAuthModalOpen, setAuthMode]);

  return null;
}

export function Navbar({ searchValue, onSearchChange }: NavbarProps = {}) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const isControlled = searchValue !== undefined && onSearchChange !== undefined;
  const searchInputValue = isControlled ? searchValue : localSearch;

  const close = () => setOpen(false);

  const openAuth = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    close();
  };

  const handleSearchChange = (value: string) => {
    if (isControlled) {
      onSearchChange!(value);
    } else {
      setLocalSearch(value);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isControlled) {
      const term = localSearch.trim();
      router.push(term ? `/?search=${encodeURIComponent(term)}` : "/");
    }
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

          <form className={styles.navSearchWrapper} onSubmit={handleSearchSubmit}>
            <div className={styles.navSearch}>
              <SearchIcon size={14} className={styles.navSearchIcon} />
              <input
                type="text"
                className={styles.navSearchInput}
                placeholder="Buscar eventos, filmes..."
                value={searchInputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
              />
            </div>
          </form>

          <div className={styles.navActions}>
            {user?.role === "ORGANIZER" && (
              <Link href="/dashboard?tab=novo" className={styles.navActionItem}>
                <PlusIcon size={15} />
                <span>Criar evento</span>
              </Link>
            )}
            {user?.role !== "DOORMAN" && (
              <Link href="/tickets" className={styles.navActionItem}>
                <TicketIcon size={15} />
                <span>Meus ingressos</span>
              </Link>
            )}

            <button
              type="button"
              className={styles.themeToggleBtn}
              onClick={toggleTheme}
              aria-label="Alternar tema"
              title={theme === "dark" ? "Alternar para Modo Claro" : "Alternar para Modo Escuro"}
            >
              {theme === "dark" ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

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
          <form className={styles.mobileSearchForm} onSubmit={handleSearchSubmit}>
            <div className={styles.navSearch}>
              <SearchIcon size={14} className={styles.navSearchIcon} />
              <input
                type="text"
                className={styles.navSearchInput}
                placeholder="Buscar eventos, filmes..."
                value={searchInputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                autoComplete="off"
              />
            </div>
          </form>

          {user?.role === "ORGANIZER" && (
            <Link href="/dashboard?tab=novo" className={styles.mobileLink} onClick={close}>
              Criar evento
            </Link>
          )}
          {user?.role !== "DOORMAN" && (
            <Link href="/tickets" className={styles.mobileLink} onClick={close}>Meus ingressos</Link>
          )}

          <button
            type="button"
            className={styles.mobileLink}
            style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer" }}
            onClick={() => {
              toggleTheme();
              close();
            }}
          >
            {theme === "dark" ? <SunIcon size={15} /> : <MoonIcon size={15} />}
            <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
          </button>

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
                  setShowLogoutModal(true);
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

      <Suspense fallback={null}>
        <LoginParamHandler
          setAuthModalOpen={setAuthModalOpen}
          setAuthMode={setAuthMode}
        />
      </Suspense>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={logout}
        title="Encerrar sessão"
        description="Deseja realmente sair da sua conta?"
        confirmText="Sair da conta"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
