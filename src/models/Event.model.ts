import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface EventAttributes {
  id: string;
  title: string;
  description: string | null;
  agenda: string | null;
  location: string | null;
  date: Date;
  status: "draft" | "published" | "cancelled";
  maxCapacity: number | null;
  organiserId: string;
  organisationId: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, "id" | "description" | "agenda" | "location" | "status" | "maxCapacity" | "organisationId"> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare agenda: string | null;
  declare location: string | null;
  declare date: Date;
  declare status: "draft" | "published" | "cancelled";
  declare maxCapacity: number | null;
  declare organiserId: string;
  declare organisationId: string | null;
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
  },
  {
    tableName: "events",
    timestamps: true,
    sequelize,
  },
);

export default Event;
