import express from "express";
import { listUsers, setUserRole, listAllEvents, cancelAnyEvent, deleteAnyEvent, verifyOrganisation, deleteOrganisation } from "../controllers/admin-controller.js";
import { verifyToken, requireAdmin } from "../middleware/auth-middleware.js";
const router = express.Router();
router.use(verifyToken, requireAdmin);
router.get("/users", listUsers);
router.patch("/users/:id/role", setUserRole);
router.get("/events", listAllEvents);
router.patch("/events/:id/cancel", cancelAnyEvent);
router.delete("/events/:id", deleteAnyEvent);
router.patch("/organisations/:id/verify", verifyOrganisation);
router.delete("/organisations/:id", deleteOrganisation);
export default router;
//# sourceMappingURL=admin-routes.js.map