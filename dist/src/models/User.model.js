import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class User extends Model {
}
User.init({
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
    emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    verificationCode: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    verificationCodeExpires: {
        type: DataTypes.BIGINT,
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
}, {
    tableName: "users",
    timestamps: true,
    sequelize,
});
export default User;
//# sourceMappingURL=User.model.js.map