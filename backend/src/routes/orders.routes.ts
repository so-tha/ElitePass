import { Router } from "express";
import { createOrder, confirmOrderPayment, getMyOrders, getOrderById } from "../controllers/orders.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.post("/", requireAuth("CLIENT", "ORGANIZER"), createOrder);
router.post("/:id/confirm", requireAuth("CLIENT", "ORGANIZER"), confirmOrderPayment);
router.get("/mine", requireAuth(), getMyOrders);
router.get("/:id", requireAuth(), getOrderById);

export default router;
