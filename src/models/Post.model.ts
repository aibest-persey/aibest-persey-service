import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface PostAttributes {
  id: string;
  clubId: string;
  authorId: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PostCreationAttributes extends Optional<PostAttributes, "id"> {}

class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
  declare id: string;
  declare clubId: string;
  declare authorId: string;
  declare content: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Post.init(
  {
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
  },
  {
    tableName: "posts",
    timestamps: true,
    sequelize,
  },
);

export default Post;
