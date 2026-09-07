/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) Core Script
 * バージョン：2.1 (タブID自動整合・サブパネル強制起動アップデート版)
 */

// ================= 1. 定数 ＆ アプリ初期状態 =================
const FORBIDDEN_WORDS = [
  '本名', 'LINE', 'ライン', '本名教えて', 'どこ住み', '住所', 
  '電話番号', '高校どこ', '学校どこ', 'インスタ', '会おう', 'DMして'
];

const EMOJI_PALETTE = [
  '🎨','🎧','🎬','💻','🖋️','🎹','🎸','📷','🕹️','☕','🚀','🔥','✨','📐','🛠️',
  '🎙️','💡','👾','⚡','🌌','🐺','🐱','🦊','🌸','🍙','🍺','🧩','📦','🪐','🔮'
];

let currentUser = {
  id: 'u_' + Math.floor(Math.random() * 10000),
  name: localStorage.getItem('cncm_username') || '未認証クリエイター',
  avatar: localStorage.getItem('cncm_avatar') || '🎨',
  customImage: localStorage.getItem('cncm_custom_image') || null,
  rank: localStorage.getItem('cncm_rank') || 'bronze',
  likesReceived: 12
};

let currentAdminRole = 'オーナー';
let isSafeMode = false;
let groupViewMode = 'card';
let selectedGroupTags = [];

// メインタブ定義（HTML内のIDと完全一致）
const defaultTabs = [
  { id: 'panel-lounge', name: '🏠 ポート・ラウンジ' },
  { id: 'panel-groups', name: '👥 グループ' },
  { id: 'panel-forum', name: '💬 相談・Q&A' },
  { id: 'panel-events', name: '🏆 企画・お題' },
  { id: 'panel-drive', name: '📁 素材ドライブ' }
];

// 【自動修正ロジック】過去の古いタブID（panel-が付いていないID）が残っていれば自動修復
let savedTabOrder = null;
try {
  savedTabOrder = JSON.parse(localStorage.getItem('cncm_tab_order'));
  if (savedTabOrder && savedTabOrder.some(t => !t.id.startsWith('panel-'))) {
    localStorage.removeItem('cncm_tab_order');
    savedTabOrder = null;
  }
} catch (e) {
  savedTabOrder = null;
}
let currentTabs = savedTabOrder || defaultTabs;

// データストア
let loungeMembers = [
  { id: 'm1', name: 'サウンド職人B', avatar: '🎧', status: 'ok', task: 'ドラムトラックの打ち込み中。意見求む！' },
  { id: 'm2', name: 'ペンシル04', avatar: '🖋️', status: 'busy', task: 'キービジュアルのネーム（全集中中）' },
  { id: 'm3', name: 'カット編集マン', avatar: '🎬', status: 'work', task: 'PVのカット割り尺詰め' },
  { id: 'm4', name: 'WebCoder_X', avatar: '💻', status: 'rest', task: '息抜きにYouTube徘徊中' }
];

let openChatMessages = [
  { id: 1, author: 'サウンド職人B', avatar: '🎧', text: 'ラウンジ開きました。今夜も作業していきます', likes: 2, read: true },
  { id: 2, author: 'ペンシル04', avatar: '🖋️', text: 'お疲れ様です！ネーム描いてます', likes: 1, read: true },
  { id: 3, author: 'カット編集マン', avatar: '🎬', text: '新エフェクト試してるけど面白いですね', likes: 0, read: false },
  { id: 4, author: 'WebCoder_X', avatar: '💻', text: '何か詰まったら気軽にメンションどうぞ！', likes: 3, read: false }
];

let groups = [
  {
    id: 'g1',
    icon: '🎧',
    name: '夜更かしDTMセッション',
    desc: '深夜帯に集まってBGMやループ音源を作るグループ',
    leader: 'サウンド職人B',
    members: ['サウンド職人B', 'WebCoder_X'],
    invited: ['カット編集マン'],
    tags: ['音響DTM', '深夜制作'],
    folder: 'CNCM_DTM_Night'
  },
  {
    id: 'g2',
    icon: '🎬',
    name: 'AEモーショングラフィックス研究',
    desc: 'モーショングラフィックスの技法研究とプリセット共有',
    leader: 'カット編集マン',
    members: ['カット編集マン'],
    invited: [],
    tags: ['映像', 'AfterEffects'],
    folder: 'CNCM_AE_Motion'
  }
];

let forumThreads = [
  {
    id: 't1',
    category: 'help',
    title: 'Premiere Proで書き出し時に特定フレームでクラッシュする',
    author: 'カット編集マン',
    body: 'ルミトリカラーを重ね掛けしたクリップの45秒地点でエンコードエラーが出ます。メディアエンコーダー経由でも同様。回避策知ってる方いますか？',
    driveUrl: 'https://drive.google.com/file/d/1_dummy_preview_id/preview',
    replies: [
      { author: 'WebCoder_X', text: 'レンダラーをソフトウェア処理に切り替えるか、GPUドライバをStudio版に更新すると治ることが多いです！', best: true }
    ],
    solved: true
  },
  {
    id: 't2',
    category: 'compare',
    title: '新曲のキックの抜け感、AとBどっちが好きですか？',
    author: 'サウンド職人B',
    body: 'サイドチェインを強めにしたAパターンと、EQで中域を削ったBパターンです。意見聞かせてほしいです。',
    driveUrl: 'https://drive.google.com/file/d/2_dummy_preview_id/preview',
    replies: [],
    solved: false
  }
];

