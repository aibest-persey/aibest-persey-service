import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class NotificationJob extends Model {
}
NotificationJob.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    type: {
        type: DataTypes.STRING(64),
        allowNull: false,
    },
    payload: {
        type: DataTypes.JSONB,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("pending", "processing", "done", "failed"),
        allowNull: false,
        defaultValue: "pending",
    },
    attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    lastError: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
    },
    // Allows delayed retry: processor skips jobs where processAfter > NOW()
    processAfter: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: "notification_jobs",
    timestamps: true,
    sequelize,
});
export default NotificationJob;
//# sourceMappingURL=NotificationJob.model.js.map