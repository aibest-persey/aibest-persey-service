import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface ClubAttributes {
  id: string;
  name: string;
  description: string | null;
  organisationId: string | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClubCreationAttributes extends Optional<ClubAttributes, "id" | "description" | "organisationId"> {}

class Club extends Model<ClubAttributes, ClubCreationAttributes> implements ClubAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare organisationId: string | null;
  declare createdBy: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Club.init(
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
    organisationId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "clubs",
    timestamps: true,
    sequelize,
  },
);

export default Club;
