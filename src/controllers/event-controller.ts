import { Request, Response } from "express";
import { Op } from "sequelize";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import User from "../models/User.model.js";
import sequelize from "../clients/postgres-client.js";
import eventBus from "../events/event-bus.js";

interface CreateEventBody {
  title: string;
  description?: string;
  location?: string;
  date: string;
  maxCapacity?: number;
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
    const { title, description, location, date, maxCapacity } = req.body as CreateEventBody;

    if (!title || !date) {
      res.status(400).json({ message: "title and date are required." });
      return;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: "Invalid date format." });
      return;
    }

    if (maxCapacity !== undefined && (!Number.isInteger(maxCapacity) || maxCapacity < 1)) {
      res.status(400).json({ message: "maxCapacity must be a positive integer." });
      return;
    }

    const event = await Event.create({
      title,
      description: description ?? null,
      location: location ?? null,
      date: parsedDate,
      status: "draft",
      maxCapacity: maxCapacity ?? null,
      organiserId: req.user!.id,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events — list events based on user roles and filters
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const userId = req.user!.id;
    const { upcoming, status } = req.query as { upcoming?: string; status?: string };

    const visibleStatuses = { [Op.in]: ["published", "cancelled"] as const };

    let where: any = isOrganiser
      ? { [Op.or]: [{ organiserId: userId }, { status: visibleStatuses }] }
      : { status: visibleStatuses };

    if (status === "draft" && isOrganiser) {
      where = { organiserId: userId, status: "draft" };
    } else if (status === "published") {
      where = isOrganiser 
        ? { [Op.and]: [{ status: "published" }, { [Op.or]: [{ organiserId: userId }, { status: "published" }] }] }
        : { status: "published" };
    } else if (status === "cancelled" && isOrganiser) {
      where = { organiserId: userId, status: "cancelled" };
    }

    if (upcoming === "true") {
      where = { [Op.and]: [where, { date: { [Op.gte]: new Date() } }] };
    }

    const events = await Event.findAll({ where, order: [["date", "ASC"]] });

    if (events.length === 0) {
      res.json([]);
      return;
    }

    const eventIds = events.map(e => e.id);
    const registrations = await Registration.findAll({
      where: {
        eventId: { [Op.in]: eventIds },
        status: { [Op.in]: ["registered", "waitlisted"] },
      },
    });

    const countMap: Record<string, number> = {};
    const userStatusMap: Record<string, string> = {};
    for (const r of registrations) {
      if (r.status === "registered") {
        countMap[r.eventId] = (countMap[r.eventId] ?? 0) + 1;
      }
      if (r.studentId === userId) {
        userStatusMap[r.eventId] = r.status;
      }
    }

    const result = events.map(e => ({
      ...e.toJSON(),
      registrationCount: countMap[e.id] ?? 0,
      isRegistered: userStatusMap[e.id] === "registered",
      isWaitlisted: userStatusMap[e.id] === "waitlisted",
      isOwner: e.organiserId === userId,
    }));

    res.json(result);
  } catch (error) {
    console.error("List Events Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/:id — full event details
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (!isOrganiser && event.status === "draft") {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const isOwner = event.organiserId === userId;

    const organiser = await User.findByPk(event.organiserId, {
      attributes: ["id", "username", "firstName", "lastName", "color"],
    });

    const registrationCount = await Registration.count({
      where: { eventId: event.id, status: "registered" },
    });

    const myRegistration = await Registration.findOne({
      where: { eventId: event.id, studentId: userId, status: { [Op.in]: ["registered", "waitlisted"] } },
    });
    const isRegistered = myRegistration?.status === "registered";
    const isWaitlisted = myRegistration?.status === "waitlisted";
    const waitlistPosition = myRegistration?.waitlistPosition ?? null;

    let recentRegistrations = undefined;
    if (isOwner) {
      const dbRecent = await Registration.findAll({
        where: { eventId: event.id, status: { [Op.in]: ["registered", "waitlisted"] } },
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
      recentRegistrations = dbRecent.map(r => r.toJSON());
    }

    res.json({
      ...event.toJSON(),
      organiser,
      registrationCount,
      isRegistered,
      isWaitlisted,
      waitlistPosition,
      isOwner,
      ...(isOwner && { recentRegistrations }),
    });
  } catch (error) {
    console.error("Get Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PUT /api/events/:id — organiser updates their own draft event
export const updateEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

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

// PATCH /api/events/:id/publish — transition status from draft to published
export const publishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

    if (!event || event.organiserId !== req.user!.id) {
      res.status(404).json({ message: "Event not found." });
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

// PATCH /api/events/:id/unpublish — revert back to draft status
export const unpublishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

    if (!event || event.organiserId !== req.user!.id) {
      res.status(404).json({ message: "Event not found." });
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

// PATCH /api/events/:id/cancel — cancel event and alert outbox systems
export const cancelEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "Forbidden: Only the owner can cancel this event." });
      return;
    }

    if (event.status === "cancelled") {
      res.status(400).json({ message: "Event is already cancelled." });
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

    eventBus.publish("event.cancelled", {
      eventId: event.id,
      eventTitle: event.title,
      organiserId: event.organiserId,
    });

    res.json(event);
  } catch (error) {console.error("Cancel Event Error:", error);
                   res.status(500).json
                     ({ message: "Internal server error." });
                  }
};

// DELETE /api/events/:id — purge event records securely
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

    if (!event || event.organiserId !== req.user!.id) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    await Registration.destroy({ where: { eventId: id } });
    await event.destroy();
    res.json({ message: "Event deleted successfully." });
  } catch (error) {
    console.error("Delete Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// POST /api/events/:id/register — book a seat or queue on the waitlist
export const registerForEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: eventId } = req.params as { id: string };
    const studentId = req.user!.id;

    const event = await Event.findByPk(eventId);
    if (!event || event.status === "draft") {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.status === "cancelled") {
      res.status(410).json({ message: "Cannot register for a cancelled event." });
      return;
    }

    const existingReg = await Registration.findOne({
      where: { eventId, studentId, status: { [Op.in]: ["registered", "waitlisted"] } }
    });
    if (existingReg) {
      res.status(409).json({ message: "You are already registered or waitlisted for this event." });
      return;
    }

    const student = await User.findByPk(studentId);
    if (!student) {
      res.status(404).json({ message: "Student account not found." });
      return;
    }

    const result = await sequelize.transaction(async (t) => {
      const regCount = await Registration.count({
        where: { eventId, status: "registered" },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      let status: "registered" | "waitlisted" = "registered";
      let waitlistPosition: number | null = null;

      if (event.maxCapacity !== null && regCount >= event.maxCapacity) {
        status = "waitlisted";
        const currentWaitlistCount = await Registration.count({
          where: { eventId, status: "waitlisted" },
          transaction: t
        });
        waitlistPosition = currentWaitlistCount + 1;
      }

      const newReg = await Registration.create({
        eventId,
        studentId,
        status,
        waitlistPosition
      }, { transaction: t });

      return { newReg, status, waitlistPosition };
    });

    if (result.status === "registered") {
      eventBus.publish("registration.confirmed", {
        eventId,
        eventTitle: event.title,
        studentId,
        studentEmail: student.email,
        studentName: `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || student.username,
        registrationId: result.newReg.id,
      });
    } else {
      eventBus.publish("registration.waitlisted", {
        eventId,
        eventTitle: event.title,
        studentId,
        studentEmail: student.email,
        studentName: `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || student.username,
        registrationId: result.newReg.id,
        waitlistPosition: result.waitlistPosition!,
      });
    }

    res.status(201).json(result.newReg);
  } catch (error) {
    console.error("Register For Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/events/:id/register — cancel registration & trigger waitlist promotions
export const cancelRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: eventId } = req.params as { id: string };
    const studentId = req.user!.id;

    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const registration = await Registration.findOne({
      where: { eventId, studentId, status: { [Op.in]: ["registered", "waitlisted"] } }
    });
    if (!registration) {
      res.status(404).json({ message: "No active registration found to cancel." });
      return;
    }

    const student = await User.findByPk(studentId);
    const studentName = student 
      ? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim() || student.username 
      : "Unknown Student";

    const oldStatus = registration.status;

    await sequelize.transaction(async (t) => {
      registration.status = "cancelled";
      registration.waitlistPosition = null;
      await registration.save({ transaction: t });

      if (oldStatus === "registered") {
        const nextInLine = await Registration.findOne({
          where: { eventId, status: "waitlisted" },
          order: [["createdAt", "ASC"]],
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        if (nextInLine) {
          nextInLine.status = "registered";
          nextInLine.waitlistPosition = null;
          await nextInLine.save({ transaction: t });

          const promotedStudent = await User.findByPk(nextInLine.studentId, { transaction: t });
          if (promotedStudent) {
            eventBus.publish("registration.promoted", {
              eventId,
              eventTitle: event.title,
              studentId: nextInLine.studentId,
              studentEmail: promotedStudent.email,
              studentName: `${promotedStudent.firstName ?? ""} ${promotedStudent.lastName ?? ""}`.trim() || promotedStudent.username,
              registrationId: nextInLine.id,
            });
          }

          const remainingWaitlist = await Registration.findAll({
            where: { eventId, status: "waitlisted" },
            order: [["createdAt", "ASC"]],
            transaction: t
          });

          let currentPos = 1;
          for (const rw of remainingWaitlist) {
            rw.waitlistPosition = currentPos++;
            await rw.save({ transaction: t });
          }
        }
      } else if (oldStatus === "waitlisted") {
        const trailingWaitlist = await Registration.findAll({
          where: { eventId, status: "waitlisted" },
          order: [["createdAt", "ASC"]],
          transaction: t
        });

        let currentPos = 1;
        for (const tw of trailingWaitlist) {
          tw.waitlistPosition = currentPos++;
          await tw.save({ transaction: t });
        }
      }
    });

    eventBus.publish("registration.cancelled", {
      eventId,
      eventTitle: event.title,
      studentId,
      studentEmail: student?.email ?? "",
      studentName,
      registrationId: registration.id,
    });

    res.json({ message: "Registration successfully cancelled." });
  } catch (error) {
    console.error("Cancel Registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/:id/participants — query participants & waitlist info
export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: eventId } = req.params as { id: string };
    const event = await Event.findByPk(eventId);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "Forbidden: Only the owner can view participant sheets." });
      return;
    }

    const registrations = await Registration.findAll({
      where: { eventId, status: { [Op.in]: ["registered", "waitlisted"] } },
      order: [["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "username", "firstName", "lastName", "email", "color"],
        },
      ],
    });

    const participants = registrations.map(r => r.toJSON());
    const registrationCount = registrations.filter(r => r.status === "registered").length;
    const waitlistCount = registrations.filter(r => r.status === "waitlisted").length;

    res.json({
      registrationCount,
      waitlistCount,
      participants,
    });
  } catch (error) {
    console.error("Get Participants Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/my-registrations — fetch user's personal schedules
export const getMyRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.user!.id;
    const registrations = await Registration.findAll({
      where: { studentId, status: { [Op.in]: ["registered", "waitlisted"] } },
      include: [
        {
          model: Event,
          as: "event",
          include: [{ model: User, as: "organiser", attributes: ["id", "username", "firstName", "lastName", "color"] }]
        }
      ],
      order: [["createdAt", "DESC"]]
    });

    res.json(registrations);
  } catch (error) {
    console.error("Get My Registrations Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
