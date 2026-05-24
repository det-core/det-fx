/**
 * ┌⪼❏ TELEGRAM × WHATSAPP PAIRING SYSTEM
 * ├◆ Pairing Code + QR Code (inline buttons)
 * ├◆ Admin toggle inline on/off
 * ├◆ Multi‑user with per‑folder sessions
 * └ ❏ Powered by ꪶ ¡ϻ Nᴜʟʟ ꫂ
 */

const TelegramBot = require("node-telegram-bot-api");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const { 
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestWAWebVersion,
  DisconnectReason,
  makeInMemoryStore,
  jidDecode,
  proto,
  getContentType,
  downloadContentFromMessage
} = require("@whiskeysockets/baileys");
const QRCode = require("qrcode"); // npm i qrcode

// ==================== CONFIGURATION ====================
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || "8785555567:AAG4fYV5kLZ280SNOIoF4KdSryPmIvVRbBw";
const ADMIN_IDS = ["8151155337"]; // as strings

// If you have external settings (e.g. global.dev, global.img), uncomment:
// require("./settings.js");

// ==================== GLOBAL STATE ====================
global.inline = global.inline ?? true;
global.lockPair = global.lockPair ?? false;
global.sessionState = global.sessionState || {};
global.activeSockets = global.activeSockets || {};
global.startTime = global.startTime || Date.now();
global.vip = global.vip || [];

// ==================== STORAGE SETUP ====================
const sessionDir = "./Null_Sessions";
if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

// ==================== TELEGRAM BOT INIT ====================
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// ==================== SMSG FUNCTION (from original) ====================
function smsg(conn, m, store) {
    if (!m) return m;
    let M = proto.WebMessageInfo;
    if (m.key) {
        m.id = m.key.id;
        m.from = m.key.remoteJid.startsWith('status') 
            ? jidDecode(m.key?.participant || m.participant)?.user + '@s.whatsapp.net' 
            : m.key.remoteJid;
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = (m.fromMe && conn.user?.id || m.participant || m.key.participant || m.chat || '').replace(/:.*/, '');
        if (m.isGroup) m.participant = (m.key.participant || '').replace(/:.*/, '');
    }
    if (m.message) {
        m.mtype = getContentType(m.message);
        m.msg = (m.mtype === 'viewOnceMessage' ? 
            m.message[m.mtype]?.message?.[getContentType(m.message[m.mtype]?.message)] : 
            m.message[m.mtype]
        ) || {};
        m.body = m.message.conversation || 
            m.msg.caption || 
            m.msg.text || 
            (m.mtype === 'listResponseMessage' && m.msg.singleSelectReply?.selectedRowId) || 
            (m.mtype === 'buttonsResponseMessage' && m.msg.selectedButtonId) || 
            (m.mtype === 'viewOnceMessage' && m.msg.caption) || 
            m.text || '';
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null;
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
        if (m.quoted) {
            let type = getContentType(quoted);
            m.quoted = quoted?.[type] || {};
            if (typeof m.quoted === 'string') m.quoted = { text: m.quoted };
            m.quoted.mtype = type;
            m.quoted.sender = (m.msg?.contextInfo?.participant || "").replace(/:.*/, '');
            m.quoted.text = m.quoted.text || m.quoted.caption || '';
            m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
            m.quoted.download = async () => {
                const stream = await downloadContentFromMessage(m.quoted, m.quoted.mtype?.includes('image') ? 'image' : 'video');
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                return buffer;
            };
        }
    }
    if (m.msg && m.msg.url) m.download = async () => {
        const stream = await downloadContentFromMessage(m.msg, m.mtype?.includes('image') ? 'image' : 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };
    m.text = m.msg.text || m.msg.caption || m.message.conversation || '';
    m.reply = (text, chatId = m.chat, options = {}) => 
        Buffer.isBuffer(text) ? conn.sendMedia(chatId, text, 'file', '', m, { ...options }) : 
        conn.sendMessage(chatId, { text: text }, { ...options, quoted: m });
    return m;
}

// ==================== HELPER: DECORATIVE STYLE ====================
function deco(text) {
    return `┌⪼❏\n${text}\n└ ❏ Powered by ꪶ ¡ϻ Nᴜʟʟ ꫂ`;
}

// ==================== PERMISSION CHECKS ====================
const isAdmin = (id) => ADMIN_IDS.includes(String(id));

// ==================== SESSION STATUS ====================
function getSessionStatus(id) {
    const dir = path.join(sessionDir, id);
    if (!fs.existsSync(dir)) return "NOT LINKED";
    return global.sessionState[id] || "OFFLINE";
}

// ==================== INLINE MENU BUILDER ====================
function buildMainMenu(isAdm) {
    const keyboard = [];
    // Row 1: Pair methods
    keyboard.push([
        { text: "📱 PAIR (CODE)", callback_data: "pair_code" },
        { text: "🔳 PAIR (QR)", callback_data: "pair_qr" }
    ]);
    // Row 2: Status & Help
    keyboard.push([
        { text: "📊 STATUS", callback_data: "status" },
        { text: "ℹ️ HELP", callback_data: "help" }
    ]);
    // Row 3: Delete own session
    keyboard.push([
        { text: "🗑️ DELETE SESSION", callback_data: "del_self" }
    ]);
    // Admin row
    if (isAdm) {
        keyboard.push([
            { text: "🛠 ADMIN PANEL", callback_data: "admin_panel" }
        ]);
    }
    return { reply_markup: { inline_keyboard: keyboard } };
}

function buildAdminPanel() {
    return {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "INLINE ON/OFF", callback_data: "toggle_inline" },
                    { text: "LOCK PAIR", callback_data: "toggle_lock" }
                ],
                [
                    { text: "LIST SESSIONS", callback_data: "list_sessions" },
                    { text: "DEL USER SESSION", callback_data: "del_user" }
                ],
                [
                    { text: "🔙 BACK TO MENU", callback_data: "back_to_menu" }
                ]
            ]
        }
    };
}

