import express, { Router } from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import {
  createOrganisation,
  listOrganisations,
  getOrganisation,
  getOrganisationMembers,
  addOrganisationMember,
  updateOrganisationMember,
  removeOrganisationMember,
  requestToJoinOrganisation,
  listJoinRequestsForOrg,
  getMyJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} from "../controllers/organisation-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.post("/", createOrganisation);
router.get("/", listOrganisations);
router.get("/join-requests/my", getMyJoinRequests);
router.get("/:id", getOrganisation);
router.get("/:id/members", getOrganisationMembers);
router.post("/:id/members", addOrganisationMember);
router.patch("/:id/members/:memberId", updateOrganisationMember);
router.delete("/:id/members/:memberId", removeOrganisationMember);
router.post("/:id/join-requests", requestToJoinOrganisation);
router.get("/:id/join-requests", listJoinRequestsForOrg);
router.patch("/:id/join-requests/:reqId/approve", approveJoinRequest);
router.patch("/:id/join-requests/:reqId/reject", rejectJoinRequest);

export default router;
