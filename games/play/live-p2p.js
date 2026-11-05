/**
 * JH 바둑스쿨 — 실시간 1:1 P2P 대국 동기화 엔진 (PeerJS WebRTC 기반)
 * Serverless Real-time Peer-to-Peer Go Engine
 */

(function () {
  'use strict';

  var urlParams = new URLSearchParams(window.location.search);
  var modeParam = urlParams.get('mode');
  var roomParam = urlParams.get('room');
  var isHost = urlParams.get('host') === '1' || urlParams.get('role') === 'host';
  var p1Param = urlParams.get('p1');
  var p2Param = urlParams.get('p2');

  // live 모드가 아니거나 room 파라미터가 없으면 활성화하지 않음
  if (modeParam !== 'live' && !roomParam) {
    return;
  }

  var roomCode = (roomParam || 'JH-' + Math.floor(1000 + Math.random() * 9000)).toUpperCase();
  var myPeerId = isHost ? ('jh-baduk-' + roomCode.toLowerCase()) : null;
  var targetPeerId = 'jh-baduk-' + roomCode.toLowerCase();

  var peer = null;
  var activeConn = null;
  var isConnected = false;

  // 내가 잡은 돌 색상 (Host: 흑(1), Guest: 백(2) 기본값)
  var myColor = isHost ? 1 : 2; // 1: BLACK, 2: WHITE
  var myName = isHost ? (p1Param || '선생님') : (p2Param || '학생');
  var oppName = isHost ? (p2Param || '상대방') : (p1Param || '선생님');

  // --- UI 엘리먼트 생성 및 주입 ---
  function injectLiveUI() {
    var playStage = document.getElementById('playStage');
    if (!playStage) return;

    // 1. 상단 실시간 대국 상태 배너
    var banner = document.createElement('div');
    banner.className = 'live-match-banner';
    banner.id = 'liveMatchBanner';
    banner.innerHTML =
      '<div class="live-banner-left">' +
      '  <span class="live-status-dot waiting" id="liveStatusDot"></span>' +
      '  <span class="live-banner-text" id="liveBannerText">' +
      (isHost ? '⏳ 상대방(학생)의 입장을 기다리고 있습니다...' : '⏳ 대국방에 연결 중입니다...') +
      '  </span>' +
      '</div>' +
      '<div class="live-banner-right">' +
      '  <span class="live-room-badge" id="liveRoomBadge">방 코드: ' + escapeHtml(roomCode) + '</span>' +
      '  <button type="button" class="btn-copy-invite" id="btnCopyInviteLink">📋 초대 링크 복사</button>' +
      '</div>';

    // 2. 하단 매너 인사 & 빠른 채팅 툴바
    var chatBar = document.createElement('div');
    chatBar.className = 'live-chat-bar';
    chatBar.id = 'liveChatBar';
    chatBar.innerHTML =
      '<span class="chat-bar-label">💬 매너 인사:</span>' +
      '<button type="button" class="btn-chat-pill" data-msg="안녕하세요! 잘 부탁드립니다 🙇">🙇 인사하기</button>' +
      '<button type="button" class="btn-chat-pill" data-msg="좋은 수네요! 👍">👍 좋은 수</button>' +
      '<button type="button" class="btn-chat-pill" data-msg="생각 중이에요 잠시만요 ⏳">⏳ 생각 중</button>' +
      '<button type="button" class="btn-chat-pill" data-msg="감사합니다! 잘 배웠습니다 🌟">🌟 감사 인사</button>';

    var boardContainer = document.getElementById('boardContainer');
    if (boardContainer) {
      playStage.insertBefore(banner, boardContainer);
      playStage.appendChild(chatBar);
    } else {
      playStage.prepend(banner);
      playStage.appendChild(chatBar);
    }

    // 초대 링크 복사 버튼 이벤트
    var btnCopy = document.getElementById('btnCopyInviteLink');
    if (btnCopy) {
      btnCopy.addEventListener('click', function () {
        var hostUrl = window.location.origin + window.location.pathname +
          '?mode=live&room=' + encodeURIComponent(roomCode) +
          '&boardSize=' + (window.PlayApp ? window.PlayApp.state.boardSize : 19);

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(hostUrl).then(function () {
            showToast('📋 대국 초대 링크가 복사되었습니다! 카톡이나 문자로 보내세요.');
          }).catch(function () {
            promptCopyFallback(hostUrl);
          });
        } else {
          promptCopyFallback(hostUrl);
        }
      });
    }

    // 채팅 툴바 이벤트
    chatBar.querySelectorAll('.btn-chat-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var msg = btn.dataset.msg;
        sendPacket({ type: 'chat', text: msg, sender: myName });
        showChatBubble(myColor, msg);
        showToast('💬 ' + msg);
      });
    });

    // 플레이어 이름 및 아바타 텍스트 업데이트
    updatePlayerHeaders();
  }

  function promptCopyFallback(url) {
    prompt('아래 초대 링크를 복사하여 학생에게 전달하세요:', url);
  }

  function updatePlayerHeaders() {
    var blackNameEl = document.getElementById('timerBlackName');
    var whiteNameEl = document.getElementById('timerWhiteName');
    var whiteRankBadge = document.getElementById('arenaWhiteRankBadge');
    var blackRankBadge = document.getElementById('arenaBlackRankBadge');

    if (myColor === 1) {
      if (blackNameEl) blackNameEl.textContent = myName + ' (나·흑)';
      if (whiteNameEl) whiteNameEl.textContent = oppName + ' (상대·백)';
    } else {
      if (whiteNameEl) whiteNameEl.textContent = myName + ' (나·백)';
      if (blackNameEl) blackNameEl.textContent = oppName + ' (상대·흑)';
    }

    if (whiteRankBadge) whiteRankBadge.textContent = '🌐 실시간 원격';
    if (blackRankBadge) blackRankBadge.textContent = '🌐 실시간 원격';

    var engineCard = document.getElementById('arenaEngineCard');
    if (engineCard) {
      engineCard.innerHTML = '<div class="engine-badge-title">🌐 1:1 실시간 대국</div><div class="engine-badge-sub">P2P 착수 동기화 연결됨</div>';
    }
  }

  // --- 말풍선 표시 애니메이션 ---
  function showChatBubble(color, text) {
    var charBoxId = color === 1 ? 'arenaBlackCharBox' : 'arenaWhiteCharBox';
    var box = document.getElementById(charBoxId);
    if (!box) return;

    var oldBubble = box.querySelector('.char-chat-bubble');
    if (oldBubble) oldBubble.remove();

    var bubble = document.createElement('div');
    bubble.className = 'char-chat-bubble';
    bubble.textContent = text;
    box.appendChild(bubble);

    setTimeout(function () {
      bubble.classList.add('fade-out');
      setTimeout(function () { bubble.remove(); }, 400);
    }, 3500);
  }

  // --- PeerJS WebRTC 네트워크 연결 ---
  function initPeer() {
    if (typeof window.Peer === 'undefined') {
      console.warn('[LiveP2P] PeerJS not loaded yet, retrying...');
      setTimeout(initPeer, 300);
      return;
    }

    try {
      if (isHost) {
        // 호스트는 정해진 방 ID로 오픈
        peer = new window.Peer(myPeerId);
      } else {
        // 게스트는 랜덤 ID로 열고 호스트에게 접속
        peer = new window.Peer();
      }

      peer.on('open', function (id) {
        console.log('[LiveP2P] Peer opened with ID:', id);
        if (!isHost) {
          connectToHost();
        }
      });

      peer.on('connection', function (conn) {
        console.log('[LiveP2P] Incoming connection from:', conn.peer);
        setupConnection(conn);
      });

      peer.on('error', function (err) {
        console.error('[LiveP2P] Peer error:', err.type, err);
        if (err.type === 'peer-unavailable') {
          console.log('[LiveP2P] Host peer not ready yet, retrying connect in 1.5s...');
          setTimeout(connectToHost, 1500);
          return;
        }
        if (err.type === 'unavailable-id') {
          // 이미 방이 열려있는 경우 (내가 게스트로 들어온 상황)
          console.log('[LiveP2P] Room ID already taken, connecting as guest...');
          isHost = false;
          myColor = 2;
          peer.destroy();
          peer = new window.Peer();
          peer.on('open', function () {
            connectToHost();
          });
          return;
        }
        showToast('⚠️ 네트워크 연결 오류: ' + (err.message || err.type));
      });

    } catch (e) {
      console.error('[LiveP2P] Exception during initPeer:', e);
    }
  }

  var connectRetryTimer = null;
  function connectToHost() {
    if (!peer || isConnected) return;
    console.log('[LiveP2P] Connecting to host peer:', targetPeerId);
    var conn = peer.connect(targetPeerId, { reliable: true });
    setupConnection(conn);

    clearTimeout(connectRetryTimer);
    connectRetryTimer = setTimeout(function () {
      if (!isConnected) {
        console.log('[LiveP2P] Auto-retrying connection to host...');
        connectToHost();
      }
    }, 2800);
  }

  function setupConnection(conn) {
    activeConn = conn;

    conn.on('open', function () {
      clearTimeout(connectRetryTimer);
      isConnected = true;
      console.log('[LiveP2P] DataChannel connected successfully!');

      var dot = document.getElementById('liveStatusDot');
      var text = document.getElementById('liveBannerText');

      if (dot) {
        dot.className = 'live-status-dot connected';
      }
      if (text) {
        text.innerHTML = '🟢 <b>' + escapeHtml(oppName) + '</b>님과 실시간 연결되었습니다! 대국을 시작하세요.';
      }

      showToast('🎉 상대방과 실시간 연결되었습니다! 즐거운 대국 되세요.');

      // 핸드셰이크 전송
      sendPacket({
        type: 'handshake',
        name: myName,
        isHost: isHost,
        color: myColor
      });
    });

    conn.on('data', function (data) {
      handleRemotePacket(data);
    });

    conn.on('close', function () {
      isConnected = false;
      console.log('[LiveP2P] Connection closed.');
      var dot = document.getElementById('liveStatusDot');
      var text = document.getElementById('liveBannerText');
      if (dot) dot.className = 'live-status-dot waiting';
      if (text) text.innerHTML = '⚠️ 상대방과의 연결이 종료되었습니다.';
      showToast('⚠️ 상대방과의 연결이 끊어졌습니다.');
    });

    conn.on('error', function (err) {
      console.error('[LiveP2P] Connection error:', err);
    });
  }

  // --- 패킷 송수신 ---
  function sendPacket(pkt) {
    if (activeConn && activeConn.open) {
      try {
        activeConn.send(pkt);
      } catch (e) {
        console.error('[LiveP2P] Send failed:', e);
      }
    }
  }

  function handleRemotePacket(pkt) {
    if (!pkt || !pkt.type) return;
    console.log('[LiveP2P] Received packet:', pkt);

    switch (pkt.type) {
      case 'handshake':
        if (pkt.name) oppName = pkt.name;
        updatePlayerHeaders();
        break;

      case 'move':
        if (window.LiveBridge && window.LiveBridge.applyRemoteMove) {
          window.LiveBridge.applyRemoteMove(pkt.c, pkt.r, pkt.color);
        }
        break;

      case 'pass':
        if (window.LiveBridge && window.LiveBridge.applyRemotePass) {
          window.LiveBridge.applyRemotePass(pkt.color);
        }
        break;

      case 'resign':
        if (window.LiveBridge && window.LiveBridge.applyRemoteResign) {
          window.LiveBridge.applyRemoteResign(pkt.color);
        }
        break;

      case 'chat':
        showChatBubble(pkt.color || (myColor === 1 ? 2 : 1), pkt.text);
        showToast('💬 ' + pkt.text);
        break;
    }
  }

  // --- 외부 노출 API ---
  window.LiveP2P = {
    isLive: true,
    myColor: myColor,
    canMove: function (currentTurn) {
      if (!isConnected) {
        showToast('⏳ 아직 상대방이 입장하지 않았습니다.');
        return false;
      }
      return currentTurn === myColor;
    },
    broadcastMove: function (c, r, color) {
      sendPacket({ type: 'move', c: c, r: r, color: color });
    },
    broadcastPass: function (color) {
      sendPacket({ type: 'pass', color: color });
    },
    broadcastResign: function (color) {
      sendPacket({ type: 'resign', color: color });
    }
  };

  // 토스트 헬퍼
  function showToast(msg) {
    var toast = document.getElementById('playToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.hidden = true;
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      injectLiveUI();
      initPeer();
    });
  } else {
    injectLiveUI();
    initPeer();
  }
})();
