import { Request, Response } from "express";
import Club from "../models/Club.model.js";
import ClubMember from "../models/ClubMember.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";

// GET /api/clubs — every club, flagged with whether the current user is a member
export const listClubs = async (req: Request, res: Response): Promise<void> => {
  try {
    const clubs = await Club.findAll({ order: [["createdAt", "ASC"]] });

    const memberships = await ClubMember.findAll({ where: { userId: req.user!.id } });
    const memberClubIds = new Set(memberships.map((m) => m.clubId));

    const memberCounts = await ClubMember.findAll();
    const countByClub: Record<string, number> = {};
    for (const m of memberCounts) {
      countByClub[m.clubId] = (countByClub[m.clubId] ?? 0) + 1;
    }

    res.json(clubs.map((club) => ({
      ...club.toJSON(),
      isMember: memberClubIds.has(club.id),
      memberCount: countByClub[club.id] ?? 0,
    })));
  } catch (error) {
    console.error("List Clubs Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// POST /api/clubs/:id/join — self-service; if the club belongs to an
// organisation, the requester must already be a member of that organisation
export const joinClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const club = await Club.findByPk(id);
    if (!club) {
      res.status(404).json({ message: "Club not found." });
      return;
    }

    if (club.organisationId) {
      const orgMembership = await OrganisationMember.findOne({
        where: { organisationId: club.organisationId, userId: req.user!.id },
      });
      if (!orgMembership) {
        res.status(403).json({ message: "You must be a member of this club's organisation to join it." });
        return;
      }
    }

    const existing = await ClubMember.findOne({ where: { clubId: id, userId: req.user!.id } });
    if (existing) {
      res.status(400).json({ message: "You are already a member of this club." });
      return;
    }

    const member = await ClubMember.create({ clubId: id, userId: req.user!.id, role: "member" });
    res.status(201).json({ message: "Joined club.", member });
  } catch (error) {
    console.error("Join Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// DELETE /api/clubs/:id/join — leave a club
export const leaveClub = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const membership = await ClubMember.findOne({ where: { clubId: id, userId: req.user!.id } });
    if (!membership) {
      res.status(404).json({ message: "You are not a member of this club." });
      return;
    }

    if (membership.role === "owner") {
      res.status(400).json({ message: "The club owner cannot leave. Transfer ownership first." });
      return;
    }

    await membership.destroy();
    res.json({ message: "Left club." });
  } catch (error) {
    console.error("Leave Club Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
