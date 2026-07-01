import { Model, Optional } from "sequelize";
interface ClubAttributes {
    id: string;
    name: string;
    description: string | null;
    organisationId: string | null;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface ClubCreationAttributes extends Optional<ClubAttributes, "id" | "description" | "organisationId"> {
}
declare class Club extends Model<ClubAttributes, ClubCreationAttributes> implements ClubAttributes {
    id: string;
    name: string;
    description: string | null;
    organisationId: string | null;
    createdBy: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Club;
//# sourceMappingURL=Club.model.d.ts.map