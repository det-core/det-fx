const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");
const { db, auth, Collections, getUserDoc, updateUserDoc } = require("../services/firebase");
const { verifyToken } = require("../middleware/auth");
const { getRealIP, logRegistrationIP, detectVPN } = require("../middleware/ipGuard");

function generateToken(uid, role, remember = false) {
  const expiresIn = remember ? config.APP.JWT_REMEMBER_EXPIRES_IN : config.APP.JWT_EXPIRES_IN;
  return jwt.sign({ uid, role }, config.APP.JWT_SECRET, { expiresIn });
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, username, referral_code } = req.body;
    const ip = getRealIP(req);
    if (!email || !password || !username) return res.status(400).json({ success: false, message: "Email, password and username are required" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    const usernameSnap = await db.collection(Collections.USERS).where("username_lower", "==", username.toLowerCase()).limit(1).get();
    if (!usernameSnap.empty) return res.status(400).json({ success: false, message: "Username already taken" });
    let firebaseUser;
    try {
      firebaseUser = await auth.getUserByEmail(email);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        try { firebaseUser = await auth.createUser({ email, password, displayName: username }); }
        catch (createErr) {
          if (createErr.code === "auth/email-already-exists") return res.status(400).json({ success: false, message: "Email already registered" });
          throw createErr;
        }
      } else throw err;
    }
    const uid = firebaseUser.uid;
    const existingDoc = await getUserDoc(uid);
    if (existingDoc) {
      const token = generateToken(uid, existingDoc.role || "user", false);
      return res.status(200).json({ success: true, message: "Account already exists", token, user: { uid, email: existingDoc.email, username: existingDoc.username, role: existingDoc.role, subscription: existingDoc.subscription, referral_code: existingDoc.referral?.my_code } });
    }
    const referralCode = uuidv4().slice(0, 8).toUpperCase();
    const isVPN = await detectVPN(ip);
    const userData = {
      uid, email, username, username_lower: username.toLowerCase(), role: "user",
      subscription: { plan: "free", expires_at: null, paystack_customer_code: null, paystack_subscription_code: null },
      referral: { my_code: referralCode, referred_by: null, referral_count: 0, total_bonus_hours: 0, milestones_claimed: [] },
      bonus_access: { active: false, expires_at: null, plan_during_bonus: null },
      analyses_today: 0, analyses_this_week: 0, analyses_date: new Date().toDateString(), analyses_week_start: getWeekStart(),
      ip_registered: ip, is_vpn: isVPN, banned: false, ban_reason: null, chat_banned: false,
      chat_images_today: 0, chat_images_date: new Date().toDateString(), avatar_url: null,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    await db.collection(Collections.USERS).doc(uid).set(userData);
    const ipResult = await logRegistrationIP(ip, uid);
    if (ipResult.blocked) {
      await auth.deleteUser(uid);
      await db.collection(Collections.USERS).doc(uid).delete();
      return res.status(403).json({ success: false, message: "Registration blocked. Contact support." });
    }
    if (referral_code) await processReferral(uid, referral_code, ip);
    await db.collection(Collections.NOTIFICATIONS).add({ uid, type: "welcome", title: "Welcome to DET Trades 🚀", message: `Welcome ${username}! Start by uploading your first chart for AI analysis.`, read: false, created_at: new Date().toISOString() });
    const token = generateToken(uid, "user", false);
    return res.status(201).json({ success: true, message: "Account created successfully", token, user: { uid, email, username, role: "user", subscription: userData.subscription, referral_code: referralCode } });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ success: false, message: "Registration failed. Try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, firebase_id_token, remember } = req.body;
    const ip = getRealIP(req);
    if (!firebase_id_token) return res.status(400).json({ success: false, message: "Firebase ID token required" });
    let decodedToken;
    try { decodedToken = await auth.verifyIdToken(firebase_id_token); }
    catch (err) { return res.status(401).json({ success: false, message: "Invalid session. Please try again." }); }
    const uid = decodedToken.uid;
    let user = await getUserDoc(uid);
    if (!user) {
      const fbUser = await auth.getUser(uid);
      const referralCode = uuidv4().slice(0, 8).toUpperCase();
      const newUserData = {
        uid, email: fbUser.email, username: fbUser.displayName || fbUser.email.split("@")[0],
        username_lower: (fbUser.displayName || fbUser.email.split("@")[0]).toLowerCase(), role: "user",
        subscription: { plan: "free", expires_at: null, paystack_customer_code: null, paystack_subscription_code: null },
        referral: { my_code: referralCode, referred_by: null, referral_count: 0, total_bonus_hours: 0, milestones_claimed: [] },
        bonus_access: { active: false, expires_at: null, plan_during_bonus: null },
        analyses_today: 0, analyses_this_week: 0, analyses_date: new Date().toDateString(), analyses_week_start: getWeekStart(),
        ip_registered: ip, is_vpn: false, banned: false, ban_reason: null, chat_banned: false,
        chat_images_today: 0, chat_images_date: new Date().toDateString(), avatar_url: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      };
      await db.collection(Collections.USERS).doc(uid).set(newUserData);
      const token = generateToken(uid, "user", remember === true);
      return res.status(200).json({ success: true, message: "Login successful", token, user: { uid, email: fbUser.email, username: newUserData.username, role: "user", subscription: newUserData.subscription, referral_code: referralCode } });
    }
    if (user.banned) return res.status(403).json({ success: false, message: `Account suspended: ${user.ban_reason || "Contact support"}` });
    const ipSnap = await db.collection(Collections.FLAGGED_IPS).doc(ip).get();
    if (ipSnap.exists && ipSnap.data().status === "blocked") return res.status(403).json({ success: false, message: "Access denied from this network." });
    const bonusActive = checkBonusActive(user);
    const effectivePlan = bonusActive ? user.bonus_access.plan_during_bonus : user.subscription.plan;
    const token = generateToken(uid, user.role, remember === true);
    await updateUserDoc(uid, { last_login: new Date().toISOString(), last_ip: ip });
    return res.status(200).json({ success: true, message: "Login successful", token, user: { uid, email: user.email, username: user.username, role: user.role, avatar_url: user.avatar_url, subscription: user.subscription, effective_plan: effectivePlan, bonus_active: bonusActive, bonus_expires_at: bonusActive ? user.bonus_access.expires_at : null, referral_code: user.referral?.my_code } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, message: "Login failed. Try again." });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const bonusActive = checkBonusActive(user);
    const effectivePlan = bonusActive ? user.bonus_access.plan_during_bonus : user.subscription?.plan || "free";
    return res.status(200).json({ success: true, user: { uid: user.id, email: user.email, username: user.username, role: user.role, avatar_url: user.avatar_url, subscription: user.subscription, effective_plan: effectivePlan, bonus_active: bonusActive, bonus_expires_at: bonusActive ? user.bonus_access.expires_at : null, referral: user.referral, analyses_today: user.analyses_today, analyses_this_week: user.analyses_this_week, created_at: user.created_at } });
  } catch (err) { return res.status(500).json({ success: false, message: "Failed to fetch profile" }); }
});

