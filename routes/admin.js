// ============================================================
//  routes/admin.js — Admin Panel Routes
//  DET Trades | Dark Empire Technologies
// ============================================================

const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/auth");
const { db, auth, Collections, updateUserDoc } = require("../services/firebase");
const config = require("../config");

// All admin routes require auth + admin role
router.use(verifyToken, requireAdmin);

// ════════════════════════════════════════════════════════════
//  DASHBOARD OVERVIEW
// ════════════════════════════════════════════════════════════

router.get("/overview", async (req, res) => {
  try {
    const [usersSnap, analysesSnap, signalsSnap, flaggedSnap, broadcastsSnap] = await Promise.all([
      db.collection(Collections.USERS).get(),
      db.collection(Collections.ANALYSES).get(),
      db.collection(Collections.SIGNALS).where("active", "==", true).get(),
      db.collection(Collections.FLAGGED_IPS).where("status", "!=", "clean").get(),
      db.collection(Collections.BROADCASTS).orderBy("created_at", "desc").limit(1).get(),
    ]);

    const users = usersSnap.docs.map(d => d.data());
    const planCounts = { free: 0, weekly: 0, monthly: 0 };
    users.forEach(u => {
      const plan = u.subscription?.plan || "free";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    });

    // Today's signups
    const today = new Date().toDateString();
    const newToday = users.filter(u => new Date(u.created_at).toDateString() === today).length;

    // Support threads with unread
    const supportSnap = await db.collection("support_chat_meta")
      .orderBy("last_at", "desc").limit(20).get();

    return res.status(200).json({
      success: true,
      overview: {
        total_users: usersSnap.size,
        new_today: newToday,
        plan_counts: planCounts,
        total_analyses: analysesSnap.size,
        active_signals: signalsSnap.size,
        flagged_ips: flaggedSnap.size,
        last_broadcast: broadcastsSnap.empty ? null : broadcastsSnap.docs[0].data(),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch overview" });
  }
});

// ════════════════════════════════════════════════════════════
//  USER MANAGEMENT
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/users ──────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { plan, search, limit = 50, banned } = req.query;
    let query = db.collection(Collections.USERS).orderBy("created_at", "desc").limit(parseInt(limit));

    if (plan) query = query.where("subscription.plan", "==", plan);
    if (banned === "true") query = query.where("banned", "==", true);

    const snap = await query.get();
    let users = snap.docs.map(d => ({
      id: d.id,
      uid: d.id,
      email: d.data().email,
      username: d.data().username,
      role: d.data().role,
      plan: d.data().subscription?.plan || "free",
      banned: d.data().banned,
      is_vpn: d.data().is_vpn,
      chat_banned: d.data().chat_banned,
      created_at: d.data().created_at,
      last_login: d.data().last_login,
      referral_count: d.data().referral?.referral_count || 0,
      analyses_today: d.data().analyses_today || 0,
    }));

    // Search filter (in-memory)
    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, users, count: users.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
});

// ── GET /api/admin/users/:uid ─────────────────────────────
router.get("/users/:uid", async (req, res) => {
  try {
    const snap = await db.collection(Collections.USERS).doc(req.params.uid).get();
    if (!snap.exists) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, user: { id: snap.id, ...snap.data() } });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch user" });
  }
});

