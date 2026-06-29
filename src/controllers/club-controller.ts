import { Request, Response } from "express";
import { Op } from "sequelize";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";
import Club from "../models/Club.model.js";
import ClubMember from "../models/ClubMember.model.js";
import User from "../models/User.model.js";

interface CreateClubBody {
  name: string;
  description?: string;
}

interface UpdateClubBody {
  name?: string;
  description?: string | null;
}

interface InviteMemberBody {
  identifier: string;
}

const isOrgMember = async (organisationId: string, userId: string): Promise<boolean> => {
  const membership = await OrganisationMember.findOne({
    where: { organisationId, userId, status: "active" },
  });
  return !!membership;
};

const isClubOwner = async (clubId: string, userId: string): Promise<boolean> => {
  const club = await Club.findByPk(clubId);
  return club?.creatorId === userId;
};

export const createClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId } = req.params as { organisationId: string };
    const { name, description } = req.body as CreateClubBody;

    if (!name) {
      res.status(400).json({ message: "Club name is required." });
      return;
    }

    const isMember = await isOrgMember(organisationId, req.user!.id);
    if (!isMember) {
      res.status(403).json({ message: "You must be an active member of this organisation to create a club." });
      return;
    }

    const existing = await Club.findOne({
      where: { organisationId, name },
    });
    if (existing) {
      res.status(409).json({ message: "A club with this name already exists in this organisation." });
      return;
    }

    const club = await Club.create({
      organisationId,
      name,
      description: description ?? null,
      creatorId: req.user!.id,
    });

    await ClubMember.create({
      clubId: club.id,
      userId: req.user!.id,
      role: "owner",
      status: "active",
    });

    res.status(201).json(club);
  } catch (error) {
    console.error("Create Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const listClubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId } = req.params as { organisationId: string };

    const isMember = await isOrgMember(organisationId, req.user!.id);
    if (!isMember) {
      res.status(403).json({ message: "You must be a member of this organisation." });
      return;
    }

    const clubs = await Club.findAll({
      where: { organisationId },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "firstName", "lastName", "color"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const clubIds = clubs.map(c => c.id);
    const memberCounts = await ClubMember.findAll({
      where: { clubId: { [Op.in]: clubIds }, status: "active" },
      attributes: ["clubId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
      group: ["clubId"],
      raw: true,
    });

    const countMap: Record<string, number> = {};
    memberCounts.forEach((mc: any) => {
      countMap[mc.clubId] = parseInt(mc.count, 10);
    });

    const result = clubs.map(club => ({
      ...club.toJSON(),
      memberCount: countMap[club.id] ?? 0,
    }));

    res.json(result);
  } catch (error) {
    console.error("List Clubs Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const isMember = await isOrgMember(organisationId, req.user!.id);
    if (!isMember) {
      res.status(403).json({ message: "You must be a member of this organisation." });
      return;
    }

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "firstName", "lastName", "color"],
        },
      ],
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const members = await ClubMember.findAll({
      where: { clubId, status: "active" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "firstName", "lastName", "color"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    const currentUserMembership = members.find(m => m.userId === req.user!.id);

    res.json({
      ...club.toJSON(),
      isMember: !!currentUserMembership,
      isOwner: club.creatorId === req.user!.id,
      memberCount: members.length,
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        user: m.user,
      })),
    });
  } catch (error) {
    console.error("Get Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };
    const { name, description } = req.body as UpdateClubBody;

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const isOwner = await isClubOwner(clubId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: "Only the club owner can update this club." });
      return;
    }

    if (name !== undefined && name !== club.name) {
      const existing = await Club.findOne({
        where: { organisationId, name, id: { [Op.ne]: clubId } },
      });
      if (existing) {
        res.status(409).json({ message: "A club with this name already exists in this organisation." });
        return;
      }
      club.name = name;
    }

    if (description !== undefined) club.description = description;

    await club.save();
    res.json(club);
  } catch (error) {
    console.error("Update Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const isOwner = await isClubOwner(clubId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: "Only the club owner can delete this club." });
      return;
    }

    await ClubMember.destroy({ where: { clubId } });
    await club.destroy();

    res.json({ message: "Club deleted successfully." });
  } catch (error) {
    console.error("Delete Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const joinClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const isMember = await isOrgMember(organisationId, req.user!.id);
    if (!isMember) {
      res.status(403).json({ message: "You must be a member of this organisation to join a club." });
      return;
    }

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const [membership, created] = await ClubMember.findOrCreate({
      where: { clubId, userId: req.user!.id },
      defaults: {
        clubId,
        userId: req.user!.id,
        role: "member",
        status: "active",
      },
    });

    if (!created) {
      res.status(409).json({ message: "You are already a member of this club." });
      return;
    }

    res.status(201).json({ message: "Joined club successfully.", membership });
  } catch (error) {
    console.error("Join Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const leaveClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const membership = await ClubMember.findOne({
      where: { clubId, userId: req.user!.id },
    });

    if (!membership) {
      res.status(404).json({ message: "You are not a member of this club." });
      return;
    }

    if (membership.role === "owner") {
      const otherOwners = await ClubMember.count({
        where: { clubId, role: "owner", userId: { [Op.ne]: req.user!.id } },
      });
      if (otherOwners === 0) {
        res.status(400).json({ message: "Cannot leave club: you are the only owner. Delete the club instead." });
        return;
      }
    }

    await membership.destroy();
    res.json({ message: "Left club successfully." });
  } catch (error) {
    console.error("Leave Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };
    const { identifier } = req.body as InviteMemberBody;

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const isOwner = await isClubOwner(clubId, req.user!.id);
    if (!isOwner) {
      res.status(403).json({ message: "Only the club owner can invite members." });
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

    const isOrgMemberCheck = await isOrgMember(organisationId, user.id);
    if (!isOrgMemberCheck) {
      res.status(400).json({ message: "User must be a member of this organisation." });
      return;
    }

    const [membership, created] = await ClubMember.findOrCreate({
      where: { clubId, userId: user.id },
      defaults: {
        clubId,
        userId: user.id,
        role: "member",
        status: "invited",
      },
    });

    if (!created) {
      if (membership.status === "active") {
        res.status(409).json({ message: "User is already a member of this club." });
        return;
      }
      membership.status = "invited";
      await membership.save();
    }

    res.status(created ? 201 : 200).json({
      message: "Invitation sent.",
      membership: {
        id: membership.id,
        userId: user.id,
        status: membership.status,
      },
    });
  } catch (error) {
    console.error("Invite Member Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const acceptInvitation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const membership = await ClubMember.findOne({
      where: { clubId, userId: req.user!.id, status: "invited" },
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
    const { organisationId, clubId } = req.params as { organisationId: string; clubId: string };

    const club = await Club.findOne({
      where: { id: clubId, organisationId },
    });

    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    const membership = await ClubMember.findOne({
      where: { clubId, userId: req.user!.id, status: "invited" },
    });

    if (!membership) {
      res.status(404).json({ message: "Invitation not found." });
      return;
    }

    await membership.destroy();
    res.json({ message: "Invitation declined." });
  } catch (error) {
    console.error("Decline Invitation Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const sequelize = require("../clients/postgres-client.js").default;

export default {};
