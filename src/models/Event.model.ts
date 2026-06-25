import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface EventAttributes {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  date: Date;
  status: "draft" | "published" | "cancelled";
  organiserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface EventCreationAttributes extends Optional<EventAttributes, "id" | "description" | "location" | "status"> {}

class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare location: string | null;
  declare date: Date;
  declare status: "draft" | "published";
  declare organiserId: string;
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
    organiserId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "events",
    timestamps: true,
    sequelize,
  },
);

export default Event;
