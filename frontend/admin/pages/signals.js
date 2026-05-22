// admin/pages/signals.js — Signal Management
document.getElementById("page-title").textContent = "SIGNALS";

document.getElementById("page-content").innerHTML = `
  <div class="form-card" id="signal-form-card">
    <h3>➕ POST NEW SIGNAL</h3>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">PAIR</label>
        <input type="text" class="input" id="sig-pair" placeholder="e.g. GBPUSD" style="text-transform:uppercase">
      </div>
      <div class="input-group">
        <label class="input-label">BIAS</label>
        <select class="input" id="sig-bias">
          <option value="BULLISH">BULLISH</option>
          <option value="BEARISH">BEARISH</option>
          <option value="NEUTRAL">NEUTRAL</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">ENTRY FROM</label>
        <input type="number" class="input" id="sig-entry-from" placeholder="1.28400" step="0.00001">
      </div>
      <div class="input-group">
        <label class="input-label">ENTRY TO</label>
        <input type="number" class="input" id="sig-entry-to" placeholder="1.28600" step="0.00001">
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">STOP LOSS PRICE</label>
        <input type="number" class="input" id="sig-sl" placeholder="1.27800" step="0.00001">
      </div>
      <div class="input-group">
        <label class="input-label">SL PIPS</label>
        <input type="number" class="input" id="sig-sl-pips" placeholder="60">
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">TP1</label>
        <input type="number" class="input" id="sig-tp1" placeholder="1.29200" step="0.00001">
      </div>
      <div class="input-group">
        <label class="input-label">TP1 RR</label>
        <input type="text" class="input" id="sig-tp1-rr" placeholder="1:1.3">
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">TP2</label>
        <input type="number" class="input" id="sig-tp2" placeholder="1.29800" step="0.00001">
      </div>
      <div class="input-group">
        <label class="input-label">TP3</label>
        <input type="number" class="input" id="sig-tp3" placeholder="1.30500" step="0.00001">
      </div>
    </div>
    <div class="input-group">
      <label class="input-label">AI REASONING / NOTE</label>
      <textarea class="input" id="sig-note" placeholder="Brief trade reasoning..." style="min-height:80px;resize:vertical"></textarea>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">CONFIDENCE %</label>
        <input type="number" class="input" id="sig-conf" placeholder="75" min="0" max="100">
      </div>
      <div class="input-group">
        <label class="input-label">MARKET SESSION</label>
        <select class="input" id="sig-session">
          <option value="LONDON">LONDON</option>
          <option value="NEW_YORK">NEW YORK</option>
          <option value="ASIAN">ASIAN</option>
          <option value="OVERLAP">OVERLAP</option>
        </select>
      </div>
    </div>
    <button class="btn btn-primary" id="post-signal-btn">📡 POST SIGNAL</button>
  </div>

  <div class="table-wrap">
    <table class="admin-table">
      <thead>
        <tr><th>PAIR</th><th>BIAS</th><th>ENTRY</th><th>SL</th><th>TP1</th><th>OUTCOME</th><th>TIME</th><th>ACTIONS</th></tr>
      </thead>
      <tbody id="signals-tbody">
        <tr><td colspan="8" style="text-align:center;padding:30px"><div class="spinner"></div></td></tr>
      </tbody>
    </table>
  </div>`;

document.getElementById("post-signal-btn").onclick = async () => {
  const pair = document.getElementById("sig-pair").value.trim().toUpperCase();
  const bias = document.getElementById("sig-bias").value;
  const ef = document.getElementById("sig-entry-from").value;
  const et = document.getElementById("sig-entry-to").value;
  const sl = document.getElementById("sig-sl").value;
  const slp = document.getElementById("sig-sl-pips").value;
  const tp1 = document.getElementById("sig-tp1").value;
  const tp1rr = document.getElementById("sig-tp1-rr").value;
  const tp2 = document.getElementById("sig-tp2").value;
  const tp3 = document.getElementById("sig-tp3").value;
  const note = document.getElementById("sig-note").value.trim();
  const conf = document.getElementById("sig-conf").value;
  const session = document.getElementById("sig-session").value;

  if (!pair || !ef || !sl || !tp1) { Toast.error("Fill in pair, entry, SL and TP1"); return; }

  const btn = document.getElementById("post-signal-btn");
  btnLoading(btn, true);

  const payload = {
    pair, bias,
    entry_zone: { from: parseFloat(ef), to: parseFloat(et||ef), description: `${bias} entry zone` },
    stop_loss: { price: parseFloat(sl), pips: parseInt(slp||0), description: "Structure based SL" },
    tp1: { price: parseFloat(tp1), pips: 0, rr_ratio: tp1rr || "1:1" },
    tp2: tp2 ? { price: parseFloat(tp2), pips: 0, rr_ratio: "1:2" } : null,
    tp3: tp3 ? { price: parseFloat(tp3), pips: 0, rr_ratio: "1:3" } : null,
    reasoning: note ? { "4h_analysis": note } : null,
    confidence_score: conf ? parseInt(conf) : null,
    market_session: session,
    note,
  };

  const data = await API.post("/signals", payload);
  btnLoading(btn, false);

  if (data?.success) {
    Toast.success("Signal posted and users notified!");
    document.getElementById("sig-pair").value = "";
    document.getElementById("sig-entry-from").value = "";
    document.getElementById("sig-entry-to").value = "";
    document.getElementById("sig-sl").value = "";
    document.getElementById("sig-tp1").value = "";
    document.getElementById("sig-tp2").value = "";
    document.getElementById("sig-tp3").value = "";
    document.getElementById("sig-note").value = "";
    loadSignals();
  } else Toast.error(data?.message || "Failed to post signal");
};

async function loadSignals() {
  const data = await API.get("/signals?limit=30");
  const tbody = document.getElementById("signals-tbody");
  if (!data?.success || !data.signals.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">No signals yet</td></tr>`;
    return;
  }
  tbody.innerHTML = data.signals.map(s => `
    <tr>
      <td style="font-family:var(--font-display);font-weight:700">${s.pair}</td>
      <td>${biasBadge(s.bias)}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--cyan)">${s.entry_zone?.from||"—"}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--danger)">${s.stop_loss?.price||"—"}</td>
      <td style="font-family:var(--font-mono);font-size:0.8rem;color:var(--success)">${s.tp1?.price||"—"}</td>
      <td>
        <select class="input" style="padding:4px 8px;font-size:0.72rem;width:auto" onchange="setOutcome('${s.id}',this.value)">
          <option value="" ${!s.outcome?"selected":""}>Running</option>
          <option value="win" ${s.outcome==="win"?"selected":""}>✅ Win</option>
          <option value="loss" ${s.outcome==="loss"?"selected":""}>❌ Loss</option>
          <option value="breakeven" ${s.outcome==="breakeven"?"selected":""}>💰 BE</option>
        </select>
      </td>
      <td style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)">${timeAgo(s.created_at)}</td>
      <td>
        <button class="action-btn action-ban" onclick="deleteSignal('${s.id}')">Remove</button>
      </td>
    </tr>`).join("");
}

async function setOutcome(id, outcome) {
  if (!outcome) return;
  const data = await API.patch(`/signals/${id}/outcome`, { outcome });
  if (data?.success) Toast.success("Outcome updated");
  else Toast.error("Failed to update outcome");
}

async function deleteSignal(id) {
  showConfirm("Remove Signal", "Remove this signal from the feed?", async () => {
    const data = await API.delete(`/signals/${id}`);
    if (data?.success) { Toast.success("Signal removed"); loadSignals(); }
    else Toast.error("Failed to remove signal");
  });
}

loadSignals();
