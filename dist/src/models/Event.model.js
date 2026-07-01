import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Event extends Model {
}
Event.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    location: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM("draft", "published", "cancelled"),
        allowNull: false,
        defaultValue: "draft",
    },
    maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
    },
    organiserId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    organisationId: {
        type: DataTypes.UUID,
        allowNull: true,
        defaultValue: null,
    },
}, {
    tableName: "events",
    timestamps: true,
    sequelize,
});
export default Event;
//# sourceMappingURL=Event.model.js.map