import { Op } from "sequelize";
import User from "../models/User.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import redis from "../clients/redis-client.js";
import crypto from "crypto";

export const register = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username, email, and password." });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const authStringOrigin = `${username}@${hashedPassword}`;
    const authString = bcrypt.hashSync(authStringOrigin, 10);
    const colorsArr = [
      "#ff9800",
      "#4caf50",
      "#2196f3",
      "#9c27b0",
      "#f44336",
      "#3f51b5",
    ];

    const newUser = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      authString: authString,
      ip_encrypted: await bcrypt.hash(requestIp.getClientIp(req), 10),
      color: colorsArr[Math.floor(Math.random() * colorsArr.length)],
    });

    try {
      const publicUser = newUser.get({ plain: true });
      delete publicUser.password;
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

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ message: "Please provide username/email and password." });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: identifier }, { email: identifier }],
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const secret = process.env.JWT_SECRET;
    const token = jwt.sign({ id: user.id, username: user.username }, secret, {
      expiresIn: "24h",
    });

    try {
      const publicUser = user.get({ plain: true });
      delete publicUser.password;
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

export const me = async (req, res) => {
  try {
    const cached = await redis.get(`userId:${req.user.id}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        delete parsed.password;
        delete parsed.ip_encrypted;
        const resp = { ...parsed };
        delete resp.authString;
        return res.json(resp);
      } catch (e) {
        console.warn(
          "Failed to parse cached user in me endpoint, falling back to DB",
          e,
        );
      }
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "ip_encrypted"] },
    });
    if (!user) return res.status(404).json({ message: "User not found." });

    try {
      const publicForCache = user.get({ plain: true });
      delete publicForCache.password;
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

    const responseUser = user.get({ plain: true });
    delete responseUser.password;
    delete responseUser.ip_encrypted;
    delete responseUser.authString;
    res.json(responseUser);
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, id, password } = req.body;
    if (!token || !id || !password)
      return res
        .status(400)
        .json({ message: "token, id and password are required" });
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      where: {
        id,
        resetPasswordToken: hashed,
        resetPasswordExpires: { [Op.gt]: Date.now() },
      },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};