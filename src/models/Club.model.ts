import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface ClubAttributes {
  id: string;
  organisationId: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClubCreationAttributes extends Optional<ClubAttributes, "id" | "description"> {}

class Club extends Model<ClubAttributes, ClubCreationAttributes> implements ClubAttributes {
  declare id: string;
  declare organisationId: string;
  declare name: string;
  declare description: string | null;
  declare creatorId: string;
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
    organisationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    tableName: "clubs",
    timestamps: true,
    indexes: [
      {
        fields: ["organisationId", "name"],
        unique: true,
      },
    ],
    sequelize,
  },
);

export default Club;