// ==================== WHATSAPP SOCKET FACTORY ====================
async function startWaSocket(userId, method, phoneNumber = null) {
    const userDir = path.join(sessionDir, userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    // Close existing socket if any
    if (global.activeSockets[userId]) {
        try { global.activeSockets[userId].end(); } catch(e) {}
        delete global.activeSockets[userId];
    }

    const { state, saveCreds } = await useMultiFileAuthState(userDir);
    const version = await fetchLatestWAWebVersion();
    const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,  // we handle QR manually
        browser: ["Ubuntu", "Chrome", "20.0.0"],
        syncFullHistory: false
    });
    store.bind(sock.ev);
    global.activeSockets[userId] = sock;
    global.sessionState[userId] = "CONNECTING";

    // ---------- Connection handling ----------
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR code available (only when not registered)
        if (qr && method === "qr") {
            try {
                const qrBuffer = await QRCode.toBuffer(qr);
                await bot.sendPhoto(userId, qrBuffer, { caption: deco("├◆ Scan this QR code with WhatsApp") });
                global.sessionState[userId] = "AWAITING_QR";
            } catch (e) {
                bot.sendMessage(userId, deco("├◆ Failed to generate QR image"));
            }
        }

        if (connection === "open") {
            global.sessionState[userId] = "ACTIVE";
            bot.sendMessage(userId, deco("├◆ WhatsApp Connected! ✅"));
            // Auto‑follow newsletter (from original)
            try { await sock.newsletterFollow("120363423407628679@newsletter"); } catch(e) {}
        }

        if (connection === "close") {
            console.log(`[${userId}] Connection closed: ${lastDisconnect?.error?.output?.statusCode}`);
            delete global.activeSockets[userId];
            global.sessionState[userId] = "OFFLINE";

            const statusCode = new (require("@hapi/boom").Boom)(lastDisconnect?.error)?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                bot.sendMessage(userId, deco("├◆ Session logged out. Use /pair again."));
                try { fs.rmSync(userDir, { recursive: true, force: true }); } catch(e) {}
                return;
            }
            // Auto‑reconnect after 5s unless user deletes session
            setTimeout(() => {
                if (clientsStillActive(userId) && global.sessionState[userId] === "OFFLINE") {
                    startWaSocket(userId, method, phoneNumber);
                }
            }, 5000);
        }
    });

    // ---------- Credentials ----------
    sock.ev.on("creds.update", saveCreds);

    // ---------- Message handler (your original null.js) ----------
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
            const msg = messages[0];
            if (!msg.message || type !== "notify") return;
            if (msg.key?.remoteJid === "status@broadcast") return;
            const m = smsg(sock, msg, store);
            // Assumes ./system/null.js exists
            require("./system/null")(sock, m, msg, store);
        } catch (err) { console.log("Message handler error:", err); }
    });

    // ---------- Contacts ----------
    sock.ev.on("contacts.update", update => {
        for (let contact of update) {
            let id = sock.decodeJid ? sock.decodeJid(contact.id) : contact.id;
            if (store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });

    // ---------- Pairing code request (if method = code) ----------
    if (!sock.authState.creds.registered && method === "code" && phoneNumber) {
        try {
            const code = await sock.requestPairingCode(phoneNumber.trim(), "NULLBOT");
            bot.sendMessage(userId, deco(`├◆ Your pairing code: ${code}`));
            global.sessionState[userId] = "AWAITING_PAIR";
        } catch (err) {
            bot.sendMessage(userId, deco("├◆ Failed to request pairing code. Check the number."));
            delete global.activeSockets[userId];
            global.sessionState[userId] = "OFFLINE";
        }
    }
}

function clientsStillActive(userId) {
    // Check if session folder still exists (not deleted by user)
    return fs.existsSync(path.join(sessionDir, userId));
}

// ==================== TELEGRAM COMMAND HANDLERS ====================

bot.onText(/\/start/, async (msg) => {
    const id = String(msg.chat.id);
    if (global.inline) {
        const opts = buildMainMenu(isAdmin(id));
        return bot.sendMessage(id, deco("├◆ Welcome to NULL Pairing Bot! Choose an option:"), opts);
    } else {
        const textMenu = `┌⪼❏ TEXT COMMANDS
├◆ /pair <number> - get pairing code
├◆ /qr - get QR code
├◆ /status - check session
├◆ /del - delete your session
${isAdmin(id) ? "├◆ /delsession <id> - admin delete user session" : ""}`;
        return bot.sendMessage(id, deco(textMenu));
    }
});

bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, deco("├◆ Use /start to see the menu")));

