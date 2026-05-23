// ============================================================
//  server.js — DET Trades API Server
//  Dark Empire Technologies | fx.darkempiretech.eu.cc
//  Port: 4010
// ============================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");

const config = require("./config");
const { checkIPBlocked } = require("./middleware/ipGuard");
const { startAllJobs } = require("./jobs/cron");

// ── Route imports ─────────────────────────────────────────
const authRoutes = require("./routes/auth");
const analysisRoutes = require("./routes/analysis");
const subscriptionRoutes = require("./routes/subscription");
const chatRoutes = require("./routes/chat");
const signalsRoutes = require("./routes/signals");
const adminRoutes = require("./routes/admin");

const app = express();

// ── Trust proxy (for Nginx) ───────────────────────────────
app.set("trust proxy", 1);

// ── Security headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow images to be served cross-origin
}));

// ── CORS ──────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.CORS.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────
if (config.APP.ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ── Body parsers ──────────────────────────────────────────
// Note: Paystack webhook needs raw body — handled in subscription route
app.use((req, res, next) => {
  if (req.originalUrl === "/api/subscription/webhook") {
    next();
  } else {
    express.json({ limit: "5mb" })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── Static file serving (VPS uploads) ────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  maxAge: "7d",
  etag: true,
}));

// ── Global rate limiting ──────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: config.SECURITY.RATE_LIMIT_WINDOW_MS,
  max: config.SECURITY.RATE_LIMIT_MAX_GENERAL,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please slow down." },
});
app.use("/api", globalLimiter);

// ── Auth rate limiting ────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: config.SECURITY.RATE_LIMIT_WINDOW_MS,
  max: config.SECURITY.RATE_LIMIT_MAX_AUTH,
  message: { success: false, message: "Too many auth attempts. Try again in 15 minutes." },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── Analysis rate limiting ────────────────────────────────
const analysisLimiter = rateLimit({
  windowMs: config.SECURITY.RATE_LIMIT_WINDOW_MS,
  max: config.SECURITY.RATE_LIMIT_MAX_ANALYSIS,
  message: { success: false, message: "Too many analysis requests. Slow down." },
});
app.use("/api/analysis/analyze", analysisLimiter);

// ── IP Block check (global) ───────────────────────────────
app.use("/api", checkIPBlocked);

// ── Health check ──────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    app: config.APP.NAME,
    brand: config.APP.BRAND,
    domain: config.APP.DOMAIN,
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/signals", signalsRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global error handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err.message);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({ success: false, message: err.message });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File too large" });
  }

  return res.status(500).json({
    success: false,
    message: config.APP.ENV === "development" ? err.message : "Internal server error",
  });
});

// ── Start server ──────────────────────────────────────────
app.listen(config.APP.PORT, () => {
  console.log("╔════════════════════════════════════════════╗");
  console.log("║        DET TRADES API — ONLINE             ║");
  console.log("║     Dark Empire Technologies               ║");
  console.log(`║     Port: ${config.APP.PORT}                          ║`);
  console.log(`║     Domain: ${config.APP.DOMAIN}  ║`);
  console.log("╚════════════════════════════════════════════╝");

  // Start background jobs
  startAllJobs();
});

module.exports = app;
