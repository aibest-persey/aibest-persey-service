import express, { Router } from "express";
import { getSchedule } from "../controllers/schedule-controller.js";

const router: Router = express.Router();

router.get("/", getSchedule);

export default router;
