import { Router } from "express";
import {
  getTicketByCode,
  getTicketByShareToken,
  validateTicket,
  cancelTicket,
} from "../controllers/tickets.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/share/:token", getTicketByShareToken);
router.get("/code/:code", requireAuth("DOORMAN", "ORGANIZER"), getTicketByCode);
router.post("/validate/:code", requireAuth("DOORMAN", "ORGANIZER"), validateTicket);
router.post("/:id/cancel", requireAuth(), cancelTicket);

export default router;
