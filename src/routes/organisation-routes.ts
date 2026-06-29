import express, { Router } from "express";
import {
  createOrganisation,
  listOrganisations,
  getOrganisation,
  updateOrganisation,
  inviteMember,
  updateMemberRole,
  removeMember,
  acceptInvitation,
  declineInvitation,
} from "../controllers/organisation-controller.js";
import { verifyToken, requireOrganiser } from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.get("/", verifyToken, listOrganisations);
router.get("/:id", verifyToken, getOrganisation);
router.post("/", verifyToken, requireOrganiser, createOrganisation);
router.put("/:id", verifyToken, requireOrganiser, updateOrganisation);
router.post("/:id/invite", verifyToken, requireOrganiser, inviteMember);
router.patch("/:id/members/:memberId/role", verifyToken, requireOrganiser, updateMemberRole);
router.delete("/:id/members/:memberId", verifyToken, requireOrganiser, removeMember);
router.post("/:id/invitations/accept", verifyToken, acceptInvitation);
router.post("/:id/invitations/decline", verifyToken, declineInvitation);

export default router;
