import express, { Router } from "express";
import {
  listOrganisers,
  getOrganiser,
  updateMyProfile,
} from "../controllers/organiser-controller.js";
import { verifyToken, requireOrganiser } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

// Update current organiser's profile
router.put("/me", verifyToken, requireOrganiser, updateMyProfile);

// List and get organisers (requires auth to align with other routes)
router.get("/", verifyToken, listOrganisers);
router.get("/:id", verifyToken, getOrganiser);

export default router;
