"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./UserMenu.module.css";
import { UserIcon, HeartIcon, TicketIcon, GridIcon, LogOutIcon, ChevronDownIcon } from "./icons";
import { useAuth } from "@/lib/auth-context";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!user) return null;

  const initial = user.name.trim().charAt(0).toUpperCase();
  const isOrganizer = user.role === "ORGANIZER";

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={styles.avatar}>{initial}</span>
        <span className={styles.name}>{user.name.split(" ")[0]}</span>
        <ChevronDownIcon size={12} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHeader}>
            <p className={styles.dropdownName}>{user.name}</p>
            <p className={styles.dropdownEmail}>{user.email}</p>
          </div>

          <ul className={styles.menuList}>
            <li>
              <Link href="/account" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                <UserIcon size={15} /> Minha conta
              </Link>
            </li>
            <li>
              <a href="#favoritos" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                <HeartIcon size={15} /> Favoritos
              </a>
            </li>

            {isOrganizer && (
              <>
                <li>
                  <a href="#meus-eventos" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                    <TicketIcon size={15} /> Meus eventos
                  </a>
                </li>
                <li>
                  <a href="#dashboard" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                    <GridIcon size={15} /> Dashboard
                  </a>
                </li>
              </>
            )}

            <li className={styles.menuDivider} role="separator" />

            <li>
              <button
                type="button"
                className={`${styles.menuItem} ${styles.menuItemDanger}`}
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOutIcon size={15} /> Sair
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
