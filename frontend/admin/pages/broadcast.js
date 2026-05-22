// admin/pages/broadcast.js
document.getElementById("page-title").textContent = "BROADCAST";
document.getElementById("page-content").innerHTML = `
  <div class="form-card">
    <h3>📢 SEND BROADCAST MESSAGE</h3>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Messages are delivered as in-app notifications instantly.</p>
    <div class="input-group">
      <label class="input-label">TARGET AUDIENCE</label>
      <select class="input" id="bc-target">
        <option value="all">All Users</option>
        <option value="free">Free Users Only</option>
        <option value="weekly">Weekly Subscribers Only</option>
        <option value="monthly">Monthly Subscribers Only</option>
      </select>
    </div>
    <div class="input-group">
      <label class="input-label">TITLE</label>
      <input type="text" class="input" id="bc-title" placeholder="e.g. Market Update 🔥" maxlength="80">
    </div>
    <div class="input-group">
      <label class="input-label">MESSAGE</label>
      <textarea class="input" id="bc-message" placeholder="Your broadcast message..." style="min-height:100px;resize:vertical" maxlength="500"></textarea>
      <span style="font-size:0.7rem;color:var(--text-muted)" id="bc-char-count">0 / 500</span>
    </div>
    <div style="background:var(--panel2);border:1px solid var(--border);border-radius:var(--radius);padding:12px;margin-bottom:16px" id="bc-preview" style="display:none">
      <div style="font-size:0.65rem;color:var(--text-muted);font-family:var(--font-display);margin-bottom:8px">PREVIEW</div>
      <div style="font-family:var(--font-display);font-size:0.85rem;color:var(--text)" id="bc-preview-title">—</div>
      <div style="font-size:0.82rem;color:var(--text-dim);margin-top:4px" id="bc-preview-msg">—</div>
    </div>
    <button class="btn btn-gold" id="send-bc-btn">📢 SEND BROADCAST</button>
  </div>

  <div class="card">
    <p class="section-title" style="margin-bottom:12px">BROADCAST HISTORY</p>
    <div id="bc-history"><div class="spinner"></div></div>
  </div>`;

document.getElementById("bc-message").addEventListener("input", e => {
  const len = e.target.value.length;
  document.getElementById("bc-char-count").textContent = `${len} / 500`;
  document.getElementById("bc-preview-msg").textContent = e.target.value || "—";
});
document.getElementById("bc-title").addEventListener("input", e => {
  document.getElementById("bc-preview-title").textContent = e.target.value || "—";
});

document.getElementById("send-bc-btn").onclick = async () => {
  const title = document.getElementById("bc-title").value.trim();
  const message = document.getElementById("bc-message").value.trim();
  const target = document.getElementById("bc-target").value;

  if (!title || !message) { Toast.error("Title and message are required"); return; }

  const targetLabel = { all: "all users", free: "free users", weekly: "weekly subscribers", monthly: "monthly subscribers" }[target];
  showConfirm("Send Broadcast", `Send this broadcast to ${targetLabel}?`, async () => {
    const btn = document.getElementById("send-bc-btn");
    btnLoading(btn, true);
    const data = await API.post("/signals/broadcast", { title, message, target });
    btnLoading(btn, false);
    if (data?.success) {
      Toast.success(`Broadcast sent to ${data.recipients} users!`);
      document.getElementById("bc-title").value = "";
      document.getElementById("bc-message").value = "";
      document.getElementById("bc-preview-title").textContent = "—";
      document.getElementById("bc-preview-msg").textContent = "—";
      loadHistory();
    } else Toast.error(data?.message || "Broadcast failed");
  });
};

async function loadHistory() {
  const data = await API.get("/signals/broadcast/history");
  const container = document.getElementById("bc-history");
  if (!data?.success || !data.broadcasts.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📢</div><p>No broadcasts sent yet</p></div>`;
    return;
  }
  container.innerHTML = data.broadcasts.map(b => `
    <div style="padding:12px 0;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-family:var(--font-display);font-size:0.82rem;font-weight:600">${b.title}</div>
        <span class="badge badge-muted" style="font-size:0.6rem">${(b.target||"all").toUpperCase()}</span>
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted)">${b.message?.substring(0,100)}${b.message?.length>100?"...":""}</div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;font-family:var(--font-mono)">${formatDateTime(b.created_at)}</div>
    </div>`).join("");
}

loadHistory();
