// ============================================================
//  routes/chat.js — Real-Time Chat Routes
//  Community Chat (all users) + Support Chat (monthly)
//  Images saved to VPS via Multer
//  DET Trades | Dark Empire Technologies
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { verifyToken } = require("../middleware/auth");
const { db, rtdb, Collections, updateUserDoc } = require("../services/firebase");
const config = require("../config");

// ── Multer for chat images (VPS storage) ──────────────────
const chatImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = config.UPLOADS.CHAT_IMAGES_PATH;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `chat_${uuidv4()}${ext}`);
  },
});

const chatUpload = multer({
  storage: chatImageStorage,
  limits: { fileSize: config.UPLOADS.MAX_CHAT_IMAGE_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (config.UPLOADS.ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP allowed"));
    }
  },
});

// ── Get effective plan ────────────────────────────────────
function getEffectivePlan(user) {
  const bonusActive = user.bonus_access?.active &&
    user.bonus_access?.expires_at &&
    new Date() < new Date(user.bonus_access.expires_at);
  return bonusActive ? user.bonus_access.plan_during_bonus : (user.subscription?.plan || "free");
}

// ── Check chat image limit for free users ─────────────────
async function checkChatImageLimit(user) {
  const plan = getEffectivePlan(user);
  if (plan !== "free") return { allowed: true };

  const today = new Date().toDateString();
  let { chat_images_today = 0, chat_images_date } = user;

  if (chat_images_date !== today) {
    chat_images_today = 0;
  }

  if (chat_images_today >= config.PLANS.FREE.chat_images_per_day) {
    return { allowed: false, reason: `Free users can send ${config.PLANS.FREE.chat_images_per_day} images per day` };
  }

  await updateUserDoc(user.id, {
    chat_images_today: chat_images_today + 1,
    chat_images_date: today,
  });

  return { allowed: true };
}

// ════════════════════════════════════════════════════════════
//  COMMUNITY CHAT
// ════════════════════════════════════════════════════════════

// ── GET /api/chat/community/messages ─────────────────────
router.get("/community/messages", verifyToken, async (req, res) => {
  try {
    const { limit = 50, before } = req.query;
    let query = rtdb.ref("community_chat").orderByChild("timestamp").limitToLast(parseInt(limit));

    const snap = await query.once("value");
    if (!snap.exists()) return res.status(200).json({ success: true, messages: [] });

    const messages = [];
    snap.forEach(child => {
      messages.push({ id: child.key, ...child.val() });
    });
    messages.reverse();

    return res.status(200).json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load messages" });
  }
});

// ── POST /api/chat/community/message ─────────────────────
router.post("/community/message", verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    const user = req.user;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    if (text.length > 1000) {
      return res.status(400).json({ success: false, message: "Message too long (max 1000 chars)" });
    }

    if (user.chat_banned) {
      return res.status(403).json({ success: false, message: "You have been banned from chat" });
    }

    const plan = getEffectivePlan(user);
    const message = {
      uid: user.id,
      username: user.username,
      avatar_url: user.avatar_url || null,
      role: user.role,
      plan,
      type: "text",
      text: text.trim(),
      timestamp: Date.now(),
    };

    const ref = await rtdb.ref("community_chat").push(message);

    return res.status(200).json({ success: true, message_id: ref.key, message });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// ── POST /api/chat/community/image ────────────────────────
router.post("/community/image", verifyToken, chatUpload.single("image"), async (req, res) => {
  try {
    const user = req.user;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    if (user.chat_banned) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, message: "You have been banned from chat" });
    }

    // Check image limit
    const limitCheck = await checkChatImageLimit(user);
    if (!limitCheck.allowed) {
      fs.unlinkSync(req.file.path);
      return res.status(429).json({ success: false, message: limitCheck.reason });
    }

    const imageUrl = `${config.APP.DOMAIN}/uploads/chat-images/${req.file.filename}`;
    const plan = getEffectivePlan(user);

    const message = {
      uid: user.id,
      username: user.username,
      avatar_url: user.avatar_url || null,
      role: user.role,
      plan,
      type: "image",
      image_url: imageUrl,
      filename: req.file.filename,
      text: null,
      timestamp: Date.now(),
    };

    const ref = await rtdb.ref("community_chat").push(message);

    return res.status(200).json({ success: true, message_id: ref.key, image_url: imageUrl, message });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ success: false, message: "Failed to send image" });
  }
});

