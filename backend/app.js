const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// All approved frontend origins
const allowedOrigins = [
  "https://hybridmart-ecommerce.vercel.app",
  "https://hybrid-ecommerce.vercel.app",
  "https://hybrid-ecommerce-2zrc8scp0-kanavkrishan28-2246.vercel.app",
  "http://localhost:5173",
];

// CORS middleware — must run before API routes
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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

// Parse JSON request bodies
app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "hybrid-ecommerce-backend",
  });
});

// Application routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/admin/analytics", require("./routes/analytics"));

// Handle unknown endpoints
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found.",
  });
});

// Central error handler — keep this last
app.use(errorHandler);

module.exports = app;
