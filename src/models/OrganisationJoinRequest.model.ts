import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface OrganisationJoinRequestAttributes {
  id: string;
  organisationId: string;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OrganisationJoinRequestCreationAttributes
  extends Optional<
    OrganisationJoinRequestAttributes,
    "id" | "status" | "reviewedBy" | "reviewedAt"
  > {}

class OrganisationJoinRequest
  extends Model<OrganisationJoinRequestAttributes, OrganisationJoinRequestCreationAttributes>
  implements OrganisationJoinRequestAttributes
{
  declare id: string;
  declare organisationId: string;
  declare studentId: string;
  declare status: "pending" | "approved" | "rejected";
  declare reviewedBy: string | null;
  declare reviewedAt: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

OrganisationJoinRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    organisationId: { type: DataTypes.UUID, allowNull: false },
    studentId: { type: DataTypes.UUID, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    reviewedBy: { type: DataTypes.UUID, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "organisation_join_requests", timestamps: true, sequelize }
);

export default OrganisationJoinRequest;
