// ============================================================
//  routes/subscription.js — Paystack Subscription Routes
//  DET Trades | Dark Empire Technologies
// ============================================================

const express = require("express");
const router = express.Router();
const axios = require("axios");
const crypto = require("crypto");
const { verifyToken } = require("../middleware/auth");
const { db, Collections, getUserDoc, updateUserDoc, getPlanPricing } = require("../services/firebase");
const config = require("../config");

const PAYSTACK_BASE = "https://api.paystack.co";
const headers = {
  Authorization: `Bearer ${config.PAYSTACK.SECRET_KEY}`,
  "Content-Type": "application/json",
};

// ── GET /api/subscription/plans ───────────────────────────
router.get("/plans", async (req, res) => {
  try {
    // Fetch admin-set prices from Firestore (falls back to config defaults)
    const customPricing = await getPlanPricing();

    const plans = {
      free: {
        id: "free",
        name: "Free",
        price: 0,
        price_display: "₦0",
        features: [
          "3 analyses per day",
          "TP1 only",
          "Community chat",
          "Basic signals view",
        ],
        limits: "No history • No AI reasoning • No risk setup",
      },
      weekly: {
        id: "weekly",
        name: "Weekly",
        price: customPricing?.weekly?.price || config.PLANS.WEEKLY.price,
        price_display: `₦${((customPricing?.weekly?.price || config.PLANS.WEEKLY.price) / 100).toLocaleString()}`,
        paystack_plan_code: customPricing?.weekly?.paystack_plan_code || null,
        features: [
          "3 analyses per day (15 per week)",
          "TP1, TP2, TP3",
          "Full AI reasoning",
          "Risk & lot size calculator",
          "Analysis history",
          "Community chat",
        ],
      },
      monthly: {
        id: "monthly",
        name: "Monthly",
        price: customPricing?.monthly?.price || config.PLANS.MONTHLY.price,
        price_display: `₦${((customPricing?.monthly?.price || config.PLANS.MONTHLY.price) / 100).toLocaleString()}`,
        paystack_plan_code: customPricing?.monthly?.paystack_plan_code || null,
        features: [
          "Unlimited analyses",
          "TP1, TP2, TP3",
          "Full AI reasoning",
          "Risk & lot size calculator",
          "Analysis history",
          "Signal feed",
          "Priority admin support chat",
          "Community chat",
        ],
        badge: "Most Popular",
      },
    };

    return res.status(200).json({ success: true, plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
});

// ── POST /api/subscription/initialize ────────────────────
router.post("/initialize", verifyToken, async (req, res) => {
  try {
    const { plan, coupon_code } = req.body;
    const user = req.user;

    if (!["weekly", "monthly"].includes(plan)) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const customPricing = await getPlanPricing();
    let amount = plan === "weekly"
      ? (customPricing?.weekly?.price || config.PLANS.WEEKLY.price)
      : (customPricing?.monthly?.price || config.PLANS.MONTHLY.price);

    // Apply coupon if provided
    let couponData = null;
    if (coupon_code) {
      const couponResult = await validateCoupon(coupon_code, plan, amount);
      if (!couponResult.valid) {
        return res.status(400).json({ success: false, message: couponResult.reason });
      }
      amount = couponResult.final_amount;
      couponData = couponResult.coupon;
    }

    // Create or get Paystack customer
    let customerCode = user.subscription?.paystack_customer_code;
    if (!customerCode) {
      const customerRes = await axios.post(`${PAYSTACK_BASE}/customer`, {
        email: user.email,
        first_name: user.username,
        last_name: "DET Trades",
        metadata: { uid: user.id },
      }, { headers });
      customerCode = customerRes.data.data.customer_code;
      await updateUserDoc(user.id, { "subscription.paystack_customer_code": customerCode });
    }

    const planCode = plan === "weekly"
      ? customPricing?.weekly?.paystack_plan_code
      : customPricing?.monthly?.paystack_plan_code;

    // Initialize transaction
    const txRes = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: user.email,
      amount,
      plan: planCode || undefined,
      customer: customerCode,
      callback_url: `${config.APP.DOMAIN}/subscription/verify`,
      metadata: {
        uid: user.id,
        plan,
        coupon_code: coupon_code || null,
        custom_fields: [
          { display_name: "Plan", variable_name: "plan", value: plan },
          { display_name: "Username", variable_name: "username", value: user.username },
        ],
      },
    }, { headers });

    const { authorization_url, reference, access_code } = txRes.data.data;

    // Save pending transaction
    await db.collection(Collections.TRANSACTIONS).add({
      uid: user.id,
      reference,
      plan,
      amount,
      coupon_code: coupon_code || null,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      authorization_url,
      reference,
      access_code,
      amount,
      amount_display: `₦${(amount / 100).toLocaleString()}`,
      coupon_applied: !!couponData,
    });
  } catch (err) {
    console.error("Subscription init error:", err.response?.data || err.message);
    return res.status(500).json({ success: false, message: "Failed to initialize payment" });
  }
});

// ── GET /api/subscription/verify/:reference ───────────────
router.get("/verify/:reference", verifyToken, async (req, res) => {
  try {
    const { reference } = req.params;
    const verifyRes = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, { headers });
    const txData = verifyRes.data.data;

    if (txData.status !== "success") {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    const uid = txData.metadata?.uid;
    const plan = txData.metadata?.plan;

    if (uid !== req.uid) {
      return res.status(403).json({ success: false, message: "Transaction mismatch" });
    }

    await activateSubscription(uid, plan, reference, txData);

    return res.status(200).json({
      success: true,
      message: `${plan} subscription activated!`,
      plan,
    });
  } catch (err) {
    console.error("Verify error:", err.message);
    return res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// ── POST /api/subscription/webhook ───────────────────────
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  try {
    // Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", config.PAYSTACK.WEBHOOK_SECRET)
      .update(req.body)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(req.body);
    const { event: eventType, data } = event;

    switch (eventType) {
      case "charge.success":
        await handleChargeSuccess(data);
        break;
      case "subscription.disable":
        await handleSubscriptionDisabled(data);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(data);
        break;
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).send("Error");
  }
});

// ── GET /api/subscription/status ─────────────────────────
router.get("/status", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const bonusActive = user.bonus_access?.active &&
      user.bonus_access?.expires_at &&
      new Date() < new Date(user.bonus_access.expires_at);

    return res.status(200).json({
      success: true,
      subscription: user.subscription,
      bonus_access: user.bonus_access,
      effective_plan: bonusActive
        ? user.bonus_access.plan_during_bonus
        : (user.subscription?.plan || "free"),
      bonus_active: bonusActive,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch status" });
  }
});

// ── POST /api/subscription/cancel ────────────────────────
router.post("/cancel", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const subCode = user.subscription?.paystack_subscription_code;

    if (!subCode) {
      return res.status(400).json({ success: false, message: "No active subscription to cancel" });
    }

    await axios.post(`${PAYSTACK_BASE}/subscription/disable`, {
      code: subCode,
      token: user.subscription?.paystack_email_token,
    }, { headers });

    await db.collection(Collections.NOTIFICATIONS).add({
      uid: user.id,
      type: "subscription_cancelled",
      title: "Subscription Cancelled",
      message: "Your subscription has been cancelled. Access continues until the end of your billing period.",
      read: false,
      created_at: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: "Subscription cancelled" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to cancel subscription" });
  }
});

// ── Helpers ───────────────────────────────────────────────
async function activateSubscription(uid, plan, reference, txData) {
  const now = new Date();
  const expiresAt = plan === "weekly"
    ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await updateUserDoc(uid, {
    "subscription.plan": plan,
    "subscription.expires_at": expiresAt.toISOString(),
    "subscription.activated_at": now.toISOString(),
    "subscription.last_reference": reference,
    "subscription.paystack_subscription_code": txData.subscription?.subscription_code || null,
    "subscription.paystack_email_token": txData.subscription?.email_token || null,
  });

  // Update transaction
  const txSnap = await db.collection(Collections.TRANSACTIONS)
    .where("reference", "==", reference).limit(1).get();
  if (!txSnap.empty) {
    await txSnap.docs[0].ref.update({ status: "success", completed_at: now.toISOString() });
  }

  // Send notification
  await db.collection(Collections.NOTIFICATIONS).add({
    uid,
    type: "subscription_activated",
    title: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan Activated! 🎉`,
    message: `Your ${plan} subscription is now active. Enjoy premium trading analysis!`,
    read: false,
    created_at: now.toISOString(),
  });
}

async function handleChargeSuccess(data) {
  const uid = data.metadata?.uid;
  const plan = data.metadata?.plan;
  if (!uid || !plan) return;
  await activateSubscription(uid, plan, data.reference, data);
}

async function handleSubscriptionDisabled(data) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  const snap = await db.collection(Collections.USERS)
    .where("subscription.paystack_customer_code", "==", customerCode).limit(1).get();
  if (snap.empty) return;

  const uid = snap.docs[0].id;
  await updateUserDoc(uid, { "subscription.plan": "free", "subscription.expires_at": null });

  await db.collection(Collections.NOTIFICATIONS).add({
    uid,
    type: "subscription_expired",
    title: "Subscription Ended",
    message: "Your subscription has ended. Upgrade to continue enjoying premium features.",
    read: false,
    created_at: new Date().toISOString(),
  });
}

async function handlePaymentFailed(data) {
  const customerCode = data.customer?.customer_code;
  if (!customerCode) return;

  const snap = await db.collection(Collections.USERS)
    .where("subscription.paystack_customer_code", "==", customerCode).limit(1).get();
  if (snap.empty) return;

  const uid = snap.docs[0].id;
  await db.collection(Collections.NOTIFICATIONS).add({
    uid,
    type: "payment_failed",
    title: "Payment Failed ⚠️",
    message: "Your subscription renewal payment failed. Please update your payment method.",
    read: false,
    created_at: new Date().toISOString(),
  });
}

async function validateCoupon(code, plan, amount) {
  const snap = await db.collection(Collections.COUPONS)
    .where("code", "==", code.toUpperCase()).limit(1).get();

  if (snap.empty) return { valid: false, reason: "Invalid coupon code" };

  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };

  if (!coupon.active) return { valid: false, reason: "Coupon is no longer active" };
  if (coupon.expires_at && new Date() > new Date(coupon.expires_at)) {
    return { valid: false, reason: "Coupon has expired" };
  }
  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }
  if (coupon.plan && coupon.plan !== plan) {
    return { valid: false, reason: `Coupon only valid for ${coupon.plan} plan` };
  }

  let finalAmount = amount;
  if (coupon.discount_type === "percent") {
    finalAmount = Math.round(amount * (1 - coupon.discount_value / 100));
  } else {
    finalAmount = Math.max(0, amount - coupon.discount_value);
  }

  // Increment usage
  await snap.docs[0].ref.update({ usage_count: (coupon.usage_count || 0) + 1 });

  return { valid: true, final_amount: finalAmount, coupon };
}

module.exports = router;
