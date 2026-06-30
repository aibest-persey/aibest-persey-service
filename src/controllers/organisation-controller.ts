import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";

interface CreateOrganisationBody {
  name: string;
  description?: string;
}

interface AddMemberBody {
  userId: string;
  role: "member" | "manager";
}

interface UpdateMemberBody {
  role: "member" | "manager";
}

const getMembership = async (organisationId: string, userId: string) => {
  return OrganisationMember.findOne({
    where: { organisationId, userId },
  });
};

const canManageOrganisation = (membership: OrganisationMember | null) => {
  return membership?.role === "owner" || membership?.role === "manager";
};

export const createOrganisation = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role !== "organiser" && req.user!.role !== "admin") {
      res.status(403).json({ message: "Only organisers can create organisations." });
      return;
    }

    const { name, description } = req.body as CreateOrganisationBody;
    if (!name) {
      res.status(400).json({ message: "Organisation name is required." });
      return;
    }

    const existing = await Organisation.findOne({ where: { name } });
    if (existing) {
      res.status(400).json({ message: "An organisation with that name already exists." });
      return;
    }

    const organisation = await Organisation.create({
      name,
      description: description ?? null,
      status: "pending",
      createdBy: req.user!.id,
    });

    await OrganisationMember.create({
      organisationId: organisation.id,
      userId: req.user!.id,
      role: "owner",
    });

    res.status(201).json({
      message: "Organisation created in pending review.",
      organisation,
    });
  } catch (error) {
    console.error("Create Organisation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const listOrganisations = async (req: Request, res: Response): Promise<void> => {
  try {
    if (req.user!.role === "admin") {
      const organisations = await Organisation.findAll({ order: [["createdAt", "DESC"]] });
      res.json(organisations);
      return;
    }

    const memberships = await OrganisationMember.findAll({
      where: { userId: req.user!.id },
      attributes: ["organisationId"],
    });
    const membershipIds = memberships.map((m) => m.organisationId);

    const organisations = await Organisation.findAll({
      where: {
        [Op.or]: [
          { status: "verified" },
          { id: { [Op.in]: membershipIds } },
        ],
      },
      order: [["createdAt", "DESC"]],
    });

    res.json(organisations);
  } catch (error) {
    console.error("List Organisations Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getOrganisation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const membership = await getMembership(id, req.user!.id);
    if (organisation.status === "pending" && !membership && req.user!.role !== "admin") {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    res.json({
      ...organisation.toJSON(),
      isMember: Boolean(membership),
      myRole: membership?.role ?? null,
    });
  } catch (error) {
    console.error("Get Organisation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getOrganisationMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const membership = await getMembership(id, req.user!.id);
    if (!membership && req.user!.role !== "admin") {
      res.status(403).json({ message: "Access denied." });
      return;
    }

    const members = await OrganisationMember.findAll({
      where: { organisationId: id },
      include: [{ model: User, as: "user", attributes: ["id", "username", "email", "firstName", "lastName", "color"] }],
      order: [["createdAt", "ASC"]],
    }) as (OrganisationMember & { user?: User })[];

    res.json(members.map((member) => ({
      id: member.id,
      role: member.role,
      user: member.user,
      createdAt: member.createdAt,
    })));
  } catch (error) {
    console.error("List Organisation Members Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const addOrganisationMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { userId, role } = req.body as AddMemberBody;

    if (!userId || !role) {
      res.status(400).json({ message: "userId and role are required." });
      return;
    }

    if (!["member", "manager"].includes(role)) {
      res.status(400).json({ message: "Role must be 'member' or 'manager'." });
      return;
    }

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const membership = await getMembership(id, req.user!.id);
    if (!canManageOrganisation(membership) && req.user!.role !== "admin") {
      res.status(403).json({ message: "Only organisation owners or managers can add members." });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const existing = await OrganisationMember.findOne({ where: { organisationId: id, userId } });
    if (existing) {
      res.status(400).json({ message: "User is already a member of this organisation." });
      return;
    }

    const member = await OrganisationMember.create({ organisationId: id, userId, role });
    res.status(201).json({ message: "Member added.", member });
  } catch (error) {
    console.error("Add Organisation Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateOrganisationMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string };
    const { role } = req.body as UpdateMemberBody;

    if (!role) {
      res.status(400).json({ message: "Role is required." });
      return;
    }

    if (!["member", "manager"].includes(role)) {
      res.status(400).json({ message: "Role must be 'member' or 'manager'." });
      return;
    }

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const membership = await getMembership(id, req.user!.id);
    if (!canManageOrganisation(membership) && req.user!.role !== "admin") {
      res.status(403).json({ message: "Only organisation owners or managers can change member roles." });
      return;
    }

    const member = await OrganisationMember.findByPk(memberId);
    if (!member || member.organisationId !== id) {
      res.status(404).json({ message: "Organisation member not found." });
      return;
    }

    if (member.role === "owner") {
      res.status(400).json({ message: "Owner role cannot be changed through this endpoint." });
      return;
    }

    member.role = role;
    await member.save();
    res.json({ message: "Member role updated.", member });
  } catch (error) {
    console.error("Update Organisation Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const removeOrganisationMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string };

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const membership = await getMembership(id, req.user!.id);
    if (!canManageOrganisation(membership) && req.user!.role !== "admin") {
      res.status(403).json({ message: "Only organisation owners or managers can remove members." });
      return;
    }

    const member = await OrganisationMember.findByPk(memberId);
    if (!member || member.organisationId !== id) {
      res.status(404).json({ message: "Organisation member not found." });
      return;
    }

    if (member.role === "owner") {
      res.status(400).json({ message: "Cannot remove the organisation owner." });
      return;
    }

    await member.destroy();
    res.json({ message: "Member removed." });
  } catch (error) {
    console.error("Remove Organisation Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
