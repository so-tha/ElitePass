import { env } from "./config/env";

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
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

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

app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);
});

export default app;
