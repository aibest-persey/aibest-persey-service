import { Request, Response } from "express";
import { Op } from "sequelize";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import User from "../models/User.model.js";

interface CreateEventBody {
  title: string;
  description?: string;
  location?: string;
  date: string;
}

interface UpdateEventBody {
  title?: string;
  description?: string;
  location?: string;
  date?: string;
}

// POST /api/events — organiser only, creates a draft
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
      status: "draft",
      organiserId: req.user!.id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events — students see published + cancelled; organisers see their own (all) + others' published/cancelled
// Query params:
//   ?upcoming=true          — only events with date >= now
//   ?status=draft           — organisers only: filter to their own drafts
//   ?status=published       — filter to published events
//   ?status=cancelled       — filter to cancelled events
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const userId = req.user!.id;
    const { upcoming, status } = req.query as { upcoming?: string; status?: string };

    // Base visibility: students see published + cancelled; organisers see own events + others' published/cancelled
    let where: any = isOrganiser
      ? { [Op.or]: [{ organiserId: userId }, { status: ["published", "cancelled"] }] }
      : { status: ["published", "cancelled"] };

    // Organisers can additionally filter by status
    if (isOrganiser && status === "draft") {
      where = { organiserId: userId, status: "draft" };
    } else if (isOrganiser && status === "cancelled") {
      where = { organiserId: userId, status: "cancelled" };
    } else if (status === "published") {
      where = isOrganiser
        ? { [Op.or]: [{ organiserId: userId, status: "published" }, { status: "published" }] }
        : { status: "published" };
    }

    // Filter to upcoming events only
    if (upcoming === "true") {
      where = { ...where, date: { [Op.gte]: new Date() } };
    }

    const events = await Event.findAll({ where, order: [["date", "ASC"]] });

    // Fetch all registrations for these events in one query
    const eventIds = events.map(e => e.id);
    const registrations = eventIds.length
      ? await Registration.findAll({ where: { eventId: eventIds } })
      : [];

    // Build registration count map and student's own registration set
    const countMap: Record<string, number> = {};
    const registeredSet = new Set<string>();
    for (const r of registrations) {
      countMap[r.eventId] = (countMap[r.eventId] ?? 0) + 1;
      if (r.studentId === userId) registeredSet.add(r.eventId);
    }

    const result = events.map(e => ({
      ...e.toJSON(),
      registrationCount: countMap[e.id] ?? 0,
      isRegistered: registeredSet.has(e.id),   // true if current user is registered
      isOwner: e.organiserId === userId,         // true if current user created this event
    }));

    res.json(result);
  } catch (error) {
    console.error("List Events Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/:id — full event detail
// Students: published events only
// Organisers: any event; owner gets recentRegistrations preview
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const userId = req.user!.id;

    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    // Students can only see published events
    if (!isOrganiser && event.status !== "published") {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const isOwner = event.organiserId === userId;

    // Fetch organiser's public profile to display "Organised by"
    const organiser = await User.findByPk(event.organiserId, {
      attributes: ["id", "username", "firstName", "lastName", "color"],
    });

    // Registration stats
    const registrationCount = await Registration.count({
      where: { eventId: event.id },
    });

    // Check if the current user is registered
    const existingRegistration = await Registration.findOne({
      where: { eventId: event.id, studentId: userId },
    });
    const isRegistered = !!existingRegistration;

    // Owners get a preview of the 5 most recent registrations for their detail page
    let recentRegistrations = null;
    if (isOwner) {
      recentRegistrations = await Registration.findAll({
        where: { eventId: event.id },
        order: [["createdAt", "DESC"]],
        limit: 5,
        include: [
          {
            model: User,
            as: "student",
            attributes: ["id", "username", "firstName", "lastName", "color"],
          },
        ],
      });
    }

    res.json({
      ...event.toJSON(),
      organiser,
      registrationCount,
      isRegistered,
      isOwner,
      ...(isOwner && { recentRegistrations }),
    });
  } catch (error) {
    console.error("Get Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PUT /api/events/:id — organiser only, update their own draft event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only edit your own events." });
      return;
    }

    if (event.status === "published") {
      res.status(400).json({ message: "Published events cannot be edited. Unpublish first." });
      return;
    }

    const { title, description, location, date } = req.body as UpdateEventBody;

    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ message: "Invalid date format." });
        return;
      }
      event.date = parsedDate;
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description ?? null;
    if (location !== undefined) event.location = location ?? null;

    await event.save();
    res.json(event);
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/events/:id/publish — organiser only, publish a draft
export const publishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only publish your own events." });
      return;
    }

    if (event.status === "published") {
      res.status(400).json({ message: "Event is already published." });
      return;
    }

    event.status = "published";
    await event.save();

    res.json(event);
  } catch (error) {
    console.error("Publish Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/events/:id/unpublish — organiser only, revert to draft
export const unpublishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only unpublish your own events." });
      return;
    }

    if (event.status === "draft") {
      res.status(400).json({ message: "Event is already a draft." });
      return;
    }

    event.status = "draft";
    await event.save();

    res.json(event);
  } catch (error) {
    console.error("Unpublish Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/events/:id/cancel — organiser only, cancel a published or draft event
export const cancelEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only cancel your own events." });
      return;
    }

    if (event.status === "cancelled") {
      res.status(400).json({ message: "Event is already cancelled." });
      return;
    }

    event.status = "cancelled";
    await event.save();

    res.json(event);
  } catch (error) {
    console.error("Cancel Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/events/:id — organiser only, delete their own event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only delete your own events." });
      return;
    }

    await Registration.destroy({ where: { eventId: event.id } });
    await event.destroy();

    res.json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// POST /api/events/:id/register — student only
export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event || event.status === "draft") {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.status === "cancelled") {
      res.status(410).json({ message: "This event has been cancelled and is no longer accepting registrations." });
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

// GET /api/events/:id/participants — organiser only
export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await Event.findByPk(req.params.id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only view participants for your own events." });
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

    res.json({ event, registrationCount: registrations.length, participants: registrations });
  } catch (error) {
    console.error("Get Participants Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
