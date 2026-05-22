// admin/pages/coupons.js
document.getElementById("page-title").textContent = "COUPONS";
document.getElementById("page-content").innerHTML = `
  <div class="form-card">
    <h3>🎟 CREATE COUPON</h3>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">COUPON CODE</label>
        <input type="text" class="input" id="coup-code" placeholder="e.g. DETLAUNCH50" style="text-transform:uppercase" maxlength="20">
      </div>
      <div class="input-group">
        <label class="input-label">DISCOUNT TYPE</label>
        <select class="input" id="coup-type">
          <option value="percent">Percentage (%)</option>
          <option value="fixed">Fixed Amount (kobo)</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">DISCOUNT VALUE</label>
        <input type="number" class="input" id="coup-value" placeholder="e.g. 20 for 20% or 100000 for ₦1000">
      </div>
      <div class="input-group">
        <label class="input-label">PLAN (leave blank for all)</label>
        <select class="input" id="coup-plan">
          <option value="">All Plans</option>
          <option value="weekly">Weekly Only</option>
          <option value="monthly">Monthly Only</option>
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">USAGE LIMIT (blank = unlimited)</label>
        <input type="number" class="input" id="coup-limit" placeholder="e.g. 100">
      </div>
      <div class="input-group">
        <label class="input-label">EXPIRY DATE (blank = no expiry)</label>
        <input type="date" class="input" id="coup-expiry">
      </div>
    </div>
    <button class="btn btn-primary" id="create-coup-btn" style="max-width:200px">CREATE COUPON</button>
  </div>

  <div class="table-wrap">
    <table class="admin-table">
      <thead>
        <tr><th>CODE</th><th>DISCOUNT</th><th>PLAN</th><th>USED</th><th>LIMIT</th><th>EXPIRES</th><th>STATUS</th><th>ACTIONS</th></tr>
      </thead>
      <tbody id="coupons-tbody">
        <tr><td colspan="8" style="text-align:center;padding:30px"><div class="spinner"></div></td></tr>
      </tbody>
    </table>
  </div>`;

document.getElementById("coup-code").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase(); });

document.getElementById("create-coup-btn").onclick = async () => {
  const code = document.getElementById("coup-code").value.trim();
  const discount_type = document.getElementById("coup-type").value;
  const discount_value = document.getElementById("coup-value").value;
  const plan = document.getElementById("coup-plan").value || null;
  const usage_limit = document.getElementById("coup-limit").value || null;
  const expires_at = document.getElementById("coup-expiry").value || null;

  if (!code || !discount_value) { Toast.error("Code and discount value are required"); return; }

  const btn = document.getElementById("create-coup-btn");
  btnLoading(btn, true);
  const data = await API.post("/admin/coupons", { code, discount_type, discount_value: parseFloat(discount_value), plan, usage_limit: usage_limit ? parseInt(usage_limit) : null, expires_at });
  btnLoading(btn, false);

  if (data?.success) {
    Toast.success(`Coupon "${code}" created!`);
    document.getElementById("coup-code").value = "";
    document.getElementById("coup-value").value = "";
    loadCoupons();
  } else Toast.error(data?.message || "Failed to create coupon");
};

async function loadCoupons() {
  const data = await API.get("/admin/coupons");
  const tbody = document.getElementById("coupons-tbody");
  if (!data?.success || !data.coupons.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted)">No coupons yet</td></tr>`;
    return;
  }
  tbody.innerHTML = data.coupons.map(c => `
    <tr>
      <td style="font-family:var(--font-mono);font-weight:700;color:var(--gold)">${c.code}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem">${c.discount_type === "percent" ? `${c.discount_value}%` : `₦${(c.discount_value/100).toLocaleString()}`}</td>
      <td>${c.plan ? `<span class="badge ${c.plan==="monthly"?"badge-gold":"badge-cyan"}">${c.plan.toUpperCase()}</span>` : `<span class="badge badge-muted">ALL</span>`}</td>
      <td style="font-family:var(--font-mono)">${c.usage_count||0}</td>
      <td style="font-family:var(--font-mono)">${c.usage_limit||"∞"}</td>
      <td style="font-size:0.75rem;color:var(--text-muted)">${c.expires_at ? formatDate(c.expires_at) : "Never"}</td>
      <td>
        <button class="action-btn ${c.active?"action-ban":"action-edit"}" onclick="toggleCoupon('${c.id}',${!c.active})">
          ${c.active ? "Disable" : "Enable"}
        </button>
      </td>
      <td>
        <button class="action-btn action-delete" onclick="deleteCoupon('${c.id}','${c.code}')">Delete</button>
      </td>
    </tr>`).join("");
}

async function toggleCoupon(id, active) {
  const data = await API.patch(`/admin/coupons/${id}`, { active });
  if (data?.success) { Toast.success(`Coupon ${active?"enabled":"disabled"}`); loadCoupons(); }
  else Toast.error("Failed to update coupon");
}

async function deleteCoupon(id, code) {
  showConfirm("Delete Coupon", `Delete coupon "${code}"? This cannot be undone.`, async () => {
    const data = await API.delete(`/admin/coupons/${id}`);
    if (data?.success) { Toast.success("Coupon deleted"); loadCoupons(); }
    else Toast.error("Failed to delete coupon");
  });
}

loadCoupons();