router.post("/logout", verifyToken, async (req, res) => {
  try { await auth.revokeRefreshTokens(req.uid); } catch {}
  return res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    await auth.updateUser(req.uid, { password: new_password });
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) { return res.status(500).json({ success: false, message: "Failed to update password" }); }
});

router.post("/update-profile", verifyToken, async (req, res) => {
  try {
    const { username, avatar_url } = req.body;
    const updates = { updated_at: new Date().toISOString() };
    if (username) {
      const snap = await db.collection(Collections.USERS).where("username_lower", "==", username.toLowerCase()).limit(1).get();
      if (snap.docs.some(d => d.id !== req.uid)) return res.status(400).json({ success: false, message: "Username already taken" });
      updates.username = username;
      updates.username_lower = username.toLowerCase();
    }
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    await updateUserDoc(req.uid, updates);
    return res.status(200).json({ success: true, message: "Profile updated" });
  } catch (err) { return res.status(500).json({ success: false, message: "Failed to update profile" }); }
});

function getWeekStart() { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toDateString(); }
function checkBonusActive(user) {
  if (!user.bonus_access?.active || !user.bonus_access?.expires_at) return false;
  return new Date() < new Date(user.bonus_access.expires_at);
}
async function processReferral(newUID, referralCode, referredIP) {
  try {
    const snap = await db.collection(Collections.USERS).where("referral.my_code", "==", referralCode).limit(1).get();
    if (snap.empty) return;
    const referrerDoc = snap.docs[0];
    const referrerUID = referrerDoc.id;
    const referrerData = referrerDoc.data();
    if (config.REFERRAL.SELF_REFERRAL_BLOCK) {
      const ipSnap = await db.collection(Collections.FLAGGED_IPS).doc(referredIP).get();
      if (ipSnap.exists && ipSnap.data().accounts?.includes(referrerUID)) return;
    }
    await updateUserDoc(newUID, { "referral.referred_by": referrerUID });
    const newCount = (referrerData.referral?.referral_count || 0) + 1;
    const bonusHours = config.REFERRAL.REWARD_HOURS;
    const now = new Date();
    const currentExpiry = referrerData.bonus_access?.expires_at ? new Date(referrerData.bonus_access.expires_at) : now;
    const baseTime = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseTime.getTime() + bonusHours * 60 * 60 * 1000);
    const milestonesClaimed = referrerData.referral?.milestones_claimed || [];
    let bonusPlan = "weekly";
    if (newCount >= 10 && !milestonesClaimed.includes("10_refs")) { milestonesClaimed.push("10_refs"); bonusPlan = "monthly"; }
    else if (newCount >= 3 && !milestonesClaimed.includes("3_refs")) { milestonesClaimed.push("3_refs"); }
    await updateUserDoc(referrerUID, { "referral.referral_count": newCount, "referral.total_bonus_hours": (referrerData.referral?.total_bonus_hours || 0) + bonusHours, "referral.milestones_claimed": milestonesClaimed, "bonus_access.active": true, "bonus_access.expires_at": newExpiry.toISOString(), "bonus_access.plan_during_bonus": bonusPlan });
    await db.collection(Collections.REFERRALS).add({ referrer_uid: referrerUID, referred_uid: newUID, bonus_hours: bonusHours, created_at: new Date().toISOString() });
    await db.collection(Collections.NOTIFICATIONS).add({ uid: referrerUID, type: "referral_reward", title: "Referral Reward! 🎉", message: `Someone signed up with your referral link. You earned ${bonusHours} hours of premium access!`, read: false, created_at: new Date().toISOString() });
  } catch (err) { console.error("Referral error:", err.message); }
}

module.exports = router;
