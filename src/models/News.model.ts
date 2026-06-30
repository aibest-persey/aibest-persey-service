import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface NewsAttributes {
  id: string;
  title: string;
  content: string;
  scope: "public" | "org" | "club";
  organisationId: string | null;
  clubId: string | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface NewsCreationAttributes extends Optional<NewsAttributes, "id" | "organisationId" | "clubId"> {}

class News extends Model<NewsAttributes, NewsCreationAttributes> implements NewsAttributes {
  declare id: string;
  declare title: string;
  declare content: string;
  declare scope: "public" | "org" | "club";
  declare organisationId: string | null;
  declare clubId: string | null;
  declare createdBy: string;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

News.init(
  {
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
  },
  {
    tableName: "news",
    timestamps: true,
    sequelize,
  },
);

export default News;
