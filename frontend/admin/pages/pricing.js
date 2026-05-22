// admin/pages/pricing.js
document.getElementById("page-title").textContent = "PRICING";
document.getElementById("page-content").innerHTML = `
  <div class="form-card">
    <h3>💰 SUBSCRIPTION PRICING</h3>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Prices in Nigerian Naira (NGN). Enter amount in kobo (₦1 = 100 kobo). Example: ₦5,000 = 500000</p>
    <div id="pricing-form"><div class="spinner"></div></div>
  </div>
  <div class="form-card">
    <h3>🔗 PAYSTACK PLAN CODES</h3>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Optional. Create recurring plans in Paystack dashboard and paste the plan codes here for auto-renewal.</p>
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">WEEKLY PLAN CODE</label>
        <input type="text" class="input" id="weekly-plan-code" placeholder="PLN_xxxxxxxxxx">
      </div>
      <div class="input-group">
        <label class="input-label">MONTHLY PLAN CODE</label>
        <input type="text" class="input" id="monthly-plan-code" placeholder="PLN_xxxxxxxxxx">
      </div>
    </div>
    <button class="btn btn-outline" id="save-codes-btn" style="max-width:200px">SAVE PLAN CODES</button>
  </div>`;

async function loadPricing() {
  const data = await API.get("/admin/pricing");
  if (!data?.success) return;
  const { weekly, monthly } = data.pricing;
  document.getElementById("pricing-form").innerHTML = `
    <div class="form-row">
      <div class="input-group">
        <label class="input-label">WEEKLY PRICE (kobo)</label>
        <div class="input-icon">
          <span class="icon">₦</span>
          <input type="number" class="input" id="weekly-price" value="${weekly?.price||500000}" placeholder="500000">
        </div>
        <span style="font-size:0.72rem;color:var(--text-muted)" id="weekly-display">= ₦${((weekly?.price||500000)/100).toLocaleString()}</span>
      </div>
      <div class="input-group">
        <label class="input-label">MONTHLY PRICE (kobo)</label>
        <div class="input-icon">
          <span class="icon">₦</span>
          <input type="number" class="input" id="monthly-price" value="${monthly?.price||1500000}" placeholder="1500000">
        </div>
        <span style="font-size:0.72rem;color:var(--text-muted)" id="monthly-display">= ₦${((monthly?.price||1500000)/100).toLocaleString()}</span>
      </div>
    </div>
    <button class="btn btn-primary" id="save-pricing-btn" style="max-width:200px">SAVE PRICES</button>`;

  if (weekly?.paystack_plan_code) document.getElementById("weekly-plan-code").value = weekly.paystack_plan_code;
  if (monthly?.paystack_plan_code) document.getElementById("monthly-plan-code").value = monthly.paystack_plan_code;

  document.getElementById("weekly-price").addEventListener("input", e => {
    document.getElementById("weekly-display").textContent = `= ₦${(parseInt(e.target.value||0)/100).toLocaleString()}`;
  });
  document.getElementById("monthly-price").addEventListener("input", e => {
    document.getElementById("monthly-display").textContent = `= ₦${(parseInt(e.target.value||0)/100).toLocaleString()}`;
  });

  document.getElementById("save-pricing-btn").onclick = async () => {
    const wp = document.getElementById("weekly-price").value;
    const mp = document.getElementById("monthly-price").value;
    const btn = document.getElementById("save-pricing-btn");
    btnLoading(btn, true);
    const data = await API.put("/admin/pricing", { weekly: { price: parseInt(wp) }, monthly: { price: parseInt(mp) } });
    btnLoading(btn, false);
    if (data?.success) Toast.success("Prices updated!");
    else Toast.error("Failed to update prices");
  };

  document.getElementById("save-codes-btn").onclick = async () => {
    const wc = document.getElementById("weekly-plan-code").value.trim();
    const mc = document.getElementById("monthly-plan-code").value.trim();
    const btn = document.getElementById("save-codes-btn");
    btnLoading(btn, true);
    const data = await API.put("/admin/pricing", {
      weekly: { paystack_plan_code: wc || null },
      monthly: { paystack_plan_code: mc || null },
    });
    btnLoading(btn, false);
    if (data?.success) Toast.success("Plan codes saved!");
    else Toast.error("Failed to save plan codes");
  };
}

loadPricing();
