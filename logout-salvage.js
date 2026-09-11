/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) - Logout Salvage Patch
 * 既存コード無改変：ログアウト完全蘇生・全セッション強制破棄プラグイン
 */

(function executeLogoutSalvage() {
  window.addEventListener('DOMContentLoaded', () => {

    // ================= 1. UIへのログアウトボタン動的注入 =================
    // ① ヘッダー右側（マイ管理ボタンの横）に即時ログアウトボタンを注入
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !document.getElementById('salvagedHeaderLogoutBtn')) {
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'salvagedHeaderLogoutBtn';
      logoutBtn.className = 'icon-action-btn';
      logoutBtn.style.borderColor = 'var(--danger)';
      logoutBtn.style.color = 'var(--danger)';
      logoutBtn.style.fontWeight = 'bold';
      logoutBtn.innerText = '🚪 退出';
      logoutBtn.title = '安全にログアウトしてログイン画面へ戻る';
      logoutBtn.onclick = () => window.triggerCompleteLogout();
      headerRight.insertBefore(logoutBtn, headerRight.firstChild);
    }

    // ② アカウント統合管理センター（accountHubModal）の内部にも退出ボタンを注入
    const hubGrid = document.querySelector('.account-hub-grid');
    if (hubGrid && !document.getElementById('salvagedHubLogoutCard')) {
      const card = document.createElement('div');
      card.id = 'salvagedHubLogoutCard';
      card.className = 'card';
      card.style.border = '1px solid var(--danger)';
      card.style.gridColumn = '1 / -1';
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.innerHTML = `
        <div>
          <strong style="color: var(--danger);">セッション終了</strong>
          <div class="sub-text">在席ステータスをオフラインにし、端末の認証情報を完全に破棄します。</div>
        </div>
        <button class="btn btn-danger btn-small" onclick="window.triggerCompleteLogout()">🚪 完全にログアウト</button>
      `;
      hubGrid.appendChild(card);
    }
  });

  // ================= 2. ログアウト実行・完全クリーンアップ処理 =================
  window.triggerCompleteLogout = function() {
    // 既存の独自ダイアログまたは標準確認
    const confirmLogout = confirm('【CNCM セッション終了】\nログアウトしてログイン画面に戻りますか？\n（在席ステータスはオフラインに更新されます）');
    if (!confirmLogout) return;

    const customId = localStorage.getItem('cncm_custom_id');
    const gasUrl = (typeof GAS_API_URL !== 'undefined') ? GAS_API_URL : '';

    // 1. スプレッドシート（動的ステータス台帳）へ切断信号を確実に送信
    if (customId && gasUrl && !gasUrl.includes("YOUR_GAS")) {
      try {
        navigator.sendBeacon(`${gasUrl}?action=logout&customId=${encodeURIComponent(customId)}`);
      } catch (e) {
        fetch(`${gasUrl}?action=logout&customId=${encodeURIComponent(customId)}`, { mode: 'no-cors' });
      }
    }

    // 2. LocalStorageの全セッションキーを完全消去（新旧全キー対応）
    const keysToRemove = [
      'cncm_uid',
      'cncm_username',
      'cncm_custom_id',
      'cncm_avatar',
      'cncm_custom_image',
      'cncm_rank',
      'cncm_likes',
      'cncm_is_admin',
      'cncm_friends',
      'cncm_mock_stories',
      'cncm_mock_feed',
      'cncm_registered_date'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 万が一のためのセッションストレージ全クリア
    sessionStorage.clear();

    // 3. ログイン画面へ強制脱出・リダイレクト
    window.location.replace('login.html');
  };

  // 既存の壊れていた古い handleLogout もこの完全関数で上書き救済
  window.handleLogout = window.triggerCompleteLogout;

})();
