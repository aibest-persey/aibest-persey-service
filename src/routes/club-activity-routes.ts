import express, { Router } from "express";
import {
  listActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../controllers/club-activity-controller.js";
import { verifyToken } from "../middleware/auth-middleware.js";

const router: Router = express.Router({ mergeParams: true });

router.get("/", verifyToken, listActivities);
router.get("/:activityId", verifyToken, getActivity);
router.post("/", verifyToken, createActivity);
router.put("/:activityId", verifyToken, updateActivity);
router.delete("/:activityId", verifyToken, deleteActivity);

export default router;
