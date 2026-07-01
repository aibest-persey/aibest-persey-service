import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class OrganisationMember extends Model {
}
OrganisationMember.init({
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
}, {
    tableName: "organisation_members",
    timestamps: true,
    sequelize,
});
export default OrganisationMember;
//# sourceMappingURL=OrganisationMember.model.js.map