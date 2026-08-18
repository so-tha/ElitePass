import { Router } from "express";
import {
  getTicketByCode,
  getTicketByShareToken,
  validateTicket,
} from "../controllers/tickets.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Rota pública para visualização via link compartilhado
router.get("/share/:token", getTicketByShareToken);

// Detalhes por código legível (Portaria / Organizador)
router.get("/code/:code", requireAuth("DOORMAN", "ORGANIZER"), getTicketByCode);

// Validação presencial do QR Code (Portaria / Organizador)
router.post("/validate/:code", requireAuth("DOORMAN", "ORGANIZER"), validateTicket);

export default router;
