/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) - Drive Uploader Addon
 * 既存コード無改変型：Google Drive完全匿名中継アップローダー
 */

// GASのWebアプリURL（前回のCode.gsと同じURL、またはDrive専用GASのURL）
const DRIVE_GAS_API_URL = "https://script.google.com/macros/s/AKfycbzDK0AsoOVoCfFtSrrzlKW3ffKUpmTwLO07AyKXXJ3-GULZiUBTo6aZEXxqicqYugqSKQ/exec";

// ================= 1. アップロード専用モーダルの自動動的生成 =================
(function injectDriveUploaderUI() {
  window.addEventListener('DOMContentLoaded', () => {
    // アップローダーモーダルHTMLをbody末尾に自動注入
    const modalHtml = `
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
              <input type="file" id="driveAddonFileInput" accept="video/*,audio/*,image/*" style="display: none;" onchange="handleFileSelected(event)">
              <button class="btn btn-outline" onclick="document.getElementById('driveAddonFileInput').click()">
                ファイルを選択 (動画・音声・画像)
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
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 既存のスレッド作成画面・企画提出画面の「Drive URL入力欄」を探してボタンを自動追加
    attachUploadButtons();
  });
})();

// 既存の入力欄の横に「アップロードボタン」を外付け注入する処理
function attachUploadButtons() {
  const targetInputs = [
    { id: 'newThreadDriveUrl', targetFolder: '01_Forum_Attachments' },
    { id: 'submitWorkDriveUrl', targetFolder: '02_Event_Entries' }
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
      btn.onclick = () => openDriveUploadModal(target.id, target.targetFolder);
      
      inputElem.parentNode.insertBefore(btn, inputElem.nextSibling);
    }
  });
}

// ================= 2. アップロード制御ロジック =================
let currentTargetInputId = null;
let currentTargetFolder = '01_Forum_Attachments';
let fileToUpload = null;

function openDriveUploadModal(targetInputId, folderName) {
  currentTargetInputId = targetInputId;
  currentTargetFolder = folderName;
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

  // 約40MB制限チェック
  if (file.size > 40 * 1024 * 1024) {
    alert('ファイルサイズが40MBを超えています。大容量ファイルはギガファイル便等の共有リンクをご利用ください。');
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
  statusLabel.innerText = 'ファイルを暗号化・変換中...';

  const reader = new FileReader();
  reader.onload = function(e) {
    progressBar.style.width = '60%';
    statusLabel.innerText = '団体Driveへ安全中継アップロード中...';

    const base64Data = e.target.result.split(',')[1];
    
    // GASエンドポイントへ送信
    fetch(DRIVE_GAS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: JSON.stringify({
        action: 'uploadFile',
        folder: currentTargetFolder,
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

        // 呼び出し元の入力欄（スレッド画面や企画提出画面のURL欄）へ自動セット
        if (currentTargetInputId) {
          const targetInput = document.getElementById(currentTargetInputId);
          if (targetInput) {
            targetInput.value = result.previewUrl;
          }
        }

        setTimeout(() => {
          closeDriveUploadModal();
          alert('Google Driveへの安全アップロードが完了し、URLが自動挿入されました！🎉');
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
