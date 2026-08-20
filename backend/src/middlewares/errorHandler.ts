import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/client/client";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express only recognizes 4-arg error middleware by its arity
  _next: NextFunction
): void {
  console.error("[ERROR]", err.stack ?? err.message);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({ error: "Registro duplicado (valor já cadastrado)." });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "Registro não encontrado." });
      return;
    }
  }

  res.status(500).json({ error: "Erro interno no servidor." });
}
