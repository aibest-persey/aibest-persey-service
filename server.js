import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
server.use(express.json());

import authRoutes from "./src/routes/auth-routes.js";
import courseRoutes from "./src/routes/course.routes.js";

server.use("/api/auth", authRoutes);
server.use("/api/course", courseRoutes);

server.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "aibest-persey-client", "index.html"));
});

// Sync Postgres models (creates tables if they don't exist)
import sequelize from "./src/clients/postgres-client.js";
sequelize
  .sync({ alter: false })
  .then(() => console.log("PostgreSQL tables synced"))
  .catch((err) => console.error("PostgreSQL sync error:", err));

