import express, { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  registerForEvent,
  getParticipants,
} from "../controllers/event-controller.js";
import { verifyToken, requireOrganiser, requireStudent } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.get("/", verifyToken, listEvents);
router.get("/:id", verifyToken, getEvent);
router.post("/", verifyToken, requireOrganiser, createEvent);
router.post("/:id/register", verifyToken, requireStudent, registerForEvent);
router.get("/:id/participants", verifyToken, requireOrganiser, getParticipants);

export default router;
