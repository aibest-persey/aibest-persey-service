import { Request, Response } from "express";
import User from "../models/User.model.js";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import sequelize from "../clients/postgres-client.js";

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

    const { id } = req.params as { id: string };

    if (id === req.user!.id) {
      res.status(400).json({ message: "You cannot change your own role." });
      return;
    }

    const user = await User.findByPk(id);
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

// GET /api/admin/events — all events with organiser info
export const listAllEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, as: "organiser", attributes: ["id", "username", "email"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(events);
  } catch (error) {
    console.error("Admin List Events Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/admin/events/:id/cancel — admin cancels any event
export const cancelAnyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }
    await sequelize.transaction(async (t) => {
      event.status = "cancelled";
      await event.save({ transaction: t });
      await Registration.update(
        { status: "cancelled", waitlistPosition: null },
        { where: { eventId: id, status: "waitlisted" }, transaction: t }
      );
    });
    res.json({ message: "Event cancelled." });
  } catch (error) {
    console.error("Admin Cancel Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/admin/events/:id — admin deletes any event
export const deleteAnyEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }
    await Registration.destroy({ where: { eventId: id } });
    await event.destroy();
    res.json({ message: "Event deleted." });
  } catch (error) {
    console.error("Admin Delete Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
