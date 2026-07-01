import Post from "../models/Post.model.js";
import User from "../models/User.model.js";
import Club from "../models/Club.model.js";
import ClubMember from "../models/ClubMember.model.js";
const AUTHOR_ATTRIBUTES = ["id", "username", "firstName", "lastName", "color"];
const canModifyPost = async (post, userId) => {
    if (post.authorId === userId)
        return true;
    const membership = await ClubMember.findOne({ where: { clubId: post.clubId, userId } });
    return membership?.role === "owner" || membership?.role === "manager";
};
// POST /api/posts — any club member can post to their club's feed
export const createPost = async (req, res) => {
    try {
        const { clubId, content } = req.body;
        if (!clubId || !content || !content.trim()) {
            res.status(400).json({ message: "clubId and content are required." });
            return;
        }
        const club = await Club.findByPk(clubId);
        if (!club) {
            res.status(404).json({ message: "Club not found." });
            return;
        }
        const membership = await ClubMember.findOne({ where: { clubId, userId: req.user.id } });
        if (!membership) {
            res.status(403).json({ message: "Only club members can post to this club." });
            return;
        }
        const post = await Post.create({
            clubId,
            authorId: req.user.id,
            content: content.trim(),
        });
        const withAuthor = await Post.findByPk(post.id, {
            include: [{ model: User, as: "author", attributes: [...AUTHOR_ATTRIBUTES] }],
        });
        res.status(201).json(withAuthor);
    }
    catch (error) {
        console.error("Create Post Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/posts?clubId= — feed is member-only, unlike public news
export const listPosts = async (req, res) => {
    try {
        const { clubId } = req.query;
        if (!clubId) {
            res.status(400).json({ message: "clubId is required." });
            return;
        }
        if (req.user.role !== "admin") {
            const membership = await ClubMember.findOne({ where: { clubId, userId: req.user.id } });
            if (!membership) {
                res.status(403).json({ message: "Only club members can view this club's feed." });
                return;
            }
        }
        const posts = await Post.findAll({
            where: { clubId },
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "author", attributes: [...AUTHOR_ATTRIBUTES] }],
        });
        res.json(posts);
    }
    catch (error) {
        console.error("List Posts Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// DELETE /api/posts/:id — author, club owner/manager, or admin
export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findByPk(id);
        if (!post) {
            res.status(404).json({ message: "Post not found." });
            return;
        }
        if (req.user.role !== "admin" && !(await canModifyPost(post, req.user.id))) {
            res.status(403).json({ message: "You do not have permission to delete this post." });
            return;
        }
        await post.destroy();
        res.json({ message: "Post deleted." });
    }
    catch (error) {
        console.error("Delete Post Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=post-controller.js.map