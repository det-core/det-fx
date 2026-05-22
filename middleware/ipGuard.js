// ============================================================
//  middleware/ipGuard.js — IP Fraud & Abuse Prevention
//  DET Trades | Dark Empire Technologies
// ============================================================

const axios = require("axios");
const { db, Collections } = require("../services/firebase");
const config = require("../config");

// ── Get Real IP (behind Nginx proxy) ─────────────────────
function getRealIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

// ── Check if IP is blocked ────────────────────────────────
async function checkIPBlocked(req, res, next) {
  const ip = getRealIP(req);
  req.clientIP = ip;

  try {
    const snap = await db.collection(Collections.FLAGGED_IPS).doc(ip).get();
    if (snap.exists) {
      const data = snap.data();
      if (data.status === "blocked") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Contact support if you believe this is an error.",
        });
      }
    }
    next();
  } catch (err) {
    // Don't block on DB error — fail open
    next();
  }
}

// ── Log registration IP + check for multi-account fraud ──
async function logRegistrationIP(ip, uid) {
  try {
    const ref = db.collection(Collections.FLAGGED_IPS).doc(ip);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        ip,
        accounts: [uid],
        count: 1,
        status: "clean",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return { flagged: false };
    }

    const data = snap.data();
    const accounts = [...new Set([...(data.accounts || []), uid])];
    const count = accounts.length;

    let status = data.status;
    if (count >= config.SECURITY.IP_BLOCK_THRESHOLD) {
      status = "blocked";
    } else if (count >= config.SECURITY.IP_FLAG_THRESHOLD) {
      status = "flagged";
    }

    await ref.update({
      accounts,
      count,
      status,
      updated_at: new Date().toISOString(),
    });

    return { flagged: status !== "clean", blocked: status === "blocked", count };
  } catch (err) {
    console.error("IP log error:", err.message);
    return { flagged: false };
  }
}

// ── Detect VPN/Proxy via ip-api.com (free tier) ───────────
async function detectVPN(ip) {
  try {
    if (ip === "127.0.0.1" || ip === "::1" || ip === "unknown") return false;
    const res = await axios.get(`${config.SECURITY.VPN_DETECTION_API}/${ip}?fields=proxy,hosting,query`, {
      timeout: 3000,
    });
    return res.data?.proxy === true || res.data?.hosting === true;
  } catch {
    return false; // fail open — don't block if API is down
  }
}

// ── Log analysis request for abuse tracking ───────────────
async function logAnalysisRequest(uid, ip, userAgent) {
  try {
    const ref = db.collection("analysis_logs").doc();
    await ref.set({
      uid,
      ip,
      user_agent: userAgent,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Analysis log error:", err.message);
  }
}

// ── Check referral fraud (same IP self-referral) ──────────
async function checkReferralFraud(referrerUID, referredIP) {
  try {
    const snap = await db.collection(Collections.FLAGGED_IPS).doc(referredIP).get();
    if (!snap.exists) return false;
    const data = snap.data();
    return data.accounts?.includes(referrerUID);
  } catch {
    return false;
  }
}

module.exports = {
  getRealIP,
  checkIPBlocked,
  logRegistrationIP,
  detectVPN,
  logAnalysisRequest,
  checkReferralFraud,
};