let eventTopics = [
  {
    id: 'e1',
    title: '雨の音を使った15秒ループ音源・映像制作',
    desc: '環境音（雨音）を取り入れ、15秒で綺麗にシームレスループする作品を制作してください。',
    driveFolder: 'https://drive.google.com/drive/folders/dummy_rain_asset',
    entries: [
      { id: 'w1', title: 'Rainy Night Lo-Fi', author: 'サウンド職人B', likes: 18, driveUrl: 'https://drive.google.com/file/d/w1_dummy/preview' },
      { id: 'w2', title: 'Droplet Motion #01', author: 'ペンシル04', likes: 25, driveUrl: 'https://drive.google.com/file/d/w2_dummy/preview' }
    ]
  }
];

let adminAuditLogs = [
  { time: '2026-09-07 20:05', user: '匿名ゲスト99', flag: '禁止ワード検知', content: '「俺のLINEは〜〜」' },
  { time: '2026-09-07 19:40', user: '匿名クリエイター12', flag: '短時間連投検知', content: '同一メッセージ5回' }
];

// ================= 2. 独自ダイアログシステム (提案②) =================
function showCustomDialog(options) {
  return new Promise((resolve) => {
    const dialog = document.getElementById('customDialog');
    const icon = document.getElementById('dialogIcon');
    const title = document.getElementById('dialogTitle');
    const msg = document.getElementById('dialogMessage');
    const confirmBtn = document.getElementById('dialogConfirmBtn');
    const cancelBtn = document.getElementById('dialogCancelBtn');

    icon.innerText = options.icon || 'ℹ️';
    title.innerText = options.title || '通知';
    msg.innerText = options.message || '';
    
    confirmBtn.innerText = options.confirmText || 'OK';
    if (options.isConfirm) {
      cancelBtn.style.display = 'inline-flex';
      cancelBtn.innerText = options.cancelText || 'キャンセル';
    } else {
      cancelBtn.style.display = 'none';
    }

    dialog.style.display = 'flex';

    confirmBtn.onclick = () => {
      dialog.style.display = 'none';
      resolve(true);
    };
    cancelBtn.onclick = () => {
      dialog.style.display = 'none';
      resolve(false);
    };
  });
}

// ================= 3. 全画面制御システム (提案③) =================
const fullscreenBtn = document.getElementById('fullscreenToggleBtn');
if (fullscreenBtn) {
  fullscreenBtn.addEventListener('click', toggleFullscreen);
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
    if (fullscreenBtn) fullscreenBtn.innerText = '✕ 全画面終了';
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    if (fullscreenBtn) fullscreenBtn.innerText = '⛶ 全画面';
  }
}

window.addEventListener('click', function autoFullOnce() {
  if (!document.fullscreenElement && !window._fsTriggered) {
    window._fsTriggered = true;
    document.documentElement.requestFullscreen().catch(() => {});
    if (fullscreenBtn) fullscreenBtn.innerText = '✕ 全画面終了';
  }
  window.removeEventListener('click', autoFullOnce);
}, { once: true });

// ================= 4. タブ＆レイアウト描画（修復済み） =================
function renderMainTabs() {
  const bar = document.getElementById('mainTabBar');
  if (!bar) return;
  bar.innerHTML = '';

  currentTabs.forEach((tab, index) => {
    const btn = document.createElement('button');
    btn.className = `main-tab-btn ${index === 0 ? 'active' : ''}`;
    btn.innerText = tab.name;
    btn.onclick = (e) => switchMainTab(tab.id, e.target);
    bar.appendChild(btn);
  });

  // 最初のタブのパネルを強制的に立ち上げる
  if (currentTabs.length > 0) {
    showMainPanel(currentTabs[0].id);
  }
  renderTabOrderEditor();
}

function switchMainTab(panelId, btn) {
  document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showMainPanel(panelId);
}

function showMainPanel(panelId) {
  // すべてのパネルを一度隠す
  document.querySelectorAll('.app-panel').forEach(p => p.classList.remove('active'));
  
  const target = document.getElementById(panelId);
  if (target) {
    target.classList.add('active');
    
    // サブタブが存在する場合、アクティブなサブタブがなければ1番目を強制表示
    const activeSubBtn = target.querySelector('.sub-tab-btn.active');
    const activeSubPanel = target.querySelector('.sub-panel.active');

    if (!activeSubBtn || !activeSubPanel) {
      const firstSubBtn = target.querySelector('.sub-tab-btn');
      const firstSubPanel = target.querySelector('.sub-panel');
      if (firstSubBtn && firstSubPanel) {
        target.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
        target.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
        firstSubBtn.classList.add('active');
        firstSubPanel.classList.add('active');
      }
    }
  }
}

