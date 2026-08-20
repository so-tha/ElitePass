"use client";

import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
        <div className={styles.content}>
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} ElitePass. Todos os direitos reservados.
          </p>
          <p className={styles.credit}>
            Desenvolvido por <strong>so-tha</strong> para EliteDev.
          </p>
        </div>
      </div>
    </footer>
  );
}
