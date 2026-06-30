import express, { Router } from "express";
import { verifyToken, requireAdmin } from "../middleware/auth-middleware.js";
import {
  createNews,
  listNews,
  getNews,
  updateNews,
  deleteNews,
} from "../controllers/news-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.post("/", createNews);
router.get("/", listNews);
router.get("/:id", getNews);
router.put("/:id", updateNews);
router.delete("/:id", deleteNews);

export default router;
