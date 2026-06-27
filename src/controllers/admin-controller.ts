import { Request, Response } from "express";
import User from "../models/User.model.js";

// GET /api/admin/users — list all users
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "email", "firstName", "lastName", "role", "color", "createdAt"],
      order: [["createdAt", "ASC"]],
    });
    res.json(users);
  } catch (error) {
    console.error("Admin List Users Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/admin/users/:id/role — set a user's role (student | organiser)
export const setUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body as { role: string };

    if (!["student", "organiser"].includes(role)) {
      res.status(400).json({ message: "Role must be 'student' or 'organiser'." });
      return;
    }

    if (req.params.id === req.user!.id) {
      res.status(400).json({ message: "You cannot change your own role." });
      return;
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.role === "admin") {
      res.status(400).json({ message: "Cannot change the role of another admin." });
      return;
    }

    user.role = role as "student" | "organiser";
    await user.save();

    res.json({
      message: `User ${user.username} is now a ${role}.`,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("Admin Set Role Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
