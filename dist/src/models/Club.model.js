import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Club extends Model {
}
Club.init({
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
    organisationId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: "clubs",
    timestamps: true,
    sequelize,
});
export default Club;
//# sourceMappingURL=Club.model.js.map