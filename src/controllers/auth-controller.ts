import { Request, Response } from "express";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import crypto from "crypto";
import User from "../models/User.model.js";
import redis from "../clients/redis-client.js";

interface RegisterBody {
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  password: string;
}

interface LoginBody {
  identifier: string;
  password: string;
}

interface ResetPasswordBody {
  token: string;
  id: string;
  password: string;
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, username, email, password } = req.body as RegisterBody;

    if (!username || !email || !password) {
      res.status(400).json({ message: "Please provide username, email, and password." });
      return;
    }

    const existingByUsername = await User.findOne({ where: { username } });
    if (existingByUsername) {
      res.status(400).json({ message: "Username already taken." });
      return;
    }

    const existingByEmail = await User.findOne({ where: { email } });
    if (existingByEmail) {
      res.status(400).json({ message: "An account with this email already exists." });
      return;
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const authStringOrigin: string = `${username}@${hashedPassword}`;
    const authString: string = bcrypt.hashSync(authStringOrigin, 10);
    const colorsArr: string[] = [
      "#ff9800",
      "#4caf50",
      "#2196f3",
      "#9c27b0",
      "#f44336",
      "#3f51b5",
    ];

    const newUser = await User.create({
      role: "student",
      firstName: firstName || null,
      lastName: lastName || null,
      username,
      email,
      password: hashedPassword,
      authString,
      ip_encrypted: await bcrypt.hash(requestIp.getClientIp(req) || "unknown", 10),
      color: colorsArr[Math.floor(Math.random() * colorsArr.length)],
    });

    try {
      const publicUser = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        color: newUser.color,
        authString: newUser.authString,
      };
      await redis.set(
        `user:${publicUser.authString}`,
        JSON.stringify(publicUser),
        { ex: 3600 },
      );
      await redis.set(`userId:${publicUser.id}`, JSON.stringify(publicUser), {
        ex: 3600,
      });
    } catch (e) {
      console.warn("Failed to set user cache on register", e);
    }

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body as LoginBody;

    if (!identifier || !password) {
      res.status(400).json({ message: "Please provide username/email and password." });
      return;
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials." });
      return;
    }

    const isMatch: boolean = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials." });
      return;
    }

    const secret: string = process.env.JWT_SECRET as string;
    const token: string = jwt.sign({ id: user.id, username: user.username, role: user.role }, secret, {
      expiresIn: "24h",
    });

    try {
      const publicUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        color: user.color,
        authString: user.authString,
      };
      await redis.set(
        `user:${publicUser.authString}`,
        JSON.stringify(publicUser),
        { ex: 3600 },
      );
      await redis.set(`userId:${publicUser.id}`, JSON.stringify(publicUser), {
        ex: 3600,
      });
    } catch (e) {
      console.warn("Failed to set user cache on login", e);
    }

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        color: user.color,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const cached = await redis.get(`userId:${req.user!.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached as string);
        delete parsed.password;
        delete parsed.ip_encrypted;
        const resp = { ...parsed };
        delete resp.authString;
        res.json(resp);
        return;
      } catch (e) {
        console.warn(
          "Failed to parse cached user in me endpoint, falling back to DB",
          e,
        );
      }
    }

    const user = await User.findByPk(req.user!.id, {
      attributes: { exclude: ["password", "ip_encrypted"] },
    });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    try {
      const publicForCache = {
        id: user.id,
        username: user.username,
        email: user.email,
        color: user.color,
        authString: user.authString,
      };
      await redis.set(
        `user:${publicForCache.authString}`,
        JSON.stringify(publicForCache),
        { ex: 3600 },
      );
      await redis.set(
        `userId:${publicForCache.id}`,
        JSON.stringify(publicForCache),
        { ex: 3600 },
      );
    } catch (e) {
      console.warn("Failed to set user cache in me endpoint", e);
    }

    const responseUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
      color: user.color,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    res.json(responseUser);
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, id, password } = req.body as ResetPasswordBody;
    if (!token || !id || !password) {
      res.status(400).json({ message: "token, id and password are required" });
      return;
    }

    const hashed: string = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      where: {
        id,
        resetPasswordToken: hashed,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
};