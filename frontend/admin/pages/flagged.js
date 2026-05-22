// admin/pages/flagged.js
document.getElementById("page-title").textContent = "FLAGGED IPs";
document.getElementById("page-content").innerHTML = `
  <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">IPs are automatically flagged when multiple accounts are detected. Blocked IPs cannot access the app.</p>
  <div class="table-wrap">
    <table class="admin-table">
      <thead>
        <tr><th>IP ADDRESS</th><th>STATUS</th><th>ACCOUNTS</th><th>COUNT</th><th>LAST UPDATED</th><th>ACTIONS</th></tr>
      </thead>
      <tbody id="flagged-tbody">
        <tr><td colspan="6" style="text-align:center;padding:30px"><div class="spinner"></div></td></tr>
      </tbody>
    </table>
  </div>`;

async function loadFlagged() {
  const data = await API.get("/admin/flagged-ips");
  const tbody = document.getElementById("flagged-tbody");
  if (!data?.success || !data.ips.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">No flagged IPs — all clean ✅</td></tr>`;
    return;
  }
  tbody.innerHTML = data.ips.map(ip => `
    <tr>
      <td style="font-family:var(--font-mono);font-size:0.85rem">${ip.id}</td>
      <td>
        ${ip.status === "blocked" ? `<span class="badge badge-danger">BLOCKED</span>` : `<span class="badge badge-muted">FLAGGED</span>`}
      </td>
      <td style="font-size:0.75rem;color:var(--text-muted)">${ip.accounts?.length || 0} accounts</td>
      <td style="font-family:var(--font-mono)">${ip.count || 0}</td>
      <td style="font-size:0.72rem;color:var(--text-muted);font-family:var(--font-mono)">${formatDate(ip.updated_at)}</td>
      <td>
        <div style="display:flex;gap:6px">
          ${ip.status === "blocked"
            ? `<button class="action-btn action-edit" onclick="unblockIP('${ip.id}')">Unblock</button>`
            : `<button class="action-btn action-ban" onclick="blockIP('${ip.id}')">Block</button>`}
        </div>
      </td>
    </tr>`).join("");
}

async function blockIP(ip) {
  showConfirm("Block IP", `Block all access from ${ip}?`, async () => {
    const data = await API.patch(`/admin/flagged-ips/${encodeURIComponent(ip)}/block`);
    if (data?.success) { Toast.success("IP blocked"); loadFlagged(); }
    else Toast.error("Failed to block IP");
  });
}

async function unblockIP(ip) {
  const data = await API.patch(`/admin/flagged-ips/${encodeURIComponent(ip)}/unblock`);
  if (data?.success) { Toast.success("IP unblocked"); loadFlagged(); }
  else Toast.error("Failed to unblock IP");
}

loadFlagged();
