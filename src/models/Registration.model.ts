import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

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

interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, "id" | "status" | "waitlistPosition" | "ticketCode"> {}

class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes> implements RegistrationAttributes {
  declare id: string;
  declare eventId: string;
  declare studentId: string;
  declare status: "registered" | "waitlisted" | "cancelled";
  declare waitlistPosition: number | null;
  declare ticketCode: string | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

Registration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("registered", "waitlisted", "cancelled"),
      allowNull: false,
      defaultValue: "registered",
    },
    waitlistPosition: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    ticketCode: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "registrations",
    timestamps: true,
    sequelize,
  },
);

export default Registration;
