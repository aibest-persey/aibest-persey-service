import { Model, Optional } from "sequelize";
interface EventAttributes {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    date: Date;
    status: "draft" | "published" | "cancelled";
    maxCapacity: number | null;
    organiserId: string;
    organisationId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EventCreationAttributes extends Optional<EventAttributes, "id" | "description" | "location" | "status" | "maxCapacity" | "organisationId"> {
}
declare class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    date: Date;
    status: "draft" | "published" | "cancelled";
    maxCapacity: number | null;
    organiserId: string;
    organisationId: string | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Event;
//# sourceMappingURL=Event.model.d.ts.map