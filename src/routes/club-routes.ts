import express, { Router } from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { listClubs, getClub, joinClub, leaveClub } from "../controllers/club-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.get("/", listClubs);
router.get("/:id", getClub);
router.post("/:id/join", joinClub);
router.delete("/:id/join", leaveClub);

export default router;
