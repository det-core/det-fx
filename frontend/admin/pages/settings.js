// admin/pages/settings.js
document.getElementById("page-title").textContent = "APP SETTINGS";
document.getElementById("page-content").innerHTML = `
  <div class="form-card">
    <h3>🖼 APP IMAGES (via URL)</h3>
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:16px">Paste image links from Catbox, ImgBB, Cloudinary, or any public HTTPS URL. Changes apply instantly site-wide.</p>
    <div class="input-group">
      <label class="input-label">APP LOGO URL</label>
      <input type="url" class="input" id="s-logo" placeholder="https://files.catbox.moe/xxxxx.png">
      <div id="logo-preview" style="margin-top:8px"></div>
    </div>
    <div class="input-group">
      <label class="input-label">FAVICON URL</label>
      <input type="url" class="input" id="s-favicon" placeholder="https://...">
    </div>
    <div class="input-group">
      <label class="input-label">LANDING HERO IMAGE URL</label>
      <input type="url" class="input" id="s-hero" placeholder="https://...">
    </div>
    <div class="input-group">
      <label class="input-label">PROMO BANNER URL</label>
      <input type="url" class="input" id="s-banner" placeholder="https://...">
    </div>
    <button class="btn btn-primary" id="save-images-btn" style="max-width:220px">SAVE IMAGE SETTINGS</button>
  </div>

  <div class="form-card">
    <h3>⚙️ APP CONFIGURATION</h3>
    <div class="input-group">
      <label class="input-label">APP NAME</label>
      <input type="text" class="input" id="s-appname" placeholder="DET Trades">
    </div>
    <div class="input-group">
      <label class="input-label">TAGLINE</label>
      <input type="text" class="input" id="s-tagline" placeholder="Stop Guessing. Start Trading with Precision.">
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--panel2);border-radius:var(--radius);margin-bottom:12px">
      <div>
        <div style="font-family:var(--font-display);font-size:0.8rem">REFERRAL SYSTEM</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Enable/disable referral rewards</div>
      </div>
      <button type="button" class="toggle-switch" id="referral-toggle" onclick="this.classList.toggle('on')"></button>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:var(--panel2);border-radius:var(--radius);margin-bottom:16px">
      <div>
        <div style="font-family:var(--font-display);font-size:0.8rem;color:var(--danger)">MAINTENANCE MODE</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Takes site offline for all non-admins</div>
      </div>
      <button type="button" class="toggle-switch" id="maintenance-toggle" onclick="this.classList.toggle('on')"></button>
    </div>
    <button class="btn btn-gold" id="save-config-btn" style="max-width:220px">SAVE CONFIGURATION</button>
  </div>`;

// Add toggle switch styles
const style = document.createElement("style");
style.textContent = `.toggle-switch{width:44px;height:24px;background:var(--border2);border-radius:12px;position:relative;transition:background 0.2s;cursor:pointer;border:none}.toggle-switch.on{background:var(--cyan)}.toggle-switch::after{content:'';position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:transform 0.2s}.toggle-switch.on::after{transform:translateX(20px)}`;
document.head.appendChild(style);

async function loadSettings() {
  const data = await API.get("/admin/settings");
  if (!data?.success) return;
  const s = data.settings;

  if (s.app_logo_url) {
    document.getElementById("s-logo").value = s.app_logo_url;
    document.getElementById("logo-preview").innerHTML = `<img src="${s.app_logo_url}" style="height:48px;border-radius:var(--radius);border:1px solid var(--border)">`;
  }
  if (s.app_favicon_url) document.getElementById("s-favicon").value = s.app_favicon_url;
  if (s.hero_image_url) document.getElementById("s-hero").value = s.hero_image_url;
  if (s.promo_banner_url) document.getElementById("s-banner").value = s.promo_banner_url;
  if (s.app_name) document.getElementById("s-appname").value = s.app_name;
  if (s.tagline) document.getElementById("s-tagline").value = s.tagline;
  if (s.referral_enabled !== false) document.getElementById("referral-toggle").classList.add("on");
  if (s.maintenance_mode) document.getElementById("maintenance-toggle").classList.add("on");
}

document.getElementById("s-logo").addEventListener("input", e => {
  const url = e.target.value.trim();
  document.getElementById("logo-preview").innerHTML = url ? `<img src="${url}" style="height:48px;border-radius:var(--radius);border:1px solid var(--border)" onerror="this.style.display='none'">` : "";
});

document.getElementById("save-images-btn").onclick = async () => {
  const btn = document.getElementById("save-images-btn");
  btnLoading(btn, true);
  const data = await API.put("/admin/settings", {
    app_logo_url: document.getElementById("s-logo").value.trim() || null,
    app_favicon_url: document.getElementById("s-favicon").value.trim() || null,
    hero_image_url: document.getElementById("s-hero").value.trim() || null,
    promo_banner_url: document.getElementById("s-banner").value.trim() || null,
  });
  btnLoading(btn, false);
  if (data?.success) Toast.success("Image settings saved! Changes are live.");
  else Toast.error("Failed to save settings");
};

document.getElementById("save-config-btn").onclick = async () => {
  const btn = document.getElementById("save-config-btn");
  btnLoading(btn, true);
  const data = await API.put("/admin/settings", {
    app_name: document.getElementById("s-appname").value.trim() || null,
    tagline: document.getElementById("s-tagline").value.trim() || null,
    referral_enabled: document.getElementById("referral-toggle").classList.contains("on"),
    maintenance_mode: document.getElementById("maintenance-toggle").classList.contains("on"),
  });
  btnLoading(btn, false);
  if (data?.success) Toast.success("Configuration saved!");
  else Toast.error("Failed to save configuration");
};

loadSettings();
