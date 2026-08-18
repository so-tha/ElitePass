import crypto from "crypto";
import { env } from "../config/env";

/**
 * Gera um código de ingresso único e legível.
 * Formato: EVT-TI-YYYYMMDD-NNNNNN
 *   EVT = 3 letras do nome do evento
 *   TI  = 2 letras do tier
 *   Date = data de emissão
 *   N   = 6 dígitos pseudoaleatórios seguros
 *
 * Exemplo: "MIC-PI-20260817-832941"
 */
export function generateTicketCode(eventName: string, tierLabel: string): string {
  const evPart   = eventName.replace(/\s+/g, "").toUpperCase().slice(0, 3).padEnd(3, "X");
  const tierPart = tierLabel.replace(/\s+/g, "").toUpperCase().slice(0, 2).padEnd(2, "X");
  const now      = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const rand = crypto.randomInt(100000, 999999);
  return `${evPart}-${tierPart}-${datePart}-${rand}`;
}

/**
 * Gera o conteúdo do QR Code: um hash HMAC-SHA256 do código do ticket.
 * O QR carrega o próprio code + assinatura para dificultar falsificações.
 */
export function generateQrData(ticketCode: string): string {
  const hmac = crypto.createHmac("sha256", env.TICKET_HMAC_SECRET).update(ticketCode).digest("hex").slice(0, 16);
  return `EP:${ticketCode}:${hmac}`;
}

/**
 * Valida se um QR Data é autêntico.
 */
export function verifyQrData(qrData: string): { valid: boolean; code: string | null } {
  const parts = qrData.split(":");
  if (parts.length !== 3 || parts[0] !== "EP") return { valid: false, code: null };

  const code     = parts[1];
  const received = Buffer.from(parts[2], "utf8");
  const expected = Buffer.from(
    crypto.createHmac("sha256", env.TICKET_HMAC_SECRET).update(code).digest("hex").slice(0, 16),
    "utf8"
  );

  // timingSafeEqual exige buffers do mesmo tamanho; um hash de tamanho
  // diferente do esperado já é inválido, sem precisar comparar bytes.
  const valid = received.length === expected.length && crypto.timingSafeEqual(received, expected);

  return { valid, code };
}
