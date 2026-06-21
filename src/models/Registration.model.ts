import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface RegistrationAttributes {
  id: string;
  eventId: string;
  studentId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, "id"> {}

class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes> implements RegistrationAttributes {
  declare id: string;
  declare eventId: string;
  declare studentId: string;
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
  },
  {
    tableName: "registrations",
    timestamps: true,
    sequelize,
    indexes: [{ unique: true, fields: ["eventId", "studentId"] }],
  },
);

export default Registration;
