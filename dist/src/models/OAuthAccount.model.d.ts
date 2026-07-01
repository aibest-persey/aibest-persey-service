import { Model, Optional } from "sequelize";
interface OAuthAccountAttributes {
    id: string;
    userId: string;
    provider: "google" | "microsoft" | "apple";
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
interface OAuthAccountCreationAttributes extends Optional<OAuthAccountAttributes, "id" | "emailVerified"> {
}
declare class OAuthAccount extends Model<OAuthAccountAttributes, OAuthAccountCreationAttributes> implements OAuthAccountAttributes {
    id: string;
    userId: string;
    provider: "google" | "microsoft" | "apple";
    providerAccountId: string;
    email: string;
    emailVerified: boolean;
    readonly createdAt?: Date;
    readonly updatedAt?: Date;
}
export default OAuthAccount;
//# sourceMappingURL=OAuthAccount.model.d.ts.map