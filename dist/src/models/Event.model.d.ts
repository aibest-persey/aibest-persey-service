import { Model, Optional } from "sequelize";
interface EventAttributes {
    id: string;
    title: string;
    description: string | null;
    agenda: string | null;
    location: string | null;
    date: Date;
    startAt: Date | null;
    endAt: Date | null;
    coverImage: string | null;
    visibility: "public" | "org-only" | "club";
    ownerScope: "public" | "organisation" | "club";
    status: "draft" | "published" | "cancelled";
    maxCapacity: number | null;
    organiserId: string;
    organisationId: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface EventCreationAttributes extends Optional<EventAttributes, "id" | "description" | "agenda" | "location" | "status" | "maxCapacity" | "organisationId" | "startAt" | "endAt" | "coverImage" | "visibility" | "ownerScope"> {
}
declare class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
    id: string;
    title: string;
    description: string | null;
    agenda: string | null;
    location: string | null;
    date: Date;
    startAt: Date | null;
    endAt: Date | null;
    coverImage: string | null;
    visibility: "public" | "org-only" | "club";
    ownerScope: "public" | "organisation" | "club";
    status: "draft" | "published" | "cancelled";
    maxCapacity: number | null;
    organiserId: string;
    organisationId: string | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Event;
//# sourceMappingURL=Event.model.d.ts.map