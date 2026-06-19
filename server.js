import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";

// Import coworker's existing routes
import authRoutes from "./src/routes/auth-routes.js";
import courseRoutes from "./src/routes/course.routes.js";

// Import your new merged routes
import eventRoutes from "./src/routes/event.routes.js";

// Configuration setups
dns.setServers(["1.1.1.1", "8.8.8.8"]);
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
server.use(express.json());

// Mounted API endpoint routers
server.use("/api/auth", authRoutes);
server.use("/api/course", courseRoutes);
server.use("/api/events", eventRoutes); // <-- Your clean new feature endpoint is active here!

// Fallback to serve your React client files
server.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "aibest-persey-client", "index.html"));
});

// Sync Postgres models using Sequelize (Creates tables automatically if missing)
import sequelize from "./src/clients/postgres-client.js";
sequelize
  .sync({ alter: false })
  .then(() => console.log("🚀 PostgreSQL database tables synced successfully!"))
  .catch((err) => console.error("❌ PostgreSQL database sync error:", err));

server.listen(PORT, () => {
  console.log(`🚀 Server fully operational running on port http://localhost:${PORT}`);
});
