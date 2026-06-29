import express, { Router } from "express";
import {
  createClub,
  listClubs,
  getClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  inviteMember,
  acceptInvitation,
  declineInvitation,
} from "../controllers/club-controller.js";
import { verifyToken } from "../middleware/auth-middleware.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", verifyToken, listClubs);
router.get("/:clubId", verifyToken, getClub);
router.post("/", verifyToken, createClub);
router.put("/:clubId", verifyToken, updateClub);
router.delete("/:clubId", verifyToken, deleteClub);
router.post("/:clubId/join", verifyToken, joinClub);
router.delete("/:clubId/join", verifyToken, leaveClub);
router.post("/:clubId/invite", verifyToken, inviteMember);
router.post("/:clubId/invitations/accept", verifyToken, acceptInvitation);
router.post("/:clubId/invitations/decline", verifyToken, declineInvitation);

export default router;
