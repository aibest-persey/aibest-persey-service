import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.PG_DATABASE || "aibest_persey",
  process.env.PG_USER || "postgres",
  process.env.PG_PASSWORD || "postgres",
  {
    host: process.env.PG_HOST || "localhost",
    port: parseInt(process.env.PG_PORT || "5432", 10),
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
);

export default sequelize;