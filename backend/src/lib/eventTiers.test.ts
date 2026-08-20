import { describe, it, expect } from "vitest";
import { tierSchema, tiersArraySchema } from "./eventTiers";

const validTier = { id: "tier-1", label: "Pista", priceUnit: 120, capacity: 200 };

describe("tierSchema", () => {
  it("aceita um tier válido", () => {
    expect(tierSchema.safeParse(validTier).success).toBe(true);
  });

  it("rejeita preço zero ou negativo", () => {
    expect(tierSchema.safeParse({ ...validTier, priceUnit: 0 }).success).toBe(false);
    expect(tierSchema.safeParse({ ...validTier, priceUnit: -10 }).success).toBe(false);
  });

  it("rejeita capacidade zero, negativa ou não inteira", () => {
    expect(tierSchema.safeParse({ ...validTier, capacity: 0 }).success).toBe(false);
    expect(tierSchema.safeParse({ ...validTier, capacity: -5 }).success).toBe(false);
    expect(tierSchema.safeParse({ ...validTier, capacity: 10.5 }).success).toBe(false);
  });

  it("rejeita id ou label vazios", () => {
    expect(tierSchema.safeParse({ ...validTier, id: "" }).success).toBe(false);
    expect(tierSchema.safeParse({ ...validTier, label: "" }).success).toBe(false);
  });
});

describe("tiersArraySchema", () => {
  it("aceita uma lista de tiers válidos", () => {
    const result = tiersArraySchema.safeParse([
      validTier,
      { id: "tier-2", label: "VIP", priceUnit: 450, capacity: 50 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejeita a lista inteira se um único tier for inválido", () => {
    const result = tiersArraySchema.safeParse([
      validTier,
      { id: "tier-2", label: "VIP", priceUnit: -1, capacity: 50 },
    ]);
    expect(result.success).toBe(false);
  });
});
