import express, { Router } from "express";
import { verifyToken } from "../middleware/auth-middleware.js";
import { createPost, listPosts, deletePost } from "../controllers/post-controller.js";

const router: Router = express.Router();

router.use(verifyToken);
router.post("/", createPost);
router.get("/", listPosts);
router.delete("/:id", deletePost);

export default router;
