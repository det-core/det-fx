// ============================================================
//  routes/signals.js — Signals, Notifications & Broadcasts
//  DET Trades | Dark Empire Technologies
// ============================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { db, Collections } = require("../services/firebase");

function getEffectivePlan(user) {
  const bonusActive = user.bonus_access?.active &&
    user.bonus_access?.expires_at &&
    new Date() < new Date(user.bonus_access.expires_at);
  return bonusActive ? user.bonus_access.plan_during_bonus : (user.subscription?.plan || "free");
}

// ════════════════════════════════════════════════════════════
//  SIGNALS
// ════════════════════════════════════════════════════════════

// ── GET /api/signals ──────────────────────────────────────
router.get("/", verifyToken, async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    const { limit = 20 } = req.query;

    let query = db.collection(Collections.SIGNALS)
      .where("active", "==", true)
      .orderBy("created_at", "desc")
      .limit(parseInt(limit));

    // Free and weekly users see teaser (no full analysis)
    const snap = await query.get();
    const signals = snap.docs.map(d => {
      const data = { id: d.id, ...d.data() };
      if (plan !== "monthly") {
        // Strip premium signal details
        delete data.tp2;
        delete data.tp3;
        delete data.reasoning;
        delete data.stop_loss_detail;
        data.locked = true;
      }
      return data;
    });

    return res.status(200).json({ success: true, signals, plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch signals" });
  }
});

// ── GET /api/signals/:id ──────────────────────────────────
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    const snap = await db.collection(Collections.SIGNALS).doc(req.params.id).get();

    if (!snap.exists) return res.status(404).json({ success: false, message: "Signal not found" });

    const data = { id: snap.id, ...snap.data() };
    if (plan !== "monthly" && req.user.role !== "admin") {
      delete data.tp2;
      delete data.tp3;
      delete data.reasoning;
      delete data.stop_loss_detail;
      data.locked = true;
    }

    return res.status(200).json({ success: true, signal: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch signal" });
  }
});

// ── POST /api/signals (admin) ─────────────────────────────
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      pair, bias, entry_zone, stop_loss, tp1, tp2, tp3,
      reasoning, confidence_score, market_session, note,
    } = req.body;

    if (!pair || !bias || !entry_zone || !stop_loss || !tp1) {
      return res.status(400).json({ success: false, message: "pair, bias, entry_zone, stop_loss and tp1 are required" });
    }

    const signal = {
      pair: pair.toUpperCase(),
      bias,
      entry_zone,
      stop_loss,
      tp1,
      tp2: tp2 || null,
      tp3: tp3 || null,
      reasoning: reasoning || null,
      confidence_score: confidence_score || null,
      market_session: market_session || null,
      note: note || null,
      active: true,
      outcome: null, // "win" | "loss" | "breakeven" — set later
      created_by: req.uid,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const docRef = await db.collection(Collections.SIGNALS).add(signal);

    // Push notification to monthly users
    await pushSignalNotification(pair, bias, docRef.id);

    return res.status(201).json({ success: true, signal_id: docRef.id, signal });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create signal" });
  }
});

// ── PATCH /api/signals/:id (admin) ───────────────────────
router.patch("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    delete updates.created_by;
    delete updates.created_at;

    await db.collection(Collections.SIGNALS).doc(req.params.id).update(updates);
    return res.status(200).json({ success: true, message: "Signal updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update signal" });
  }
});

// ── DELETE /api/signals/:id (admin) ──────────────────────
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    await db.collection(Collections.SIGNALS).doc(req.params.id).update({
      active: false,
      deleted_at: new Date().toISOString(),
    });
    return res.status(200).json({ success: true, message: "Signal removed" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to remove signal" });
  }
});

// ── PATCH /api/signals/:id/outcome (admin) ────────────────
router.patch("/:id/outcome", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { outcome } = req.body; // "win" | "loss" | "breakeven"
    if (!["win", "loss", "breakeven"].includes(outcome)) {
      return res.status(400).json({ success: false, message: "outcome must be win, loss or breakeven" });
    }
    await db.collection(Collections.SIGNALS).doc(req.params.id).update({
      outcome,
      outcome_set_at: new Date().toISOString(),
    });
    return res.status(200).json({ success: true, message: "Signal outcome updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update outcome" });
  }
});

