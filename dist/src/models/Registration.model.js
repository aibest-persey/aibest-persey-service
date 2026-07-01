import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Registration extends Model {
}
Registration.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    eventId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    studentId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("registered", "waitlisted", "cancelled"),
        allowNull: false,
        defaultValue: "registered",
    },
    waitlistPosition: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    ticketCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    tableName: "registrations",
    timestamps: true,
    sequelize,
});
export default Registration;
//# sourceMappingURL=Registration.model.js.map