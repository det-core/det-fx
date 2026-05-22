// ============================================================
//  js/app.js — Core Utilities: API, Auth, Toast, Helpers
//  DET Trades | Dark Empire Technologies
// ============================================================

// ── Token management ──────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem("det_token") || sessionStorage.getItem("det_token"),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem("det_user") || sessionStorage.getItem("det_user")); }
    catch { return null; }
  },
  setSession: (token, user, remember) => {
    const store = remember ? localStorage : sessionStorage;
    store.setItem("det_token", token);
    store.setItem("det_user", JSON.stringify(user));
    store.setItem("det_remember", remember ? "1" : "0");
  },
  clear: () => {
    ["det_token","det_user","det_remember"].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
  },
  isLoggedIn: () => !!Auth.getToken(),
  isAdmin: () => {
    const u = Auth.getUser();
    return u?.role === "admin" || u?.role === "superadmin";
  },
  requireAuth: (redirect = "/login.html") => {
    if (!Auth.isLoggedIn()) { window.location.href = redirect; return false; }
    return true;
  },
  requireAdmin: () => {
    if (!Auth.isLoggedIn()) { window.location.href = "/login.html"; return false; }
    if (!Auth.isAdmin()) { window.location.href = "/dashboard.html"; return false; }
    return true;
  },
  requireGuest: (redirect = "/dashboard.html") => {
    if (Auth.isLoggedIn()) { window.location.href = redirect; return false; }
    return true;
  },
};

// ── API wrapper ───────────────────────────────────────────
const API = {
  async request(method, path, body = null, isFormData = false) {
    const token = Auth.getToken();
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (!isFormData) headers["Content-Type"] = "application/json";

    const opts = { method, headers };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);

    try {
      const res = await fetch(`${DET_CONFIG.API_BASE}${path}`, opts);
      const data = await res.json();

      if (res.status === 401) {
        Auth.clear();
        window.location.href = "/login.html";
        return null;
      }
      return data;
    } catch (err) {
      console.error("API error:", err);
      return { success: false, message: "Network error. Check your connection." };
    }
  },
  get:    (path) => API.request("GET", path),
  post:   (path, body) => API.request("POST", path, body),
  put:    (path, body) => API.request("PUT", path, body),
  patch:  (path, body) => API.request("PATCH", path, body),
  delete: (path) => API.request("DELETE", path),
  upload: (path, formData) => API.request("POST", path, formData, true),
};

// ── Toast notifications ───────────────────────────────────
const Toast = {
  container: null,
  init() {
    if (document.getElementById("toast-container")) return;
    this.container = document.createElement("div");
    this.container.id = "toast-container";
    document.body.appendChild(this.container);
  },
  show(message, type = "info", duration = 3500) {
    this.init();
    const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || "ℹ️"}</span><span>${message}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease forwards";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, "success"),
  error:   (msg) => Toast.show(msg, "error"),
  info:    (msg) => Toast.show(msg, "info"),
  warning: (msg) => Toast.show(msg, "warning"),
};

// ── Loading screen ────────────────────────────────────────
const Loader = {
  show(text = "LOADING") {
    let el = document.getElementById("global-loader");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-loader";
      el.className = "loading-screen";
      el.innerHTML = `<div class="logo">DET<span style="color:var(--gold)">●</span>TRADES</div><div class="spinner spinner-lg"></div><div style="font-family:var(--font-display);font-size:0.7rem;letter-spacing:3px;color:var(--text-muted)">${text}</div>`;
      document.body.appendChild(el);
    }
  },
  hide() {
    const el = document.getElementById("global-loader");
    if (el) { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }
  },
};

// ── Button loading state ──────────────────────────────────
function btnLoading(btn, loading, text = null) {
  if (loading) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${text || "Please wait..."}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.original || btn.innerHTML;
    btn.disabled = false;
  }
}

// ── Format helpers ────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
}
function formatDateTime(iso) {
  return `${formatDate(iso)} ${formatTime(iso)}`;
}
function formatNaira(kobo) {
  return `₦${(kobo / 100).toLocaleString("en-NG")}`;
}
function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
}
function planBadge(plan) {
  const map = { free: "badge-muted", weekly: "badge-cyan", monthly: "badge-gold" };
  return `<span class="badge ${map[plan] || "badge-muted"}">${(plan||"FREE").toUpperCase()}</span>`;
}
function biasBadge(bias) {
  const map = { BULLISH: "badge-success", BEARISH: "badge-danger", NEUTRAL: "badge-muted" };
  const icons = { BULLISH: "↑", BEARISH: "↓", NEUTRAL: "→" };
  return `<span class="badge ${map[bias]||"badge-muted"}">${icons[bias]||""} ${bias}</span>`;
}

// ── Populate nav user info ────────────────────────────────
function populateNav() {
  const user = Auth.getUser();
  if (!user) return;

  const avatarEl = document.getElementById("nav-avatar");
  if (avatarEl) {
    if (user.avatar_url) {
      avatarEl.innerHTML = `<img src="${user.avatar_url}" alt="${user.username}" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
      avatarEl.textContent = user.username?.charAt(0).toUpperCase() || "U";
    }
  }

  // Set active bottom nav item
  const page = window.location.pathname.split("/").pop();
  document.querySelectorAll(".bottom-nav-item").forEach(item => {
    if (item.dataset.page === page) item.classList.add("active");
  });

  // Load unread notifications count
  loadUnreadCount();
}

async function loadUnreadCount() {
  try {
    const data = await API.get("/signals/notifications/all?limit=50");
    if (data?.success) {
      const badge = document.getElementById("notif-badge");
      if (badge) {
        if (data.unread_count > 0) {
          badge.textContent = data.unread_count > 9 ? "9+" : data.unread_count;
          badge.classList.remove("hidden");
        } else {
          badge.classList.add("hidden");
        }
      }
    }
  } catch {}
}

// ── Copy to clipboard ─────────────────────────────────────
async function copyToClipboard(text, msg = "Copied!") {
  try {
    await navigator.clipboard.writeText(text);
    Toast.success(msg);
  } catch {
    Toast.error("Copy failed");
  }
}

// ── Confirm modal ─────────────────────────────────────────
function showConfirm(title, message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal" style="border-radius:var(--radius-lg)">
      <div class="modal-handle"></div>
      <div class="modal-title">${title}</div>
      <p style="color:var(--text-dim);font-size:0.9rem;margin-bottom:24px">${message}</p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-outline" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Confirm</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector("#confirm-cancel").onclick = () => overlay.remove();
  overlay.querySelector("#confirm-ok").onclick = () => { overlay.remove(); onConfirm(); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
}

// ── App settings (logo etc from Firestore via API) ────────
async function loadAppSettings() {
  try {
    const data = await API.get("/admin/settings");
    if (data?.success && data.settings) {
      const s = data.settings;
      if (s.app_logo_url) {
        document.querySelectorAll(".app-logo-img").forEach(el => {
          el.src = s.app_logo_url;
          el.style.display = "block";
        });
        document.querySelectorAll(".app-logo-text").forEach(el => el.style.display = "none");
      }
    }
  } catch {}
}

// Init on page load
document.addEventListener("DOMContentLoaded", () => {
  Toast.init();
  populateNav();
});
