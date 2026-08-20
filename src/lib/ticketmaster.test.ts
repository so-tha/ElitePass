import { describe, it, expect } from "vitest";
import {
  parseLocalDate,
  formatDate,
  formatPrice,
  getEventMinPrice,
  generateMockPrices,
  getArtistName,
  getVenue,
  type TMEvent,
} from "./ticketmaster";

function makeEvent(overrides: Partial<TMEvent> = {}): TMEvent {
  return {
    id: "evt-1",
    name: "Show de Teste",
    url: "https://example.com",
    images: [],
    dates: { start: { localDate: "2026-03-15" } },
    ...overrides,
  };
}

describe("parseLocalDate", () => {
  it("interpreta a data no fuso local, sem deslocar um dia (bug comum de timezone)", () => {
    const date = parseLocalDate("2026-03-15");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2); // março = índice 2
    expect(date.getDate()).toBe(15);
  });
});

describe("formatDate", () => {
  it("formata a data em pt-BR", () => {
    const formatted = formatDate("2026-03-15");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("15");
  });
});

describe("preços", () => {
  it("usa o priceRanges real da API quando disponível", () => {
    const event = makeEvent({ priceRanges: [{ min: 150, max: 300, currency: "BRL" }] });
    expect(getEventMinPrice(event)).toBe(150);
    expect(formatPrice(event)).toContain("150");
  });

  it("cai para preço simulado quando a API não retorna priceRanges", () => {
    const event = makeEvent();
    const mock = generateMockPrices(event);
    expect(mock.isMock).toBe(true);
    expect(mock.min).toBeGreaterThan(0);
    expect(getEventMinPrice(event)).toBe(mock.min);
  });

  it("o preço simulado é determinístico para o mesmo evento (mesmo seed)", () => {
    const event = makeEvent({ id: "evento-fixo-123" });
    expect(generateMockPrices(event)).toEqual(generateMockPrices(event));
  });
});

describe("getArtistName", () => {
  it("usa o nome da atração quando disponível", () => {
    const event = makeEvent({
      name: "Nome Genérico do Evento",
      _embedded: { attractions: [{ name: "Arctic Monkeys" }] },
    });
    expect(getArtistName(event)).toBe("Arctic Monkeys");
  });

  it("cai para o nome do evento quando não há atração", () => {
    const event = makeEvent({ name: "Nome Genérico do Evento" });
    expect(getArtistName(event)).toBe("Nome Genérico do Evento");
  });
});

describe("getVenue", () => {
  it("combina nome do local com a cidade", () => {
    const event = makeEvent({
      _embedded: { venues: [{ name: "Arena Fonte Nova", city: { name: "Salvador" } }] },
    });
    expect(getVenue(event)).toBe("Arena Fonte Nova, Salvador");
  });

  it("usa texto padrão quando não há local", () => {
    expect(getVenue(makeEvent())).toBe("Local a confirmar");
  });

  it("ignora valores literais 'undefined' vindos da API externa", () => {
    const event = makeEvent({
      _embedded: { venues: [{ name: "undefined", city: { name: "undefined" } }] },
    });
    expect(getVenue(event)).toBe("Local a confirmar");
  });
});
