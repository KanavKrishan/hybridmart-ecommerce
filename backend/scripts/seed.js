const { connectSql } = require("../config/db");
const { connectMongo, disconnectMongo } = require("../config/mongo");
const { seedDemoData } = require("../services/seedService");

async function main() {
  await connectSql();
  await connectMongo();
  await seedDemoData();
  await disconnectMongo();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
