import Message from "../models/Message.model.js";
import User from "../models/User.model.js";
const SENDER_ATTRS = ["id", "username", "firstName", "lastName", "color", "role"];
// POST /api/messages — send a message to any user
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, subject, content } = req.body;
        if (!receiverId || !content?.trim()) {
            res.status(400).json({ message: "receiverId and content are required." });
            return;
        }
        if (receiverId === req.user.id) {
            res.status(400).json({ message: "You cannot message yourself." });
            return;
        }
        const receiver = await User.findByPk(receiverId);
        if (!receiver) {
            res.status(404).json({ message: "Recipient not found." });
            return;
        }
        const msg = await Message.create({
            senderId: req.user.id,
            receiverId,
            subject: subject?.trim() || null,
            content: content.trim(),
        });
        res.status(201).json(msg);
    }
    catch (error) {
        console.error("Send Message Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/messages/inbox — messages received by current user
export const getInbox = async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { receiverId: req.user.id },
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "sender", attributes: SENDER_ATTRS }],
        });
        res.json(messages);
    }
    catch (error) {
        console.error("Get Inbox Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// GET /api/messages/sent — messages sent by current user
export const getSent = async (req, res) => {
    try {
        const messages = await Message.findAll({
            where: { senderId: req.user.id },
            order: [["createdAt", "DESC"]],
            include: [{ model: User, as: "receiver", attributes: SENDER_ATTRS }],
        });
        res.json(messages);
    }
    catch (error) {
        console.error("Get Sent Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
// PATCH /api/messages/:id/read — mark received message as read
export const markRead = async (req, res) => {
    try {
        const { id } = req.params;
        const msg = await Message.findByPk(id);
        if (!msg || msg.receiverId !== req.user.id) {
            res.status(404).json({ message: "Message not found." });
            return;
        }
        msg.isRead = true;
        await msg.save();
        res.json({ message: "Marked as read." });
    }
    catch (error) {
        console.error("Mark Read Error:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
//# sourceMappingURL=message-controller.js.map