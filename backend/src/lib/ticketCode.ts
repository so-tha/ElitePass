import crypto from "crypto";

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
  const secret = process.env.TICKET_HMAC_SECRET ?? "elitepass_qr_secret_change_me";
  const hmac   = crypto.createHmac("sha256", secret).update(ticketCode).digest("hex").slice(0, 16);
  return `EP:${ticketCode}:${hmac}`;
}

/**
 * Valida se um QR Data é autêntico.
 */
export function verifyQrData(qrData: string): { valid: boolean; code: string | null } {
  const parts = qrData.split(":");
  if (parts.length !== 3 || parts[0] !== "EP") return { valid: false, code: null };

  const code     = parts[1];
  const received = parts[2];
  const secret   = process.env.TICKET_HMAC_SECRET ?? "elitepass_qr_secret_change_me";
  const expected = crypto.createHmac("sha256", secret).update(code).digest("hex").slice(0, 16);

  return {
    valid: crypto.timingSafeEqual(Buffer.from(received, "utf8"), Buffer.from(expected, "utf8")),
    code,
  };
}
