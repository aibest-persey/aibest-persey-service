import { Request, Response } from "express";
import { Op } from "sequelize";
import crypto from "crypto";
import Event from "../models/Event.model.js";
import Registration from "../models/Registration.model.js";
import User from "../models/User.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";
import ClubMember from "../models/ClubMember.model.js";
import sequelize from "../clients/postgres-client.js";
import eventBus from "../events/event-bus.js";
import { getAllowedEventFormOptions, validateEventFormPayload } from "../events/event-form-utils.js";

interface CreateEventBody {
  title?: string;
  description?: string;
  location?: string;
  coverImage?: string;
  startAt?: string;
  endAt?: string;
  date?: string;
  start?: string;
  end?: string;
  capacity?: number;
  maxCapacity?: number;
  visibility?: string;
  ownerScope?: string;
  organisationId?: string;
  scope?: string;
}

interface UpdateEventBody extends CreateEventBody {}

const getEventFormContext = async (userId: string, role: "student" | "organiser" | "admin") => {
  if (role === "admin") {
    return { role, hasOrganisationMembership: true, hasClubMembership: true };
  }

  const [organisationMembership, clubMembership] = await Promise.all([
    OrganisationMember.findOne({ where: { userId } }),
    ClubMember.findOne({ where: { userId } }),
  ]);

  return {
    role,
    hasOrganisationMembership: Boolean(organisationMembership),
    hasClubMembership: Boolean(clubMembership),
  };
};

const buildEventResponse = (event: Event) => ({
  ...event.toJSON(),
  capacity: event.maxCapacity,
  startAt: event.startAt ?? event.date,
  endAt: event.endAt ?? event.date,
  visibility: event.visibility ?? "public",
  ownerScope: event.ownerScope ?? "public",
  coverImage: event.coverImage ?? null,
});

const parseCreateEventPayload = async (req: Request, body: CreateEventBody) => {
  const context = await getEventFormContext(req.user!.id, req.user!.role);
  const validation = validateEventFormPayload(body, context);

  if (!validation.ok) {
    return { error: validation.errors };
  }

  return { values: validation.values };
};

