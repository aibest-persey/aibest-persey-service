import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../clients/postgres-client.js";

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

interface OAuthAccountCreationAttributes
  extends Optional<OAuthAccountAttributes, "id" | "emailVerified"> {}

class OAuthAccount
  extends Model<OAuthAccountAttributes, OAuthAccountCreationAttributes>
  implements OAuthAccountAttributes
{
  declare id: string;
  declare userId: string;
  declare provider: "google" | "microsoft" | "apple";
  declare providerAccountId: string;
  declare email: string;
  declare emailVerified: boolean;
  declare readonly createdAt?: Date;
  declare readonly updatedAt?: Date;
}

OAuthAccount.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    provider: { type: DataTypes.ENUM("google", "microsoft", "apple"), allowNull: false },
    providerAccountId: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    tableName: "oauth_accounts",
    timestamps: true,
    sequelize,
    indexes: [{ unique: true, fields: ["provider", "providerAccountId"] }],
  },
);

export default OAuthAccount;