function switchSubTab(parentPanelId, subPanelId, btn) {
  const parent = document.getElementById(parentPanelId);
  if (!parent) return;
  parent.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
  parent.querySelectorAll('.sub-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const targetSub = document.getElementById(subPanelId);
  if (targetSub) targetSub.classList.add('active');
}

// ================= 5. 設定カスタマイズ機能 =================
function changeColorTheme(themeKey) {
  const themes = {
    dark: { bg: '#12141a', card: '#1c202a', sub: '#161922', border: '#2a3142', text: '#f3f4f6' },
    light: { bg: '#f8fafc', card: '#ffffff', sub: '#f1f5f9', border: '#e2e8f0', text: '#0f172a' },
    midnight: { bg: '#0b0f19', card: '#111827', sub: '#161f30', border: '#1f2937', text: '#e5e7eb' },
    terminal: { bg: '#0d1117', card: '#161b22', sub: '#1b222d', border: '#30363d', text: '#58a6ff' }
  };
  const t = themes[themeKey];
  if (!t) return;
  document.documentElement.style.setProperty('--bg-main', t.bg);
  document.documentElement.style.setProperty('--bg-card', t.card);
  document.documentElement.style.setProperty('--bg-sub', t.sub);
  document.documentElement.style.setProperty('--border', t.border);
  document.documentElement.style.setProperty('--text', t.text);
  localStorage.setItem('cncm_theme', themeKey);
}

function changeAccentColor(color) {
  document.documentElement.style.setProperty('--accent', color);
  localStorage.setItem('cncm_accent', color);
}

function changeFontStyle(fontKey) {
  let fontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  if (fontKey === 'serif') fontStack = '"Yu Mincho", "Hiragino Mincho ProN", serif';
  if (fontKey === 'monospace') fontStack = '"Fira Code", "Consolas", monospace';
  document.documentElement.style.setProperty('--font-family', fontStack);
  localStorage.setItem('cncm_font', fontKey);
}

function renderTabOrderEditor() {
  const container = document.getElementById('tabOrderEditor');
  if (!container) return;
  container.innerHTML = '';
  currentTabs.forEach((tab, i) => {
    const row = document.createElement('div');
    row.className = 'tab-order-row';
    row.innerHTML = `
      <span>${tab.name}</span>
      <div>
        ${i > 0 ? `<button class="btn btn-small btn-outline" onclick="moveTabOrder(${i}, -1)">▲</button>` : ''}
        ${i < currentTabs.length - 1 ? `<button class="btn btn-small btn-outline" onclick="moveTabOrder(${i}, 1)">▼</button>` : ''}
      </div>
    `;
    container.appendChild(row);
  });
}

function moveTabOrder(index, dir) {
  const target = index + dir;
  const temp = currentTabs[index];
  currentTabs[index] = currentTabs[target];
  currentTabs[target] = temp;
  localStorage.setItem('cncm_tab_order', JSON.stringify(currentTabs));
  renderMainTabs();
}

function resetAllSettings() {
  localStorage.clear();
  location.reload();
}

// ================= 6. プロフィール・アバター・画像アップロード =================
function initEmojiPickers() {
  const userGrid = document.getElementById('avatarEmojiGrid');
  const groupGrid = document.getElementById('groupCrownEmojiGrid');
  if (!userGrid || !groupGrid) return;
  userGrid.innerHTML = '';
  groupGrid.innerHTML = '';

  EMOJI_PALETTE.forEach(e => {
    const d1 = document.createElement('div');
    d1.className = 'emoji-item';
    d1.innerText = e;
    d1.onclick = () => {
      document.querySelectorAll('#avatarEmojiGrid .emoji-item').forEach(x => x.classList.remove('selected'));
      d1.classList.add('selected');
      currentUser.avatar = e;
      currentUser.customImage = null;
    };
    userGrid.appendChild(d1);

    const d2 = document.createElement('div');
    d2.className = 'emoji-item';
    d2.innerText = e;
    d2.onclick = () => {
      document.querySelectorAll('#groupCrownEmojiGrid .emoji-item').forEach(x => x.classList.remove('selected'));
      d2.classList.add('selected');
      window._selectedGroupIcon = e;
    };
    groupGrid.appendChild(d2);
  });
}

function handleImageUpload(event, type) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    if (type === 'userAvatar') {
      currentUser.customImage = e.target.result;
      showCustomDialog({ title: '画像設定', message: 'カスタムアバターが読み込まれました。' });
    } else if (type === 'groupIcon') {
      window._selectedGroupCustomImage = e.target.result;
      showCustomDialog({ title: 'グループ冠画像', message: 'グループアイコン画像が読み込まれました。' });
    }
  };
  reader.readAsDataURL(file);
}

function handleGoogleAuthClick() {
  showCustomDialog({
    icon: '🔴',
    title: 'Google認証照合',
    message: 'Googleアカウントとセキュアトークン照合を行いました。続いて匿名プロフィールを入力してください。'
  });
}

