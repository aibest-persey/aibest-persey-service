import { Request, Response } from "express";
import { Op } from "sequelize";
import Club from "../models/Club.model.js";
import ClubActivity from "../models/ClubActivity.model.js";
import ClubMember from "../models/ClubMember.model.js";

interface CreateActivityBody {
  title: string;
  description?: string;
  activityType?: "meeting" | "event" | "task" | "other";
  location?: string;
  startDate: string;
  endDate?: string;
}

interface UpdateActivityBody {
  title?: string;
  description?: string | null;
  activityType?: "meeting" | "event" | "task" | "other";
  location?: string | null;
  startDate?: string;
  endDate?: string | null;
  status?: "scheduled" | "completed" | "cancelled";
}

const getClubMember = async (clubId: string, userId: string) => {
  return ClubMember.findOne({ where: { clubId, userId, status: "active" } });
};

const canManageActivities = async (clubId: string, userId: string): Promise<boolean> => {
  const membership = await getClubMember(clubId, userId);
  if (!membership) return false;
  return membership.role === "owner" || membership.permissions.includes("manage_club");
};

export const listActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };
    const membership = await getClubMember(clubId, req.user!.id);
    if (!membership) {
      res.status(403).json({ message: "You must be an active club member to view activities." });
      return;
    }

    const activities = await ClubActivity.findAll({
      where: { clubId },
      order: [["startDate", "ASC"]],
    });

    res.json(activities);
  } catch (error) {
    console.error("List Club Activities Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clubId, activityId } = req.params as { clubId: string; activityId: string };
    const membership = await getClubMember(clubId, req.user!.id);
    if (!membership) {
      res.status(403).json({ message: "You must be an active club member to view this activity." });
      return;
    }

    const activity = await ClubActivity.findOne({ where: { id: activityId, clubId } });
    if (!activity) {
      res.status(404).json({ message: "Activity not found." });
      return;
    }

    res.json(activity);
  } catch (error) {
    console.error("Get Club Activity Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const createActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clubId } = req.params as { clubId: string };
    const { title, description, activityType, location, startDate, endDate } = req.body as CreateActivityBody;

    if (!title || !startDate) {
      res.status(400).json({ message: "Title and startDate are required." });
      return;
    }

    const canManage = await canManageActivities(clubId, req.user!.id);
    if (!canManage) {
      res.status(403).json({ message: "You do not have permission to create activities for this club." });
      return;
    }

    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      res.status(400).json({ message: "Invalid startDate format." });
      return;
    }

    let parsedEnd: Date | null = null;
    if (endDate !== undefined) {
      parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        res.status(400).json({ message: "Invalid endDate format." });
        return;
      }
    }

    const activity = await ClubActivity.create({
      clubId,
      creatorId: req.user!.id,
      title,
      description: description ?? null,
      activityType: activityType ?? "meeting",
      location: location ?? null,
      startDate: parsedStart,
      endDate: parsedEnd,
      status: "scheduled",
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error("Create Club Activity Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clubId, activityId } = req.params as { clubId: string; activityId: string };
    const { title, description, activityType, location, startDate, endDate, status } = req.body as UpdateActivityBody;

    const canManage = await canManageActivities(clubId, req.user!.id);
    if (!canManage) {
      res.status(403).json({ message: "You do not have permission to update activities for this club." });
      return;
    }

    const activity = await ClubActivity.findOne({ where: { id: activityId, clubId } });
    if (!activity) {
      res.status(404).json({ message: "Activity not found." });
      return;
    }

    if (title !== undefined) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (activityType !== undefined) activity.activityType = activityType;
    if (location !== undefined) activity.location = location;
    if (startDate !== undefined) {
      const parsed = new Date(startDate);
      if (isNaN(parsed.getTime())) {
        res.status(400).json({ message: "Invalid startDate format." });
        return;
      }
      activity.startDate = parsed;
    }
    if (endDate !== undefined) {
      activity.endDate = endDate === null ? null : new Date(endDate);
      if (activity.endDate !== null && isNaN(activity.endDate.getTime())) {
        res.status(400).json({ message: "Invalid endDate format." });
        return;
      }
    }
    if (status !== undefined) activity.status = status;

    await activity.save();
    res.json(activity);
  } catch (error) {
    console.error("Update Club Activity Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clubId, activityId } = req.params as { clubId: string; activityId: string };

    const canManage = await canManageActivities(clubId, req.user!.id);
    if (!canManage) {
      res.status(403).json({ message: "You do not have permission to delete activities for this club." });
      return;
    }

    const activity = await ClubActivity.findOne({ where: { id: activityId, clubId } });
    if (!activity) {
      res.status(404).json({ message: "Activity not found." });
      return;
    }

    await activity.destroy();
    res.json({ message: "Activity deleted successfully." });
  } catch (error) {
    console.error("Delete Club Activity Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export default {};
