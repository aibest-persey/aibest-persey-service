import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Organisation extends Model {
}
Organisation.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("pending", "verified"),
        allowNull: false,
        defaultValue: "pending",
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: "organisations",
    timestamps: true,
    sequelize,
});
export default Organisation;
//# sourceMappingURL=Organisation.model.js.map