const app = require("./app");
const env = require("./config/env");
const { connectSql } = require("./config/db");
const { connectMongo, disconnectMongo } = require("./config/mongo");

async function start() {
  // Both databases must be reachable before we accept traffic.
  await connectSql();
  await connectMongo();

  if (env.seedOnStart) {
    const { seedDemoData, usersExist } = require("./services/seedService");
    if (await usersExist()) {
      console.log("Seed: users already exist, skipping demo seed.");
    } else {
      console.log("Seed: empty database detected, loading demo data.");
      await seedDemoData();
    }
  }

  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`Express API listening on port ${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down.`);
    server.close(async () => {
      await disconnectMongo().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
