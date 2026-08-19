import { Router } from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  getMyEvents,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEventStats,
  getOrganizerDashboard,
} from "../controllers/events.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", getEvents);
router.get("/organizer/dashboard", requireAuth("ORGANIZER"), getOrganizerDashboard);
router.get("/organizer/mine", requireAuth("ORGANIZER"), getMyEvents);
router.get("/:id", getEventById);
router.post("/", requireAuth("ORGANIZER"), createEvent);
router.put("/:id", requireAuth("ORGANIZER"), updateEvent);
router.patch("/:id/status", requireAuth("ORGANIZER"), updateEventStatus);
router.delete("/:id", requireAuth("ORGANIZER"), deleteEvent);
router.get("/:id/stats", requireAuth("ORGANIZER"), getEventStats);

export default router;

