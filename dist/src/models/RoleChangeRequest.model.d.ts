import { Model, Optional } from "sequelize";
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
interface RoleChangeRequestCreationAttributes extends Optional<RoleChangeRequestAttributes, "id" | "reason" | "status" | "reviewedBy" | "reviewedAt"> {
}
declare class RoleChangeRequest extends Model<RoleChangeRequestAttributes, RoleChangeRequestCreationAttributes> implements RoleChangeRequestAttributes {
    id: string;
    studentId: string;
    requestedRole: "organiser";
    reason: string | null;
    status: "pending" | "approved" | "rejected";
    reviewedBy: string | null;
    reviewedAt: Date | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default RoleChangeRequest;
//# sourceMappingURL=RoleChangeRequest.model.d.ts.map