// /pair <number> — pairing code
bot.onText(/\/pair (\d+)/, async (msg, match) => {
    const id = String(msg.chat.id);
    if (global.sessionState[id] === "ACTIVE") return bot.sendMessage(id, deco("├◆ You are already connected."));
    const number = match[1].replace(/\D/g, "");
    bot.sendMessage(id, deco(`├◆ Requesting code for +${number}...`));
    await startWaSocket(id, "code", number);
});

// /qr — QR code pairing
bot.onText(/\/qr/, async (msg) => {
    const id = String(msg.chat.id);
    if (global.sessionState[id] === "ACTIVE") return bot.sendMessage(id, deco("├◆ Already connected."));
    bot.sendMessage(id, deco("├◆ Generating QR code..."));
    await startWaSocket(id, "qr");
});

// /status
bot.onText(/\/status/, (msg) => {
    const id = String(msg.chat.id);
    bot.sendMessage(id, deco(`├◆ Status: ${getSessionStatus(id)}`));
});

// /del — delete own session
bot.onText(/\/del/, (msg) => {
    const id = String(msg.chat.id);
    if (global.activeSockets[id]) {
        try { global.activeSockets[id].end(); } catch(e) {}
        delete global.activeSockets[id];
    }
    const userDir = path.join(sessionDir, id);
    if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
    global.sessionState[id] = "OFFLINE";
    bot.sendMessage(id, deco("├◆ Your session has been deleted."));
});

// /delsession <user_id> (admin)
bot.onText(/\/delsession (\d+)/, (msg, match) => {
    const adminId = String(msg.chat.id);
    if (!isAdmin(adminId)) return bot.sendMessage(adminId, deco("├◆ Admin only."));
    const targetId = match[1];
    if (global.activeSockets[targetId]) {
        try { global.activeSockets[targetId].end(); } catch(e) {}
        delete global.activeSockets[targetId];
    }
    const userDir = path.join(sessionDir, targetId);
    if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
    global.sessionState[targetId] = "OFFLINE";
    bot.sendMessage(adminId, deco(`├◆ Session of user ${targetId} deleted.`));
    bot.sendMessage(targetId, deco("├◆ Your session was deleted by admin."));
});