// ── PATCH /api/admin/users/:uid/ban ──────────────────────
router.patch("/users/:uid/ban", async (req, res) => {
  try {
    const { reason } = req.body;
    await updateUserDoc(req.params.uid, {
      banned: true,
      ban_reason: reason || "Violation of terms",
      banned_at: new Date().toISOString(),
      banned_by: req.uid,
    });
    await auth.updateUser(req.params.uid, { disabled: true });
    return res.status(200).json({ success: true, message: "User banned" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to ban user" });
  }
});

// ── PATCH /api/admin/users/:uid/unban ────────────────────
router.patch("/users/:uid/unban", async (req, res) => {
  try {
    await updateUserDoc(req.params.uid, {
      banned: false,
      ban_reason: null,
      unbanned_at: new Date().toISOString(),
    });
    await auth.updateUser(req.params.uid, { disabled: false });
    return res.status(200).json({ success: true, message: "User unbanned" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to unban user" });
  }
});

// ── PATCH /api/admin/users/:uid/plan ─────────────────────
router.patch("/users/:uid/plan", async (req, res) => {
  try {
    const { plan, expires_at } = req.body;
    if (!["free", "weekly", "monthly"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    await updateUserDoc(req.params.uid, {
      "subscription.plan": plan,
      "subscription.expires_at": expires_at || null,
      "subscription.manually_set": true,
      "subscription.set_by": req.uid,
      "subscription.set_at": new Date().toISOString(),
    });

    await db.collection(Collections.NOTIFICATIONS).add({
      uid: req.params.uid,
      type: "plan_updated",
      title: "Plan Updated by Admin",
      message: `Your account has been upgraded to ${plan} plan.`,
      read: false,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: `User plan set to ${plan}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update plan" });
  }
});

// ── PATCH /api/admin/users/:uid/role ─────────────────────
router.patch("/users/:uid/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin", "moderator"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    await updateUserDoc(req.params.uid, { role });
    return res.status(200).json({ success: true, message: `User role set to ${role}` });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update role" });
  }
});

// ════════════════════════════════════════════════════════════
//  PRICING CRUD
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/pricing ────────────────────────────────
router.get("/pricing", async (req, res) => {
  try {
    const snap = await db.collection(Collections.APP_SETTINGS).doc("plans").get();
    const pricing = snap.exists ? snap.data() : {
      weekly: { price: config.PLANS.WEEKLY.price, paystack_plan_code: null },
      monthly: { price: config.PLANS.MONTHLY.price, paystack_plan_code: null },
    };
    return res.status(200).json({ success: true, pricing });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch pricing" });
  }
});

// ── PUT /api/admin/pricing ────────────────────────────────
router.put("/pricing", async (req, res) => {
  try {
    const { weekly, monthly } = req.body;
    const updates = {};

    if (weekly) {
      updates["weekly.price"] = parseInt(weekly.price);
      if (weekly.paystack_plan_code) updates["weekly.paystack_plan_code"] = weekly.paystack_plan_code;
    }
    if (monthly) {
      updates["monthly.price"] = parseInt(monthly.price);
      if (monthly.paystack_plan_code) updates["monthly.paystack_plan_code"] = monthly.paystack_plan_code;
    }

    updates.updated_at = new Date().toISOString();
    updates.updated_by = req.uid;

    await db.collection(Collections.APP_SETTINGS).doc("plans").set(updates, { merge: true });
    return res.status(200).json({ success: true, message: "Pricing updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update pricing" });
  }
});

// ════════════════════════════════════════════════════════════
//  COUPON CRUD
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/coupons ────────────────────────────────
router.get("/coupons", async (req, res) => {
  try {
    const snap = await db.collection(Collections.COUPONS)
      .orderBy("created_at", "desc").limit(50).get();
    const coupons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, coupons });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch coupons" });
  }
});

// ── POST /api/admin/coupons ───────────────────────────────
router.post("/coupons", async (req, res) => {
  try {
    const { code, discount_type, discount_value, plan, usage_limit, expires_at } = req.body;

    if (!code || !discount_type || discount_value === undefined) {
      return res.status(400).json({ success: false, message: "code, discount_type and discount_value required" });
    }
    if (!["percent", "fixed"].includes(discount_type)) {
      return res.status(400).json({ success: false, message: "discount_type must be percent or fixed" });
    }

    // Check code uniqueness
    const existing = await db.collection(Collections.COUPONS)
      .where("code", "==", code.toUpperCase()).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ success: false, message: "Coupon code already exists" });
    }

    const coupon = {
      code: code.toUpperCase(),
      discount_type,
      discount_value: parseFloat(discount_value),
      plan: plan || null, // null = all plans
      usage_limit: usage_limit ? parseInt(usage_limit) : null,
      usage_count: 0,
      expires_at: expires_at || null,
      active: true,
      created_by: req.uid,
      created_at: new Date().toISOString(),
    };

    const docRef = await db.collection(Collections.COUPONS).add(coupon);
    return res.status(201).json({ success: true, coupon_id: docRef.id, coupon });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to create coupon" });
  }
});

// ── PATCH /api/admin/coupons/:id ─────────────────────────
router.patch("/coupons/:id", async (req, res) => {
  try {
    const allowed = ["active", "discount_value", "usage_limit", "expires_at", "plan"];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();

    await db.collection(Collections.COUPONS).doc(req.params.id).update(updates);
    return res.status(200).json({ success: true, message: "Coupon updated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update coupon" });
  }
});

// ── DELETE /api/admin/coupons/:id ────────────────────────
router.delete("/coupons/:id", async (req, res) => {
  try {
    await db.collection(Collections.COUPONS).doc(req.params.id).delete();
    return res.status(200).json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
});

// ════════════════════════════════════════════════════════════
//  APP SETTINGS (Logo, Images via URL)
// ════════════════════════════════════════════════════════════

// ── GET /api/admin/settings ───────────────────────────────
router.get("/settings", async (req, res) => {
  try {
    const snap = await db.collection(Collections.APP_SETTINGS).doc("general").get();
    return res.status(200).json({ success: true, settings: snap.exists ? snap.data() : {} });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch settings" });
  }
});

// ── PUT /api/admin/settings ───────────────────────────────
router.put("/settings", async (req, res) => {
  try {
    const allowed = [
      "app_logo_url", "app_favicon_url", "hero_image_url",
      "signal_bg_url", "promo_banner_url", "maintenance_mode",
      "referral_enabled", "app_name", "tagline",
    ];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    updates.updated_at = new Date().toISOString();
    updates.updated_by = req.uid;

    await db.collection(Collections.APP_SETTINGS).doc("general").set(updates, { merge: true });
    return res.status(200).json({ success: true, message: "Settings updated", settings: updates });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update settings" });
  }
});

// ════════════════════════════════════════════════════════════
//  FLAGGED IPs
// ════════════════════════════════════════════════════════════

router.get("/flagged-ips", async (req, res) => {
  try {
    const snap = await db.collection(Collections.FLAGGED_IPS)
      .where("status", "!=", "clean").orderBy("status").orderBy("count", "desc").limit(50).get();
    const ips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, ips });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch flagged IPs" });
  }
});

router.patch("/flagged-ips/:ip/unblock", async (req, res) => {
  try {
    await db.collection(Collections.FLAGGED_IPS).doc(req.params.ip).update({
      status: "clean",
      unblocked_at: new Date().toISOString(),
      unblocked_by: req.uid,
    });
    return res.status(200).json({ success: true, message: "IP unblocked" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to unblock IP" });
  }
});

router.patch("/flagged-ips/:ip/block", async (req, res) => {
  try {
    await db.collection(Collections.FLAGGED_IPS).doc(req.params.ip).update({
      status: "blocked",
      blocked_at: new Date().toISOString(),
      blocked_by: req.uid,
    });
    return res.status(200).json({ success: true, message: "IP blocked" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to block IP" });
  }
});

// ════════════════════════════════════════════════════════════
//  ANALYTICS
// ════════════════════════════════════════════════════════════

router.get("/analytics", async (req, res) => {
  try {
    const [usersSnap, analysesSnap, transactionsSnap] = await Promise.all([
      db.collection(Collections.USERS).get(),
      db.collection(Collections.ANALYSES).orderBy("created_at", "desc").limit(500).get(),
      db.collection(Collections.TRANSACTIONS).where("status", "==", "success").get(),
    ]);

    // Pair popularity
    const pairCounts = {};
    analysesSnap.docs.forEach(d => {
      const pair = d.data().pair;
      pairCounts[pair] = (pairCounts[pair] || 0) + 1;
    });
    const topPairs = Object.entries(pairCounts)
      .map(([pair, count]) => ({ pair, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Revenue (in kobo → naira)
    let totalRevenue = 0;
    transactionsSnap.docs.forEach(d => { totalRevenue += d.data().amount || 0; });

    // User growth by day (last 14 days)
    const usersData = usersSnap.docs.map(d => d.data().created_at);
    const growth = getLast14Days(usersData);

    return res.status(200).json({
      success: true,
      analytics: {
        top_pairs: topPairs,
        total_revenue_naira: totalRevenue / 100,
        total_transactions: transactionsSnap.size,
        user_growth_14d: growth,
        total_analyses: analysesSnap.size,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch analytics" });
  }
});

function getLast14Days(timestamps) {
  const days = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[d.toDateString()] = 0;
  }
  timestamps.forEach(ts => {
    const key = new Date(ts).toDateString();
    if (days[key] !== undefined) days[key]++;
  });
  return Object.entries(days).map(([date, count]) => ({ date, count }));
}

module.exports = router;
