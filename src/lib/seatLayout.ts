/** Layout fixo da sala, espelhando `backend/src/lib/seatLayout.ts`. */
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const SEATS_PER_ROW = 12;

export const ALL_SEAT_LABELS: readonly string[] = SEAT_ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => `${row}${i + 1}`)
);

/** Tempo (ms) de reserva de um assento após seleção — só para exibir contagem regressiva na UI. */
export const HOLD_DURATION_MS = 5 * 60 * 1000;
