import express from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { createOrganisation, listOrganisations, getOrganisation, getOrganisationMembers, addOrganisationMember, updateOrganisationMember, removeOrganisationMember, } from "../controllers/organisation-controller.js";
const router = express.Router();
router.use(verifyToken);
router.post("/", createOrganisation);
router.get("/", listOrganisations);
router.get("/:id", getOrganisation);
router.get("/:id/members", getOrganisationMembers);
router.post("/:id/members", addOrganisationMember);
router.patch("/:id/members/:memberId", updateOrganisationMember);
router.delete("/:id/members/:memberId", removeOrganisationMember);
export default router;
//# sourceMappingURL=organisation-routes.js.map