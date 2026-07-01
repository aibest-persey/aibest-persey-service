import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class OrganisationJoinRequest extends Model {
}
OrganisationJoinRequest.init({
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
}, { tableName: "organisation_join_requests", timestamps: true, sequelize });
export default OrganisationJoinRequest;
//# sourceMappingURL=OrganisationJoinRequest.model.js.map