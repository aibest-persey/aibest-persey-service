import "dotenv/config";
import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const server: Express = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

server.use(express.json());

import authRoutes from "./src/routes/auth-routes.js";

server.use("/api/auth", authRoutes);

server.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "aibest-persey-client", "index.html"));
});

import sequelize from "./src/clients/postgres-client.js";
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("PostgreSQL tables synced");
    server.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
    });
  })
  .catch((err: Error) => console.error("PostgreSQL sync error:", err));