const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const env = require('./env');

let sql = null;

function mysqlAdapter(pool) {
  return {
    kind: 'mysql',
    async query(text, params = []) {
      const [rows] = await pool.execute(text, params);
      return rows;
    },
    async execute(text, params = []) {
      const [result] = await pool.execute(text, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    },
    async withTransaction(work) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const tx = {
          async query(text, params = []) {
            const [rows] = await conn.execute(text, params);
            return rows;
          },
          async execute(text, params = []) {
            const [result] = await conn.execute(text, params);
            return {
              insertId: result.insertId,
              affectedRows: result.affectedRows
            };
          }
        };
        const output = await work(tx);
        await conn.commit();
        return output;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }
  };
}

function sqliteRun(db, text, params = []) {
  return new Promise((resolve, reject) => {
    db.run(text, params, function onRun(err) {
      if (err) reject(err);
      else resolve({ insertId: this.lastID, affectedRows: this.changes });
    });
  });
}

function sqliteAll(db, text, params = []) {
  return new Promise((resolve, reject) => {
    db.all(text, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

function sqliteAdapter(db) {
  return {
    kind: 'sqlite',
    query(text, params = []) {
      return sqliteAll(db, text, params);
    },
    execute(text, params = []) {
      return sqliteRun(db, text, params);
    },
    async withTransaction(work) {
      await sqliteRun(db, 'BEGIN IMMEDIATE');
      const tx = {
        query(text, params = []) {
          return sqliteAll(db, text, params);
        },
        execute(text, params = []) {
          return sqliteRun(db, text, params);
        }
      };
      try {
        const output = await work(tx);
        await sqliteRun(db, 'COMMIT');
        return output;
      } catch (err) {
        await sqliteRun(db, 'ROLLBACK');
        throw err;
      }
    }
  };
}

async function tryMysql() {
  const { host, port, user, password, database } = env.mysql;
  const bootstrap = await mysql.createConnection({ host, port, user, password });
  await bootstrap.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await bootstrap.end();

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: false
  });
  await pool.query('SELECT 1');

  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const statements = raw
    .split(';')
    .map((s) => s.trim())
    .filter(
      (s) =>
        s &&
        !s.startsWith('--') &&
        !/^CREATE DATABASE/i.test(s) &&
        !/^USE /i.test(s)
    );

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (!/already exists|Duplicate/i.test(err.message)) throw err;
    }
  }

  return mysqlAdapter(pool);
}

async function openSqlite() {
  const file = path.isAbsolute(env.sqlitePath)
    ? env.sqlitePath
    : path.join(__dirname, '..', env.sqlitePath.replace(/^\.\//, ''));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new sqlite3.Database(file);
  await sqliteRun(db, 'PRAGMA foreign_keys = ON');
  const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sqlite.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const statements = raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sqliteRun(db, statement);
  }
  return sqliteAdapter(db);
}

async function connectSql() {
  if (sql) return sql;

  const preferMysql = env.sqlDialect !== 'sqlite';
  if (preferMysql) {
    try {
      sql = await tryMysql();
      console.log('SQL: connected to MySQL database', env.mysql.database);
      return sql;
    } catch (err) {
      console.warn('SQL: MySQL not available (' + err.message + '). Falling back to SQLite.');
    }
  }

  sql = await openSqlite();
  console.log('SQL: using SQLite at', env.sqlitePath);
  return sql;
}

function getSql() {
  if (!sql) throw new Error('SQL database is not connected yet');
  return sql;
}

module.exports = { connectSql, getSql };
