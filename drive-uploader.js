/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) - Drive Storage & Explorer Addon
 * GAS側親フォルダ固定 ＆ サブフォルダ動的スクリーニング連動版
 */

// ================= 設定領域 =================
// 独立Drive専用GASのデプロイURL（ウェブアプリURL）をここに貼るだけ！
const DRIVE_GAS_API_URL = "https://script.google.com/macros/s/AKfycbzrhCMwSbRE6Qv1NZ2mRcTqxHf0LwriqIAaqcHeRvnraHTgj0ObCeta2qimMWH8lu63bA/exec";

// サブフォルダ名とUI表示タイトルのマッピング
const SUB_FOLDER_DISPLAY_TITLES = {
  "SE_BGM": "🎵 効果音・BGM素材",
  "VideoFootage": "🎬 動画テクスチャ・オーバーレイ",
  "Presets": "⚙️ プロジェクト・プリセット",
  "Fonts_Palette": "🎨 パレット・カラー設定",
  "01_Forum_Attachments": "💬 フォーラム添付メディア",
  "02_Event_Entries": "🏆 企画・お題提出作品"
};

// ================= DOM動的注入 ＆ 既存関数ハイジャック =================
(function initDriveScreeningExplorer() {
  window.addEventListener('DOMContentLoaded', () => {
    // 独自エクスプローラー用モーダルの注入
    const explorerModalHtml = `
      <div class="modal-backdrop" id="driveExplorerModal" style="display: none; z-index: 2500;">
        <div class="modal-sheet modal-sheet-lg" style="max-height: 85vh; display: flex; flex-direction: column;">
          <div class="modal-header">
            <div>
              <h3 id="explorerFolderTitle" style="display: inline;">📁 ドライブストレージ</h3>
              <span id="explorerItemCount" class="sub-text" style="margin-left: 0.5rem;">0件</span>
            </div>
            <button class="modal-close-btn" onclick="closeDriveExplorerModal()">✕</button>
          </div>

          <!-- 親フォルダ配下のサブフォルダ切替タブバー -->
          <div id="explorerSubFolderTabs" style="display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.5rem; margin-bottom: 0.6rem; border-bottom: 1px solid var(--border); scrollbar-width: none;"></div>
          
          <!-- 素材追加アップロードバー -->
          <div style="background: var(--bg-main); border: 1px dashed var(--border); border-radius: 6px; padding: 0.6rem 0.8rem; margin-bottom: 0.8rem; display: flex; justify-content: space-between; align-items: center;">
            <span class="sub-text">選択中のフォルダに素材を追加</span>
            <button class="btn btn-primary btn-small" onclick="openDriveUploadFromExplorer()">＋ ファイルを追加</button>
          </div>

          <!-- ファイル一覧領域 -->
          <div class="modal-body" id="explorerFileListArea" style="flex: 1; overflow-y: auto;">
            <div class="empty-state-notice" id="explorerLoadingNotice">親フォルダをスクリーニング中...</div>
            <div id="explorerGridContainer" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.8rem;"></div>
          </div>
        </div>
      </div>

      <!-- 匿名アップロードモーダル -->
      <div class="modal-backdrop" id="driveUploadAddonModal" style="display: none; z-index: 3000;">
        <div class="modal-sheet" style="max-width: 440px; text-align: center;">
          <div class="modal-header">
            <h3>📁 団体Driveへ安全アップロード</h3>
            <button class="modal-close-btn" onclick="closeDriveUploadModal()">✕</button>
          </div>
          <div class="modal-body" style="padding: 1rem 0;">
            <p class="sub-text" style="margin-bottom: 1rem;">
              ファイルはCNCM公式ドライブへ代理保存され、<br>
              <strong>あなたのGoogle本名やメールは一切残りません（完全匿名化）。</strong>
            </p>
            
            <div style="border: 2px dashed var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; background: var(--bg-main);">
              <input type="file" id="driveAddonFileInput" style="display: none;" onchange="handleFileSelected(event)">
              <button class="btn btn-outline" onclick="document.getElementById('driveAddonFileInput').click()">
                ファイルを選択
              </button>
              <div id="selectedFileNameDisplay" class="sub-text" style="margin-top: 0.6rem; word-break: break-all;">選択されていません (上限: 約40MB)</div>
            </div>

            <div id="uploadProgressArea" style="display: none; margin-bottom: 1rem;">
              <div class="sub-text" id="uploadStatusLabel" style="color: var(--accent); margin-bottom: 0.3rem;">アップロード中...</div>
              <div style="width: 100%; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden;">
                <div id="uploadProgressBar" style="width: 0%; height: 100%; background: var(--accent); transition: width 0.3s;"></div>
              </div>
            </div>

            <button class="btn btn-primary" id="startUploadBtn" style="width: 100%;" onclick="executeDriveUpload()" disabled>
              匿名アップロードを開始
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', explorerModalHtml);

    // 既存の openDriveLink(folderKey) をアプリ内エクスプローラー起動へ奪取
    window.openDriveLink = function(subFolderName) {
      launchDriveExplorer(subFolderName);
    };

    attachUploadButtons();
  });
})();

// ================= エクスプローラー制御ロジック =================
let activeSubFolderName = "SE_BGM";
let cachedSubFolders = [];

function launchDriveExplorer(targetSubName) {
  activeSubFolderName = targetSubName || "SE_BGM";
  const modal = document.getElementById('driveExplorerModal');
  const title = document.getElementById('explorerFolderTitle');
  const count = document.getElementById('explorerItemCount');
  const container = document.getElementById('explorerGridContainer');
  const loading = document.getElementById('explorerLoadingNotice');

  title.innerText = SUB_FOLDER_DISPLAY_TITLES[activeSubFolderName] || `📁 ${activeSubFolderName}`;
  count.innerText = "読込中...";
  container.innerHTML = "";
  loading.style.display = "block";
  loading.innerText = "Google Driveの親フォルダ配下をスクリーニング中...";
  modal.style.display = "flex";

  // 親フォルダ直下のサブフォルダ一覧を取得（未キャッシュ時）
  if (cachedSubFolders.length === 0) {
    fetch(`${DRIVE_GAS_API_URL}?action=getSubFolders`)
      .then(res => res.json())
      .then(res => {
        if (res.status === "success" && res.folders) {
          cachedSubFolders = res.folders;
          renderSubFolderTabs();
        }
      })
      .catch(() => {});
  } else {
    renderSubFolderTabs();
  }

  // 指定サブフォルダ内のファイル一覧を取得
  loadSubFolderFiles(activeSubFolderName);
}

function renderSubFolderTabs() {
  const bar = document.getElementById('explorerSubFolderTabs');
  if (!bar) return;
  bar.innerHTML = "";

  cachedSubFolders.forEach(folder => {
    const btn = document.createElement('button');
    btn.className = `sub-tab-btn ${folder.name === activeSubFolderName ? 'active' : ''}`;
    btn.innerText = SUB_FOLDER_DISPLAY_TITLES[folder.name] || folder.name;
    btn.onclick = () => {
      activeSubFolderName = folder.name;
      document.querySelectorAll('#explorerSubFolderTabs .sub-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('explorerFolderTitle').innerText = SUB_FOLDER_DISPLAY_TITLES[folder.name] || `📁 ${folder.name}`;
      loadSubFolderFiles(folder.name);
    };
    bar.appendChild(btn);
  });
}

function loadSubFolderFiles(subName) {
  const count = document.getElementById('explorerItemCount');
  const container = document.getElementById('explorerGridContainer');
  const loading = document.getElementById('explorerLoadingNotice');

  container.innerHTML = "";
  loading.style.display = "block";
  loading.innerText = `フォルダ「${subName}」をスキャン中...`;

  fetch(`${DRIVE_GAS_API_URL}?action=getFilesBySubFolder&subFolderName=${encodeURIComponent(subName)}`)
    .then(res => res.json())
    .then(response => {
      loading.style.display = "none";
      if (response.status !== "success" || !response.files || response.files.length === 0) {
        count.innerText = "0件";
        container.innerHTML = `<div class="empty-state-notice" style="grid-column: 1/-1;">このフォルダにはまだファイルがありません。「ファイルを追加」からアップロードできます！</div>`;
        return;
      }

      count.innerText = `${response.files.length}件の素材`;
      renderExplorerFiles(response.files, container);
    })
    .catch(err => {
      loading.style.display = "block";
      loading.innerText = "Driveスクリーニング通信に失敗しました。GASのPARENT_FOLDER_URLと共有設定をご確認ください。";
    });
}

function renderExplorerFiles(files, container) {
  container.innerHTML = "";
  files.forEach(file => {
    const card = document.createElement('div');
    card.className = "card no-margin-bottom";
    card.style.padding = "0.75rem";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.justifyContent = "space-between";

    let mediaPreviewHtml = "";
    if (file.mimeType.startsWith("audio/")) {
      mediaPreviewHtml = `
        <audio controls style="width: 100%; height: 32px; margin: 0.4rem 0;">
          <source src="${file.downloadUrl}" type="${file.mimeType}">
        </audio>
      `;
    } else if (file.mimeType.startsWith("image/")) {
      mediaPreviewHtml = `
        <div style="width: 100%; aspect-ratio: 16/9; background: #000; border-radius: 4px; overflow: hidden; margin: 0.4rem 0;">
          <img src="${file.previewUrl.replace('/preview', '/view')}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">
        </div>
      `;
    } else {
      mediaPreviewHtml = `
        <div style="background: var(--bg-main); border-radius: 4px; padding: 0.5rem; text-align: center; margin: 0.4rem 0; font-size: 0.75rem; color: var(--text-sub);">
          📄 ${file.mimeType}
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div style="font-weight: bold; font-size: 0.85rem; word-break: break-all; margin-bottom: 0.2rem;">${file.name}</div>
        <div class="sub-text">${file.size} ・ ${file.updated}</div>
        ${mediaPreviewHtml}
      </div>
      <div style="display: flex; gap: 0.4rem; margin-top: 0.5rem;">
        <a href="${file.previewUrl}" target="_blank" class="btn btn-outline btn-small" style="flex: 1; text-decoration: none; text-align: center;">別窓</a>
        <a href="${file.downloadUrl}" class="btn btn-primary btn-small" style="flex: 1; text-decoration: none; text-align: center;" download>保存</a>
      </div>
    `;
    container.appendChild(card);
  });
}

function closeDriveExplorerModal() {
  document.getElementById('driveExplorerModal').style.display = 'none';
}

function openDriveUploadFromExplorer() {
  openDriveUploadModal(null, activeSubFolderName);
}

// ================= アップロード制御 =================
let currentTargetInputId = null;
let currentUploadSubFolder = "SE_BGM";
let fileToUpload = null;

function attachUploadButtons() {
  const targetInputs = [
    { id: 'newThreadDriveUrl', targetSub: '01_Forum_Attachments' },
    { id: 'submitWorkDriveUrl', targetSub: '02_Event_Entries' }
  ];

  targetInputs.forEach(target => {
    const inputElem = document.getElementById(target.id);
    if (inputElem && !document.getElementById(target.id + '_btn')) {
      const btn = document.createElement('button');
      btn.id = target.id + '_btn';
      btn.type = 'button';
      btn.className = 'btn btn-outline btn-small';
      btn.style.marginTop = '0.3rem';
      btn.innerText = '📁 端末からDriveへ直接アップロードしてURLを挿入';
      btn.onclick = () => openDriveUploadModal(target.id, target.targetSub);
      inputElem.parentNode.insertBefore(btn, inputElem.nextSibling);
    }
  });
}

function openDriveUploadModal(targetInputId, subFolderName) {
  currentTargetInputId = targetInputId;
  currentUploadSubFolder = subFolderName || "SE_BGM";
  fileToUpload = null;

  document.getElementById('selectedFileNameDisplay').innerText = '選択されていません (上限: 約40MB)';
  document.getElementById('startUploadBtn').disabled = true;
  document.getElementById('uploadProgressArea').style.display = 'none';
  document.getElementById('uploadProgressBar').style.width = '0%';
  document.getElementById('driveUploadAddonModal').style.display = 'flex';
}

function closeDriveUploadModal() {
  document.getElementById('driveUploadAddonModal').style.display = 'none';
}

function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 40 * 1024 * 1024) {
    alert('ファイルサイズが40MBを超えています。大容量ファイルはギガファイル便等をご利用ください。');
    return;
  }

  fileToUpload = file;
  document.getElementById('selectedFileNameDisplay').innerText = `選択中: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  document.getElementById('startUploadBtn').disabled = false;
}

function executeDriveUpload() {
  if (!fileToUpload) return;

  const btn = document.getElementById('startUploadBtn');
  const progressArea = document.getElementById('uploadProgressArea');
  const progressBar = document.getElementById('uploadProgressBar');
  const statusLabel = document.getElementById('uploadStatusLabel');

  btn.disabled = true;
  progressArea.style.display = 'block';
  progressBar.style.width = '30%';
  statusLabel.innerText = 'ファイルを変換中...';

  const reader = new FileReader();
  reader.onload = function(e) {
    progressBar.style.width = '60%';
    statusLabel.innerText = `フォルダ「${currentUploadSubFolder}」へ安全中継アップロード中...`;

    const base64Data = e.target.result.split(',')[1];
    
    fetch(DRIVE_GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: JSON.stringify({
        action: 'uploadFile',
        subFolderName: currentUploadSubFolder,
        fileName: fileToUpload.name,
        mimeType: fileToUpload.type,
        base64: base64Data
      })
    })
    .then(res => res.json())
    .then(result => {
      if (result.status === 'success') {
        progressBar.style.width = '100%';
        statusLabel.innerText = 'アップロード完了！';

        if (currentTargetInputId) {
          const targetInput = document.getElementById(currentTargetInputId);
          if (targetInput) targetInput.value = result.previewUrl;
        }

        setTimeout(() => {
          closeDriveUploadModal();
          alert('Google Driveへのアップロードが完了しました！🎉');
          if (document.getElementById('driveExplorerModal').style.display === 'flex') {
            loadSubFolderFiles(activeSubFolderName);
          }
        }, 500);
      } else {
        throw new Error(result.message);
      }
    })
    .catch(err => {
      alert('アップロードに失敗しました: ' + err.message);
      btn.disabled = false;
      progressArea.style.display = 'none';
    });
  };

  reader.readAsDataURL(fileToUpload);
}