// ════════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ════════════════════════════════════════════════════════════

// ── GET /api/signals/notifications/all ───────────────────
router.get("/notifications/all", verifyToken, async (req, res) => {
  try {
    const { limit = 30 } = req.query;
    const snap = await db.collection(Collections.NOTIFICATIONS)
      .where("uid", "==", req.uid)
      .orderBy("created_at", "desc")
      .limit(parseInt(limit))
      .get();

    const notifications = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const unread_count = notifications.filter(n => !n.read).length;

    return res.status(200).json({ success: true, notifications, unread_count });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// ── PATCH /api/signals/notifications/:id/read ────────────
router.patch("/notifications/:id/read", verifyToken, async (req, res) => {
  try {
    await db.collection(Collections.NOTIFICATIONS).doc(req.params.id).update({ read: true });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
});

// ── PATCH /api/signals/notifications/read-all ────────────
router.patch("/notifications/read-all", verifyToken, async (req, res) => {
  try {
    const snap = await db.collection(Collections.NOTIFICATIONS)
      .where("uid", "==", req.uid).where("read", "==", false).get();

    const batch = db.batch();
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();

    return res.status(200).json({ success: true, marked: snap.size });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to mark all as read" });
  }
});

// ════════════════════════════════════════════════════════════
//  BROADCASTS (Admin → Users)
// ════════════════════════════════════════════════════════════

// ── POST /api/signals/broadcast (admin) ──────────────────
router.post("/broadcast", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, message, target } = req.body; // target: "all" | "free" | "weekly" | "monthly"

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "title and message are required" });
    }

    const targetPlan = target || "all";

    // Save broadcast record
    const broadcastRef = await db.collection(Collections.BROADCASTS).add({
      title,
      message,
      target: targetPlan,
      sent_by: req.uid,
      created_at: new Date().toISOString(),
    });

    // Fetch target users
    let userQuery = db.collection(Collections.USERS).where("banned", "==", false);
    if (targetPlan !== "all") {
      userQuery = userQuery.where("subscription.plan", "==", targetPlan);
    }

    const usersSnap = await userQuery.get();
    const batch = db.batch();
    let count = 0;

    usersSnap.docs.forEach(userDoc => {
      const notifRef = db.collection(Collections.NOTIFICATIONS).doc();
      batch.set(notifRef, {
        uid: userDoc.id,
        type: "broadcast",
        title,
        message,
        broadcast_id: broadcastRef.id,
        read: false,
        created_at: new Date().toISOString(),
      });
      count++;

      // Batch in chunks of 400
      if (count % 400 === 0) {
        batch.commit();
      }
    });

    await batch.commit();

    return res.status(200).json({
      success: true,
      message: `Broadcast sent to ${count} users`,
      broadcast_id: broadcastRef.id,
      recipients: count,
    });
  } catch (err) {
    console.error("Broadcast error:", err);
    return res.status(500).json({ success: false, message: "Failed to send broadcast" });
  }
});

// ── GET /api/signals/broadcast/history (admin) ───────────
router.get("/broadcast/history", verifyToken, requireAdmin, async (req, res) => {
  try {
    const snap = await db.collection(Collections.BROADCASTS)
      .orderBy("created_at", "desc").limit(30).get();

    const broadcasts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, broadcasts });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch broadcasts" });
  }
});

// ── Helper: push signal notification to monthly users ─────
async function pushSignalNotification(pair, bias, signalId) {
  try {
    const snap = await db.collection(Collections.USERS)
      .where("subscription.plan", "==", "monthly")
      .where("banned", "==", false)
      .get();

    const batch = db.batch();
    snap.docs.forEach(doc => {
      const ref = db.collection(Collections.NOTIFICATIONS).doc();
      batch.set(ref, {
        uid: doc.id,
        type: "new_signal",
        title: `New Signal: ${pair.toUpperCase()} 📊`,
        message: `${bias} setup posted. Check the signal feed for full details.`,
        signal_id: signalId,
        read: false,
        created_at: new Date().toISOString(),
      });
    });

    await batch.commit();
  } catch (err) {
    console.error("Signal notification error:", err.message);
  }
}

module.exports = router;
// patch applied at bottom — no changes needed
