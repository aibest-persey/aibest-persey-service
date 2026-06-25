import express from "express";
import { EventDomain } from "../modules/eventDomain.js";
import { verifyToken } from "../middleware/auth-middleware.js";

const router = express.Router();

// 1. Event registration flow endpoint (#9)
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

// 2. Event cancellation queue endpoint (#10)
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

// 3. Waitlist line visibility position checker endpoint (#12)
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
