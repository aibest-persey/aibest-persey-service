import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import type Club from "./Club.model.js";
import type User from "./User.model.js";

interface ClubMemberAttributes {
  id: string;
  clubId: string;
  userId: string;
  role: "owner" | "member";
  status: "active" | "invited";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClubMemberCreationAttributes extends Optional<ClubMemberAttributes, "id" | "role" | "status"> {}

class ClubMember extends Model<ClubMemberAttributes, ClubMemberCreationAttributes> implements ClubMemberAttributes {
  declare id: string;
  declare clubId: string;
  declare userId: string;
  declare role: "owner" | "member";
  declare status: "active" | "invited";
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
  declare club?: Club;
  declare user?: User;
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
      type: DataTypes.ENUM("owner", "member"),
      allowNull: false,
      defaultValue: "member",
    },
    status: {
      type: DataTypes.ENUM("active", "invited"),
      allowNull: false,
      defaultValue: "active",
    },
  },
  {
    tableName: "club_members",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["clubId", "userId"],
      },
    ],
    sequelize,
  },
);

export default ClubMember;
