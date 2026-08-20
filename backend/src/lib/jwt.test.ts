import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";

const payload = { userId: "user-123", role: "CLIENT" };

describe("access token", () => {
  it("assina e verifica um token, preservando o payload", () => {
    const token = signAccessToken(payload);
    const decoded = verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });

  it("rejeita um token adulterado", () => {
    const token = signAccessToken(payload);
    const tampered = token.slice(0, -2) + "xx";

    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe("refresh token", () => {
  it("assina e verifica um token, preservando o payload", () => {
    const token = signRefreshToken(payload);
    const decoded = verifyRefreshToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });
});

describe("separação entre segredos de access e refresh", () => {
  it("um refresh token não é válido como access token", () => {
    const refreshToken = signRefreshToken(payload);
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });

  it("um access token não é válido como refresh token", () => {
    const accessToken = signAccessToken(payload);
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
