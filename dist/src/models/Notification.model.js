import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Notification extends Model {
}
Notification.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    type: {
        type: DataTypes.ENUM("role_request_submitted", "role_request_approved", "role_request_rejected"),
        allowNull: false,
    },
    title: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: false },
    relatedId: { type: DataTypes.UUID, allowNull: true },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: "notifications",
    timestamps: true,
    sequelize,
});
export default Notification;
//# sourceMappingURL=Notification.model.js.map