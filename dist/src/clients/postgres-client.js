import "dotenv/config";
import { Sequelize } from "sequelize";
const sequelize = new Sequelize(process.env.PG_DATABASE, process.env.PG_USER, process.env.PG_PASSWORD, {
    host: process.env.PG_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || "5432", 10),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    dialectOptions: process.env.PG_SSL === "true"
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
export default sequelize;
//# sourceMappingURL=postgres-client.js.map