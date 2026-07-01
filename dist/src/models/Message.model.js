import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class Message extends Model {
}
Message.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    senderId: { type: DataTypes.UUID, allowNull: false },
    receiverId: { type: DataTypes.UUID, allowNull: false },
    subject: { type: DataTypes.STRING(255), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    isRead: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: "messages", timestamps: true, sequelize });
export default Message;
//# sourceMappingURL=Message.model.js.map