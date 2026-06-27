import express, { Router } from "express";
import { listUsers, setUserRole } from "../controllers/admin-controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.use(verifyToken, requireAdmin);

router.get("/users", listUsers);
router.patch("/users/:id/role", setUserRole);

export default router;