function saveUserProfile() {
  const name = document.getElementById('profileNameInput').value.trim();
  if (!name) return showCustomDialog({ icon: '⚠️', title: '警告', message: '匿名ネームを入力してください' });

  currentUser.name = name;
  localStorage.setItem('cncm_username', name);
  localStorage.setItem('cncm_avatar', currentUser.avatar);
  if (currentUser.customImage) localStorage.setItem('cncm_custom_image', currentUser.customImage);

  updateUserUI();
  closeModal('profileModal');
  showCustomDialog({ icon: '✅', title: '保存完了', message: 'プロフィールを更新しました。' });
}

function updateUserUI() {
  document.getElementById('displayUsername').innerText = currentUser.name;
  const avatarBox = document.getElementById('headerAvatar');
  if (currentUser.customImage) {
    avatarBox.innerHTML = `<img src="${currentUser.customImage}" alt="avatar">`;
  } else {
    avatarBox.innerText = currentUser.avatar;
  }

  const badge = document.getElementById('headerRankBadge');
  if (currentUser.likesReceived >= 50) {
    currentUser.rank = 'gold';
    badge.innerText = '🥇 Gold';
    badge.style.borderColor = '#f59e0b';
  } else if (currentUser.likesReceived >= 20) {
    currentUser.rank = 'silver';
    badge.innerText = '🥈 Silver';
    badge.style.borderColor = '#9ca3af';
  } else {
    currentUser.rank = 'bronze';
    badge.innerText = '🥉 Bronze';
    badge.style.borderColor = '#b45309';
  }
}

// ================= 7. ポート＆ラウンジ (オープンチャット) =================
function renderLoungeMembers() {
  const list = document.getElementById('loungeMemberList');
  if (!list) return;
  list.innerHTML = '';

  loungeMembers.forEach(m => {
    const row = document.createElement('div');
    row.className = 'member-row';
    row.onclick = () => openTalkConfirm(m);

    row.innerHTML = `
      <div class="header-avatar">${m.avatar}</div>
      <span class="status-dot dot-${m.status}"></span>
      <div style="flex:1; min-width:0;">
        <div style="display:flex; justify-content:space-between;">
          <strong>${m.name}</strong>
          <span class="sub-text" style="color:var(--status-${m.status});">${m.status==='busy'?'全集中(声かけNG)':m.status==='ok'?'話しかけOK':'作業中'}</span>
        </div>
        <div class="sub-text" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.task}</div>
      </div>
    `;
    list.appendChild(row);
  });
}

function updateLoungeStatus() {
  const mode = document.getElementById('myStatusMode').value;
  const task = document.getElementById('myTaskInput').value.trim() || '集中制作中';

  loungeMembers = loungeMembers.filter(m => m.name !== currentUser.name);
  loungeMembers.unshift({
    id: currentUser.id,
    name: currentUser.name,
    avatar: currentUser.avatar,
    status: mode,
    task: task
  });
  renderLoungeMembers();
  showCustomDialog({ icon: '🟢', title: 'ステータス更新', message: '自習室の在席状況を更新しました。' });
}

function openTalkConfirm(member) {
  if (member.name === currentUser.name) return;
  if (member.status === 'busy') {
    return showCustomDialog({ icon: '⚠️', title: '声かけ不可', message: `${member.name}さんは現在「一人にしてください」モードです。` });
  }

  showCustomDialog({
    icon: member.avatar,
    title: `${member.name} に話しかける？`,
    message: `作業内容：${member.task}`,
    isConfirm: true,
    confirmText: '申請する',
    cancelText: 'また後で'
  }).then(ok => {
    if (ok) {
      showCustomDialog({ icon: '📨', title: '申請送信', message: '相手に話しかけ申請を送りました。承認されるまでお待ちください。' });
      setTimeout(() => {
        document.getElementById('privateChatPartnerAvatar').innerText = member.avatar;
        document.getElementById('privateChatPartnerName').innerText = member.name;
        openModal('privateChatModal');
      }, 1200);
    }
  });
}

