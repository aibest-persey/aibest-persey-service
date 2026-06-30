import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import type Organisation from "./Organisation.model.js";
import type User from "./User.model.js";

interface OrganisationMemberAttributes {
  id: string;
  organisationId: string;
  userId: string;
  role: "admin" | "member";
  status: "active" | "invited" | "rejected";
  invitedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganisationMemberCreationAttributes extends Optional<OrganisationMemberAttributes, "id" | "role" | "status" | "invitedBy"> {}

class OrganisationMember extends Model<OrganisationMemberAttributes, OrganisationMemberCreationAttributes> implements OrganisationMemberAttributes {
  declare id: string;
  declare organisationId: string;
  declare userId: string;
  declare role: "admin" | "member";
  declare status: "active" | "invited" | "rejected";
  declare invitedBy: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
  declare organisation?: Organisation;
  declare user?: User;
}

OrganisationMember.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "member"),
      allowNull: false,
      defaultValue: "member",
    },
    status: {
      type: DataTypes.ENUM("active", "invited", "rejected"),
      allowNull: false,
      defaultValue: "invited",
    },
    invitedBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "organisation_members",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["organisationId", "userId"],
      },
    ],
    sequelize,
  },
);

export default OrganisationMember;