// ==================== INLINE BUTTON HANDLING ====================
bot.on("callback_query", async (cb) => {
    const userId = String(cb.from.id);
    const chatId = cb.message.chat.id;
    const data = cb.data;
    bot.answerCallbackQuery(cb.id);

    // ---- Main menu actions ----
    if (data === "pair_code") {
        if (!global.inline) return;
        // Ask user to send number (set state)
        bot.sendMessage(chatId, deco("├◆ Please reply with the phone number (e.g. 2347030626048)"));
        // We can set a global state to capture the next message
        global.awaitingNumber = global.awaitingNumber || {};
        global.awaitingNumber[userId] = true;
        return;
    }
    if (data === "pair_qr") {
        if (global.sessionState[userId] === "ACTIVE") return bot.sendMessage(chatId, deco("├◆ Already connected."));
        bot.sendMessage(chatId, deco("├◆ Generating QR code..."));
        await startWaSocket(userId, "qr");
        return;
    }
    if (data === "status") {
        return bot.sendMessage(chatId, deco(`├◆ Status: ${getSessionStatus(userId)}`));
    }
    if (data === "help") {
        return bot.sendMessage(chatId, deco("├◆ Use the buttons or text commands to pair your WhatsApp."));
    }
    if (data === "del_self") {
        if (global.activeSockets[userId]) {
            try { global.activeSockets[userId].end(); } catch(e) {}
            delete global.activeSockets[userId];
        }
        const userDir = path.join(sessionDir, userId);
        if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
        global.sessionState[userId] = "OFFLINE";
        return bot.sendMessage(chatId, deco("├◆ Session deleted."));
    }
    // ---- Admin panel ----
    if (data === "admin_panel") {
        if (!isAdmin(userId)) return bot.sendMessage(chatId, deco("├◆ Admin only."));
        return bot.sendMessage(chatId, deco("├◆ ADMIN PANEL"), buildAdminPanel());
    }
    if (data === "toggle_inline") {
        if (!isAdmin(userId)) return;
        global.inline = !global.inline;
        return bot.sendMessage(chatId, deco(`├◆ Inline menu: ${global.inline ? "ON" : "OFF"}`));
    }
    if (data === "toggle_lock") {
        if (!isAdmin(userId)) return;
        global.lockPair = !global.lockPair;
        return bot.sendMessage(chatId, deco(`├◆ Pair lock: ${global.lockPair ? "LOCKED" : "UNLOCKED"}`));
    }
    if (data === "list_sessions") {
        if (!isAdmin(userId)) return;
        const sessions = Object.entries(global.sessionState)
            .map(([uid, status]) => `├◆ ${uid}: ${status}`)
            .join("\n");
        return bot.sendMessage(chatId, deco(sessions || "├◆ No sessions"));
    }
    if (data === "del_user") {
        if (!isAdmin(userId)) return;
        bot.sendMessage(chatId, deco("├◆ Reply with the Telegram user ID to delete its session."));
        global.awaitingDelUser = global.awaitingDelUser || {};
        global.awaitingDelUser[userId] = true;
        return;
    }
    if (data === "back_to_menu") {
        const opts = buildMainMenu(isAdmin(userId));
        return bot.sendMessage(chatId, deco("├◆ MAIN MENU"), opts);
    }
});

// ==================== CAPTURE TEXT REPLIES FOR INLINE ACTIONS ====================
bot.on("message", async (msg) => {
    if (msg.text && msg.text.startsWith("/")) return; // ignore commands
    const userId = String(msg.from.id);
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    // Capture phone number for pairing code (set by inline "pair_code")
    if (global.awaitingNumber && global.awaitingNumber[userId]) {
        delete global.awaitingNumber[userId];
        if (global.sessionState[userId] === "ACTIVE") {
            return bot.sendMessage(chatId, deco("├◆ Already connected."));
        }
        const number = text.replace(/\D/g, "");
        if (!/^\d{6,15}$/.test(number)) {
            return bot.sendMessage(chatId, deco("├◆ Invalid number. Use digits only (e.g. 2347030626048)"));
        }
        bot.sendMessage(chatId, deco(`├◆ Requesting code for +${number}...`));
        await startWaSocket(userId, "code", number);
        return;
    }

    // Capture target user ID for admin session deletion
    if (global.awaitingDelUser && global.awaitingDelUser[userId]) {
        delete global.awaitingDelUser[userId];
        if (!isAdmin(userId)) return;
        const targetId = text;
        if (global.activeSockets[targetId]) {
            try { global.activeSockets[targetId].end(); } catch(e) {}
            delete global.activeSockets[targetId];
        }
        const userDir = path.join(sessionDir, targetId);
        if (fs.existsSync(userDir)) fs.rmSync(userDir, { recursive: true, force: true });
        global.sessionState[targetId] = "OFFLINE";
        return bot.sendMessage(chatId, deco(`├◆ Session of ${targetId} deleted.`));
    }
});

// ==================== ERROR HANDLER ====================
process.on("uncaughtException", console.log);

console.log("🤖 Telegram WhatsApp Pairing Bot with Inline Menu started.");