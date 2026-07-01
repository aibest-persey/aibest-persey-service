import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface EventAttributes {
  id: string;
  title: string;
  description: string | null;
  agenda: string | null;
  location: string | null;
  date: Date;
  startAt: Date | null;
  endAt: Date | null;
  coverImage: string | null;
  visibility: "public" | "org-only" | "club";
  ownerScope: "public" | "organisation" | "club";
  status: "draft" | "published" | "cancelled";
  maxCapacity: number | null;
  organiserId: string;
  organisationId: string | null;
  clubId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, "id" | "description" | "agenda" | "location" | "status" | "maxCapacity" | "organisationId" | "clubId" | "startAt" | "endAt" | "coverImage" | "visibility" | "ownerScope"> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare agenda: string | null;
  declare location: string | null;
  declare date: Date;
  declare startAt: Date | null;
  declare endAt: Date | null;
  declare coverImage: string | null;
  declare visibility: "public" | "org-only" | "club";
  declare ownerScope: "public" | "organisation" | "club";
  declare status: "draft" | "published" | "cancelled";
  declare maxCapacity: number | null;
  declare organiserId: string;
  declare organisationId: string | null;
  declare clubId: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    visibility: {
      type: DataTypes.ENUM("public", "org-only", "club"),
      allowNull: false,
      defaultValue: "public",
    },
    ownerScope: {
      type: DataTypes.ENUM("public", "organisation", "club"),
      allowNull: false,
      defaultValue: "public",
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "cancelled"),
      allowNull: false,
      defaultValue: "draft",
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    organiserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    organisationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    clubId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "events",
    timestamps: true,
    sequelize,
  },
);

export default Event;
