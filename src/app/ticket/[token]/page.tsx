"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "./page.module.css";
import { Navbar } from "@/components/Navbar";
import { CalendarIcon, MapPinIcon, TicketIcon, CheckIcon, XIcon, AlertTriangleIcon } from "@/components/icons";
import type { SharedTicketResponse } from "@/app/api/tickets/share/[token]/route";

const STATUS_LABEL: Record<SharedTicketResponse["status"], string> = {
  VALID: "Válido",
  USED: "Utilizado",
  CANCELLED: "Cancelado",
};

export default function SharedTicketPage() {
  const { token } = useParams<{ token: string }>();

  const [ticket, setTicket] = useState<SharedTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/tickets/share/${encodeURIComponent(token)}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Link de ingresso inválido ou expirado.");
        setTicket(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Link de ingresso inválido ou expirado.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className={styles.root}>
      <Navbar />

      <main className={styles.main}>
        {loading && <div className={styles.skeleton} />}

        {!loading && error && (
          <div className={styles.errorBox}>
            <AlertTriangleIcon size={32} />
            <h2>Não foi possível abrir este ingresso</h2>
            <p>{error}</p>
          </div>
        )}

        {!loading && ticket && (
          <div className={styles.ticketCard}>
            <div className={styles.header}>
              <TicketIcon size={18} />
              <span>Ingresso compartilhado</span>
              <span className={`${styles.badge} ${styles[`badge${ticket.status}`]}`}>
                {ticket.status === "VALID" && <CheckIcon size={11} />}
                {ticket.status === "CANCELLED" && <XIcon size={11} />}
                {STATUS_LABEL[ticket.status]}
              </span>
            </div>

            <h1 className={styles.eventName}>{ticket.eventName}</h1>

            <div className={styles.meta}>
              {ticket.eventDate && (
                <span className={styles.metaItem}>
                  <CalendarIcon size={13} /> {new Date(ticket.eventDate).toLocaleDateString("pt-BR")}
                </span>
              )}
              {ticket.eventVenue && (
                <span className={styles.metaItem}>
                  <MapPinIcon size={13} /> {ticket.eventVenue}
                </span>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.qrSection}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(ticket.qrData)}`}
                alt="QR Code do ingresso"
                className={styles.qrCode}
                width={180}
                height={180}
              />
              <span className={styles.ticketCode}>{ticket.code}</span>
            </div>

            <div className={styles.divider} />

            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span>Categoria</span>
                <span>{ticket.tierLabel}</span>
              </div>
              <div className={styles.detailRow}>
                <span>Titular</span>
                <span>{ticket.holder}</span>
              </div>
            </div>

            <p className={styles.note}>Este é um link público de visualização — apresente o QR Code na entrada do evento.</p>
          </div>
        )}
      </main>
    </div>
  );
}
