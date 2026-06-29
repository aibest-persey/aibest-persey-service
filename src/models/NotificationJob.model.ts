import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import type { DomainEventType } from "../events/event-types.js";

interface NotificationJobAttributes {
  id: string;
  type: DomainEventType;
  payload: object;
  status: "pending" | "processing" | "done" | "failed";
  attempts: number;
  lastError: string | null;
  processAfter: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationJobCreationAttributes
  extends Optional<NotificationJobAttributes, "id" | "status" | "attempts" | "lastError" | "processAfter"> {}

class NotificationJob extends Model<NotificationJobAttributes, NotificationJobCreationAttributes> implements NotificationJobAttributes {
  declare id: string;
  declare type: DomainEventType;
  declare payload: object;
  declare status: "pending" | "processing" | "done" | "failed";
  declare attempts: number;
  declare lastError: string | null;
  declare processAfter: Date;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

NotificationJob.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type: { type: DataTypes.STRING(64), allowNull: false },
    payload: { type: DataTypes.JSONB, allowNull: false },
    status: { type: DataTypes.ENUM("pending", "processing", "done", "failed"), allowNull: false, defaultValue: "pending" },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastError: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    processAfter: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "notification_jobs",
    timestamps: true,
    sequelize,
  }
);

export default NotificationJob;
