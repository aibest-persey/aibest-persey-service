import { Model, Optional } from "sequelize";
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
interface NewsCreationAttributes extends Optional<NewsAttributes, "id" | "organisationId" | "clubId"> {
}
declare class News extends Model<NewsAttributes, NewsCreationAttributes> implements NewsAttributes {
    id: string;
    title: string;
    content: string;
    scope: "public" | "org" | "club";
    organisationId: string | null;
    clubId: string | null;
    createdBy: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default News;
//# sourceMappingURL=News.model.d.ts.map