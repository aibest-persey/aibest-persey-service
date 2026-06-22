import express, { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  me,
  resetPassword,
} from "../controllers/auth-controller.js";
import { verifyToken } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const limiter = process.env.NODE_ENV === "test"
  ? (_req: any, _res: any, next: any) => next()
  : authLimiter;

router.post("/register", limiter, register);
router.post("/login", limiter, login);
router.post("/reset-password", limiter, resetPassword);
router.get("/me", verifyToken, me);

export default router;