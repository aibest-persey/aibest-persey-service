import express from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { createPost, listPosts, deletePost } from "../controllers/post-controller.js";
const router = express.Router();
router.use(verifyToken);
router.post("/", createPost);
router.get("/", listPosts);
router.delete("/:id", deletePost);
export default router;
//# sourceMappingURL=post-routes.js.map