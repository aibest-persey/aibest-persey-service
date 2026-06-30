import { Request, Response } from "express";
import { Op } from "sequelize";
import News from "../models/News.model.js";
import User from "../models/User.model.js";
import Organisation from "../models/Organisation.model.js";
import OrganisationMember from "../models/OrganisationMember.model.js";
import Club from "../models/Club.model.js";
import ClubMember from "../models/ClubMember.model.js";

interface CreateNewsBody {
  title: string;
  content: string;
  scope: "public" | "org" | "club";
  organisationId?: string;
  clubId?: string;
}

interface UpdateNewsBody {
  title?: string;
  content?: string;
  scope?: "public" | "org" | "club";
  organisationId?: string | null;
  clubId?: string | null;
}

const canModifyNews = async (news: News, userId: string) => {
  if (news.createdBy === userId) return true;
  if (news.scope === "org" && news.organisationId) {
    const membership = await OrganisationMember.findOne({ where: { organisationId: news.organisationId, userId } });
    return membership?.role === "owner" || membership?.role === "manager";
  }
  if (news.scope === "club" && news.clubId) {
    const membership = await ClubMember.findOne({ where: { clubId: news.clubId, userId } });
    return membership?.role === "owner" || membership?.role === "manager";
  }
  return false;
};

const canAccessNews = async (news: News, userId: string, userRole: string) => {
  if (news.scope === "public") return true;
  if (userRole === "admin") return true;
  if (news.scope === "org" && news.organisationId) {
    const membership = await OrganisationMember.findOne({ where: { organisationId: news.organisationId, userId } });
    return !!membership;
  }
  if (news.scope === "club" && news.clubId) {
    const membership = await ClubMember.findOne({ where: { clubId: news.clubId, userId } });
    return !!membership;
  }
  return false;
};

export const createNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, scope, organisationId, clubId } = req.body as CreateNewsBody;

    if (!title || !content || !scope) {
      res.status(400).json({ message: "title, content, and scope are required." });
      return;
    }

    if (scope === "org") {
      if (!organisationId) {
        res.status(400).json({ message: "organisationId is required for org news." });
        return;
      }
      const organisation = await Organisation.findByPk(organisationId);
      if (!organisation || organisation.status !== "verified") {
        res.status(404).json({ message: "Verified organisation not found." });
        return;
      }
      const membership = await OrganisationMember.findOne({ where: { organisationId, userId: req.user!.id } });
      if (!membership) {
        res.status(403).json({ message: "Only organisation members can create org news." });
        return;
      }
    }

    if (scope === "club") {
      if (!clubId) {
        res.status(400).json({ message: "clubId is required for club news." });
        return;
      }
      const club = await Club.findByPk(clubId);
      if (!club) {
        res.status(404).json({ message: "Club not found." });
        return;
      }
      const membership = await ClubMember.findOne({ where: { clubId, userId: req.user!.id } });
      if (!membership) {
        res.status(403).json({ message: "Only club members can create club news." });
        return;
      }
    }

    const news = await News.create({
      title,
      content,
      scope,
      organisationId: organisationId ?? null,
      clubId: clubId ?? null,
      createdBy: req.user!.id,
    });

    res.status(201).json(news);
  } catch (error) {
    console.error("Create News Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const listNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { scope, organisationId, clubId } = req.query as { scope?: string; organisationId?: string; clubId?: string };
    const filters: any = {};

    if (scope) {
      if (!["public", "org", "club"].includes(scope)) {
        res.status(400).json({ message: "Invalid scope filter." });
        return;
      }
      filters.scope = scope;
    }
    if (organisationId) filters.organisationId = organisationId;
    if (clubId) filters.clubId = clubId;

    const newsItems = await News.findAll({ where: filters, order: [["createdAt", "DESC"]] });
    const visibleItems = [] as News[];
    for (const news of newsItems) {
      if (await canAccessNews(news, req.user!.id, req.user!.role)) {
        visibleItems.push(news);
      }
    }

    res.json(visibleItems);
  } catch (error) {
    console.error("List News Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const news = await News.findByPk(id);
    if (!news) {
      res.status(404).json({ message: "News item not found." });
      return;
    }
    if (!(await canAccessNews(news, req.user!.id, req.user!.role))) {
      res.status(403).json({ message: "Access denied." });
      return;
    }
    res.json(news);
  } catch (error) {
    console.error("Get News Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const updateNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const news = await News.findByPk(id);
    if (!news) {
      res.status(404).json({ message: "News item not found." });
      return;
    }

    if (!(await canModifyNews(news, req.user!.id)) && req.user!.role !== "admin") {
      res.status(403).json({ message: "You do not have permission to edit this news item." });
      return;
    }

    const { title, content, scope, organisationId, clubId } = req.body as UpdateNewsBody;
    if (scope) {
      if (!["public", "org", "club"].includes(scope)) {
        res.status(400).json({ message: "Invalid scope." });
        return;
      }
      news.scope = scope;
    }
    if (title !== undefined) news.title = title;
    if (content !== undefined) news.content = content;
    news.organisationId = organisationId ?? null;
    news.clubId = clubId ?? null;

    await news.save();
    res.json(news);
  } catch (error) {
    console.error("Update News Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteNews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const news = await News.findByPk(id);
    if (!news) {
      res.status(404).json({ message: "News item not found." });
      return;
    }

    if (req.user!.role !== "admin" && !(await canModifyNews(news, req.user!.id))) {
      res.status(403).json({ message: "You do not have permission to delete this news item." });
      return;
    }

    await news.destroy();
    res.json({ message: "News item deleted." });
  } catch (error) {
    console.error("Delete News Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
