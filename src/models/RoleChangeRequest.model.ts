import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface RoleChangeRequestAttributes {
  id: string;
  studentId: string;
  requestedRole: "organiser";
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoleChangeRequestCreationAttributes
  extends Optional<
    RoleChangeRequestAttributes,
    "id" | "reason" | "status" | "reviewedBy" | "reviewedAt"
  > {}

class RoleChangeRequest
  extends Model<RoleChangeRequestAttributes, RoleChangeRequestCreationAttributes>
  implements RoleChangeRequestAttributes
{
  declare id: string;
  declare studentId: string;
  declare requestedRole: "organiser";
  declare reason: string | null;
  declare status: "pending" | "approved" | "rejected";
  declare reviewedBy: string | null;
  declare reviewedAt: Date | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

RoleChangeRequest.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studentId: { type: DataTypes.UUID, allowNull: false },
    requestedRole: { type: DataTypes.ENUM("organiser"), allowNull: false },
    reason: { type: DataTypes.TEXT, allowNull: true },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    reviewedBy: { type: DataTypes.UUID, allowNull: true },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "role_change_requests", timestamps: true, sequelize }
);

export default RoleChangeRequest;
