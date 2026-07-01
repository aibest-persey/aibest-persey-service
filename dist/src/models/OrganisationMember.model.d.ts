import { Model, Optional } from "sequelize";
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
interface OrganisationMemberCreationAttributes extends Optional<OrganisationMemberAttributes, "id"> {
}
declare class OrganisationMember extends Model<OrganisationMemberAttributes, OrganisationMemberCreationAttributes> implements OrganisationMemberAttributes {
    id: string;
    organisationId: string;
    userId: string;
    role: "owner" | "manager" | "member";
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
    user?: User;
    organisation?: Organisation;
}
export default OrganisationMember;
//# sourceMappingURL=OrganisationMember.model.d.ts.map