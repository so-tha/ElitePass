/**
 * Layout fixo da sala usado por todas as sessões de filme. Assentos livres não têm linha na
 * tabela `Seat` — o mapa completo é gerado aqui e mesclado com as linhas HELD/SOLD do banco.
 */
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
export const SEATS_PER_ROW = 12;

export const ALL_SEAT_LABELS: readonly string[] = SEAT_ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => `${row}${i + 1}`)
);

const SEAT_LABEL_SET = new Set(ALL_SEAT_LABELS);

export function isValidSeatLabel(label: string): boolean {
  return SEAT_LABEL_SET.has(label);
}

/** Tempo que um assento fica reservado (HELD) para um usuário após ele selecioná-lo. */
export const HOLD_DURATION_MS = 5 * 60 * 1000;

/** Ao criar o pedido, a reserva é estendida por esse tempo para cobrir o preenchimento do pagamento. */
export const ORDER_HOLD_EXTENSION_MS = 10 * 60 * 1000;
