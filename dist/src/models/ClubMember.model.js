import { DataTypes, Model } from "sequelize";
import sequelize from "../clients/postgres-client.js";
class ClubMember extends Model {
}
ClubMember.init({
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    clubId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM("owner", "manager", "member"),
        allowNull: false,
        defaultValue: "member",
    },
}, {
    tableName: "club_members",
    timestamps: true,
    sequelize,
});
export default ClubMember;
//# sourceMappingURL=ClubMember.model.js.map