function renderOpenChat() {
  const stream = document.getElementById('openChatStream');
  if (!stream) return;
  stream.innerHTML = '';
  let firstUnread = false;

  openChatMessages.forEach(msg => {
    if (!msg.read && !firstUnread) {
      firstUnread = true;
      const sep = document.createElement('div');
      sep.className = 'unread-separator';
      sep.id = 'unreadSeparator';
      sep.innerText = '―― ここから未読メッセージ ――';
      stream.appendChild(sep);
    }

    const isMine = (msg.author === currentUser.name);
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isMine ? 'mine' : 'other'} ${msg.text.includes('@' + currentUser.name) ? 'mentioned' : ''}`;
    
    bubble.innerHTML = `
      ${!isMine ? `<div class="chat-meta">${msg.avatar} ${msg.author}</div>` : ''}
      <div>${msg.text}</div>
      ${msg.likes > 0 ? `<div class="like-counter-pill">❤️ ${msg.likes}</div>` : ''}
    `;

    let lastTap = 0;
    bubble.addEventListener('pointerdown', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        triggerLikeAnimation(bubble, e.clientX, e.clientY);
        msg.likes++;
        renderOpenChat();
      }
      lastTap = now;
    });

    stream.appendChild(bubble);
  });

  const sep = document.getElementById('unreadSeparator');
  if (sep) sep.scrollIntoView({ behavior: 'smooth', block: 'center' });
  else stream.scrollTop = stream.scrollHeight;
}

function triggerLikeAnimation(element, x, y) {
  const rect = element.getBoundingClientRect();
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.innerText = '❤️';
  heart.style.left = (x ? x - rect.left : rect.width / 2) + 'px';
  heart.style.top = (y ? y - rect.top : rect.height / 2) + 'px';
  element.appendChild(heart);
  setTimeout(() => heart.remove(), 600);
}

function sendOpenChatMessage() {
  if (isSafeMode) return showCustomDialog({ icon: '🛑', title: 'セーフモード', message: '荒らし対策のためチャットは一時停止されています。' });

  const input = document.getElementById('openChatInput');
  let text = input.value.trim();
  if (!text) return;

  FORBIDDEN_WORDS.forEach(w => {
    if (text.includes(w)) text = text.split(w).join(' [検閲削除] ');
  });

  openChatMessages.push({
    id: Date.now(),
    author: currentUser.name,
    avatar: currentUser.avatar,
    text: text,
    likes: 0,
    read: true
  });

  input.value = '';
  renderOpenChat();
}

function markOpenChatAsRead() {
  openChatMessages.forEach(m => m.read = true);
  renderOpenChat();
}

function sendPrivateChatMessage() {
  const input = document.getElementById('privateChatInput');
  let text = input.value.trim();
  if (!text) return;

  FORBIDDEN_WORDS.forEach(w => {
    if (text.includes(w)) text = text.split(w).join(' [検閲削除] ');
  });

  const stream = document.getElementById('privateChatStream');
  const b = document.createElement('div');
  b.className = 'chat-bubble mine';
  b.innerText = text;
  stream.appendChild(b);
  stream.scrollTop = stream.scrollHeight;
  input.value = '';
}

// ================= 8. グループ管理 =================
function setGroupViewMode(mode) {
  groupViewMode = mode;
  document.getElementById('viewCardBtn').classList.toggle('active', mode === 'card');
  document.getElementById('viewListBtn').classList.toggle('active', mode === 'list');
  renderGroups();
}

function setGroupTagFilter(tag, el) {
  document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  window._currentGroupTag = tag;
  filterGroups();
}

function filterGroups() { renderGroups(); }

function renderGroups() {
  const myBox = document.getElementById('myGroupContainer');
  const invBox = document.getElementById('invitedGroupContainer');
  const allBox = document.getElementById('allGroupContainer');
  if (!myBox || !invBox || !allBox) return;

  myBox.className = `group-items-container view-${groupViewMode}`;
  invBox.className = `group-items-container view-${groupViewMode}`;
  allBox.className = `group-items-container view-${groupViewMode}`;

  myBox.innerHTML = '';
  invBox.innerHTML = '';
  allBox.innerHTML = '';

  const q = document.getElementById('groupSearchInput').value.toLowerCase();
  const filterTag = window._currentGroupTag || 'all';

  groups.forEach(g => {
    const matchQ = !q || g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q) || g.tags.some(t => t.toLowerCase().includes(q));
    let matchTag = true;
    if (filterTag === 'leader') matchTag = (g.leader === currentUser.name);
    else if (filterTag !== 'all') matchTag = g.tags.includes(filterTag);

    if (!matchQ || !matchTag) return;

    const isMember = g.members.includes(currentUser.name);
    const isInvited = g.invited.includes(currentUser.name);

    const card = document.createElement('div');
    card.className = 'group-card-item';
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="font-size:1.3rem;">${g.icon}</span>
        <div>
          <strong>${g.name}</strong> ${g.leader === currentUser.name ? '<span class="user-rank-badge">👑 Leader</span>' : ''}
          <div class="sub-text">${g.desc}</div>
        </div>
      </div>
      <div class="group-tags-wrap">
        ${g.tags.map(t => `<span class="group-tag-label">#${t}</span>`).join('')}
      </div>
      <div style="margin-top:0.4rem; display:flex; gap:0.4rem;">
        ${isMember ? `
          <button class="btn btn-primary btn-small" onclick="showCustomDialog({title:'${g.name}', message:'グループ専用ルームへ入室します。Driveフォルダ: ${g.folder}'})">入室</button>
        ` : isInvited ? `
          <button class="btn btn-primary btn-small" onclick="acceptGroupInvite('${g.id}')">承認して参加</button>
        ` : `
          <button class="btn btn-outline btn-small" onclick="applyToGroup('${g.id}')">参加申請</button>
        `}
      </div>
    `;

    if (isMember) myBox.appendChild(card.cloneNode(true));
    if (isInvited) invBox.appendChild(card.cloneNode(true));
    allBox.appendChild(card);
  });
}

function applyToGroup(gid) {
  const g = groups.find(x => x.id === gid);
  showCustomDialog({
    icon: '📨',
    title: '参加申請',
    message: `リーダー（${g.leader}）に参加リクエストを送りました。`
  });
}

function acceptGroupInvite(gid) {
  const g = groups.find(x => x.id === gid);
  g.invited = g.invited.filter(u => u !== currentUser.name);
  g.members.push(currentUser.name);
  renderGroups();
  showCustomDialog({ icon: '🎉', title: '参加完了', message: `グループ「${g.name}」に参加しました！` });
}

function submitCreateGroup() {
  const name = document.getElementById('newGroupName').value.trim();
  const desc = document.getElementById('newGroupDesc').value.trim();
  const custom = document.getElementById('newGroupCustomTags').value.trim();
  if (!name) return showCustomDialog({ icon: '⚠️', title: '警告', message: 'グループ名を入力してください' });

  let tags = [...selectedGroupTags];
  if (custom) tags = tags.concat(custom.split(',').map(s => s.trim()));

  groups.push({
    id: 'g_' + Date.now(),
    icon: window._selectedGroupIcon || '🎬',
    name: name,
    desc: desc || 'クリエイティブ・プロジェクト',
    leader: currentUser.name,
    members: [currentUser.name],
    invited: [],
    tags: tags,
    folder: 'CNCM_' + name.replace(/\s+/g, '_')
  });

  renderGroups();
  closeModal('newGroupModal');
  showCustomDialog({ icon: '👑', title: 'グループ作成', message: `「${name}」を作成し、初期リーダーに就任しました。` });
}

function toggleTagChoice(el, tag) {
  if (selectedGroupTags.includes(tag)) {
    selectedGroupTags = selectedGroupTags.filter(t => t !== tag);
    el.classList.remove('selected');
  } else {
    selectedGroupTags.push(tag);
    el.classList.add('selected');
  }
}

// ================= 9. 相談・Q&Aスレッド ＆ Drive埋め込み =================
function renderForumThreads() {
  const list = document.getElementById('threadListScroll');
  if (!list) return;
  list.innerHTML = '';

  forumThreads.forEach(t => {
    const card = document.createElement('div');
    card.className = 'thread-preview-card';
    card.onclick = () => selectThread(t);

    card.innerHTML = `
      <div style="display:flex; justify-content:space-between;">
        <span class="user-rank-badge" style="color:#06b6d4; border-color:#06b6d4;">${t.category==='help'?'🙋‍♂️ 助けて':t.category==='compare'?'👀 どっち？':'🎨 ラフ'}</span>
        ${t.solved ? '<span class="badge badge-ok">✅ 解決済</span>' : ''}
      </div>
      <strong style="font-size:0.85rem; display:block; margin:0.3rem 0;">${t.title}</strong>
      <div class="sub-text">${t.author} ・ 返信 ${t.replies.length}件</div>
    `;
    list.appendChild(card);
  });
}

function selectThread(t) {
  const main = document.getElementById('threadDetailView');
  if (!main) return;
  
  let driveFrame = '';
  if (t.driveUrl) {
    let embedSrc = t.driveUrl.replace(/\/view.*$/, '/preview');
    driveFrame = `
      <div class="drive-media-frame">
        <iframe src="${embedSrc}" allow="autoplay"></iframe>
      </div>
    `;
  }

  main.innerHTML = `
    <div style="border-bottom:1px solid var(--border); padding-bottom:0.8rem; margin-bottom:1rem;">
      <div style="display:flex; justify-content:space-between;">
        <h2>${t.title}</h2>
        ${!t.solved ? `<button class="btn btn-primary btn-small" onclick="resolveThread('${t.id}')">✅ 解決済みにする</button>` : '<span class="badge badge-ok">解決済み</span>'}
      </div>
      <div class="sub-text" style="margin-top:0.3rem;">投稿者: ${t.author}</div>
      <p style="margin:0.8rem 0; font-size:0.9rem;">${t.body}</p>
      ${driveFrame}
    </div>

    <h3>返信・アドバイス (${t.replies.length})</h3>
    <div style="display:flex; flex-direction:column; gap:0.6rem; margin:1rem 0;">
      ${t.replies.map(r => `
        <div class="card ${r.best ? 'border-success' : ''}" style="margin-bottom:0.4rem;">
          ${r.best ? '<span class="badge badge-ok">ベストアンサー</span>' : ''}
          <div style="font-size:0.85rem; margin-top:0.2rem;">${r.text}</div>
          <div class="sub-text" style="margin-top:0.2rem;">回答者: ${r.author}</div>
        </div>
      `).join('')}
    </div>

    <div style="display:flex; gap:0.5rem; margin-top:auto;">
      <input type="text" id="threadReplyInput" class="form-control" placeholder="建設的な提案・フィードバックを投稿...">
      <button class="btn btn-primary" onclick="submitThreadReply('${t.id}')">回答</button>
    </div>
  `;
}

function submitCreateThread() {
  const cat = document.getElementById('newThreadCategory').value;
  const title = document.getElementById('newThreadTitle').value.trim();
  const body = document.getElementById('newThreadBody').value.trim();
  const drive = document.getElementById('newThreadDriveUrl').value.trim();
  if (!title) return showCustomDialog({ icon: '⚠️', title: '警告', message: 'タイトルを入力してください' });

  forumThreads.unshift({
    id: 't_' + Date.now(),
    category: cat,
    title: title,
    author: currentUser.name,
    body: body,
    driveUrl: drive,
    replies: [],
    solved: false
  });

  renderForumThreads();
  closeModal('newThreadModal');
  showCustomDialog({ icon: '💬', title: '投稿完了', message: '相談スレッドを公開しました。' });
}

function submitThreadReply(tid) {
  const input = document.getElementById('threadReplyInput');
  const txt = input.value.trim();
  if (!txt) return;

  const t = forumThreads.find(x => x.id === tid);
  t.replies.push({ author: currentUser.name, text: txt, best: false });
  currentUser.likesReceived += 2;
  updateUserUI();
  selectThread(t);
}

function resolveThread(tid) {
  const t = forumThreads.find(x => x.id === tid);
  t.solved = true;
  renderForumThreads();
  selectThread(t);
  showCustomDialog({ icon: '🎉', title: '解決！', message: 'スレッドを解決済みに設定しました。' });
}

// ================= 10. 企画お題 ＆ ギャラリー =================
function renderEventTopics() {
  const grid = document.getElementById('eventTopicsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  eventTopics.forEach(e => {
    const card = document.createElement('div');
    card.className = 'topic-card';
    card.innerHTML = `
      <h3>${e.title}</h3>
      <p class="sub-text">${e.desc}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.6rem;">
        <span class="sub-text">エントリー: ${e.entries.length}作品</span>
        <button class="btn btn-primary btn-small" onclick="viewEventGallery('${e.id}')">ギャラリー鑑賞</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function viewEventGallery(eid) {
  const e = eventTopics.find(x => x.id === eid);
  window._activeEvent = e;
  document.getElementById('galleryEventTitle').innerText = e.title;
  document.getElementById('galleryEventDesc').innerText = e.desc;

  document.getElementById('eventTopicsView').classList.remove('active');
  document.getElementById('eventGalleryView').classList.add('active');

  renderGalleryWorks(e.entries);
}

function renderGalleryWorks(entries) {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;
  grid.innerHTML = '';

  entries.forEach(w => {
    const card = document.createElement('div');
    card.className = 'work-showcase-card';

    card.innerHTML = `
      <div class="work-media-preview">
        <iframe src="${w.driveUrl}" allow="autoplay"></iframe>
      </div>
      <div style="padding:0.8rem;">
        <strong>${w.title}</strong>
        <div class="sub-text">作者: ${w.author}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
          <span style="color:#ef4444; font-weight:bold;">❤️ ${w.likes}</span>
          <button class="btn btn-outline btn-small" onclick="likeWork('${w.id}')">スキ！</button>
        </div>
      </div>
    `;

    let lastTap = 0;
    card.addEventListener('pointerdown', (ev) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        triggerLikeAnimation(card, ev.clientX, ev.clientY);
        w.likes++;
        renderGalleryWorks(entries);
      }
      lastTap = now;
    });

    grid.appendChild(card);
  });
}