// ── DELETE /api/chat/community/:messageId ─────────────────
// Admin only — delete a message
router.delete("/community/:messageId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const msgSnap = await rtdb.ref(`community_chat/${req.params.messageId}`).once("value");
    if (msgSnap.exists()) {
      const msg = msgSnap.val();
      // Delete image file if it's an image message
      if (msg.type === "image" && msg.filename) {
        const filePath = `${config.UPLOADS.CHAT_IMAGES_PATH}/${msg.filename}`;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    }

    await rtdb.ref(`community_chat/${req.params.messageId}`).remove();
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete message" });
  }
});

// ── POST /api/chat/community/ban/:uid ─────────────────────
// Admin — ban user from chat
router.post("/community/ban/:uid", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    await updateUserDoc(req.params.uid, { chat_banned: true });
    return res.status(200).json({ success: true, message: "User banned from chat" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to ban user" });
  }
});

// ── POST /api/chat/community/unban/:uid ───────────────────
router.post("/community/unban/:uid", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }
    await updateUserDoc(req.params.uid, { chat_banned: false });
    return res.status(200).json({ success: true, message: "User unbanned from chat" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to unban user" });
  }
});

// ════════════════════════════════════════════════════════════
//  SUPPORT CHAT (Monthly users ↔ Admin)
// ════════════════════════════════════════════════════════════

// ── GET /api/chat/support/thread ─────────────────────────
router.get("/support/thread", verifyToken, async (req, res) => {
  try {
    const plan = getEffectivePlan(req.user);
    if (plan !== "monthly" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Support chat requires Monthly plan",
        upgrade_required: true,
      });
    }

    const uid = req.user.role === "admin" ? req.query.uid : req.uid;
    if (!uid) return res.status(400).json({ success: false, message: "uid required" });

    const snap = await rtdb.ref(`support_chat/${uid}`).orderByChild("timestamp").limitToLast(100).once("value");
    const messages = [];
    if (snap.exists()) {
      snap.forEach(child => messages.push({ id: child.key, ...child.val() }));
      messages.reverse();
    }

    // Mark messages as read
    if (req.user.role === "admin") {
      await rtdb.ref(`support_chat_meta/${uid}`).update({ admin_unread: 0 });
    } else {
      await rtdb.ref(`support_chat_meta/${uid}`).update({ user_unread: 0 });
    }

    return res.status(200).json({ success: true, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load support chat" });
  }
});

// ── POST /api/chat/support/message ───────────────────────
router.post("/support/message", verifyToken, async (req, res) => {
  try {
    const { text, target_uid } = req.body;
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
    const plan = getEffectivePlan(req.user);

    if (!isAdmin && plan !== "monthly") {
      return res.status(403).json({ success: false, message: "Support chat requires Monthly plan", upgrade_required: true });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    const threadUID = isAdmin ? target_uid : req.uid;
    if (!threadUID) return res.status(400).json({ success: false, message: "target_uid required for admin" });

    const message = {
      uid: req.uid,
      username: req.user.username,
      role: req.user.role,
      type: "text",
      text: text.trim(),
      timestamp: Date.now(),
    };

    await rtdb.ref(`support_chat/${threadUID}`).push(message);

    // Update unread counter
    if (isAdmin) {
      await rtdb.ref(`support_chat_meta/${threadUID}`).update({
        last_message: text.trim(),
        last_at: Date.now(),
        user_unread: (await rtdb.ref(`support_chat_meta/${threadUID}/user_unread`).once("value")).val() + 1 || 1,
      });
    } else {
      await rtdb.ref(`support_chat_meta/${threadUID}`).update({
        uid: req.uid,
        username: req.user.username,
        last_message: text.trim(),
        last_at: Date.now(),
        admin_unread: (await rtdb.ref(`support_chat_meta/${threadUID}/admin_unread`).once("value")).val() + 1 || 1,
      });
    }

    // Notify
    if (!isAdmin) {
      await db.collection(Collections.NOTIFICATIONS).add({
        uid: "admin",
        type: "support_message",
        title: `Support message from ${req.user.username}`,
        message: text.trim().substring(0, 100),
        read: false,
        meta: { thread_uid: req.uid },
        created_at: new Date().toISOString(),
      });
    } else {
      await db.collection(Collections.NOTIFICATIONS).add({
        uid: threadUID,
        type: "support_reply",
        title: "Admin replied to your support message",
        message: text.trim().substring(0, 100),
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    return res.status(200).json({ success: true, message: "Message sent" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to send message" });
  }
});

// ── GET /api/chat/support/threads (admin) ─────────────────
router.get("/support/threads", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Admin only" });
    }

    const snap = await rtdb.ref("support_chat_meta").orderByChild("last_at").limitToLast(50).once("value");
    const threads = [];
    if (snap.exists()) {
      snap.forEach(child => threads.push({ uid: child.key, ...child.val() }));
      threads.reverse();
    }

    return res.status(200).json({ success: true, threads });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to load threads" });
  }
});

module.exports = router;
