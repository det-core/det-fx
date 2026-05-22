// admin/pages/support.js
document.getElementById("page-title").textContent = "SUPPORT THREADS";
document.getElementById("page-content").innerHTML = `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;height:calc(100vh - 120px)">
    <div class="card" style="overflow-y:auto">
      <p class="section-title" style="margin-bottom:12px">OPEN THREADS</p>
      <div id="threads-list"><div class="spinner"></div></div>
    </div>
    <div class="card" id="thread-panel" style="display:flex;flex-direction:column">
      <div style="text-align:center;padding:40px;color:var(--text-muted)">
        <div style="font-size:2rem;margin-bottom:8px">🎧</div>
        <p>Select a thread to reply</p>
      </div>
    </div>
  </div>`;

async function loadThreads() {
  const data = await API.get("/chat/support/threads");
  const list = document.getElementById("threads-list");
  if (!data?.success || !data.threads.length) {
    list.innerHTML = `<div class="empty-state"><div class="icon">🎧</div><p>No support threads yet</p></div>`;
    return;
  }
  list.innerHTML = data.threads.map(t => `
    <div style="padding:12px;border-bottom:1px solid var(--border);cursor:pointer;transition:background 0.15s" onclick="openThread('${t.uid}','${t.username||"User"}')" onmouseover="this.style.background='var(--panel2)'" onmouseout="this.style.background='transparent'">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="font-family:var(--font-display);font-size:0.8rem;font-weight:600">${t.username||"User"}</div>
        ${t.admin_unread > 0 ? `<span style="background:var(--danger);color:#fff;font-size:0.6rem;padding:2px 6px;border-radius:100px;font-family:var(--font-display)">${t.admin_unread}</span>` : ""}
      </div>
      <div style="font-size:0.78rem;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.last_message||"—"}</div>
      <div style="font-size:0.65rem;color:var(--text-muted);margin-top:4px;font-family:var(--font-mono)">${t.last_at ? timeAgo(new Date(t.last_at).toISOString()) : "—"}</div>
    </div>`).join("");
}

async function openThread(uid, username) {
  const panel = document.getElementById("thread-panel");
  panel.innerHTML = `
    <div style="padding:12px;border-bottom:1px solid var(--border);font-family:var(--font-display);font-size:0.85rem">${username}</div>
    <div id="thread-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px">
      <div class="spinner"></div>
    </div>
    <div style="padding:10px;border-top:1px solid var(--border);display:flex;gap:8px">
      <input type="text" class="input" id="reply-input" placeholder="Type reply..." style="flex:1">
      <button class="btn btn-primary btn-sm" style="width:auto" onclick="sendReply('${uid}')">Send</button>
    </div>`;

  const data = await API.get(`/chat/support/thread?uid=${uid}`);
  const msgs = document.getElementById("thread-messages");
  if (data?.success) {
    msgs.innerHTML = data.messages.length ? data.messages.map(m => `
      <div style="display:flex;flex-direction:${m.uid===uid?"row":"row-reverse"};gap:6px">
        <div style="max-width:80%;background:${m.role==="admin"?"linear-gradient(135deg,rgba(240,180,41,0.08),rgba(0,212,255,0.05))":"var(--panel2)"};border:1px solid ${m.role==="admin"?"var(--gold-glow)":"var(--border)"};border-radius:10px;padding:8px 12px;font-size:0.82rem;color:var(--text)">
          ${m.role==="admin"?`<div style="font-size:0.6rem;color:var(--gold);font-family:var(--font-display);margin-bottom:3px">ADMIN</div>`:""}
          ${m.text}
          <div style="font-size:0.6rem;color:var(--text-muted);margin-top:3px">${new Date(m.timestamp).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
      </div>`).join("") : `<div style="text-align:center;color:var(--text-muted);font-size:0.85rem">No messages yet</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }

  document.getElementById("reply-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendReply(uid);
  });
}

async function sendReply(uid) {
  const input = document.getElementById("reply-input");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  const data = await API.post("/chat/support/message", { text, target_uid: uid });
  if (data?.success) openThread(uid, "");
  else Toast.error("Failed to send reply");
}

loadThreads();
