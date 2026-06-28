import express, { Router } from "express";
import {
  submitRequest,
  getMyRequests,
  listAllRequests,
  listPending,
  approveRequest,
  rejectRequest,
} from "../controllers/rolechange-controller.js";
import {
  verifyToken,
  requireStudent,
  requireOrganiserOrAdmin,
} from "../middleware/auth-middleware.js";

const router: Router = express.Router();

router.use(verifyToken);

// Student routes
router.post("/", requireStudent, submitRequest);
router.get("/my", requireStudent, getMyRequests);

// Organiser or Admin routes — must be before /:id
router.get("/pending", requireOrganiserOrAdmin, listPending);
router.get("/", requireOrganiserOrAdmin, listAllRequests);
router.patch("/:id/approve", requireOrganiserOrAdmin, approveRequest);
router.patch("/:id/reject", requireOrganiserOrAdmin, rejectRequest);

export default router;
