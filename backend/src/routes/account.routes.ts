import { Router } from "express";
import { getProfile, updateProfile, updateAddress, updateOrganization, changePassword } from "../controllers/account.controller";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth(), getProfile);
router.patch("/profile", requireAuth(), updateProfile);
router.patch("/address", requireAuth(), updateAddress);
router.patch("/organization", requireAuth("ORGANIZER"), updateOrganization);
router.patch("/password", requireAuth(), changePassword);

export default router;
