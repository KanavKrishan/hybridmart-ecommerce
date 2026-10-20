const bcrypt = require("bcrypt");
const { getSql } = require("../config/db");
const { signToken } = require("../middleware/auth");
const { httpError } = require("../middleware/errorHandler");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return {
    id: Number(row.id),
    name: row.name,
    email: row.email,
    role: row.role,
  };
}

async function register(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (name.length < 2) {
      throw httpError(400, "Name must be at least 2 characters.");
    }

    if (!EMAIL_RE.test(email)) {
      throw httpError(400, "Enter a valid email address.");
    }

    if (password.length < 6) {
      throw httpError(400, "Password must be at least 6 characters.");
    }

    const sql = getSql();

    const existing = await sql.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existing.length) {
      throw httpError(409, "An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await sql.execute(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, "customer"],
    );

    const user = {
      id: result.insertId,
      name,
      email,
      role: "customer",
    };

    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      throw httpError(400, "Email and password are required.");
    }

    if (!EMAIL_RE.test(email)) {
      throw httpError(400, "Enter a valid email address.");
    }

    const sql = getSql();

    const rows = await sql.query(
      "SELECT id, name, email, password_hash, role FROM users WHERE email = ?",
      [email],
    );

    const row = rows[0];

    if (!row || !row.password_hash) {
      throw httpError(401, "Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(password, row.password_hash);

    if (!passwordMatches) {
      throw httpError(401, "Invalid email or password.");
    }

    const user = publicUser(row);
    const token = signToken(user);

    return res.json({ token, user });
  } catch (err) {
    return next(err);
  }
}

async function me(req, res, next) {
  try {
    const sql = getSql();

    const rows = await sql.query(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [req.user.id],
    );

    if (!rows[0]) {
      throw httpError(404, "User not found.");
    }

    return res.json({
      user: publicUser(rows[0]),
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  me,
};
