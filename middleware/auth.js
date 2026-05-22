// ============================================================
//  middleware/auth.js — JWT Auth & Role Guards
//  DET Trades | Dark Empire Technologies
// ============================================================

const jwt = require("jsonwebtoken");
const config = require("../config");
const { getUserDoc } = require("../services/firebase");

// ── Verify JWT Token ──────────────────────────────────────
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.APP.JWT_SECRET);

    // Fetch fresh user data from Firestore
    const user = await getUserDoc(decoded.uid);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.banned) {
      return res.status(403).json({ success: false, message: "Account suspended. Contact support." });
    }

    req.user = user;
    req.uid = user.id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please login again." });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// ── Admin Only Guard ──────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }
  next();
}

// ── Subscription Guard ────────────────────────────────────
function requirePlan(...plans) {
  return (req, res, next) => {
    const userPlan = req.user?.subscription?.plan || "free";
    if (!plans.includes(userPlan)) {
      return res.status(403).json({
        success: false,
        message: `This feature requires: ${plans.join(" or ")} plan`,
        upgrade_required: true,
        current_plan: userPlan,
      });
    }
    next();
  };
}

// ── Optional Auth (for public+auth routes) ────────────────
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.APP.JWT_SECRET);
    const user = await getUserDoc(decoded.uid);
    req.user = user || null;
    req.uid = user?.id || null;
    next();
  } catch {
    req.user = null;
    next();
  }
}

module.exports = { verifyToken, requireAdmin, requirePlan, optionalAuth };
