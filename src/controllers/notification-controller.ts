import { Request, Response } from "express";
import Notification from "../models/Notification.model.js";

// GET /api/notifications — current user's own notifications
export const listMyNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user!.id },
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("List My Notifications Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/notifications/:id/read — mark one of the caller's own notifications as read
export const markRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const notification = await Notification.findByPk(id);

    if (!notification || notification.userId !== req.user!.id) {
      res.status(404).json({ message: "Notification not found." });
      return;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await notification.save();
    }

    res.json(notification);
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
