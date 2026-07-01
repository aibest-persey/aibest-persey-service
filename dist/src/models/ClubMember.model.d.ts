import { Model, Optional } from "sequelize";
interface ClubMemberAttributes {
    id: string;
    clubId: string;
    userId: string;
    role: "owner" | "manager" | "member";
    createdAt?: Date;
    updatedAt?: Date;
}
interface ClubMemberCreationAttributes extends Optional<ClubMemberAttributes, "id"> {
}
declare class ClubMember extends Model<ClubMemberAttributes, ClubMemberCreationAttributes> implements ClubMemberAttributes {
    id: string;
    clubId: string;
    userId: string;
    role: "owner" | "manager" | "member";
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default ClubMember;
//# sourceMappingURL=ClubMember.model.d.ts.map