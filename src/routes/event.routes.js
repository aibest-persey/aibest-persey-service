import express from "express";
import { EventDomain } from "../modules/eventDomain.js";
import { verifyToken } from "../middleware/auth-middleware.js"; // <-- Plugs right into her middleware file!

const router = express.Router();

// Secured event booking endpoint
router.post("/register", verifyToken, async (req, res) => {
  const { eventId } = req.body;
  const userId = req.user.id; // <-- Safely extracts the certified user UUID from her JWT login session

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

export default router;
