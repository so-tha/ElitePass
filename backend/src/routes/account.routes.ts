import { Router } from "express";
import { getProfile, updateProfile, updateAddress, changePassword } from "../controllers/account.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth(), getProfile);
router.patch("/profile", requireAuth(), updateProfile);
router.patch("/address", requireAuth(), updateAddress);
router.patch("/password", requireAuth(), changePassword);

export default router;
