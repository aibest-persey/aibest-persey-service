import { Model, Optional } from "sequelize";
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
interface OrganisationJoinRequestCreationAttributes extends Optional<OrganisationJoinRequestAttributes, "id" | "status" | "reviewedBy" | "reviewedAt"> {
}
declare class OrganisationJoinRequest extends Model<OrganisationJoinRequestAttributes, OrganisationJoinRequestCreationAttributes> implements OrganisationJoinRequestAttributes {
    id: string;
    organisationId: string;
    studentId: string;
    status: "pending" | "approved" | "rejected";
    reviewedBy: string | null;
    reviewedAt: Date | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default OrganisationJoinRequest;
//# sourceMappingURL=OrganisationJoinRequest.model.d.ts.map