import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

interface UserAttributes {
  id: string;
  role: "student" | "organiser" | "admin";
  bio: string | null;
  organization: string | null;
  website: string | null;
  logoUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string;
  email: string;
  password: string;
  authString: string | null;
  ip_encrypted: string | null;
  color: string | null;
  resetPasswordToken: string | null;
  resetPasswordExpires: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role" | "authString" | "ip_encrypted" | "color" | "resetPasswordToken" | "resetPasswordExpires" | "bio" | "organization" | "website" | "logoUrl"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare role: "student" | "organiser" | "admin";
  declare firstName: string | null;
  declare lastName: string | null;
  declare username: string;
  declare email: string;
  declare password: string;
  declare authString: string | null;
  declare ip_encrypted: string | null;
  declare color: string | null;
  declare bio: string | null;
  declare organization: string | null;
  declare website: string | null;
  declare logoUrl: string | null;
  declare resetPasswordToken: string | null;
  declare resetPasswordExpires: number | null;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role: {
      type: DataTypes.ENUM("student", "organiser", "admin"),
      allowNull: false,
      defaultValue: "student",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    organization: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    authString: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ip_encrypted: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    resetPasswordToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    sequelize,
  },
);

export default User;