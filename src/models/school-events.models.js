import { DataTypes } from "sequelize";
import sequelize from "../clients/postgres-client.js";

// 1. Event Model Blueprint
export const Event = sequelize.define("Event", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  eventDate: { type: DataTypes.DATE, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  organizerId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: "events",
  underscored: true
});

// 2. Registration Model Blueprint (Handles waitlists natively)
export const Registration = sequelize.define("Registration", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
  eventId: { type: DataTypes.INTEGER, allowNull: false, field: "event_id" },
  status: { 
    type: DataTypes.ENUM("registered", "waitlisted", "cancelled"), 
    defaultValue: "registered" 
  }
}, {
  tableName: "registrations",
  underscored: true,
  indexes: [{ unique: true, fields: ["user_id", "event_id"] }]
});

// 3. Notification Model Blueprint
export const Notification = sequelize.define("Notification", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, field: "user_id" },
  message: { type: DataTypes.TEXT, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false, field: "is_read" }
}, {
  tableName: "notifications",
  underscored: true
});

// Structural Relationship Mapping (Foreign Keys mapping)
if (sequelize.models.User) {
  sequelize.models.User.hasMany(Event, { foreignKey: "organizerId", onDelete: "CASCADE" });
  Event.belongsTo(sequelize.models.User, { foreignKey: "organizerId" });

  sequelize.models.User.hasMany(Registration, { foreignKey: "userId", onDelete: "CASCADE" });
  Registration.belongsTo(sequelize.models.User, { foreignKey: "userId" });

  sequelize.models.User.hasMany(Notification, { foreignKey: "userId", onDelete: "CASCADE" });
  Notification.belongsTo(sequelize.models.User, { foreignKey: "userId" });
}

Event.hasMany(Registration, { foreignKey: "eventId", onDelete: "CASCADE" });
Registration.belongsTo(Event, { foreignKey: "eventId" });
