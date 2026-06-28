import express, { Router } from "express";
import {
  createEvent,
  listEvents,
  getEvent,
  getMyRegistrations,
  updateEvent,
  publishEvent,
  unpublishEvent,
  cancelEvent,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getParticipants,
} from "../controllers/event-controller.js";
import { verifyToken, requireOrganiser, requireStudent, requireStudentOrAdmin } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.get("/", verifyToken, listEvents);
router.get("/my-registrations", verifyToken, requireStudentOrAdmin, getMyRegistrations);
router.get("/:id", verifyToken, getEvent);
router.post("/", verifyToken, requireOrganiser, createEvent);
router.put("/:id", verifyToken, requireOrganiser, updateEvent);
router.patch("/:id/publish", verifyToken, requireOrganiser, publishEvent);
router.patch("/:id/unpublish", verifyToken, requireOrganiser, unpublishEvent);
router.patch("/:id/cancel", verifyToken, requireOrganiser, cancelEvent);
router.delete("/:id", verifyToken, requireOrganiser, deleteEvent);
router.post("/:id/register", verifyToken, requireStudent, registerForEvent);
router.delete("/:id/register", verifyToken, requireStudent, cancelRegistration);
router.get("/:id/participants", verifyToken, requireOrganiser, getParticipants);

export default router;
