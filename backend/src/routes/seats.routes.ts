import { Router } from "express";
import { getSeatMap, holdSeat, releaseSeat } from "../controllers/seats.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/:eventId", getSeatMap);
router.post("/:eventId/hold", requireAuth(), holdSeat);
router.post("/:eventId/release", requireAuth(), releaseSeat);

export default router;