function likeWork(wid) {
  const w = window._activeEvent.entries.find(x => x.id === wid);
  w.likes++;
  renderGalleryWorks(window._activeEvent.entries);
}

function submitCreateTopic() {
  if (currentUser.rank !== 'gold' && currentAdminRole !== 'オーナー') {
    return showCustomDialog({ icon: '🔒', title: '権限制限', message: 'お題の新規起案はGoldランク以上、または運営のみ可能です。' });
  }
  const title = document.getElementById('newTopicTitle').value.trim();
  const desc = document.getElementById('newTopicDesc').value.trim();
  const drive = document.getElementById('newTopicDriveFolder').value.trim();
  if (!title) return;

  eventTopics.unshift({
    id: 'e_' + Date.now(),
    title: title,
    desc: desc,
    driveFolder: drive,
    entries: []
  });

  renderEventTopics();
  closeModal('newTopicModal');
  showCustomDialog({ icon: '🎯', title: 'お題公開', message: '新しい企画お題を公開しました！' });
}

function submitWorkEntry() {
  const title = document.getElementById('submitWorkTitle').value.trim();
  const url = document.getElementById('submitWorkDriveUrl').value.trim();
  if (!title) return;

  window._activeEvent.entries.unshift({
    id: 'w_' + Date.now(),
    title: title,
    author: currentUser.name,
    likes: 0,
    driveUrl: url.replace(/\/view.*$/, '/preview')
  });

  renderGalleryWorks(window._activeEvent.entries);
  closeModal('submitWorkModal');
  showCustomDialog({ icon: '🚀', title: '提出完了', message: '作品がエントリーされました！' });
}

