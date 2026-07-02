import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

type NotificationType = "role_request_submitted" | "role_request_approved" | "role_request_rejected";

interface NotificationAttributes {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, "id" | "relatedId" | "isRead"> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  declare id: string;
  declare userId: string;
  declare type: NotificationType;
  declare title: string;
  declare body: string;
  declare relatedId: string | null;
  declare isRead: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Notification.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: {
      type: DataTypes.ENUM("role_request_submitted", "role_request_approved", "role_request_rejected"),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    relatedId: { type: DataTypes.UUID, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "notifications",
    timestamps: true,
    sequelize,
  },
);

export default Notification;
