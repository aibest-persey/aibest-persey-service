import express, { Router } from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { listClubs } from "../controllers/club-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.get("/", listClubs);

export default router;
