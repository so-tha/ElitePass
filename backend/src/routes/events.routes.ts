import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  deleteEvent,
  getEventStats,
} from "../controllers/events.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

// Rotas públicas
router.get("/", getEvents);

// Rotas exclusivas do Organizador (precisam ficar acima de :id)
router.get("/organizer/mine", requireAuth("ORGANIZER"), getMyEvents);

// Rota pública de detalhe por ID
router.get("/:id", getEventById);

// Rotas de escrita do Organizador
router.post("/", requireAuth("ORGANIZER"), createEvent);
router.put("/:id", requireAuth("ORGANIZER"), updateEvent);
router.delete("/:id", requireAuth("ORGANIZER"), deleteEvent);
router.get("/:id/stats", requireAuth("ORGANIZER"), getEventStats);

export default router;