// POST /api/events — organiser only, creates a draft
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedPayload = await parseCreateEventPayload(req, req.body as CreateEventBody);
    if ("error" in parsedPayload && parsedPayload.error) {
      res.status(400).json({ message: parsedPayload.error.join("; ") });
      return;
    }

    const {
      title,
      description,
      coverImage,
      startAt,
      endAt,
      capacity,
      visibility,
      ownerScope,
    } = parsedPayload.values;

    const organisationId = (req.body as CreateEventBody).organisationId;
    let organisationIdValue: string | null = null;
    if (ownerScope === "organisation") {
      if (!organisationId) {
        res.status(400).json({ message: "organisationId is required for organisation-scoped events." });
        return;
      }

      const organisation = await Organisation.findByPk(organisationId);
      if (!organisation) {
        res.status(404).json({ message: "Organisation not found." });
        return;
      }
      if (organisation.status !== "verified") {
        res.status(400).json({ message: "Organisation must be verified before creating organisation events." });
        return;
      }

      const membership = await OrganisationMember.findOne({
        where: { organisationId, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: "You must be a member of the organisation to create organisation events." });
        return;
      }
      organisationIdValue = organisationId;
    }

    const event = await Event.create({
      title,
      description,
      location: (req.body as CreateEventBody).location ?? null,
      date: startAt,
      startAt,
      endAt,
      coverImage,
      visibility,
      ownerScope,
      status: "draft",
      maxCapacity: capacity ?? null,
      organiserId: req.user!.id,
      organisationId: organisationIdValue,
    });

    res.status(201).json(buildEventResponse(event));
  } catch (error) {
    console.error("Create Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getEventFormOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const context = await getEventFormContext(req.user!.id, req.user!.role);
    res.json(getAllowedEventFormOptions(context));
  } catch (error) {
    console.error("Get Event Form Options Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events — students see published + cancelled; organisers see their own (all) + others' published/cancelled
// Query params:
//   ?upcoming=true    — only events with date >= now
//   ?status=draft     — organisers only: their own drafts
//   ?status=published — published events (all roles)
//   ?status=cancelled — organisers only: their own cancelled events
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const isAdmin = req.user!.role === "admin";
    const userId = req.user!.id;
    const { upcoming, status } = req.query as { upcoming?: string; status?: string };

    const visibleStatuses = { [Op.in]: ["published", "cancelled"] as const };

    let where: any = isOrganiser
      ? { [Op.or]: [{ organiserId: userId }, { status: visibleStatuses }] }
      : { status: visibleStatuses };

    if (isAdmin) {
      where = {};
    }

    if (status === "draft" && isOrganiser) {
      where = { organiserId: userId, status: "draft" };
    } else if (status === "published") {
      where = { status: "published" };
    } else if (status === "cancelled" && isOrganiser) {
      where = { organiserId: userId, status: "cancelled" };
    }

    if (upcoming === "true") {
      where = { [Op.and]: [where, { date: { [Op.gte]: new Date() } }] };
    }

    const events = await Event.findAll({ where, order: [["date", "ASC"]] });

    const orgIds = Array.from(new Set(
      events
        .map((e) => e.organisationId)
        .filter((o): o is string => Boolean(o)),
    ));
    const orgMemberships = orgIds.length > 0
      ? await OrganisationMember.findAll({ where: { userId, organisationId: { [Op.in]: orgIds } } })
      : [];
    const memberOrgIds = new Set(orgMemberships.map((m) => m.organisationId));

    const visibleEvents = events.filter((event) => {
      if (!event.organisationId) return true;
      if (isAdmin) return true;
      if (event.organiserId === userId) return true;
      return memberOrgIds.has(event.organisationId);
    });

    if (visibleEvents.length === 0) {
      res.json([]);
      return;
    }

    const eventIds = visibleEvents.map((e) => e.id);
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

    const result = visibleEvents.map((e) => ({
      ...buildEventResponse(e),
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

// GET /api/events/:id — full event detail
// Students: published events only
// Organisers: any event; owner gets recentRegistrations preview
export const getEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const isOrganiser = req.user!.role === "organiser";
    const isAdmin = req.user!.role === "admin";
    const userId = req.user!.id;
    const { id } = req.params as { id: string };

    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    const orgMembership = event.organisationId
      ? await OrganisationMember.findOne({ where: { organisationId: event.organisationId, userId } })
      : null;

    const isOwner = event.organiserId === userId;
    if (event.organisationId && !isOwner && !isAdmin && !orgMembership) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (!isOrganiser && event.status === "draft") {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    // Fetch organiser's public profile to display "Organised by"
    const organiser = await User.findByPk(event.organiserId, {
      attributes: ["id", "username", "firstName", "lastName", "color"],
    });

    // Registration stats — count confirmed registrations only
    const registrationCount = await Registration.count({
      where: { eventId: event.id, status: "registered" },
    });

    // Check current user's registration status for this event
    const myRegistration = await Registration.findOne({
      where: { eventId: event.id, studentId: userId, status: { [Op.in]: ["registered", "waitlisted"] } },
    });
    const isRegistered = myRegistration?.status === "registered";
    const isWaitlisted = myRegistration?.status === "waitlisted";
    const waitlistPosition = myRegistration?.waitlistPosition ?? null;

    // Owners get a preview of the 5 most recent active registrations for their detail page
    let recentRegistrations = null;
    if (isOwner) {
      recentRegistrations = await Registration.findAll({
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
    }

    res.json({
      ...buildEventResponse(event),
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

// PUT /api/events/:id — organiser only, update their own draft event
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

    const parsedPayload = await parseCreateEventPayload(req, req.body as CreateEventBody);
    if ("error" in parsedPayload && parsedPayload.error) {
      res.status(400).json({ message: parsedPayload.error.join("; ") });
      return;
    }

    const {
      title,
      description,
      coverImage,
      startAt,
      endAt,
      capacity,
      visibility,
      ownerScope,
    } = parsedPayload.values;

    const organisationId = (req.body as CreateEventBody).organisationId;
    if (ownerScope === "organisation") {
      if (!organisationId) {
        res.status(400).json({ message: "organisationId is required for organisation-scoped events." });
        return;
      }

      const organisation = await Organisation.findByPk(organisationId);
      if (!organisation) {
        res.status(404).json({ message: "Organisation not found." });
        return;
      }
      if (organisation.status !== "verified") {
        res.status(400).json({ message: "Organisation must be verified before creating organisation events." });
        return;
      }

      const membership = await OrganisationMember.findOne({
        where: { organisationId, userId: req.user!.id },
      });
      if (!membership) {
        res.status(403).json({ message: "You must be a member of the organisation to create organisation events." });
        return;
      }
      event.organisationId = organisationId;
    } else if (req.body && (req.body as CreateEventBody).organisationId === undefined) {
      event.organisationId = null;
    }

    event.title = title;
    event.description = description;
    event.location = (req.body as CreateEventBody).location ?? null;
    event.date = startAt;
    event.startAt = startAt;
    event.endAt = endAt;
    event.coverImage = coverImage;
    event.visibility = visibility;
    event.ownerScope = ownerScope;
    event.maxCapacity = capacity ?? null;

    await event.save();
    res.json(buildEventResponse(event));
  } catch (error) {
    console.error("Update Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// PATCH /api/events/:id/publish — organiser only, publish a draft
export const publishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

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

    if (event.status === "cancelled") {
      res.status(400).json({ message: "Cancelled events cannot be published." });
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
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

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
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

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

    await sequelize.transaction(async (t) => {
      event.status = "cancelled";
      await event.save({ transaction: t });
      // Waitlisted entries are meaningless on a cancelled event — clear them atomically
      await Registration.update(
        { status: "cancelled", waitlistPosition: null },
        { where: { eventId: event.id, status: "waitlisted" }, transaction: t },
      );
    });

    res.json(event);

    // Notify subscribers — consumers query registrations by eventId to reach attendees
    eventBus.publish("event.cancelled", {
      eventId: event.id,
      eventTitle: event.title,
      organiserId: event.organiserId,
    });
  } catch (error) {
    console.error("Cancel Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/events/:id — organiser only, delete their own event
export const deleteEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

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
  // Pre-flight checks outside the transaction (no locks needed, fast-fail)
  const eventId = (req.params as { id: string }).id;
  const studentId = req.user!.id;

  const eventCheck = await Event.findByPk(eventId);
  if (!eventCheck || eventCheck.status === "draft") {
    res.status(404).json({ message: "Event not found." });
    return;
  }
  if (eventCheck.status === "cancelled") {
    res.status(410).json({ message: "This event has been cancelled and is no longer accepting registrations." });
    return;
  }

  try {
    const registration = await sequelize.transaction(async (t) => {
      // Lock the event row — concurrent registrations for the same event queue here
      const event = await Event.findByPk(eventId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!event || event.status === "draft") throw Object.assign(new Error("not_found"), { code: 404 });
      if (event.status === "cancelled") throw Object.assign(new Error("cancelled"), { code: 410 });

      // Check for existing active registration inside the lock
      const existing = await Registration.findOne({
        where: { eventId, studentId, status: { [Op.in]: ["registered", "waitlisted"] } },
        transaction: t,
      });
      if (existing) throw Object.assign(new Error("conflict"), { code: 409 });

      // Determine status — count confirmed seats inside the lock to prevent over-booking
      let status: "registered" | "waitlisted" = "registered";
      let waitlistPosition: number | null = null;

      if (event.maxCapacity !== null) {
        const confirmedCount = await Registration.count({
          where: { eventId, status: "registered" },
          transaction: t,
        });

        if (confirmedCount >= event.maxCapacity) {
          const lastWaitlisted = await Registration.findOne({
            where: { eventId, status: "waitlisted" },
            order: [["waitlistPosition", "DESC"]],
            transaction: t,
          });
          status = "waitlisted";
          waitlistPosition = (lastWaitlisted?.waitlistPosition ?? 0) + 1;
        }
      }

      const ticketCode = status === "registered"
        ? crypto.randomBytes(16).toString("hex")
        : null;
      return Registration.create({ eventId, studentId, status, waitlistPosition, ticketCode }, { transaction: t });
    });

    res.status(201).json(registration);

    // Publish domain event after transaction commits — non-blocking, fire-and-forget
    const [student, event] = await Promise.all([
      User.findByPk(studentId, { attributes: ["id", "email", "firstName", "lastName"] }),
      Event.findByPk(eventId, { attributes: ["id", "title"] }),
    ]);
    if (student && event) {
      const studentName = `${student.get("firstName")} ${student.get("lastName")}`;
      const studentEmail = student.get("email") as string;
      const eventTitle = event.get("title") as string;

      if (registration.status === "registered") {
        eventBus.publish("registration.confirmed", {
          eventId, eventTitle, studentId,
          studentEmail, studentName,
          registrationId: registration.id,
        });
      } else {
        eventBus.publish("registration.waitlisted", {
          eventId, eventTitle, studentId,
          studentEmail, studentName,
          registrationId: registration.id,
          waitlistPosition: registration.waitlistPosition!,
        });
      }
    }
  } catch (error: any) {
    if (error.code === 404) { res.status(404).json({ message: "Event not found." }); return; }
    if (error.code === 410) { res.status(410).json({ message: "This event has been cancelled and is no longer accepting registrations." }); return; }
    if (error.code === 409) { res.status(409).json({ message: "Already registered for this event." }); return; }
    console.error("Register For Event Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/events/:id/register — student cancels their own registration
export const cancelRegistration = async (req: Request, res: Response): Promise<void> => {
  const eventId = (req.params as { id: string }).id;
  const studentId = req.user!.id;

  // Capture post-commit data for domain events
  let cancelledRegistrationId = "";
  let eventTitle = "";
  let promotedStudentId: string | null = null;
  let promotedRegistrationId: string | null = null;

  try {
    await sequelize.transaction(async (t) => {
      // Lock the event row — serialises concurrent cancellations on the same event so
      // only one promotion runs at a time and the event status is read consistently
      const event = await Event.findByPk(eventId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!event) throw Object.assign(new Error("event_not_found"), { code: 404 });

      const registration = await Registration.findOne({
        where: { eventId, studentId, status: { [Op.in]: ["registered", "waitlisted"] } },
        transaction: t,
      });
      if (!registration) throw Object.assign(new Error("not_found"), { code: 404 });

      const wasRegistered = registration.status === "registered";
      registration.status = "cancelled";
      registration.waitlistPosition = null;
      await registration.save({ transaction: t });

      cancelledRegistrationId = registration.id;
      eventTitle = event.title;

      // Only promote when a confirmed seat was freed and the event is still published
      // (guards against promoting into an event that was cancelled concurrently)
      if (wasRegistered && event.maxCapacity !== null && event.status === "published") {
        const next = await Registration.findOne({
          where: { eventId, status: "waitlisted" },
          order: [["waitlistPosition", "ASC"]],
          transaction: t,
        });
        if (next) {
          next.status = "registered";
          next.waitlistPosition = null;
          next.ticketCode = crypto.randomBytes(16).toString("hex");
          await next.save({ transaction: t });
          promotedStudentId = next.studentId;
          promotedRegistrationId = next.id;
        }
      }
    });

    res.json({ message: "Registration cancelled successfully." });

    // Fetch email details for domain events — both in parallel to minimise latency
    const [cancellingStudent, promotedStudent] = await Promise.all([
      User.findByPk(studentId, { attributes: ["id", "email", "firstName", "lastName"] }),
      promotedStudentId
        ? User.findByPk(promotedStudentId, { attributes: ["id", "email", "firstName", "lastName"] })
        : Promise.resolve(null),
    ]);

    if (cancellingStudent) {
      eventBus.publish("registration.cancelled", {
        eventId,
        eventTitle,
        studentId,
        studentEmail: cancellingStudent.get("email") as string,
        studentName: `${cancellingStudent.get("firstName")} ${cancellingStudent.get("lastName")}`,
        registrationId: cancelledRegistrationId,
      });
    }

    if (promotedStudentId && promotedRegistrationId && promotedStudent) {
      eventBus.publish("registration.promoted", {
        eventId,
        eventTitle,
        studentId: promotedStudentId,
        studentEmail: promotedStudent.get("email") as string,
        studentName: `${promotedStudent.get("firstName")} ${promotedStudent.get("lastName")}`,
        registrationId: promotedRegistrationId,
      });
    }
  } catch (error: any) {
    if (error.code === 404) {
      res.status(404).json({ message: "Registration not found." });
      return;
    }
    console.error("Cancel Registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/my-registrations — student only, their own active registrations with event details
export const getMyRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const registrations = await Registration.findAll({
      where: {
        studentId: req.user!.id,
        status: { [Op.in]: ["registered", "waitlisted"] },
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "title", "location", "date", "status", "maxCapacity"],
        },
      ],
    });

    res.json(registrations);
  } catch (error) {
    console.error("Get My Registrations Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/:id/ticket — student only, retrieve registration ticket details
export const getTicket = async (req: Request, res: Response): Promise<void> => {
  try {
    const eventId = (req.params as { id: string }).id;
    const registration = await Registration.findOne({
      where: {
        eventId,
        studentId: req.user!.id,
        status: { [Op.in]: ["registered", "waitlisted"] },
      },
    });

    if (!registration) {
      res.status(404).json({ message: "Registration not found." });
      return;
    }

    res.json({
      registrationId: registration.id,
      eventId: registration.eventId,
      status: registration.status,
      waitlistPosition: registration.waitlistPosition,
      ticketCode: registration.ticketCode,
    });
  } catch (error) {
    console.error("Get Ticket Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// GET /api/events/:id/participants — organiser only
export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const event = await Event.findByPk(id);

    if (!event) {
      res.status(404).json({ message: "Event not found." });
      return;
    }

    if (event.organiserId !== req.user!.id) {
      res.status(403).json({ message: "You can only view participants for your own events." });
      return;
    }

    const registrations = await Registration.findAll({
      where: { eventId: id, status: { [Op.in]: ["registered", "waitlisted"] } },
      order: [["waitlistPosition", "ASC"], ["createdAt", "ASC"]],
      include: [
        {
          model: User,
          as: "student",
          attributes: ["id", "username", "email", "firstName", "lastName", "color"],
        },
      ],
    });

    const registrationCount = registrations.filter(r => r.status === "registered").length;
    const waitlistCount = registrations.filter(r => r.status === "waitlisted").length;

    res.json({ event, registrationCount, waitlistCount, participants: registrations });
  } catch (error) {
    console.error("Get Participants Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
