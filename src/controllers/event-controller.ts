import { Request, Response } from "express";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import User from "../models/User.model.js";

interface CreateEventBody {
  title: string;
  description?: string;
  location?: string;
  date: string;
}

export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, location, date } = req.body as CreateEventBody;

    if (!title || !date) {
      res.status(400).json({ message: "title and date are required." });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: "Invalid date format." });
      return;
    }

    const event = await Event.create({
      title,
      description: description ?? null,
      location: location ?? null,
      date: parsedDate,
      organiserId: req.user!.id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await Event.findAll({ order: [["date", "ASC"]] });
    res.json(events);
  } catch (error) {
    console.error("List Events Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }
    res.json(event);
  } catch (error) {
    console.error("Get Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const existing = await Registration.findOne({
      where: { eventId: req.params.id, studentId: req.user!.id },
    });
    if (existing) {
      res.status(409).json({ message: "Already registered for this event." });
      return;
    }

    const registration = await Registration.create({
      eventId: req.params.id,
      studentId: req.user!.id,
    });

    res.status(201).json(registration);
  } catch (error) {
    console.error("Register For Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const registrations = await Registration.findAll({
      where: { eventId: req.params.id },
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "username", "email", "firstName", "lastName", "color"],
        },
      ],
    });

    res.json(registrations);
  } catch (error) {
    console.error("Get Participants Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
