import express from "express";
import { sendMessage, getInbox, getSent, markRead } from "../controllers/message-controller.js";
import { verifyToken } from "../middleware/auth-middleware.js";
const router = express.Router();
router.use(verifyToken);
router.post("/", sendMessage);
router.get("/inbox", getInbox);
router.get("/sent", getSent);
router.patch("/:id/read", markRead);
export default router;
//# sourceMappingURL=message-routes.js.map