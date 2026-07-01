import express from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { listClubs, joinClub, leaveClub } from "../controllers/club-controller.js";
const router = express.Router();
router.use(verifyToken);
router.get("/", listClubs);
router.post("/:id/join", joinClub);
router.delete("/:id/join", leaveClub);
export default router;
//# sourceMappingURL=club-routes.js.map