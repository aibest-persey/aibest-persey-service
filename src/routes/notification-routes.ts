import express, { Router } from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { listMyNotifications, markRead } from "../controllers/notification-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.get("/", listMyNotifications);
router.patch("/:id/read", markRead);

export default router;
