import { Model, Optional } from "sequelize";
type NotificationType = "role_request_submitted" | "role_request_approved" | "role_request_rejected";
interface NotificationAttributes {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId: string | null;
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface NotificationCreationAttributes extends Optional<NotificationAttributes, "id" | "relatedId" | "isRead"> {
}
declare class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    relatedId: string | null;
    isRead: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Notification;
//# sourceMappingURL=Notification.model.d.ts.map