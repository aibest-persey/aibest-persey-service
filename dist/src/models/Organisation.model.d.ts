import { Model, Optional } from "sequelize";
interface OrganisationAttributes {
    id: string;
    name: string;
    description: string | null;
    status: "pending" | "verified";
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface OrganisationCreationAttributes extends Optional<OrganisationAttributes, "id" | "description" | "status"> {
}
declare class Organisation extends Model<OrganisationAttributes, OrganisationCreationAttributes> implements OrganisationAttributes {
    id: string;
    name: string;
    description: string | null;
    status: "pending" | "verified";
    createdBy: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Organisation;
//# sourceMappingURL=Organisation.model.d.ts.map