import { Model, Optional } from "sequelize";
interface PostAttributes {
    id: string;
    clubId: string;
    authorId: string;
    content: string;
    createdAt?: Date;
    updatedAt?: Date;
}
interface PostCreationAttributes extends Optional<PostAttributes, "id"> {
}
declare class Post extends Model<PostAttributes, PostCreationAttributes> implements PostAttributes {
    id: string;
    clubId: string;
    authorId: string;
    content: string;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Post;
//# sourceMappingURL=Post.model.d.ts.map