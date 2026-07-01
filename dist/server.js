import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dns from "node:dns";
import authRoutes from "./src/routes/auth-routes.js";
import oauthRoutes from "./src/routes/oauth-routes.js";
import eventRoutes from "./src/routes/event-routes.js";
import adminRoutes from "./src/routes/admin-routes.js";
import organiserRoutes from "./src/routes/organiser-routes.js";
import organisationRoutes from "./src/routes/organisation-routes.js";
import clubRoutes from "./src/routes/club-routes.js";
import messageRoutes from "./src/routes/message-routes.js";
import newsRoutes from "./src/routes/news-routes.js";
import roleChangeRoutes from "./src/routes/rolechange-routes.js";
import scheduleRoutes from "./src/routes/schedule-routes.js";
import sequelize from "./src/clients/postgres-client.js";
import "./src/models/associations.js";
import "./src/models/NotificationJob.model.js";
import "./src/models/Message.model.js";
import "./src/models/RoleChangeRequest.model.js";
import "./src/workers/notification-worker.js";
import { startProcessor } from "./src/workers/notification-processor.js";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
server.use(express.json());
server.use("/api/auth", authRoutes);
server.use("/api/auth/oauth", oauthRoutes);
server.use("/api/events", eventRoutes);
server.use("/api/admin", adminRoutes);
server.use("/api/organisers", organiserRoutes);
server.use("/api/organisations", organisationRoutes);
server.use("/api/clubs", clubRoutes);
server.use("/api/news", newsRoutes);
server.use("/api/messages", messageRoutes);
server.use("/api/role-requests", roleChangeRoutes);
server.use("/api/schedule", scheduleRoutes);
server.get("/schedule", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "schedule.html"));
});
server.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "aibest-persey-client", "index.html"));
});
// Add 'admin' to the role ENUM before sync (Postgres won't add it via alter:true alone)
sequelize.query(`
  DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'enum_users_role' AND e.enumlabel = 'admin'
    ) THEN
      ALTER TYPE "enum_users_role" ADD VALUE 'admin';
    END IF;
  END $$;
`).catch(() => {
    // ENUM type doesn't exist yet on first run — sync will create it with all values
});
sequelize
    .sync({ alter: true })
    .then(() => {
    console.log("PostgreSQL tables synced");
    startProcessor();
    server.listen(PORT, () => {
        console.log("Server running on http://localhost:" + PORT);
    });
})
    .catch((err) => console.error("PostgreSQL sync error:", err));
//# sourceMappingURL=server.js.map