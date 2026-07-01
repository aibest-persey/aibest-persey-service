import express from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { createNews, listNews, getNews, updateNews, deleteNews, } from "../controllers/news-controller.js";
const router = express.Router();
router.use(verifyToken);
router.post("/", createNews);
router.get("/", listNews);
router.get("/:id", getNews);
router.put("/:id", updateNews);
router.delete("/:id", deleteNews);
export default router;
//# sourceMappingURL=news-routes.js.map