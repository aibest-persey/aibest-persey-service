import express, { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  publishEvent,
  unpublishEvent,
  deleteEvent,
  registerForEvent,
  getParticipants,
} from "../controllers/event-controller.js";
import { verifyToken, requireOrganiser, requireStudent } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.get("/", verifyToken, listEvents);
router.get("/:id", verifyToken, getEvent);
router.post("/", verifyToken, requireOrganiser, createEvent);
router.put("/:id", verifyToken, requireOrganiser, updateEvent);
router.patch("/:id/publish", verifyToken, requireOrganiser, publishEvent);
router.patch("/:id/unpublish", verifyToken, requireOrganiser, unpublishEvent);
router.delete("/:id", verifyToken, requireOrganiser, deleteEvent);
router.post("/:id/register", verifyToken, requireStudent, registerForEvent);
router.get("/:id/participants", verifyToken, requireOrganiser, getParticipants);

export default router;
