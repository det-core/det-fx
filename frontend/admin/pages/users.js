// admin/pages/users.js — Users Management
document.getElementById("page-title").textContent = "ALL USERS";

document.getElementById("page-content").innerHTML = `
  <div class="search-bar">
    <input type="text" class="input" id="search-input" placeholder="Search by email or username..." style="flex:1;max-width:300px">
    <select class="input" id="plan-filter" style="width:auto">
      <option value="">All Plans</option>
      <option value="free">Free</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>
    <button class="btn btn-primary btn-sm" style="width:auto" onclick="loadUsers()">Search</button>
  </div>
  <div class="table-wrap">
    <table class="admin-table">
      <thead>
        <tr>
          <th>USER</th><th>PLAN</th><th>JOINED</th><th>STATUS</th><th>ACTIONS</th>
        </tr>
      </thead>
      <tbody id="users-tbody">
        <tr><td colspan="5" style="text-align:center;padding:30px"><div class="spinner"></div></td></tr>
      </tbody>
    </table>
  </div>`;

async function loadUsers() {
  const search = document.getElementById("search-input").value.trim();
  const plan = document.getElementById("plan-filter").value;
  let url = `/admin/users?limit=50`;
  if (plan) url += `&plan=${plan}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const data = await API.get(url);
  const tbody = document.getElementById("users-tbody");
  if (!data?.success || !data.users.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-muted)">No users found</td></tr>`;
    return;
  }
  tbody.innerHTML = data.users.map(u => `
    <tr>
      <td>
        <div style="font-family:var(--font-display);font-size:0.8rem;font-weight:600">${u.username}</div>
        <div style="font-size:0.72rem;color:var(--text-muted)">${u.email}</div>
        ${u.is_vpn ? `<span style="font-size:0.6rem;color:var(--warning)">⚠ VPN</span>` : ""}
      </td>
      <td>${planBadge(u.plan)}</td>
      <td style="font-size:0.75rem;color:var(--text-muted);font-family:var(--font-mono)">${formatDate(u.created_at)}</td>
      <td>
        ${u.banned ? `<span class="badge badge-danger">BANNED</span>` : `<span class="badge badge-success">ACTIVE</span>`}
        ${u.chat_banned ? `<span class="badge badge-muted" style="margin-top:4px;display:block">CHAT BANNED</span>` : ""}
      </td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button class="action-btn action-edit" onclick="openUserModal('${u.id}','${u.username}','${u.plan}','${u.role}')">Edit</button>
          <button class="action-btn action-ban" onclick="${u.banned ? `unbanUser('${u.id}')` : `banUser('${u.id}')`}">${u.banned ? "Unban" : "Ban"}</button>
        </div>
      </td>
    </tr>`).join("");
}

function openUserModal(uid, username, plan, role) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-handle"></div>
      <div class="modal-title">Edit: ${username}</div>
      <div class="input-group">
        <label class="input-label">SET PLAN</label>
        <select class="input" id="modal-plan">
          <option value="free" ${plan==="free"?"selected":""}>Free</option>
          <option value="weekly" ${plan==="weekly"?"selected":""}>Weekly</option>
          <option value="monthly" ${plan==="monthly"?"selected":""}>Monthly</option>
        </select>
      </div>
      <div class="input-group">
        <label class="input-label">SET ROLE</label>
        <select class="input" id="modal-role">
          <option value="user" ${role==="user"?"selected":""}>User</option>
          <option value="moderator" ${role==="moderator"?"selected":""}>Moderator</option>
          <option value="admin" ${role==="admin"?"selected":""}>Admin</option>
        </select>
      </div>
      <button class="btn btn-primary" id="save-user-btn">SAVE CHANGES</button>
      <button class="btn btn-outline mt-12" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

  overlay.querySelector("#save-user-btn").onclick = async () => {
    const newPlan = overlay.querySelector("#modal-plan").value;
    const newRole = overlay.querySelector("#modal-role").value;
    const btn = overlay.querySelector("#save-user-btn");
    btnLoading(btn, true);
    const [r1, r2] = await Promise.all([
      API.patch(`/admin/users/${uid}/plan`, { plan: newPlan }),
      API.patch(`/admin/users/${uid}/role`, { role: newRole }),
    ]);
    btnLoading(btn, false);
    if (r1?.success && r2?.success) {
      Toast.success("User updated!");
      overlay.remove();
      loadUsers();
    } else Toast.error("Update failed");
  };
}

async function banUser(uid) {
  showConfirm("Ban User", "Are you sure you want to ban this user?", async () => {
    const data = await API.patch(`/admin/users/${uid}/ban`, { reason: "Admin action" });
    if (data?.success) { Toast.success("User banned"); loadUsers(); }
    else Toast.error("Failed to ban user");
  });
}

async function unbanUser(uid) {
  const data = await API.patch(`/admin/users/${uid}/unban`);
  if (data?.success) { Toast.success("User unbanned"); loadUsers(); }
  else Toast.error("Failed to unban user");
}

loadUsers();
