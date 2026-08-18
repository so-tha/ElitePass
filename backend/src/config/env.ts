import "dotenv/config";
import { z } from "zod";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3001),
    FRONTEND_URL: z.string().url().optional(),
    DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatório"),

    JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET deve ter ao menos 16 caracteres"),
    JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET deve ter ao menos 16 caracteres"),
    TICKET_HMAC_SECRET: z.string().min(16, "TICKET_HMAC_SECRET deve ter ao menos 16 caracteres"),

    TICKETMASTER_API_KEY: z.string().optional(),
    TMDB_API_KEY: z.string().optional(),
    TMDB_READ_ACCESS_TOKEN: z.string().optional(),
  })
  .refine((data) => data.NODE_ENV !== "production" || !!data.FRONTEND_URL, {
    message: "FRONTEND_URL é obrigatório em produção (necessário para configurar o CORS corretamente).",
    path: ["FRONTEND_URL"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas ou ausentes:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
