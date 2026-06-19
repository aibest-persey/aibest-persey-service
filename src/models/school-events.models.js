import { DataTypes } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import User from "./User.model.js"; // <-- Points precisely to her capital-U User model file

// 1. Event Model Configuration
export const Event = sequelize.define("Event", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  eventDate: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  organizerId: { type: DataTypes.UUID, allowNull: false } // Matches her User UUID data type
}, {
  tableName: "events",
  timestamps: true
});

// 2. Registration Model Configuration (Handles waitlists natively)
export const Registration = sequelize.define("Registration", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" }, // Matches her User UUID data type
  eventId: { type: DataTypes.INTEGER, allowNull: false, field: "event_id" },
  status: { 
    type: DataTypes.ENUM("registered", "waitlisted", "cancelled"), 
    defaultValue: "registered" 
  }
}, {
  tableName: "registrations",
  timestamps: true,
  indexes: [{ unique: true, fields: ["user_id", "event_id"] }]
});

// 3. Notification Model Configuration
export const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" }, // Matches her User UUID data type
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_read" }
}, {
  tableName: "notifications",
  timestamps: true
});

// Establish Structural Cross-Table Associations
User.hasMany(Event, { foreignKey: "organizerId", onDelete: "CASCADE" });
Event.belongsTo(User, { foreignKey: "organizerId" });

User.hasMany(Registration, { foreignKey: "userId", onDelete: "CASCADE" });
Registration.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Notification, { foreignKey: "userId", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "userId" });

Event.hasMany(Registration, { foreignKey: "eventId", onDelete: "CASCADE" });
Registration.belongsTo(Event, { foreignKey: "eventId" });
