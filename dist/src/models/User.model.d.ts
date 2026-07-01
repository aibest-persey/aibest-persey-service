import { Model, Optional } from "sequelize";
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
    password: string | null;
    authString: string | null;
    ip_encrypted: string | null;
    color: string | null;
    emailVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpires: number | null;
    resetPasswordToken: string | null;
    resetPasswordExpires: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, "id" | "role" | "password" | "authString" | "ip_encrypted" | "color" | "verificationCode" | "verificationCodeExpires" | "resetPasswordToken" | "resetPasswordExpires" | "bio" | "organization" | "website" | "logoUrl"> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    role: "student" | "organiser" | "admin";
    firstName: string | null;
    lastName: string | null;
    username: string;
    email: string;
    password: string | null;
    authString: string | null;
    ip_encrypted: string | null;
    color: string | null;
    emailVerified: boolean;
    verificationCode: string | null;
    verificationCodeExpires: number | null;
    bio: string | null;
    organization: string | null;
    website: string | null;
    logoUrl: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpires: number | null;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default User;
//# sourceMappingURL=User.model.d.ts.map