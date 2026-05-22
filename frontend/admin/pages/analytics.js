// admin/pages/analytics.js
document.getElementById("page-title").textContent = "ANALYTICS";
document.getElementById("page-content").innerHTML = `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
    <div class="card"><div class="ov-icon">💰</div><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:900;color:var(--gold)" id="total-revenue">—</div><div style="font-size:0.7rem;color:var(--text-muted)">TOTAL REVENUE</div></div>
    <div class="card"><div class="ov-icon">📊</div><div style="font-family:var(--font-display);font-size:1.4rem;font-weight:900;color:var(--cyan)" id="total-analyses">—</div><div style="font-size:0.7rem;color:var(--text-muted)">TOTAL ANALYSES</div></div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <p class="section-title" style="margin-bottom:12px">TOP PAIRS ANALYZED</p>
    <div id="top-pairs"><div class="spinner"></div></div>
  </div>
  <div class="card">
    <p class="section-title" style="margin-bottom:12px">USER GROWTH (LAST 14 DAYS)</p>
    <div id="growth-chart"><div class="spinner"></div></div>
  </div>`;

async function loadAnalytics() {
  const data = await API.get("/admin/analytics");
  if (!data?.success) return;
  const a = data.analytics;

  document.getElementById("total-revenue").textContent = `₦${(a.total_revenue_naira||0).toLocaleString()}`;
  document.getElementById("total-analyses").textContent = a.total_analyses || 0;

  // Top pairs
  if (a.top_pairs?.length) {
    const max = a.top_pairs[0].count;
    document.getElementById("top-pairs").innerHTML = a.top_pairs.map(p => `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-family:var(--font-mono);font-size:0.82rem">${p.pair}</span>
          <span style="font-size:0.75rem;color:var(--text-muted)">${p.count} analyses</span>
        </div>
        <div style="height:4px;background:var(--border);border-radius:2px">
          <div style="height:100%;width:${Math.round((p.count/max)*100)}%;background:var(--cyan);border-radius:2px;transition:width 0.8s"></div>
        </div>
      </div>`).join("");
  } else document.getElementById("top-pairs").innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem">No analyses yet</p>`;

  // Growth chart (simple bar)
  if (a.user_growth_14d?.length) {
    const gmax = Math.max(...a.user_growth_14d.map(d => d.count), 1);
    document.getElementById("growth-chart").innerHTML = `
      <div style="display:flex;align-items:flex-end;gap:4px;height:80px;padding-bottom:4px">
        ${a.user_growth_14d.map(d => `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">
            <div style="width:100%;background:var(--cyan);border-radius:3px 3px 0 0;height:${Math.max((d.count/gmax)*72,2)}px;transition:height 0.8s;opacity:${d.count>0?1:0.2}"></div>
            <div style="font-size:0.55rem;color:var(--text-muted);font-family:var(--font-mono);white-space:nowrap">${new Date(d.date).getDate()}</div>
          </div>`).join("")}
      </div>`;
  }
}

loadAnalytics();
