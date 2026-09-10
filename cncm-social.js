/**
 * CanvasNetCreatorMEMBERSHIP (CNCM) - Social Ecosystem Addon
 * 新設13機能（フォロー/DM/フィード/ストーリーズ/AI/ギルド/11段階ランク）統合プラグイン
 */

(function initCncmSocialAddon() {
  // ストーリーズ、フィード、ギルドのインメモリ保持
  let stories = JSON.parse(localStorage.getItem('cncm_mock_stories') || '[]');
  let feedPosts = JSON.parse(localStorage.getItem('cncm_mock_feed') || '[]');
  let friends = JSON.parse(localStorage.getItem('cncm_friends') || '[]');

  // ================= 1. Xライク・フィード機能（機能②） =================
  window.publishFeedPost = function() {
    const input = document.getElementById('feedPostInput');
    const text = input.value.trim();
    if (!text) return;

    const newPost = {
      id: 'post_' + Date.now(),
      author: currentUser.name,
      customId: currentUser.customId,
      avatar: currentUser.avatar,
      rank: currentUser.rank,
      text: text,
      likes: 0,
      time: '今'
    };

    feedPosts.unshift(newPost);
    localStorage.setItem('cncm_mock_feed', JSON.stringify(feedPosts));
    input.value = '';
    renderFeed();
  };

  function renderFeed() {
    const stream = document.getElementById('feedStreamArea');
    if (!stream) return;
    stream.innerHTML = '';

    if (feedPosts.length === 0) {
      stream.innerHTML = '<div class="empty-state-notice">投稿はまだありません。最初の進捗をつぶやいてみましょう！</div>';
      return;
    }

    feedPosts.forEach(post => {
      const card = document.createElement('div');
      card.className = 'feed-card';
      card.innerHTML = `
        <div class="feed-header">
          <div class="header-avatar" style="width:28px; height:28px;">${post.avatar}</div>
          <strong>${post.author}</strong>
          <span class="ore-rank-badge rank-${post.rank.toLowerCase()}">${post.rank}</span>
          <span class="sub-text">${post.time}</span>
        </div>
        <div style="font-size:0.85rem; line-height:1.4; margin:0.4rem 0;">${post.text}</div>
        <div class="feed-actions">
          <span style="cursor:pointer;" onclick="likeFeedPost('${post.id}')">❤️ ${post.likes}</span>
          <span style="cursor:pointer;" onclick="openUserProfile('${post.customId}')">👤 プロフィール</span>
        </div>
      `;
      stream.appendChild(card);
    });
  }

  window.likeFeedPost = function(postId) {
    const p = feedPosts.find(x => x.id === postId);
    if (p) {
      p.likes++;
      localStorage.setItem('cncm_mock_feed', JSON.stringify(feedPosts));
      renderFeed();
    }
  };

  // ================= 2. 24時間ストーリーズ機能（機能⑤） =================
  window.renderStories = function() {
    const tray = document.getElementById('storiesTray');
    if (!tray) return;
    const addBtn = tray.querySelector('.add-story');
    tray.innerHTML = '';
    if (addBtn) tray.appendChild(addBtn);

    stories.forEach(s => {
      const circle = document.createElement('div');
      circle.className = 'story-circle';
      circle.onclick = () => showCustomDialog({ title: `${s.author}のストーリー`, message: s.content });
      circle.innerHTML = `
        <div class="story-avatar-wrap">${s.avatar}</div>
        <span>${s.author}</span>
      `;
      tray.appendChild(circle);
    });
  };

  // ================= 3. AIコンシェルジュ（機能④） =================
  window.toggleAiConcierge = function() {
    const win = document.getElementById('aiConciergeWindow');
    win.style.display = (win.style.display === 'none') ? 'flex' : 'none';
  };

  window.askAiConcierge = function() {
    const input = document.getElementById('aiChatInput');
    const txt = input.value.trim();
    if (!txt) return;

    const stream = document.getElementById('aiChatStream');
    const uBubble = document.createElement('div');
    uBubble.className = 'chat-bubble mine';
    uBubble.innerText = txt;
    stream.appendChild(uBubble);
    input.value = '';

    setTimeout(() => {
      const aBubble = document.createElement('div');
      aBubble.className = 'chat-bubble other';
      aBubble.innerText = `【AI回答】「${txt}」ですね！制作アイデア出しならフォーラムの「ラフ見て」タブも活用できますよ。`;
      stream.appendChild(aBubble);
      stream.scrollTop = stream.scrollHeight;
    }, 500);
  };

  // ================= 4. 公開プロフィール検索・表示（機能⑨） =================
  window.openUserProfile = function(customId) {
    const modal = document.getElementById('publicProfileModal');
    const content = document.getElementById('publicProfileContent');
    content.innerHTML = `
      <div style="text-align:center; padding:1rem 0;">
        <div class="avatar-preview-box" style="margin:0 auto 0.6rem;">🎨</div>
        <h3>クリエイター (${customId})</h3>
        <span class="ore-rank-badge rank-iron">Iron</span>
        <p class="sub-text" style="margin-top:0.4rem;">「新曲のミックス中！」</p>
        <div style="display:flex; gap:0.5rem; justify-content:center; margin-top:1rem;">
          <button class="btn btn-primary btn-small" onclick="requestFollowFriend('${customId}')">🤝 フレンド申請</button>
          <button class="btn btn-outline btn-small" onclick="openPrivateDm('${customId}')">💬 DMを送る</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  };

  window.requestFollowFriend = function(targetId) {
    if (!friends.includes(targetId)) {
      friends.push(targetId);
      localStorage.setItem('cncm_friends', JSON.stringify(friends));
    }
    showCustomDialog({ icon: '🤝', title: '申請完了', message: `${targetId} に相互フレンド申請を送りました！` });
  };

  // 起動時描画
  window.addEventListener('DOMContentLoaded', () => {
    renderFeed();
    window.renderStories();
  });
})();
