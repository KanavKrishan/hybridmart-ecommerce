const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function requiredInProduction(name, fallback) {
  const value = process.env[name] || fallback;
  if (isProduction && !process.env[name]) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function csv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function bool(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv,
  isProduction,
  jwtSecret: requiredInProduction('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',

  // Comma-separated list of allowed browser origins (your Vercel URL(s)).
  frontendOrigins: csv(process.env.FRONTEND_ORIGIN || 'http://localhost:5173'),
  // Also accept Vercel preview deployments (https://<anything>.vercel.app).
  allowVercelPreviews: bool(process.env.ALLOW_VERCEL_PREVIEWS, false),

  // ---- SQL (MySQL preferred, SQLite for local development only) ----
  sqlDialect: (process.env.SQL_DIALECT || 'mysql').toLowerCase(),
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hybrid_ecommerce_store',
    // "auto" = TLS for remote hosts (Aiven, PlanetScale, ...), off for localhost.
    ssl: (process.env.MYSQL_SSL || 'auto').toLowerCase(),
    caPath: process.env.MYSQL_CA_PATH || ''
  },
  sqlitePath: process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'store.sqlite'),

  // ---- MongoDB (carts, wishlists, reviews) ----
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hybrid_ecommerce_store',
  mongoDbName: process.env.MONGO_DB_NAME || '',

  // ---- Python analytics service ----
  analyticsUrl: (process.env.ANALYTICS_URL || 'http://127.0.0.1:5001').replace(/\/+$/, ''),
  // Free Render instances sleep; the first request can take ~50s to wake them.
  analyticsTimeoutMs: Number(process.env.ANALYTICS_TIMEOUT_MS || 60000),
  analyticsApiKey: process.env.ANALYTICS_API_KEY || '',

  // Seed demo users/products on boot if the users table is empty.
  seedOnStart: bool(process.env.SEED_ON_START, false)
};
