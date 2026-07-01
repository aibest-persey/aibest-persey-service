import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class RoleChangeRequest extends Model {
}
RoleChangeRequest.init({
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
}, { tableName: "role_change_requests", timestamps: true, sequelize });
export default RoleChangeRequest;
//# sourceMappingURL=RoleChangeRequest.model.js.map