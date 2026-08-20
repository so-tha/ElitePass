import { describe, it, expect } from "vitest";
import { generateTicketCode, generateQrData, verifyQrData } from "./ticketCode";

describe("generateTicketCode", () => {
  it("segue o formato EVT-TI-YYYYMMDD-NNNNNN", () => {
    const code = generateTicketCode("Arctic Monkeys", "Pista Premium");
    expect(code).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{2}-\d{8}-\d{6}$/);
  });

  it("usa as 3 primeiras letras do evento e as 2 primeiras do tier", () => {
    const code = generateTicketCode("Coldplay", "VIP");
    expect(code.startsWith("COL-VI-")).toBe(true);
  });

  it("preenche com X quando o nome é menor que o tamanho esperado", () => {
    const code = generateTicketCode("A", "B");
    expect(code.startsWith("AXX-BX-")).toBe(true);
  });

  it("gera códigos diferentes em chamadas sucessivas", () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generateTicketCode("Evento", "Tier"))
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe("generateQrData / verifyQrData", () => {
  it("um QR gerado é sempre válido e retorna o código original", () => {
    const ticketCode = generateTicketCode("Tame Impala", "Pista");
    const qrData = generateQrData(ticketCode);

    const result = verifyQrData(qrData);

    expect(result.valid).toBe(true);
    expect(result.code).toBe(ticketCode);
  });

  it("rejeita QR Code com assinatura HMAC adulterada", () => {
    const ticketCode = generateTicketCode("Tame Impala", "Pista");
    const qrData = generateQrData(ticketCode);

    // Troca o último caractere da assinatura — simula uma falsificação
    const tampered = qrData.slice(0, -1) + (qrData.endsWith("a") ? "b" : "a");

    expect(verifyQrData(tampered).valid).toBe(false);
  });

  it("rejeita QR Code onde o código do ingresso foi trocado mas a assinatura não", () => {
    const original = generateQrData(generateTicketCode("Evento A", "Tier"));
    const [, , signature] = original.split(":");

    const forged = `EP:CODIGO-FALSO-FORJADO:${signature}`;

    expect(verifyQrData(forged).valid).toBe(false);
  });

  it("rejeita dados que não seguem o formato esperado (prefixo/partes)", () => {
    expect(verifyQrData("dado-invalido").valid).toBe(false);
    expect(verifyQrData("EP:apenas-duas-partes").valid).toBe(false);
    expect(verifyQrData("XX:codigo:assinatura").valid).toBe(false);
  });
});
