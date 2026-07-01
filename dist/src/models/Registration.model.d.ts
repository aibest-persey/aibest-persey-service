import { Model, Optional } from "sequelize";
interface RegistrationAttributes {
    id: string;
    eventId: string;
    studentId: string;
    status: "registered" | "waitlisted" | "cancelled";
    waitlistPosition: number | null;
    ticketCode: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, "id" | "status" | "waitlistPosition" | "ticketCode"> {
}
declare class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes> implements RegistrationAttributes {
    id: string;
    eventId: string;
    studentId: string;
    status: "registered" | "waitlisted" | "cancelled";
    waitlistPosition: number | null;
    ticketCode: string | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default Registration;
//# sourceMappingURL=Registration.model.d.ts.map