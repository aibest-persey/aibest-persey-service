import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ message: "Server misconfiguration: JWT_SECRET not set." });
    return;
  }

  const authHeader = req.header("Authorization");
  if (!authHeader) {
    res.status(401).json({ message: "Access Denied. No token provided." });
    return;
  }

  const token: string = authHeader.split(" ")[1] || authHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET) as {
      id: string;
      username: string;
      role: "student" | "organiser" | "admin";
      iat?: number;
      exp?: number;
    };
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

export const requireStudent = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "student") {
    res.status(403).json({ message: "Forbidden: student access only." });
    return;
  }
  next();
};

export const requireOrganiser = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "organiser") {
    res.status(403).json({ message: "Forbidden: organiser access only." });
    return;
  }
  next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ message: "Forbidden: admin access only." });
    return;
  }
  next();
};

export const requireOrganiserOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "organiser" && req.user?.role !== "admin") {
    res.status(403).json({ message: "Forbidden: organiser or admin access required." });
    return;
  }
  next();
};
