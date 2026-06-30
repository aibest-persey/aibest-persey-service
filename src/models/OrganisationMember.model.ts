import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";
import type User from "./User.model.js";
import type Organisation from "./Organisation.model.js";

interface OrganisationMemberAttributes {
  id: string;
  organisationId: string;
  userId: string;
  role: "owner" | "manager" | "member";
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganisationMemberCreationAttributes extends Optional<OrganisationMemberAttributes, "id"> {}

class OrganisationMember extends Model<OrganisationMemberAttributes, OrganisationMemberCreationAttributes> implements OrganisationMemberAttributes {
  declare id: string;
  declare organisationId: string;
  declare userId: string;
  declare role: "owner" | "manager" | "member";
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;

  declare user?: User;
  declare organisation?: Organisation;
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
      type: DataTypes.ENUM("owner", "manager", "member"),
      allowNull: false,
      defaultValue: "member",
    },
  },
  {
    tableName: "organisation_members",
    timestamps: true,
    sequelize,
  },
);

export default OrganisationMember;
