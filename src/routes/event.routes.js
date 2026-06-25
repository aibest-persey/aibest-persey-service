import express from "express";
import { EventDomain } from "../modules/eventDomain.js";
import { verifyToken } from "../middleware/auth-middleware.js";

const router = express.Router();

router.post("/register", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  if (!eventId) {
    return res.status(400).json({ success: false, error: "Please provide an eventId." });
  }

  try {
    const data = await EventDomain.registerForEvent(userId, eventId);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post("/cancel", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id;

  if (!eventId) {
    return res.status(400).json({ success: false, error: "Please provide an eventId." });
  }

  try {
    const data = await EventDomain.cancelRegistration(userId, eventId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get("/position/:eventId", verifyToken, async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    const data = await EventDomain.getWaitlistPosition(userId, eventId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
