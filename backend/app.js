const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// Stable production domains and local development.
const allowedOrigins = [
  "https://hybridmart-ecommerce.vercel.app",
  "https://hybrid-ecommerce.vercel.app",
  "http://localhost:5173",
];

// Validate incoming browser origins.
function isAllowedOrigin(origin) {
  if (!origin) return true;

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);

    // Permit deployment URLs for this specific Vercel project/team.
    return (
      url.protocol === "https:" &&
      /^hybridmart-ecommerce(?:-[a-z0-9-]+)?-kanavkrishan28-2246\.vercel\.app$/i.test(
        url.hostname,
      )
    );
  } catch {
    return false;
  }
}

// CORS must run before the API routes.
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);
      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse JSON request bodies.
app.use(express.json({ limit: "100kb" }));

// Backend health check.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "hybrid-ecommerce-backend",
  });
});

// Application API routes.
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin/analytics", require("./routes/analytics"));

// Handle unknown routes.
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// Centralized error handler — keep last.
app.use(errorHandler);

module.exports = app;
