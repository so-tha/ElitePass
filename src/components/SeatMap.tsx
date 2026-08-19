"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./SeatMap.module.css";
import { SEAT_ROWS, SEATS_PER_ROW } from "@/lib/seatLayout";
import type { SeatInfo } from "@/lib/useSeatMap";

interface SeatMapProps {
  seats: Map<string, SeatInfo>;
  selected: string[];
  onToggle: (label: string) => void;
  loading: boolean;
  loadError: string | null;
  actionError: string | null;
  disabled?: boolean;
}

function seatState(label: string, seats: Map<string, SeatInfo>, selected: string[]): "available" | "selected" | "held" | "sold" {
  if (selected.includes(label)) return "selected";
  const info = seats.get(label);
  if (!info) return "available";
  if (info.status === "SOLD") return "sold";
  return "held";
}

function useCountdown(targetIso: string | undefined): string | null {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  if (!targetIso) return null;
  const remainingMs = new Date(targetIso).getTime() - now;
  if (remainingMs <= 0) return "0:00";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SeatMap({ seats, selected, onToggle, loading, loadError, actionError, disabled }: SeatMapProps) {
  const earliestExpiry = useMemo(() => {
    let earliest: string | undefined;
    for (const label of selected) {
      const exp = seats.get(label)?.holdExpiresAt;
      if (exp && (!earliest || exp < earliest)) earliest = exp;
    }
    return earliest;
  }, [seats, selected]);

  const countdown = useCountdown(earliestExpiry);

  if (loading) {
    return <div className={styles.loading}>Carregando mapa de assentos...</div>;
  }

  if (loadError) {
    return <div className={styles.loadError}>{loadError}</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.screen}>
        <span>TELA</span>
      </div>

      <div className={styles.grid}>
        {SEAT_ROWS.map((row) => (
          <div className={styles.row} key={row}>
            <span className={styles.rowLabel}>{row}</span>
            <div className={styles.seatsInRow}>
              {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                const label = `${row}${i + 1}`;
                const state = seatState(label, seats, selected);
                return (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.seat} ${styles[`seat_${state}`]}`}
                    onClick={() => onToggle(label)}
                    disabled={disabled || state === "sold" || state === "held"}
                    aria-label={`Assento ${label} — ${state}`}
                    title={label}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}><i className={`${styles.dot} ${styles.dot_available}`} /> Disponível</span>
        <span className={styles.legendItem}><i className={`${styles.dot} ${styles.dot_selected}`} /> Selecionado</span>
        <span className={styles.legendItem}><i className={`${styles.dot} ${styles.dot_held}`} /> Reservado</span>
        <span className={styles.legendItem}><i className={`${styles.dot} ${styles.dot_sold}`} /> Vendido</span>
      </div>

      {selected.length > 0 && countdown && (
        <p className={styles.holdNotice}>
          Seus assentos ficam reservados por mais <strong>{countdown}</strong> — finalize a compra antes de expirar.
        </p>
      )}

      {actionError && <p className={styles.actionError}>{actionError}</p>}
    </div>
  );
}
