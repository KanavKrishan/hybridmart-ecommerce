
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

const isProduction = process.env.NODE_ENV === "production";
const isRender = Boolean(process.env.RENDER);

let sequelize;

async function connectMySQL() {
  const required = [
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE",
  ];

  const missing = required.filter(
    (key) => !process.env[key]
  );

  if (missing.length) {
    throw new Error(
      `Missing MySQL environment variables: ${missing.join(", ")}`
    );
  }

  const caPath = path.resolve(
    __dirname,
    "../certs/ca.pem"
  );

  if (!fs.existsSync(caPath)) {
    throw new Error(
      `Aiven CA certificate not found at ${caPath}`
    );
  }

  const ca = fs.readFileSync(caPath, "utf8");

  if (!ca.includes("-----BEGIN CERTIFICATE-----")) {
    throw new Error("Aiven CA file is not valid PEM text");
  }

  const config = {
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: {
      ca,
      rejectUnauthorized: true,
    },
    connectTimeout: 15000,
  };

  const connection = await mysql.createConnection(config);

  try {
    const [rows] = await connection.query(
      "SELECT VERSION() AS version, DATABASE() AS db"
    );

    console.log(
      `MySQL connected: database=${rows[0].db}, version=${rows[0].version}`
    );
  } finally {
    await connection.end();
  }

  sequelize = new Sequelize(
    process.env.MYSQL_DATABASE,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASSWORD,
    {
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT),
      dialect: "mysql",
      dialectOptions: {
        ssl: {
          ca,
          rejectUnauthorized: true,
        },
      },
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );

  await sequelize.authenticate();

  console.log("SQL: MySQL connection verified");

  return sequelize;
}

async function connectDatabase() {
  try {
    return await connectMySQL();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);

    // Never silently fall back to a different database in production.
    if (isProduction || isRender) {
      throw error;
    }

    // In local development, let your existing development
    // database configuration handle SQLite if needed.
    throw error;
  }
}

module.exports = {
  connectDatabase,
  get sequelize() {
    return sequelize;
  },
};
