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
    agenda: {
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
    startAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    endAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
    coverImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
    },
    visibility: {
        type: DataTypes.ENUM("public", "org-only", "club"),
        allowNull: false,
        defaultValue: "public",
    },
    ownerScope: {
        type: DataTypes.ENUM("public", "organisation", "club"),
        allowNull: false,
        defaultValue: "public",
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
    },
    clubId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
}, {
    tableName: "events",
    timestamps: true,
    sequelize,
});
export default Event;
//# sourceMappingURL=Event.model.js.map