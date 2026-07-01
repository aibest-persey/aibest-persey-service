import { Model, Optional } from "sequelize";
import type { DomainEventType } from "../events/event-types.js";
interface NotificationJobAttributes {
    id: string;
    type: DomainEventType;
    payload: object;
    status: "pending" | "processing" | "done" | "failed";
    attempts: number;
    lastError: string | null;
    processAfter: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
interface NotificationJobCreationAttributes extends Optional<NotificationJobAttributes, "id" | "status" | "attempts" | "lastError" | "processAfter"> {
}
declare class NotificationJob extends Model<NotificationJobAttributes, NotificationJobCreationAttributes> implements NotificationJobAttributes {
    id: string;
    type: DomainEventType;
    payload: object;
    status: "pending" | "processing" | "done" | "failed";
    attempts: number;
    lastError: string | null;
    processAfter: Date;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default NotificationJob;
//# sourceMappingURL=NotificationJob.model.d.ts.map