const mongoose = require('mongoose');
const env = require('./env');

const MAX_ATTEMPTS = 3;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectMongo() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set('strictQuery', true);

  const options = {
    serverSelectionTimeoutMS: 15000,
    maxPoolSize: 10
  };
  // Atlas URIs often omit the database name; pin it explicitly when provided.
  if (env.mongoDbName) options.dbName = env.mongoDbName;

  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, options);
      console.log('MongoDB: connected to database', mongoose.connection.name);
      return mongoose.connection;
    } catch (err) {
      lastError = err;
      console.error(`MongoDB: connection attempt ${attempt}/${MAX_ATTEMPTS} failed:`, err.message);
      if (attempt < MAX_ATTEMPTS) await wait(2000 * attempt);
    }
  }
  throw lastError;
}

async function disconnectMongo() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
}

function mongoStatus() {
  // 0 disconnected, 1 connected, 2 connecting, 3 disconnecting
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

module.exports = { connectMongo, disconnectMongo, mongoStatus };
