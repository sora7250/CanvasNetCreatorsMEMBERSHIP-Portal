/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) Core Script
 * バグ修復版：在席自動同期 ＆ 起動パイプライン
 */

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz7wVXb9xMqNHK_L3NCvhRlFfPF3Rdg-0JRaDpcY9US6e4HRSU20-xTCZNoJeMkxDqUbw/exec";

let currentUser = {
  customId: localStorage.getItem('cncm_custom_id') || '',
  name: localStorage.getItem('cncm_username') || 'クリエイター',
  avatar: localStorage.getItem('cncm_avatar') || '🎨',
  customImage: localStorage.getItem('cncm_custom_image') || null,
  rank: localStorage.getItem('cncm_rank') || 'Coal',
  likesReceived: parseInt(localStorage.getItem('cncm_likes') || '0', 10)
};

let loungeMembers = [];
let openChatMessages = [];

// ================= 在席生存信号 ＆ 切断通知 =================
setInterval(() => {
  if (currentUser.customId && !GAS_API_URL.includes("YOUR_GAS")) {
    fetch(`${GAS_API_URL}?action=heartbeat&customId=${encodeURIComponent(currentUser.customId)}`, { mode: "no-cors" }).catch(() => {});
  }
}, 60000);

window.addEventListener('beforeunload', () => {
  if (currentUser.customId && !GAS_API_URL.includes("YOUR_GAS")) {
    navigator.sendBeacon(`${GAS_API_URL}?action=logout&customId=${encodeURIComponent(currentUser.customId)}`);
  }
});

// ================= 【バグ治療】在席メンバー自動同期（30秒周期） =================
function syncLoungeMembersFromGAS() {
  if (GAS_API_URL.includes("YOUR_GAS")) return;
  fetch(`${GAS_API_URL}?action=getLoungeMembers`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        loungeMembers = data;
        renderLoungeMembers();
        
        // ダッシュボード側のオンライン数も更新
        const onlineCount = data.filter(m => m.isOnline).length;
        const dashOnlineEl = document.getElementById('dashOnlineCount');
        if (dashOnlineEl) dashOnlineEl.innerText = onlineCount;
        const counterEl = document.getElementById('loungeOnlineCounter');
        if (counterEl) counterEl.innerText = `● ${onlineCount}名在席中`;
      }
    })
    .catch(() => {});
}

function renderLoungeMembers() {
  const list = document.getElementById('loungeMemberList');
  if (!list) return;
  list.innerHTML = '';

  const onlineList = loungeMembers.filter(m => m.isOnline);

  if (onlineList.length === 0) {
    list.innerHTML = '<div class="empty-state-notice">現在在席中のメンバーはいません</div>';
    return;
  }

  onlineList.forEach(m => {
    const row = document.createElement('div');
    row.className = 'member-row';
    row.onclick = () => window.openUserProfile ? window.openUserProfile(m.customId) : null;

    row.innerHTML = `
      <div class="header-avatar">${m.avatar || '🎨'}</div>
      <span class="status-dot dot-${m.status || 'ok'}"></span>
      <div style="flex:1; min-width:0;">
        <div style="display:flex; justify-content:space-between;">
          <strong>${m.name}</strong>
          <span class="sub-text" style="color:var(--status-${m.status || 'ok'});">${m.status==='busy'?'全集中':m.status==='ok'?'話しかけOK':'作業中'}</span>
        </div>
        <div class="sub-text" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.task || '集中制作中'}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

function updateLoungeStatus() {
  const mode = document.getElementById('myStatusMode').value;
  const task = document.getElementById('myTaskInput').value.trim() || '集中制作中';

  // 楽観的更新
  loungeMembers = loungeMembers.filter(m => m.customId !== currentUser.customId);
  loungeMembers.unshift({
    customId: currentUser.customId,
    name: currentUser.name,
    avatar: currentUser.avatar,
    status: mode,
    task: task,
    isOnline: true
  });
  renderLoungeMembers();

  if (!GAS_API_URL.includes("YOUR_GAS")) {
    fetch(GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "updateStatus",
        customId: currentUser.customId,
        nickname: currentUser.name,
        status: mode,
        task: task
      })
    });
  }
  showCustomDialog({ icon: '🟢', title: 'ステータス更新', message: '自習室の在席状況を更新しました。' });
}

// ================= 基本UI制御・ナビゲーション =================
function switchMainTab(panelId, btn) {
  document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.app-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(panelId);
  if (target) target.classList.add('active');
}

function switchSubTab(parentPanelId, subPanelId, btn) {
  const parent = document.getElementById(parentPanelId);
  if (!parent) return;
  parent.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const target = document.getElementById(subPanelId);
  if (target) target.classList.add('active');
}

function updateUserHeaderUI() {
  document.getElementById('displayUsername').innerText = `${currentUser.name} (${currentUser.customId})`;
  const badge = document.getElementById('headerRankBadge');
  badge.className = `ore-rank-badge rank-${currentUser.rank.toLowerCase()}`;
  badge.innerText = currentUser.rank;

  const avatarBox = document.getElementById('headerAvatar');
  if (currentUser.customImage) {
    avatarBox.innerHTML = `<img src="${currentUser.customImage}">`;
  } else {
    avatarBox.innerText = currentUser.avatar;
  }
}

function showCustomDialog(options) {
  return new Promise((resolve) => {
    const d = document.getElementById('customDialog');
    document.getElementById('dialogIcon').innerText = options.icon || 'ℹ️';
    document.getElementById('dialogTitle').innerText = options.title || '通知';
    document.getElementById('dialogMessage').innerText = options.message || '';
    document.getElementById('dialogConfirmBtn').onclick = () => { d.style.display = 'none'; resolve(true); };
    d.style.display = 'flex';
  });
}

function openModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

// ================= 起動処理 =================
window.onload = () => {
  updateUserHeaderUI();
  syncLoungeMembersFromGAS();
  setInterval(syncLoungeMembersFromGAS, 30000); // 30秒ごとの自動同期待ち受け

  // 初回チュートリアル判定
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('tutorial') === 'first') {
    document.getElementById('tutorialOverlay').style.display = 'flex';
  }

  // 運営アカウント自動直行判定（機能⑬）
  if (urlParams.get('launchAdmin') === 'true' || localStorage.getItem('cncm_is_admin') === 'true') {
    if (window.launchAdminCommandCenter) window.launchAdminCommandCenter();
  }
};
