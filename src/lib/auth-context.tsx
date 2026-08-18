"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type Role = "CLIENT" | "ORGANIZER" | "DOORMAN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = useCallback((nextUser: AuthUser, token: string) => {
    setUser(nextUser);
    setAccessToken(token);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
        if (!refreshRes.ok) return;
        const { accessToken: token } = await refreshRes.json();

        const meRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meRes.ok) return;
        const { user: restoredUser } = await meRes.json();

        if (!cancelled) {
          setUser(restoredUser);
          setAccessToken(token);
        }
      } catch {
        // sem sessão ativa
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
