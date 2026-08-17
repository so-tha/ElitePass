import { PrismaClient } from "../generated/prisma";

// Singleton do PrismaClient para evitar múltiplas conexões em dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
