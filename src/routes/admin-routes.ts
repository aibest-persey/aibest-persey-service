import express, { Router } from "express";
import { listUsers, setUserRole, listAllEvents, cancelAnyEvent, deleteAnyEvent } from "../controllers/admin-controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/role", setUserRole);

router.get("/events", listAllEvents);
router.patch("/events/:id/cancel", cancelAnyEvent);
router.delete("/events/:id", deleteAnyEvent);

export default router;
