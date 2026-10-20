const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function requiredInProduction(name, fallback) {
  const value = process.env[name] || fallback;
  if (process.env.NODE_ENV === 'production' && !process.env[name]) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: requiredInProduction('JWT_SECRET', 'dev-only-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  sqlDialect: (process.env.SQL_DIALECT || 'mysql').toLowerCase(),
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hybrid_ecommerce_store'
  },
  sqlitePath: process.env.SQLITE_PATH || path.join(__dirname, '..', 'data', 'store.sqlite'),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hybrid_ecommerce_store',
  analyticsUrl: process.env.ANALYTICS_URL || 'http://127.0.0.1:5001',
  analyticsTimeoutMs: Number(process.env.ANALYTICS_TIMEOUT_MS || 15000)
};
