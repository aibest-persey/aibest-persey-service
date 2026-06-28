import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

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

interface MessageCreationAttributes
  extends Optional<MessageAttributes, "id" | "subject" | "isRead"> {}

class Message
  extends Model<MessageAttributes, MessageCreationAttributes>
  implements MessageAttributes
{
  declare id: string;
  declare senderId: string;
  declare receiverId: string;
  declare subject: string | null;
  declare content: string;
  declare isRead: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Message.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    senderId: { type: DataTypes.UUID, allowNull: false },
    receiverId: { type: DataTypes.UUID, allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { tableName: "messages", timestamps: true, sequelize }
);

export default Message;
