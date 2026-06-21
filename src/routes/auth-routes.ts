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

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/reset-password", authLimiter, resetPassword);
router.get("/me", verifyToken, me);

export default router;