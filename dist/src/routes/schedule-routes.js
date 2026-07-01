import express from "express";
import { getSchedule } from "../controllers/schedule-controller.js";
const router = express.Router();
router.get("/", getSchedule);
export default router;
//# sourceMappingURL=schedule-routes.js.map