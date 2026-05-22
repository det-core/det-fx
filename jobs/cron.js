// ============================================================
//  jobs/cron.js — Background Jobs
//  DET Trades | Dark Empire Technologies
// ============================================================

const cron = require("node-cron");
const fs = require("fs");
const path = require("path");
const { db, Collections } = require("../services/firebase");
const config = require("../config");

// ── Job 1: Reset daily analysis counts (midnight) ─────────
function scheduleDailyReset() {
  cron.schedule("0 0 * * *", async () => {
    console.log("🔄 [CRON] Resetting daily analysis counts...");
    try {
      const today = new Date().toDateString();
      const snap = await db.collection(Collections.USERS).get();
      const batch = db.batch();
      let count = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.analyses_date !== today) {
          batch.update(doc.ref, {
            analyses_today: 0,
            analyses_date: today,
            chat_images_today: 0,
            chat_images_date: today,
          });
          count++;
        }
      });

      await batch.commit();
      console.log(`✅ [CRON] Reset ${count} users' daily counts`);
    } catch (err) {
      console.error("❌ [CRON] Daily reset failed:", err.message);
    }
  }, { timezone: "Africa/Lagos" });
}

// ── Job 2: Expire subscriptions (every hour) ──────────────
function scheduleSubscriptionExpiry() {
  cron.schedule("0 * * * *", async () => {
    console.log("🔄 [CRON] Checking subscription expiries...");
    try {
      const now = new Date().toISOString();
      const snap = await db.collection(Collections.USERS)
        .where("subscription.plan", "!=", "free").get();

      const batch = db.batch();
      let expired = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        const expiresAt = data.subscription?.expires_at;
        const manuallySet = data.subscription?.manually_set;

        if (expiresAt && !manuallySet && expiresAt < now) {
          batch.update(doc.ref, {
            "subscription.plan": "free",
            "subscription.expired_at": now,
          });
          expired++;

          // Schedule expiry notification (can't await in forEach)
          db.collection(Collections.NOTIFICATIONS).add({
            uid: doc.id,
            type: "subscription_expired",
            title: "Subscription Expired",
            message: "Your subscription has expired. Upgrade to regain premium access.",
            read: false,
            created_at: now,
          }).catch(() => {});
        }
      });

      if (expired > 0) {
        await batch.commit();
        console.log(`✅ [CRON] Expired ${expired} subscriptions`);
      }
    } catch (err) {
      console.error("❌ [CRON] Subscription expiry failed:", err.message);
    }
  });
}

// ── Job 3: Expire bonus access (every 30 min) ─────────────
function scheduleBonusAccessExpiry() {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const now = new Date().toISOString();
      const snap = await db.collection(Collections.USERS)
        .where("bonus_access.active", "==", true).get();

      const batch = db.batch();
      let expired = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.bonus_access?.expires_at && data.bonus_access.expires_at < now) {
          batch.update(doc.ref, {
            "bonus_access.active": false,
          });
          expired++;
        }
      });

      if (expired > 0) {
        await batch.commit();
        console.log(`✅ [CRON] Expired ${expired} bonus accesses`);
      }
    } catch (err) {
      console.error("❌ [CRON] Bonus expiry failed:", err.message);
    }
  });
}

// ── Job 4: Cleanup old chat images (daily at 3AM) ─────────
function scheduleImageCleanup() {
  cron.schedule("0 3 * * *", () => {
    console.log("🔄 [CRON] Cleaning up old chat images...");
    try {
      const chatDir = config.UPLOADS.CHAT_IMAGES_PATH;
      const retentionMs = config.UPLOADS.CHAT_IMAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (!fs.existsSync(chatDir)) return;

      const files = fs.readdirSync(chatDir);
      let deleted = 0;

      files.forEach(file => {
        const filePath = path.join(chatDir, file);
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtimeMs > retentionMs) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      });

      console.log(`✅ [CRON] Deleted ${deleted} old chat images`);
    } catch (err) {
      console.error("❌ [CRON] Image cleanup failed:", err.message);
    }
  }, { timezone: "Africa/Lagos" });
}

// ── Job 5: Cleanup old analysis images (daily at 4AM) ─────
function scheduleAnalysisImageCleanup() {
  cron.schedule("0 4 * * *", () => {
    console.log("🔄 [CRON] Cleaning up old analysis images...");
    try {
      const analysisDir = config.UPLOADS.ANALYSIS_IMAGES_PATH;
      const retentionMs = config.UPLOADS.ANALYSIS_IMAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

      if (!fs.existsSync(analysisDir)) return;

      const files = fs.readdirSync(analysisDir);
      let deleted = 0;

      files.forEach(file => {
        const filePath = path.join(analysisDir, file);
        const stat = fs.statSync(filePath);
        if (Date.now() - stat.mtimeMs > retentionMs) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      });

      console.log(`✅ [CRON] Deleted ${deleted} old analysis images`);
    } catch (err) {
      console.error("❌ [CRON] Analysis image cleanup failed:", err.message);
    }
  }, { timezone: "Africa/Lagos" });
}

// ── Job 6: Subscription expiry warning (daily at noon) ────
function scheduleExpiryWarnings() {
  cron.schedule("0 12 * * *", async () => {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() + 3);
      const warnISO = warningDate.toISOString();
      const now = new Date().toISOString();

      const snap = await db.collection(Collections.USERS)
        .where("subscription.plan", "!=", "free").get();

      const batch = db.batch();
      let warned = 0;

      snap.docs.forEach(doc => {
        const data = doc.data();
        const expiresAt = data.subscription?.expires_at;
        if (expiresAt && expiresAt > now && expiresAt < warnISO && !data.subscription?.warned_3days) {
          const notifRef = db.collection(Collections.NOTIFICATIONS).doc();
          batch.set(notifRef, {
            uid: doc.id,
            type: "subscription_expiring",
            title: "Subscription Expiring Soon ⚠️",
            message: "Your subscription expires in 3 days. Renew to keep uninterrupted access.",
            read: false,
            created_at: now,
          });
          batch.update(doc.ref, { "subscription.warned_3days": true });
          warned++;
        }
      });

      if (warned > 0) {
        await batch.commit();
        console.log(`✅ [CRON] Sent ${warned} expiry warnings`);
      }
    } catch (err) {
      console.error("❌ [CRON] Expiry warnings failed:", err.message);
    }
  }, { timezone: "Africa/Lagos" });
}

// ── Start all jobs ────────────────────────────────────────
function startAllJobs() {
  scheduleDailyReset();
  scheduleSubscriptionExpiry();
  scheduleBonusAccessExpiry();
  scheduleImageCleanup();
  scheduleAnalysisImageCleanup();
  scheduleExpiryWarnings();
  console.log("✅ All cron jobs started");
}

module.exports = { startAllJobs };
