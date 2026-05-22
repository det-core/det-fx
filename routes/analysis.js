// ============================================================
//  routes/analysis.js — Chart Analysis Routes
//  DET Trades | Dark Empire Technologies
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { verifyToken } = require("../middleware/auth");
const { db, Collections, getUserDoc, updateUserDoc } = require("../services/firebase");
const { analyzeChart } = require("../services/aiAnalysis");
const { getRealIP, logAnalysisRequest } = require("../middleware/ipGuard");
const config = require("../config");

// ── Multer setup for analysis images ─────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = config.UPLOADS.ANALYSIS_IMAGES_PATH;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.UPLOADS.MAX_ANALYSIS_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (config.UPLOADS.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed"));
    }
  },
});

// ── Check & update daily/weekly analysis limits ───────────
async function checkAndUpdateLimits(user) {
  const plan = getEffectivePlan(user);
  const planConfig = config.PLANS[plan.toUpperCase()];
  const today = new Date().toDateString();
  const weekStart = getWeekStart();

  let { analyses_today = 0, analyses_this_week = 0, analyses_date, analyses_week_start } = user;

  // Reset daily count
  if (analyses_date !== today) {
    analyses_today = 0;
    analyses_date = today;
  }

  // Reset weekly count
  if (analyses_week_start !== weekStart) {
    analyses_this_week = 0;
    analyses_week_start = weekStart;
  }

  // Check limits
  if (planConfig.analyses_per_day !== null && analyses_today >= planConfig.analyses_per_day) {
    return { allowed: false, reason: `Daily limit of ${planConfig.analyses_per_day} analyses reached. Resets tomorrow.` };
  }

  if (planConfig.analyses_per_week !== null && analyses_this_week >= planConfig.analyses_per_week) {
    return { allowed: false, reason: `Weekly limit of ${planConfig.analyses_per_week} analyses reached.` };
  }

  // Update counts
  await updateUserDoc(user.id, {
    analyses_today: analyses_today + 1,
    analyses_this_week: analyses_this_week + 1,
    analyses_date: today,
    analyses_week_start: weekStart,
  });

  return {
    allowed: true,
    analyses_today: analyses_today + 1,
    analyses_this_week: analyses_this_week + 1,
  };
}

// ── POST /api/analysis/analyze ────────────────────────────
router.post("/analyze", verifyToken, upload.fields([
  { name: "chart_4h", maxCount: 1 },
  { name: "chart_15m", maxCount: 1 },
]), async (req, res) => {
  const uploadedFiles = [];

  try {
    const { pair, account_balance, risk_percent } = req.body;
    const ip = getRealIP(req);
    const user = req.user;

    if (!pair) {
      return res.status(400).json({ success: false, message: "Forex pair is required (e.g. GBPUSD)" });
    }

    if (!req.files?.chart_4h || !req.files?.chart_15m) {
      return res.status(400).json({ success: false, message: "Both 4H and 15M chart images are required" });
    }

    const image4hPath = req.files.chart_4h[0].path;
    const image15mPath = req.files.chart_15m[0].path;
    uploadedFiles.push(image4hPath, image15mPath);

    // Check analysis limits
    const limitCheck = await checkAndUpdateLimits(user);
    if (!limitCheck.allowed) {
      cleanupFiles(uploadedFiles);
      return res.status(429).json({ success: false, message: limitCheck.reason, upgrade_required: true });
    }

    const effectivePlan = getEffectivePlan(user);

    // Run AI analysis
    const analysis = await analyzeChart({
      pair: pair.trim().toUpperCase(),
      image4hPath,
      image15mPath,
      accountBalance: account_balance ? parseFloat(account_balance) : null,
      riskPercent: risk_percent ? parseFloat(risk_percent) : null,
      plan: effectivePlan,
    });

    // Strip premium fields for free users
    if (effectivePlan === "free") {
      delete analysis.tp2;
      delete analysis.tp3;
      delete analysis.reasoning;
      if (analysis.stop_loss) {
        delete analysis.stop_loss.lot_size;
        delete analysis.stop_loss.risk_amount;
      }
    }

    // Save to history (only for paid plans)
    let analysisId = null;
    if (effectivePlan !== "free") {
      const docRef = await db.collection(Collections.ANALYSES).add({
        uid: user.id,
        pair: pair.trim().toUpperCase(),
        plan: effectivePlan,
        analysis,
        image_4h: image4hPath,
        image_15m: image15mPath,
        created_at: new Date().toISOString(),
      });
      analysisId = docRef.id;
    }

    // Log for abuse tracking
    await logAnalysisRequest(user.id, ip, req.headers["user-agent"]);

    return res.status(200).json({
      success: true,
      analysis_id: analysisId,
      analysis,
      plan: effectivePlan,
      limits: {
        analyses_today: limitCheck.analyses_today,
        analyses_this_week: limitCheck.analyses_this_week,
      },
    });
  } catch (err) {
    cleanupFiles(uploadedFiles);
    console.error("Analysis error:", err.message);
    return res.status(500).json({ success: false, message: err.message || "Analysis failed. Try again." });
  }
});

// ── GET /api/analysis/history ─────────────────────────────
router.get("/history", verifyToken, async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    if (plan === "free") {
      return res.status(403).json({
        success: false,
        message: "Analysis history requires Weekly or Monthly plan",
        upgrade_required: true,
      });
    }

    const { limit = 20, pair } = req.query;
    let query = db.collection(Collections.ANALYSES)
      .where("uid", "==", req.uid)
      .orderBy("created_at", "desc")
      .limit(parseInt(limit));

    if (pair) query = query.where("pair", "==", pair.toUpperCase());

    const snap = await query.get();
    const analyses = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return res.status(200).json({ success: true, analyses, count: analyses.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch history" });
  }
});

// ── GET /api/analysis/:id ─────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection(Collections.ANALYSES).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "Analysis not found" });

    const data = snap.data();
    if (data.uid !== req.uid && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    return res.status(200).json({ success: true, analysis: { id: snap.id, ...data } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch analysis" });
  }
});

// ── GET /api/analysis/stats/pairs ────────────────────────
router.get("/stats/pairs", verifyToken, async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    if (plan === "free") {
      return res.status(403).json({ success: false, message: "Upgrade to view pair stats", upgrade_required: true });
    }

    const snap = await db.collection(Collections.ANALYSES)
      .where("uid", "==", req.uid).get();

    const pairCounts = {};
    snap.docs.forEach(d => {
      const pair = d.data().pair;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    });

    const sorted = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count);

    return res.status(200).json({ success: true, pairs: sorted, total_analyses: snap.size });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
});

// ── Helpers ───────────────────────────────────────────────
function getEffectivePlan(user) {
  const bonusActive = user.bonus_access?.active &&
    user.bonus_access?.expires_at &&
    new Date() < new Date(user.bonus_access.expires_at);
  return bonusActive ? user.bonus_access.plan_during_bonus : (user.subscription?.plan || "free");
}

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.toDateString();
}

function cleanupFiles(files) {
  files.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
}

module.exports = router;
