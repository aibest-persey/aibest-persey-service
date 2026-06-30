import { Request, Response } from "express";
import Club from "../models/Club.model.js";
import ClubMember from "../models/ClubMember.model.js";

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
