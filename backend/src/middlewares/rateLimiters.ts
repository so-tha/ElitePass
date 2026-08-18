import rateLimit from "express-rate-limit";

/** Limita tentativas de login/registro para dificultar força bruta. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em alguns minutos." },
});

/** Limita tentativas de validação de ingresso por origem (proteção contra varredura de códigos). */
export const ticketValidationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de validação. Aguarde um momento." },
});
