import { env } from "./config/env";

import { createServer } from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authLimiter, ticketValidationLimiter } from "./middlewares/rateLimiters";

import authRoutes from "./routes/auth.routes";
import eventsRoutes from "./routes/events.routes";
import ordersRoutes from "./routes/orders.routes";
import ticketsRoutes from "./routes/tickets.routes";
import catalogRoutes from "./routes/catalog.routes";
import accountRoutes from "./routes/account.routes";
import seatsRoutes from "./routes/seats.routes";
import { errorHandler } from "./middlewares/errorHandler";
import { initSocket, broadcastSeatUpdate } from "./lib/socket";
import { releaseExpiredHolds } from "./controllers/seats.controller";

const SEAT_HOLD_SWEEP_INTERVAL_MS = 30_000;

const app = express();

// Necessário porque o Next.js faz proxy (rewrites) das rotas /api/auth/*
// para este servidor, adicionando o header X-Forwarded-For. Sem isso,
// o express-rate-limit rejeita a requisição por não confiar no proxy.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/tickets/validate", ticketValidationLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/seats", seatsRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "ElitePass API is running!" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ElitePass Backend API" });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

app.use(errorHandler);

const httpServer = createServer(app);
initSocket(httpServer, env.FRONTEND_URL ?? "http://localhost:3000");

setInterval(async () => {
  const released = await releaseExpiredHolds();
  for (const { eventId, label } of released) {
    broadcastSeatUpdate(eventId, { label, status: "AVAILABLE" });
  }
}, SEAT_HOLD_SWEEP_INTERVAL_MS);

httpServer.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;
