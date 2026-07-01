import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class News extends Model {
}
News.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(255),
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    scope: {
        type: DataTypes.ENUM("public", "org", "club"),
        allowNull: false,
        defaultValue: "public",
    },
    organisationId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    clubId: {
        type: DataTypes.UUID,
        allowNull: true,
    },
    createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
    },
}, {
    tableName: "news",
    timestamps: true,
    sequelize,
});
export default News;
//# sourceMappingURL=News.model.js.map