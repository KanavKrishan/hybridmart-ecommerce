const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { sqlStatus } = require("./config/db");
const { mongoStatus } = require("./config/mongo");
const { errorHandler, httpError } = require("./middleware/errorHandler");

const app = express();

// Render (and most hosts) terminate TLS in front of the app.
app.set("trust proxy", 1);

const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

function isAllowedOrigin(origin) {
  if (!origin) return true; // curl, server-to-server, health checks
  if (env.frontendOrigins.includes(origin.replace(/\/+$/, ""))) return true;
  if (env.allowVercelPreviews && VERCEL_PREVIEW.test(origin)) return true;
  return false;
}

// CORS must run before API routes. Origins come from FRONTEND_ORIGIN.
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) return callback(null, true);
      console.error(`CORS blocked origin: ${origin}`);
      return callback(httpError(403, "Origin not allowed by CORS."));
    },
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  }),
);

app.use(express.json({ limit: "100kb" }));

// Liveness probe for Render: no database calls, always fast.
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "hybrid-ecommerce-backend" });
});

// Readiness probe: shows whether both databases are reachable.
app.get("/api/health/db", async (req, res) => {
  const sql = await sqlStatus();
  const mongo = mongoStatus();
  const ok = sql.status === "connected" && mongo === "connected";
  res.status(ok ? 200 : 503).json({ ok, sql, mongo: { status: mongo } });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin/analytics", require("./routes/analytics"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

// Central error handler — keep this last.
app.use(errorHandler);

module.exports = app;
