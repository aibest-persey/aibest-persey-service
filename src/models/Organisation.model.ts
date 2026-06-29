import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface OrganisationAttributes {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  creatorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganisationCreationAttributes extends Optional<OrganisationAttributes, "id" | "description" | "logoUrl"> {}

class Organisation extends Model<OrganisationAttributes, OrganisationCreationAttributes> implements OrganisationAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare logoUrl: string | null;
  declare creatorId: string;
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
    logoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    creatorId: {
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
