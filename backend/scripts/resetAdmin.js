const bcrypt = require("bcrypt");
const { connectSql, getSql } = require("../config/db");

const ADMIN_EMAIL = "admin@hybridstore.test";
const ADMIN_PASSWORD = "Admin@123";

async function resetAdmin() {
  try {
    // Connect to the configured SQL database.
    await connectSql();

    const sql = getSql();

    if (sql.kind !== "mysql") {
      throw new Error(
        "Connected to SQLite instead of MySQL. Check your backend/.env configuration.",
      );
    }

    // Generate a valid bcrypt password hash.
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Check whether the admin already exists.
    const rows = await sql.query(
      "SELECT id FROM users WHERE LOWER(email) = ?",
      [ADMIN_EMAIL],
    );

    if (rows.length > 0) {
      // Reset the existing admin's password and role.
      await sql.execute(
        "UPDATE users SET password_hash = ?, role = ? WHERE id = ?",
        [passwordHash, "admin", rows[0].id],
      );

      console.log("Admin account password reset successfully.");
    } else {
      // Create the admin if the account does not exist.
      await sql.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ["Store Admin", ADMIN_EMAIL, passwordHash, "admin"],
      );

      console.log("Admin account created successfully.");
    }

    // Verify the new hash before finishing.
    const verifyRows = await sql.query(
      "SELECT password_hash, role FROM users WHERE LOWER(email) = ?",
      [ADMIN_EMAIL],
    );

    const valid =
      verifyRows.length > 0 &&
      (await bcrypt.compare(ADMIN_PASSWORD, verifyRows[0].password_hash));

    if (!valid) {
      throw new Error("Password verification failed after saving.");
    }

    console.log("Password verification successful.");
    console.log("Email:", ADMIN_EMAIL);
    console.log("Password: Admin@123");
    console.log("Role:", verifyRows[0].role);
  } catch (error) {
    console.error("Admin reset failed:", error.message);
    process.exitCode = 1;
  }
}

resetAdmin();
