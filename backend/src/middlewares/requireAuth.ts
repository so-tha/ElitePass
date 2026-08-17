import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

export type AuthenticatedRequest = Request & {
  user: { userId: string; role: string };
};

export function requireAuth(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token não fornecido." });
      return;
    }

    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);

      if (roles.length > 0 && !roles.includes(payload.role)) {
        res.status(403).json({ error: "Acesso não autorizado para este perfil." });
        return;
      }

      (req as AuthenticatedRequest).user = payload;
      next();
    } catch {
      res.status(401).json({ error: "Token inválido ou expirado." });
    }
  };
}