function switchEventTab(tabKey, btn) {
  document.querySelectorAll('#panel-events .sub-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  if (tabKey === 'event-topics') {
    document.getElementById('eventTopicsView').classList.add('active');
    document.getElementById('eventGalleryView').classList.remove('active');
  } else if (tabKey === 'event-ranking-trending' || tabKey === 'event-ranking-hall') {
    if (window._activeEvent) {
      document.getElementById('eventTopicsView').classList.remove('active');
      document.getElementById('eventGalleryView').classList.add('active');
      let sorted = [...window._activeEvent.entries].sort((a, b) => b.likes - a.likes);
      renderGalleryWorks(sorted);
    } else {
      showCustomDialog({ title: '通知', message: 'お題を選択してギャラリーを開いてください。' });
    }
  }
}

// ================= 11. 独立管理者ダッシュボード＆裏コマンド =================
let keyBuffer = '';
window.addEventListener('keydown', (e) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  keyBuffer += e.key.toLowerCase();
  if (keyBuffer.length > 5) keyBuffer = keyBuffer.slice(-5);
  if (keyBuffer === 'admin') {
    keyBuffer = '';
    openModal('adminUnlockModal');
  }
});

function verifyAndLaunchAdmin() {
  const pass = document.getElementById('adminSecretInput').value;
  if (pass === 'canvas2026') {
    closeModal('adminUnlockModal');
    launchAdminConsole();
  } else {
    showCustomDialog({ icon: '🚫', title: '認証失敗', message: 'シークレットコードが一致しません。' });
  }
}

