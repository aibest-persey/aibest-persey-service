import { Request, Response } from "express";
import { Op } from "sequelize";
import User from "../models/User.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";

interface CreateOrganisationBody {
  name: string;
  description?: string;
  logoUrl?: string;
}

interface UpdateOrganisationBody {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
}

interface InviteMemberBody {
  identifier: string;
  role?: "admin" | "member";
}

interface UpdateMemberRoleBody {
  role: "admin" | "member";
}

const getMembership = async (organisationId: string, userId: string) => OrganisationMember.findOne({
  where: { organisationId, userId },
});

const ensureCreator = async (organisationId: string, userId: string): Promise<boolean> => {
  const organisation = await Organisation.findByPk(organisationId);
  return organisation?.creatorId === userId;
};

export const createOrganisation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, logoUrl } = req.body as CreateOrganisationBody;
    if (!name) {
      res.status(400).json({ message: "Organisation name is required." });
      return;
    }

    const existing = await Organisation.findOne({ where: { name } });
    if (existing) {
      res.status(409).json({ message: "An organisation with this name already exists." });
      return;
    }

    const organisation = await Organisation.create({
      name,
      description: description ?? null,
      logoUrl: logoUrl ?? null,
      creatorId: req.user!.id,
    });

    await OrganisationMember.create({
      organisationId: organisation.id,
      userId: req.user!.id,
      role: "admin",
      status: "active",
      invitedBy: req.user!.id,
    });

    res.status(201).json(organisation);
  } catch (error) {
    console.error("Create Organisation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const listOrganisations = async (req: Request, res: Response): Promise<void> => {
  try {
    const memberships = await OrganisationMember.findAll({
      where: {
        userId: req.user!.id,
        status: { [Op.in]: ["active", "invited"] },
      },
      include: [
        {
          model: Organisation,
          as: "organisation",
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "username", "firstName", "lastName", "color"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const organisations = memberships.map((membership) => ({
      ...membership.organisation?.toJSON(),
      membership: {
        role: membership.role,
        status: membership.status,
      },
    }));

    res.json(organisations);
  } catch (error) {
    console.error("List Organisations Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getOrganisation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const membership = await getMembership(id, req.user!.id);

    if (!membership) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const organisation = await Organisation.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "firstName", "lastName", "color"],
        },
      ],
    });

    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    const members = await OrganisationMember.findAll({
      where: { organisationId: id, status: { [Op.in]: ["active", "invited"] } },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "color", "email"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    res.json({
      ...organisation.toJSON(),
      membership: {
        role: membership.role,
        status: membership.status,
      },
      members: members.map((member) => ({
        id: member.id,
        role: member.role,
        status: member.status,
        invitedBy: member.invitedBy,
        user: member.user,
      })),
    });
  } catch (error) {
    console.error("Get Organisation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateOrganisation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { name, description, logoUrl } = req.body as UpdateOrganisationBody;

    const isCreator = await ensureCreator(id, req.user!.id);
    if (!isCreator) {
      res.status(403).json({ message: "Only the organisation creator can update this organisation." });
      return;
    }

    const organisation = await Organisation.findByPk(id);
    if (!organisation) {
      res.status(404).json({ message: "Organisation not found." });
      return;
    }

    if (name !== undefined && name !== organisation.name) {
      const existing = await Organisation.findOne({ where: { name, id: { [Op.ne]: id } } });
      if (existing) {
        res.status(409).json({ message: "Another organisation with this name already exists." });
        return;
      }
      organisation.name = name;
    }

    if (description !== undefined) organisation.description = description;
    if (logoUrl !== undefined) organisation.logoUrl = logoUrl;

    await organisation.save();
    res.json(organisation);
  } catch (error) {
    console.error("Update Organisation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { identifier, role = "member" } = req.body as InviteMemberBody;

    const isCreator = await ensureCreator(id, req.user!.id);
    if (!isCreator) {
      res.status(403).json({ message: "Only the organisation creator can invite users." });
      return;
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.id === req.user!.id) {
      res.status(400).json({ message: "Creator is already a member of this organisation." });
      return;
    }

    const [membership, created] = await OrganisationMember.findOrCreate({
      where: { organisationId: id, userId: user.id },
      defaults: {
        organisationId: id,
        userId: user.id,
        role,
        status: "invited",
        invitedBy: req.user!.id,
      },
    });

    if (!created) {
      if (membership.status === "active") {
        res.status(409).json({ message: "User is already an active member." });
        return;
      }
      membership.role = role;
      membership.status = "invited";
      membership.invitedBy = req.user!.id;
      await membership.save();
    }

    res.status(created ? 201 : 200).json({
      message: "Invitation sent.",
      membership: {
        id: membership.id,
        userId: user.id,
        role: membership.role,
        status: membership.status,
      },
    });
  } catch (error) {
    console.error("Invite Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string };
    const { role } = req.body as UpdateMemberRoleBody;

    const isCreator = await ensureCreator(id, req.user!.id);
    if (!isCreator) {
      res.status(403).json({ message: "Only the organisation creator can change member roles." });
      return;
    }

    const membership = await OrganisationMember.findByPk(memberId);
    if (!membership || membership.organisationId !== id) {
      res.status(404).json({ message: "Organisation membership not found." });
      return;
    }

    membership.role = role;
    await membership.save();

    res.json({ message: "Member role updated.", membership });
  } catch (error) {
    console.error("Update Member Role Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params as { id: string; memberId: string };
    const isCreator = await ensureCreator(id, req.user!.id);
    if (!isCreator) {
      res.status(403).json({ message: "Only the organisation creator can remove members." });
      return;
    }

    const membership = await OrganisationMember.findByPk(memberId);
    if (!membership || membership.organisationId !== id) {
      res.status(404).json({ message: "Organisation membership not found." });
      return;
    }

    if (membership.userId === req.user!.id) {
      res.status(400).json({ message: "Creator cannot remove themselves." });
      return;
    }

    await membership.destroy();
    res.json({ message: "Member removed from organisation." });
  } catch (error) {
    console.error("Remove Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const membership = await OrganisationMember.findOne({
      where: {
        organisationId: id,
        userId: req.user!.id,
        status: "invited",
      },
    });

    if (!membership) {
      res.status(404).json({ message: "Invitation not found." });
      return;
    }

    membership.status = "active";
    await membership.save();

    res.json({ message: "Invitation accepted.", membership });
  } catch (error) {
    console.error("Accept Invitation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const declineInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const membership = await OrganisationMember.findOne({
      where: {
        organisationId: id,
        userId: req.user!.id,
        status: "invited",
      },
    });

    if (!membership) {
      res.status(404).json({ message: "Invitation not found." });
      return;
    }

    membership.status = "rejected";
    await membership.save();

    res.json({ message: "Invitation declined.", membership });
  } catch (error) {
    console.error("Decline Invitation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export default {};
