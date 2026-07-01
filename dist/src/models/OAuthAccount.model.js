import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class OAuthAccount extends Model {
}
OAuthAccount.init({
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.ENUM("google", "microsoft", "apple"), allowNull: false },
    providerAccountId: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: "oauth_accounts",
    timestamps: true,
    sequelize,
    indexes: [{ unique: true, fields: ["provider", "providerAccountId"] }],
});
export default OAuthAccount;
//# sourceMappingURL=OAuthAccount.model.js.map