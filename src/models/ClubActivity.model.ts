import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface ClubActivityAttributes {
  id: string;
  clubId: string;
  creatorId: string;
  title: string;
  description: string | null;
  activityType: "meeting" | "event" | "task" | "other";
  attendanceScope: "public" | "club_members_only";
  location: string | null;
  startDate: Date;
  endDate: Date | null;
  status: "scheduled" | "completed" | "cancelled";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClubActivityCreationAttributes extends Optional<ClubActivityAttributes, "id" | "description" | "location" | "endDate" | "status" | "activityType" | "attendanceScope"> {}

class ClubActivity extends Model<ClubActivityAttributes, ClubActivityCreationAttributes> implements ClubActivityAttributes {
  declare id: string;
  declare clubId: string;
  declare creatorId: string;
  declare title: string;
  declare description: string | null;
  declare activityType: "meeting" | "event" | "task" | "other";
  declare attendanceScope: "public" | "club_members_only";
  declare location: string | null;
  declare startDate: Date;
  declare endDate: Date | null;
  declare status: "scheduled" | "completed" | "cancelled";
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

ClubActivity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    clubId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activityType: {
      type: DataTypes.ENUM("meeting", "event", "task", "other"),
      allowNull: false,
      defaultValue: "meeting",
    },
    attendanceScope: {
      type: DataTypes.ENUM("public", "club_members_only"),
      allowNull: false,
      defaultValue: "public",
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "scheduled",
    },
  },
  {
    tableName: "club_activities",
    timestamps: true,
    sequelize,
  },
);

export default ClubActivity;
