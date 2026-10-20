const app = require('./app');
const env = require('./config/env');
const { connectSql } = require('./config/db');
const { connectMongo } = require('./config/mongo');

async function start() {
  await connectSql();
  await connectMongo();
  app.listen(env.port, () => {
    console.log(`Express API listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
