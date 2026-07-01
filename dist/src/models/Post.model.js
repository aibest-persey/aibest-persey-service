import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Post extends Model {
}
Post.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    clubId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    authorId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
}, {
    tableName: "posts",
    timestamps: true,
    sequelize,
});
export default Post;
//# sourceMappingURL=Post.model.js.map