"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./UserMenu.module.css";
import { UserIcon, HeartIcon, TicketIcon, GridIcon, LogOutIcon, ChevronDownIcon, ShieldCheckIcon } from "./icons";
import { useAuth } from "@/lib/auth-context";
import { ConfirmModal } from "./ConfirmModal";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
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
  const isDoorman = user.role === "DOORMAN";

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    await logout();
  };

  return (
    <>
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

              {isDoorman && (
                <li>
                  <Link href="/portaria" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                    <ShieldCheckIcon size={15} /> Validação
                  </Link>
                </li>
              )}

              {isOrganizer && (
                <>
                  <li>
                    <Link href="/dashboard" className={styles.menuItem} role="menuitem" onClick={() => setOpen(false)}>
                      <GridIcon size={15} /> Dashboard
                    </Link>
                  </li>
                </>
              )}

              <li className={styles.menuDivider} role="separator" />

              <li>
                <button
                  type="button"
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                  role="menuitem"
                  onClick={handleLogoutClick}
                >
                  <LogOutIcon size={15} /> Sair
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Encerrar sessão"
        description="Deseja realmente sair da sua conta?"
        confirmText="Sair da conta"
        cancelText="Cancelar"
        variant="danger"
      />
    </>
  );
}
