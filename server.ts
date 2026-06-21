import "dotenv/config";
import express, { Express } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";
import authRoutes from "./src/routes/auth-routes.js";
import eventRoutes from "./src/routes/event-routes.js";
import sequelize from "./src/clients/postgres-client.js";
import "./src/models/associations.js";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

const server: Express = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

server.use(express.json());

server.use("/api/auth", authRoutes);
server.use("/api/events", eventRoutes);

server.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "aibest-persey-client", "index.html"));
});

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("PostgreSQL tables synced");
    server.listen(PORT, () => {
      console.log("Server running on http://localhost:" + PORT);
    });
  })
  .catch((err: Error) => console.error("PostgreSQL sync error:", err));