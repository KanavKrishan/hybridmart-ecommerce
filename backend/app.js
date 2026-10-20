const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

const allowedOrigins = [
  "https://hybrid-ecommerce.vercel.app",
  "https://hybrid-ecommerce-2zrc8scp0-kanavkrishan28-2246.vercel.app",
  "http://localhost:5173",
];

// CORS must run before the API routes.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`CORS blocked origin: ${origin}`);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "hybrid-ecommerce-backend",
  });
});

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin/analytics", require("./routes/analytics"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// Central error handler
app.use(errorHandler);

module.exports = app;
