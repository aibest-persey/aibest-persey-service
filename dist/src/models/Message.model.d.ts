import { Model, Optional } from "sequelize";
interface MessageAttributes {
    id: string;
    senderId: string;
    receiverId: string;
    subject: string | null;
    content: string;
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface MessageCreationAttributes extends Optional<MessageAttributes, "id" | "subject" | "isRead"> {
}
declare class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    id: string;
    senderId: string;
    receiverId: string;
    subject: string | null;
    content: string;
    isRead: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Message;
//# sourceMappingURL=Message.model.d.ts.map