// ============================================================
//  services/firebase.js — Firebase Admin SDK Init
//  DET Trades | Dark Empire Technologies
// ============================================================

const admin = require("firebase-admin");
const config = require("../config");

let db, auth, rtdb;

function initFirebase() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    auth = admin.auth();
    rtdb = admin.database();
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.FIREBASE.PROJECT_ID,
      privateKey: config.FIREBASE.PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: config.FIREBASE.CLIENT_EMAIL,
    }),
    databaseURL: config.FIREBASE.DATABASE_URL,
  });

  db = admin.firestore();
  auth = admin.auth();
  rtdb = admin.database();

  console.log("✅ Firebase Admin initialized — project:", config.FIREBASE.PROJECT_ID);
}

initFirebase();

// ── Firestore Collections ─────────────────────────────────
const Collections = {
  USERS: "users",
  ANALYSES: "analyses",
  SUBSCRIPTIONS: "subscriptions",
  SIGNALS: "signals",
  NOTIFICATIONS: "notifications",
  COUPONS: "coupons",
  PLANS: "plans",
  REFERRALS: "referrals",
  BROADCASTS: "broadcasts",
  FLAGGED_IPS: "flagged_ips",
  APP_SETTINGS: "app_settings",
  SUPPORT_CHATS: "support_chats",
  TRANSACTIONS: "transactions",
};

// ── Helper: Get user document ─────────────────────────────
async function getUserDoc(uid) {
  const snap = await db.collection(Collections.USERS).doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

// ── Helper: Update user document ─────────────────────────
async function updateUserDoc(uid, data) {
  await db.collection(Collections.USERS).doc(uid).set(data, { merge: true });
}

// ── Helper: Get app settings ──────────────────────────────
async function getAppSettings() {
  const snap = await db.collection(Collections.APP_SETTINGS).doc("general").get();
  return snap.exists ? snap.data() : {};
}

// ── Helper: Get plan pricing (admin can override defaults) ─
async function getPlanPricing() {
  const snap = await db.collection(Collections.APP_SETTINGS).doc("plans").get();
  return snap.exists ? snap.data() : null;
}

module.exports = {
  admin,
  db,
  auth,
  rtdb,
  Collections,
  getUserDoc,
  updateUserDoc,
  getAppSettings,
  getPlanPricing,
};
