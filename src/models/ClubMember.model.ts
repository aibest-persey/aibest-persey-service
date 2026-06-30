import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface ClubMemberAttributes {
  id: string;
  clubId: string;
  userId: string;
  role: "owner" | "manager" | "member";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClubMemberCreationAttributes extends Optional<ClubMemberAttributes, "id"> {}

class ClubMember extends Model<ClubMemberAttributes, ClubMemberCreationAttributes> implements ClubMemberAttributes {
  declare id: string;
  declare clubId: string;
  declare userId: string;
  declare role: "owner" | "manager" | "member";
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

ClubMember.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("owner", "manager", "member"),
      allowNull: false,
      defaultValue: "member",
    },
  },
  {
    tableName: "club_members",
    timestamps: true,
    sequelize,
  },
);

export default ClubMember;
