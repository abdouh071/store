// backend/index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from ../public
app.use(express.static(path.join(__dirname, "..", "public")));

// --- Session setup ---
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change_this_secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // true only if you use HTTPS
  })
);

// --- MongoDB connection ---
if (!process.env.MONGO_URI) {
  console.error("❌ CRITICAL: MONGO_URI is not defined in environment variables!");
} else {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}

// --- API routes ---
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/settings", require("./routes/settings"));

// ===================================================
// ⭐⭐⭐ DZAYER API PROXY (Fixes ALL CORS problems) ⭐⭐⭐
// ===================================================

const DZ_BASE = "https://algeria-apis.vercel.app/api/v1";

// Health Check for MongoDB
app.get("/api/health", async (req, res) => {
  const status = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const labels = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    mongodb: labels[status] || "unknown",
    env_mongo_uri: process.env.MONGO_URI ? "Defined" : "MISSING",
    vercel_env: process.env.VERCEL ? "Yes" : "No"
  });
});

// Get all wilayas from local JSON
app.get("/api/wilayas", (req, res) => {
  try {
    const wilayas = require("./wil.json");
    res.json(wilayas);
  } catch (err) {
    console.error("Error loading wilayas:", err);
    res.status(500).json({ error: "Failed to load wilayas" });
  }
});

// Get communes by wilaya ID (from local JSON)
app.get("/api/wilayas/:code/communes", (req, res) => {
  try {
    const wilayas = require("./wil.json");
    const wilaya = wilayas.find((w) => w.wilayaCode == req.params.code);

    if (!wilaya) {
      return res.status(404).json({ error: "Wilaya not found" });
    }

    res.json(wilaya.communes);
  } catch (err) {
    console.error("Error loading communes:", err);
    res.status(500).json({ error: "Failed to load communes" });
  }
});

// --- Authentication helper ---
function isAuthenticated(req, res, next) {
  if (req.session && req.session.admin) return next();
  return res.redirect("/login.html");
}

// --- Serve pages ---
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "login.html"));
});

app.get("/admin.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

// Simple logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// Fallback 404
app.use((req, res, next) => {
  if (req.method === "GET") {
    return res.status(404).send("Not Found");
  }
  next();
});

// Start server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

module.exports = app;