function launchAdminConsole() {
  document.getElementById('userAppContainer').style.display = 'none';
  document.getElementById('adminDashboardRoot').style.display = 'flex';
  renderAdminAuditLogs();
}

function exitAdminConsole() {
  document.getElementById('adminDashboardRoot').style.display = 'none';
  document.getElementById('userAppContainer').style.display = 'flex';
}

function switchAdminTab(panelId, btn) {
  document.querySelectorAll('.admin-menu-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(panelId).classList.add('active');
}

function renderAdminAuditLogs() {
  const tbody = document.getElementById('adminAuditTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  adminAuditLogs.forEach((log, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${log.time}</td>
      <td><strong>${log.user}</strong></td>
      <td><span class="badge badge-danger">${log.flag}</span></td>
      <td>${log.content}</td>
      <td><button class="btn btn-warning btn-small" onclick="adminQuickBan('${log.user}', ${idx})">処置</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function adminQuickBan(user, idx) {
  showCustomDialog({
    icon: '🚨',
    title: '緊急モデレーション',
    message: `${user} に対して警告および24時間ミュートを発動しますか？`,
    isConfirm: true
  }).then(ok => {
    if (ok) {
      adminAuditLogs.splice(idx, 1);
      renderAdminAuditLogs();
      showCustomDialog({ icon: '✅', title: '処置完了', message: 'アカウントを一時制限しました。' });
    }
  });
}

function broadcastEmergencyAlert() {
  const txt = document.getElementById('emergencyBroadcastInput').value.trim();
  if (!txt) return;
  const banner = document.getElementById('emergencyBanner');
  document.getElementById('emergencyBannerText').innerText = '🚨 ' + txt;
  banner.style.display = 'flex';
  showCustomDialog({ icon: '📢', title: '緊急告知発令', message: '全クライアントに赤帯アラートを配信しました。' });
}

function clearEmergencyAlert() {
  document.getElementById('emergencyBanner').style.display = 'none';
}

function toggleCommunitySafeMode() {
  isSafeMode = !isSafeMode;
  const btn = document.getElementById('safeModeToggleBtn');
  btn.innerText = isSafeMode ? '🔓 セーフモードを解除する' : '🔒 セーフモードを発動する';
  btn.className = isSafeMode ? 'btn btn-warning' : 'btn btn-danger';
  showCustomDialog({
    icon: isSafeMode ? '🔒' : '🔓',
    title: 'セーフモード切替',
    message: isSafeMode ? '一般発言・新規グループ作成を一時ロックしました。' : 'ロックを解除し通常運用に戻しました。'
  });
}

// ユーティリティ
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}
function openDriveLink(folder) {
  showCustomDialog({ icon: '📁', title: 'Google Drive', message: `共有ドライブ [${folder}] フォルダを開きます。` });
}

// ================= 12. 起動時イニシャライザ =================
window.onload = () => {
  // テーマ・アクセント・フォント復元
  const savedTheme = localStorage.getItem('cncm_theme') || 'dark';
  const themeSel = document.getElementById('themeSettingSelect');
  if (themeSel) themeSel.value = savedTheme;
  changeColorTheme(savedTheme);

  const savedAccent = localStorage.getItem('cncm_accent');
  if (savedAccent) changeAccentColor(savedAccent);

  const savedFont = localStorage.getItem('cncm_font') || 'sans-serif';
  const fontSel = document.getElementById('fontSettingSelect');
  if (fontSel) fontSel.value = savedFont;
  changeFontStyle(savedFont);

  // 初期化＆描画
  initEmojiPickers();
  updateUserUI();
  renderMainTabs();
  renderLoungeMembers();
  renderOpenChat();
  renderGroups();
  renderForumThreads();
  renderEventTopics();

  if (!localStorage.getItem('cncm_username')) {
    openModal('profileModal');
  }
};
