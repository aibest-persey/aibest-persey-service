import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User.model.js";

export const listOrganisers = async (req: Request, res: Response): Promise<void> => {
  try {
    const organisers = await User.findAll({
      where: { role: "organiser" },
      attributes: ["id", "username", "firstName", "lastName", "color", "bio", "organization", "website", "logoUrl"],
      order: [["username", "ASC"]],
    });
    res.json(organisers);
  } catch (error) {
    console.error("List Organisers Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getOrganiser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await User.findByPk(id, {
      attributes: ["id", "username", "firstName", "lastName", "color", "bio", "organization", "website", "logoUrl"],
    });
    if (!user || user.role !== "organiser") {
      res.status(404).json({ message: "Organiser not found." });
      return;
    }
    res.json(user);
  } catch (error) {
    console.error("Get Organiser Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

interface UpdateBody {
  firstName?: string | null;
  lastName?: string | null;
  username?: string;
  bio?: string | null;
  organization?: string | null;
  website?: string | null;
  logoUrl?: string | null;
}

export const updateMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as UpdateBody;
    const user = await User.findByPk(req.user!.id);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }
    if (body.username && body.username !== user.username) {
      const existing = await User.findOne({ where: { username: body.username } });
      if (existing) {
        res.status(400).json({ message: "Username already taken." });
        return;
      }
    }

    if (body.firstName !== undefined) user.firstName = body.firstName;
    if (body.lastName !== undefined) user.lastName = body.lastName;
    if (body.username !== undefined) user.username = body.username;
    if (body.bio !== undefined) user.bio = body.bio;
    if (body.organization !== undefined) user.organization = body.organization;
    if (body.website !== undefined) user.website = body.website;
    if (body.logoUrl !== undefined) user.logoUrl = body.logoUrl;

    await user.save();

    const resp = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      color: user.color,
      bio: user.bio,
      organization: user.organization,
      website: user.website,
      logoUrl: user.logoUrl,
      updatedAt: user.updatedAt,
    };
    res.json(resp);
  } catch (error) {
    console.error("Update Organiser Profile Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export default {};
