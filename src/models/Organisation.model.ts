import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface OrganisationAttributes {
  id: string;
  name: string;
  description: string | null;
  status: "pending" | "verified";
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganisationCreationAttributes extends Optional<OrganisationAttributes, "id" | "description" | "status"> {}

class Organisation extends Model<OrganisationAttributes, OrganisationCreationAttributes> implements OrganisationAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare status: "pending" | "verified";
  declare createdBy: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Organisation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "verified"),
      allowNull: false,
      defaultValue: "pending",
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "organisations",
    timestamps: true,
    sequelize,
  },
);

export default Organisation;
