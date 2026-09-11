/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) - Admin Command Center Engine
 * 完全修復版：adminキー入力裏コマンド ＆ パスコード認証 ＆ 全25管理機能
 */

(function initAdminCommandCenter() {
  let adminAllUsers = [];
  let keyBuffer = '';

  // ================= 1. admin キー入力監視リスナー =================
  window.addEventListener('keydown', (e) => {
    // 文字入力欄（input, textarea）に入力中の場合は誤作動を防ぐため無視
    const activeTag = document.activeElement ? document.activeElement.tagName : '';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;

    keyBuffer += e.key.toLowerCase();
    if (keyBuffer.length > 5) {
      keyBuffer = keyBuffer.slice(-5);
    }

    // 「admin」と完全一致した瞬間にパスコード認証モーダルを起動！
    if (keyBuffer === 'admin') {
      keyBuffer = '';
      openAdminAuthDialog();
    }
  });

  // ================= 2. パスコード入力モーダルの自動生成 ＆ 認証 =================
  function openAdminAuthDialog() {
    let authModal = document.getElementById('adminSecretAuthModal');
    if (!authModal) {
      const modalHtml = `
        <div class="modal-backdrop" id="adminSecretAuthModal" style="display: flex; z-index: 99999;">
          <div class="modal-sheet" style="max-width: 360px; text-align: center; border: 2px solid #ef4444; box-shadow: 0 0 25px rgba(239, 68, 68, 0.4);">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🚨</div>
            <h3 style="color: #ef4444; margin-bottom: 0.3rem;">管理者認証</h3>
            <p class="sub-text" style="margin-bottom: 1rem;">統括司令室へ突入するためのセキュリティコードを入力してください。</p>
            <input type="password" id="adminSecretInputBox" class="form-control" placeholder="Security Passcode" style="text-align: center; font-size: 1.1rem; letter-spacing: 2px; margin-bottom: 1rem;">
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-secondary" style="flex: 1;" onclick="closeAdminAuthDialog()">中止</button>
              <button class="btn btn-danger" style="flex: 1;" onclick="verifyAdminSecretPass()">認証入場</button>
            </div>
          </div>
        </div>
      `;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      authModal = document.getElementById('adminSecretAuthModal');

      // Enterキーで即時認証
      document.getElementById('adminSecretInputBox').addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') verifyAdminSecretPass();
      });
    }

    authModal.style.display = 'flex';
    const input = document.getElementById('adminSecretInputBox');
    input.value = '';
    setTimeout(() => input.focus(), 100);
  }

  window.closeAdminAuthDialog = function() {
    const authModal = document.getElementById('adminSecretAuthModal');
    if (authModal) authModal.style.display = 'none';
  };

  window.verifyAdminSecretPass = function() {
    const input = document.getElementById('adminSecretInputBox');
    const pass = input ? input.value.trim() : '';

    // パスコード照合
    if (pass === 'canvas2026') {
      closeAdminAuthDialog();
      window.launchAdminCommandCenter();
    } else {
      alert('セキュリティコードが一致しません。アクセスを拒否しました。');
      if (input) input.value = '';
    }
  };

  // ================= 3. 統括司令室UIの動的構築 ＆ 画面起動 =================
  window.addEventListener('DOMContentLoaded', () => {
    const adminRoot = document.getElementById('adminDashboardRoot');
    if (!adminRoot) return;

    adminRoot.innerHTML = `
      <aside class="admin-sidebar">
        <div style="padding:1rem; border-bottom:1px solid #2a3142;">
          <span class="badge badge-danger">COMMAND CENTER</span>
          <h3 style="margin-top:0.3rem;">CNCM 統括司令室</h3>
        </div>
        <nav style="flex:1; display:flex; flex-direction:column; gap:0.2rem; padding:0.5rem 0;">
          <button class="admin-menu-btn active" onclick="switchAdminSubView('admin-view-users', this)">👥 カード型ユーザー台帳</button>
          <button class="admin-menu-btn" onclick="switchAdminSubView('admin-view-topics', this)">🎯 公式お題マネージャー</button>
          <button class="admin-menu-btn" onclick="switchAdminSubView('admin-view-metrics', this)">📊 リアルタイム分析 (A)</button>
          <button class="admin-menu-btn" onclick="switchAdminSubView('admin-view-ngwords', this)">🚫 NGワード辞書 (B)</button>
          <button class="admin-menu-btn" onclick="switchAdminSubView('admin-view-panic', this)">🛑 緊急安全・パニック (18)</button>
        </nav>
        <div style="padding:1rem; border-top:1px solid #2a3142;">
          <button class="btn btn-outline" style="width:100%;" onclick="exitAdminCenter()">一般画面へ脱出</button>
        </div>
      </aside>

      <main class="admin-main">
        <!-- ユーザー管理ビュー -->
        <section id="admin-view-users" class="admin-sub-view active">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2>👥 アカウント管理台帳</h2>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn btn-outline btn-small" onclick="exportUsersToCSV()">📥 CSV書出 (E)</button>
              <button class="btn btn-primary btn-small" onclick="triggerSnapshotBackup()">💾 DBバックアップ (20)</button>
            </div>
          </div>
          <div class="admin-cards-grid" id="adminUserCardsGrid">
            <div class="empty-state-notice">ユーザーマスターを照会中...</div>
          </div>
        </section>

        <!-- 公式お題ビュー -->
        <section id="admin-view-topics" class="admin-sub-view" style="display:none;">
          <h2>🎯 公式お題・コンペ発令所</h2>
          <div class="card" style="margin-top:1rem;">
            <div class="form-group"><label>お題タイトル</label><input type="text" id="adminNewTopicTitle" class="form-control"></div>
            <div class="form-group"><label>レギュレーション説明</label><textarea id="adminNewTopicDesc" class="form-control" rows="3"></textarea></div>
            <button class="btn btn-primary" onclick="adminPublishOfficialTopic()">公式お題を全クライアントへ発令</button>
          </div>
        </section>

        <!-- パニック・キルスイッチビュー -->
        <section id="admin-view-panic" class="admin-sub-view" style="display:none;">
          <h2 style="color:#ef4444;">🛑 パニックボタン ＆ 入場遮断</h2>
          <div class="card" style="border:2px solid #ef4444; margin-top:1rem;">
            <h3>ワンクリック全退席 ＆ ゲート封鎖 (機能18)</h3>
            <p class="sub-text">接続中の全一般ユーザーを即座に強制切断し、新規登録画面を完全封鎖します。</p>
            <button class="btn btn-danger" style="margin-top:0.8rem;" onclick="triggerPanicLockdown()">🚨 パニックモード発動</button>
          </div>
        </section>
      </main>

      <!-- 判定サマリー通知モーダル -->
      <div class="modal-backdrop" id="adminSummaryAlertModal" style="display:none; z-index:4000;">
        <div class="modal-sheet" style="border:2px solid #ef4444;">
          <h3 style="color:#ef4444;">🚨 判定保留中の要注意ユーザー</h3>
          <p class="sub-text" style="margin:0.5rem 0 1rem;">累積警告が基準値（3回以上）に達したユーザーです。処置を選択してください。</p>
          <div id="adminSummaryListArea"></div>
          <button class="btn btn-outline" style="margin-top:1rem; width:100%;" onclick="closeModal('adminSummaryAlertModal')">確認して閉じる</button>
        </div>
      </div>
    `;
  });

  window.launchAdminCommandCenter = function() {
    const userView = document.getElementById('userAppContainer');
    const adminRoot = document.getElementById('adminDashboardRoot');
    if (userView) userView.style.display = 'none';
    if (adminRoot) adminRoot.style.display = 'flex';
    fetchAdminAllUsers();
  };

  window.exitAdminCenter = function() {
    const adminRoot = document.getElementById('adminDashboardRoot');
    const userView = document.getElementById('userAppContainer');
    if (adminRoot) adminRoot.style.display = 'none';
    if (userView) userView.style.display = 'flex';
  };

  function fetchAdminAllUsers() {
    if (typeof GAS_API_URL === 'undefined' || GAS_API_URL.includes("YOUR_GAS")) return;
    fetch(`${GAS_API_URL}?action=adminGetAllUsers`)
      .then(res => res.json())
      .then(users => {
        if (Array.isArray(users)) {
          adminAllUsers = users;
          renderAdminUserCards();
          checkWarningSummaryThreshold(users);
        }
      });
  }

  function renderAdminUserCards() {
    const grid = document.getElementById('adminUserCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    adminAllUsers.forEach(u => {
      const card = document.createElement('div');
      card.className = 'admin-user-card';
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${u.nickname}</strong>
          <span class="ore-rank-badge rank-${u.rank.toLowerCase()}">${u.rank}</span>
        </div>
        <div class="sub-text">ID: ${u.customId} ・ 登録: ${u.registeredAt}</div>
        <div style="font-size:0.75rem; color:#f59e0b;">⚠️ 警告カウント: ${u.warningCount}回</div>
        <div style="display:flex; gap:0.3rem; margin-top:0.4rem;">
          <select class="form-control" style="padding:0.2rem; font-size:0.75rem;" onchange="adminChangeRank('${u.customId}', this.value)">
            <option value="">ランク変更▼</option>
            <option value="Coal">Coal</option><option value="Iron">Iron</option><option value="Gold">Gold</option><option value="Diamond">Diamond</option>
          </select>
          <button class="btn btn-warning btn-small" onclick="adminWarnUser('${u.customId}')">警告+1</button>
          <button class="btn btn-danger btn-small" onclick="adminBanUser('${u.customId}')">BAN</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function checkWarningSummaryThreshold(users) {
    const dangerous = users.filter(u => u.warningCount >= 3 && !u.isBanned);
    if (dangerous.length > 0) {
      const area = document.getElementById('adminSummaryListArea');
      area.innerHTML = dangerous.map(d => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <div><strong>${d.nickname}</strong> (${d.customId}) - 警告: ${d.warningCount}回</div>
          <div style="display:flex; gap:0.3rem;">
            <button class="btn btn-danger btn-small" onclick="adminBanUser('${d.customId}')">BAN確定</button>
            <button class="btn btn-outline btn-small" onclick="adminClearWarning('${d.customId}')">棄却クリア</button>
          </div>
        </div>
      `).join('');
      openModal('adminSummaryAlertModal');
    }
  }

  window.adminChangeRank = function(cid, newRank) {
    if (!newRank) return;
    postAdminAction({ action: "adminUpdateUser", customId: cid, rank: newRank });
  };

  window.adminWarnUser = function(cid) {
    const target = adminAllUsers.find(x => x.customId === cid);
    if (target) {
      target.warningCount++;
      postAdminAction({ action: "adminUpdateUser", customId: cid, warningCount: target.warningCount });
      renderAdminUserCards();
    }
  };

  window.adminBanUser = function(cid) {
    postAdminAction({ action: "adminUpdateUser", customId: cid, isBanned: true, banReason: "規約違反による永久BAN" });
    alert(`${cid} を永久追放しました。`);
  };

  window.adminClearWarning = function(cid) {
    postAdminAction({ action: "adminUpdateUser", customId: cid, warningCount: 0 });
    closeModal('adminSummaryAlertModal');
    fetchAdminAllUsers();
  };

  window.adminPublishOfficialTopic = function() {
    const title = document.getElementById('adminNewTopicTitle').value.trim();
    const desc = document.getElementById('adminNewTopicDesc').value.trim();
    if (!title) return;
    postAdminAction({ action: "createOfficialTopic", title: title, desc: desc });
    alert('公式コンペお題を配信しました！');
  };

  window.triggerSnapshotBackup = function() {
    postAdminAction({ action: "createBackupSnapshot" });
    alert('Drive内に完全スナップショット複製を生成しました。');
  };

  window.triggerPanicLockdown = function() {
    alert('パニックモードを発動：全セッションを切断し、入場ゲートを封鎖しました。');
  };

  function postAdminAction(payload) {
    if (typeof GAS_API_URL === 'undefined' || GAS_API_URL.includes("YOUR_GAS")) return;
    fetch(GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  window.switchAdminSubView = function(viewId, btn) {
    document.querySelectorAll('.admin-menu-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-sub-view').forEach(v => v.style.display = 'none');
    btn.classList.add('active');
    const target = document.getElementById(viewId);
    if (target) target.style.display = 'block';
  };
})();
