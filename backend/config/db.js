const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const env = require("./env");

let sql = null;

function mysqlAdapter(pool) {
  return {
    kind: "mysql",

    async query(text, params = []) {
      const [rows] = await pool.execute(text, params);
      return rows;
    },

    async execute(text, params = []) {
      const [result] = await pool.execute(text, params);
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows,
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
              affectedRows: result.affectedRows,
            };
          },
        };

        const output = await work(tx);
        await conn.commit();
        return output;
      } catch (err) {
        try {
          await conn.rollback();
        } catch (rollbackError) {
          console.error(
            "SQL: transaction rollback failed:",
            rollbackError.message,
          );
        }

        throw err;
      } finally {
        conn.release();
      }
    },
  };
}

function sqliteRun(db, text, params = []) {
  return new Promise((resolve, reject) => {
    db.run(text, params, function onRun(err) {
      if (err) return reject(err);

      resolve({
        insertId: this.lastID,
        affectedRows: this.changes,
      });
    });
  });
}

function sqliteAll(db, text, params = []) {
  return new Promise((resolve, reject) => {
    db.all(text, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function sqliteAdapter(db) {
  return {
    kind: "sqlite",

    query(text, params = []) {
      return sqliteAll(db, text, params);
    },

    execute(text, params = []) {
      return sqliteRun(db, text, params);
    },

    async withTransaction(work) {
      await sqliteRun(db, "BEGIN IMMEDIATE");

      const tx = {
        query(text, params = []) {
          return sqliteAll(db, text, params);
        },

        execute(text, params = []) {
          return sqliteRun(db, text, params);
        },
      };

      try {
        const output = await work(tx);
        await sqliteRun(db, "COMMIT");
        return output;
      } catch (err) {
        await sqliteRun(db, "ROLLBACK");
        throw err;
      }
    },
  };
}

const DB_DIR = path.join(__dirname, "..", "database");

// Remove "-- comment" lines, then split into individual statements.
function readStatements(file) {
  const raw = fs.readFileSync(file, "utf8");
  const withoutComments = raw
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n");

  return withoutComments
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function resolveMysqlSsl() {
  const { host, ssl, caPath } = env.mysql;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(host);
  const enabled = ssl === "auto" ? !isLocal : ["1", "true", "yes", "on", "required"].includes(ssl);

  if (!enabled) return undefined;

  const options = { rejectUnauthorized: true };
  const file = caPath
    ? path.resolve(caPath)
    : path.join(__dirname, "..", "certs", "ca.pem");

  if (fs.existsSync(file)) {
    options.ca = fs.readFileSync(file, "utf8");
  } else {
    console.warn("SQL: CA certificate not found at", file, "- using Node's default trusted certificates.");
  }
  return options;
}

async function tryMysql() {
  const { host, port, user, password, database } = env.mysql;

  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 15000,
    enableKeepAlive: true,
    namedPlaceholders: false,
    ssl: resolveMysqlSsl()
  });

  try {
    await pool.query("SELECT 1");

    for (const statement of readStatements(path.join(DB_DIR, "schema.sql"))) {
      if (/^(CREATE DATABASE|USE)\b/i.test(statement)) continue;

      try {
        await pool.query(statement);
      } catch (err) {
        // Re-running CREATE INDEX on an existing index is expected on every boot.
        if (err.code !== "ER_DUP_KEYNAME" && !/already exists|Duplicate key name/i.test(err.message)) {
          throw err;
        }
      }
    }

    console.log("SQL: connected to MySQL database", database, "on", host);
    return mysqlAdapter(pool);
  } catch (err) {
    await pool.end().catch(() => {});
    throw err;
  }
}

async function openSqlite() {
  const sqlite3 = require("sqlite3").verbose();

  const file = path.isAbsolute(env.sqlitePath)
    ? env.sqlitePath
    : path.join(__dirname, "..", env.sqlitePath.replace(/^\.\/|^\//, ""));

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const db = new sqlite3.Database(file);

  await sqliteRun(db, "PRAGMA foreign_keys = ON");

  for (const statement of readStatements(path.join(DB_DIR, "schema.sqlite.sql"))) {
    await sqliteRun(db, statement);
  }

  console.log("SQL: using SQLite at", file);
  return sqliteAdapter(db);
}

async function connectSql() {
  if (sql) return sql;

  if (env.sqlDialect !== "sqlite") {
    try {
      sql = await tryMysql();
      return sql;
    } catch (err) {
      console.error("SQL: MySQL connection failed:", err.message);

      // Never silently switch to an empty local file in production:
      // the API and analytics services would end up on different data.
      if (env.isProduction) throw err;

      console.warn("SQL: falling back to SQLite for local development.");
    }
  }

  sql = await openSqlite();
  return sql;
}

function getSql() {
  if (!sql) {
    throw new Error("SQL database is not connected yet");
  }

  return sql;
}

async function sqlStatus() {
  if (!sql) return { status: "disconnected" };
  try {
    await sql.query("SELECT 1 AS ok");
    return { status: "connected", kind: sql.kind };
  } catch (err) {
    return { status: "error", kind: sql.kind };
  }
}

module.exports = {
  connectSql,
  getSql,
  sqlStatus
};
