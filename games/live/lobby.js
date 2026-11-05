/**
 * JH 바둑스쿨 — 실시간 대국 라운지 (대기실) 시스템
 * 조이스쿨(바둑Study) 대기실 & 원격 1:1 대국 신청 매칭 엔진
 */

(function () {
  'use strict';

  // --- 오디오 효과음 (Web Audio API Synthesizer) ---
  var soundEnabled = true;
  var audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playTone(freq, type, duration, delay) {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioContext();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (delay || 0));

      gain.gain.setValueAtTime(0.12, ctx.currentTime + (delay || 0));
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (delay || 0) + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (delay || 0));
      osc.stop(ctx.currentTime + (delay || 0) + duration);
    } catch (e) {}
  }

  function playChime() {
    playTone(523.25, 'sine', 0.2, 0);       // C5
    playTone(659.25, 'sine', 0.25, 0.12);   // E5
    playTone(783.99, 'triangle', 0.4, 0.24);// G5
  }

  function playIncomingAlert() {
    playTone(880, 'triangle', 0.25, 0);     // A5
    playTone(1046.5, 'sine', 0.35, 0.18);   // C6
    playTone(1318.5, 'sine', 0.5, 0.36);    // E6
  }

  function playClick() {
    playTone(400, 'sine', 0.05, 0);
  }

  // --- 내 프로필 & 신원 관리 ---
  var storedId = localStorage.getItem('baduk_user_id');
  if (!storedId) {
    storedId = 'u_' + Math.random().toString(36).substr(2, 8);
    localStorage.setItem('baduk_user_id', storedId);
  }

  var myProfile = {
    id: storedId,
    name: localStorage.getItem('baduk_user_name') || '김진홍선생님',
    level: localStorage.getItem('baduk_user_level') || 'Lv2',
    rank: '2단',
    avatar: '/assets/stat_1.png',
    status: 'waiting', // 'waiting' | 'playing' | 'rest'
    wins: 12,
    losses: 4,
    rating19: 292,
    rating13: 69,
    rating9: 45
  };

  // 실시간 접속자 목록 (실제 접속자 + 예시 친구들)
  var realOnlinePeers = {}; // { id: { id, name, level, status, lastSeen } }

  var mockUsers = [
    { id: 'u_mock_1', name: '시연선생님', level: 'Lv1', rank: '1단', status: 'rest', avatar: '/assets/stat_2.png', manner: '😊', school: '강남지도교사', isMock: true },
    { id: 'u_mock_2', name: '최현우선생님', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '😎', school: '마포지도교사', isMock: true },
    { id: 'u_mock_3', name: '독수리 포에버', level: 'Lv48', rank: '4단', status: 'waiting', avatar: '/assets/stat_4.png', manner: '🦁', school: '대치초 4학년', isMock: true },
    { id: 'u_mock_4', name: '은하수바둑', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_5.png', manner: '😊', school: '서초초 3학년', isMock: true },
    { id: 'u_mock_5', name: '정지율', level: 'Lv21', rank: '2단', status: 'playing', avatar: '/assets/stat_1.png', manner: '🔥', school: '잠실초 5학년', isMock: true },
    { id: 'u_mock_6', name: '염리초 하은서', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_1.png', manner: '⭐', school: '염리초 2학년', isMock: true },
    { id: 'u_mock_7', name: '신명민', level: 'Lv7', rank: '7급', status: 'waiting', avatar: '/assets/stat_2.png', manner: '😄', school: '목동초 3학년', isMock: true },
    { id: 'u_mock_8', name: '대남초 백승우', level: 'Lv3', rank: '3단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '🌱', school: '대남초 4학년', isMock: true },
    { id: 'u_mock_9', name: '김태린', level: 'Lv27', rank: '2단', status: 'playing', avatar: '/assets/stat_4.png', manner: '🏆', school: '반포초 6학년', isMock: true },
    { id: 'u_mock_10', name: '염리초 이시온', level: 'Lv2', rank: '2단', status: 'playing', avatar: '/assets/stat_5.png', manner: '🌟', school: '염리초 3학년', isMock: true },
    { id: 'u_mock_11', name: '바둑왕 민재', level: 'Lv12', rank: '1단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '👑', school: '청담초 4학년', isMock: true },
    { id: 'u_mock_12', name: '꿈나무 서현', level: 'Lv5', rank: '5급', status: 'waiting', avatar: '/assets/stat_1.png', manner: '✨', school: '도곡초 2학년', isMock: true }
  ];

  var roomsData = [
    {
      id: 1,
      type: '친선대국',
      boardSize: 19,
      status: 'review',
      pBlack: { name: '김진홍선생님', level: 'Lv2' },
      pWhite: { name: 'AI 알파돌', level: 'Lv1' },
      timeRule: '10분'
    },
    {
      id: 2,
      type: '레이팅대국',
      boardSize: 19,
      status: 'playing',
      pBlack: { name: '염리초 하은서', level: 'Lv1' },
      pWhite: { name: '신명민', level: 'Lv7' },
      timeRule: '15분'
    },
    {
      id: 3,
      type: '레이팅대국',
      boardSize: 19,
      status: 'playing',
      pBlack: { name: '정지율', level: 'Lv21' },
      pWhite: { name: '김태린', level: 'Lv27' },
      timeRule: '10분'
    },
    {
      id: 4,
      type: '친선대국',
      boardSize: 13,
      status: 'waiting',
      pBlack: { name: '독수리 포에버', level: 'Lv48' },
      pWhite: null,
      timeRule: '5분',
      roomCode: 'JH-1304'
    },
    {
      id: 5,
      type: '레이팅대국',
      boardSize: 13,
      status: 'playing',
      pBlack: { name: '염리초 이시온', level: 'Lv2' },
      pWhite: { name: '대남초 백승우', level: 'Lv3' },
      timeRule: '10분'
    },
    {
      id: 6,
      type: '새싹대국',
      boardSize: 9,
      status: 'waiting',
      pBlack: { name: '은하수바둑', level: 'Lv1' },
      pWhite: null,
      timeRule: '무제한',
      roomCode: 'JH-0906'
    },
    {
      id: 7,
      type: '새싹대국',
      boardSize: 9,
      status: 'playing',
      pBlack: { name: '꿈나무 서현', level: 'Lv5' },
      pWhite: { name: '바둑왕 민재', level: 'Lv12' },
      timeRule: '5분'
    },
    {
      id: 8,
      type: '친선대국',
      boardSize: 19,
      status: 'review',
      pBlack: { name: '최현우선생님', level: 'Lv1' },
      pWhite: { name: '시연선생님', level: 'Lv1' },
      timeRule: '10분'
    }
  ];

  // 필터 상태
  var currentRoomFilter = 'all';
  var currentUserFilter = 'waiting';
  var searchQuery = '';

  // 신청 관련
  var selectedTargetUser = null;
  var challengeOptions = {
    boardSize: 19,
    stoneColor: 'nigiri',
    handicap: 0,
    timeRule: '10m'
  };

  // --- MQTT 실시간 통신 클라이언트 ---
  var mqttClient = null;
  var TOPIC_PRESENCE = 'jhbaduk/lobby/v2/presence';
  var TOPIC_CHALLENGES = 'jhbaduk/lobby/v2/challenges';
  var TOPIC_ROOMS = 'jhbaduk/lobby/v2/rooms';

  function initMqtt() {
    if (typeof Paho === 'undefined' || !Paho.MQTT) {
      console.warn('[LobbyMQTT] Paho MQTT not available');
      return;
    }

    try {
      var clientId = 'jh_lobby_' + myProfile.id + '_' + Math.floor(Math.random() * 10000);
      mqttClient = new Paho.MQTT.Client('broker.hivemq.com', 8884, clientId);

      mqttClient.onConnectionLost = function (responseObject) {
        if (responseObject.errorCode !== 0) {
          console.warn('[LobbyMQTT] Connection lost:', responseObject.errorMessage);
          setTimeout(initMqtt, 3000);
        }
      };

      mqttClient.onMessageArrived = function (message) {
        try {
          var data = JSON.parse(message.payloadString);
          var topic = message.destinationName;

          if (topic === TOPIC_PRESENCE) {
            handlePresenceMessage(data);
          } else if (topic === TOPIC_CHALLENGES) {
            handleChallengeMessage(data);
          } else if (topic === TOPIC_ROOMS) {
            handleRoomBroadcast(data);
          }
        } catch (e) {
          console.error('[LobbyMQTT] Parse error:', e);
        }
      };

      mqttClient.connect({
        useSSL: true,
        timeout: 6,
        keepAliveInterval: 30,
        cleanSession: true,
        onSuccess: function () {
          console.log('[LobbyMQTT] Connected to HiveMQ WSS broker!');
          mqttClient.subscribe(TOPIC_PRESENCE);
          mqttClient.subscribe(TOPIC_CHALLENGES);
          mqttClient.subscribe(TOPIC_ROOMS);

          // 첫 하트비트 전송
          sendHeartbeat();
          // 4초마다 온라인 상태 갱신
          setInterval(sendHeartbeat, 4000);
          // 3초마다 타임아웃된 접속자 정리
          setInterval(pruneOfflinePeers, 3000);
        },
        onFailure: function (err) {
          console.warn('[LobbyMQTT] Connect failure, retry in 4s:', err.errorMessage);
          setTimeout(initMqtt, 4000);
        }
      });
    } catch (e) {
      console.error('[LobbyMQTT] Exception:', e);
    }
  }

  function sendHeartbeat() {
    if (!mqttClient || !mqttClient.isConnected()) return;
    try {
      var pkt = {
        action: 'heartbeat',
        user: {
          id: myProfile.id,
          name: myProfile.name,
          level: myProfile.level,
          status: myProfile.status,
          avatar: myProfile.avatar,
          timestamp: Date.now()
        }
      };
      var msg = new Paho.MQTT.Message(JSON.stringify(pkt));
      msg.destinationName = TOPIC_PRESENCE;
      mqttClient.send(msg);
    } catch (e) {}
  }

  function handlePresenceMessage(data) {
    if (!data || !data.user) return;
    var u = data.user;
    if (u.id === myProfile.id) return; // 내 자신 제외

    if (data.action === 'leave') {
      delete realOnlinePeers[u.id];
    } else {
      realOnlinePeers[u.id] = {
        id: u.id,
        name: u.name,
        level: u.level || 'Lv1',
        rank: u.level || '1단',
        status: u.status || 'waiting',
        avatar: u.avatar || '/assets/stat_2.png',
        manner: '🌟',
        school: '실시간 접속 친구 🟢',
        isReal: true,
        lastSeen: Date.now()
      };
    }
    renderUsers();
  }

  function pruneOfflinePeers() {
    var now = Date.now();
    var changed = false;
    for (var k in realOnlinePeers) {
      if (now - realOnlinePeers[k].lastSeen > 12000) {
        delete realOnlinePeers[k];
        changed = true;
      }
    }
    if (changed) renderUsers();
  }

  // --- 1:1 대국 신청 메시지 처리 (조이스쿨 핵심 방식) ---
  function handleChallengeMessage(data) {
    if (!data || !data.type) return;

    // 1. 나에게 대국 신청이 온 경우 (도전장 도착!)
    if (data.type === 'challenge_request' && data.toId === myProfile.id) {
      // 거부 옵션 체크
      if (isChallengeRejected(data.boardSize)) {
        // 자동으로 거부 응답 전송
        sendChallengeResponse(data, false, '상대방이 해당 줄 수의 대국을 거절하도록 설정해 두었습니다.');
        return;
      }

      playIncomingAlert();

      var modal = document.getElementById('incomingModal');
      var textEl = document.getElementById('incomingSenderText');
      var bEl = document.getElementById('incDetailBoard');
      var tEl = document.getElementById('incDetailTime');

      if (textEl) {
        textEl.innerHTML = '<b>' + escapeHtml(data.from.name) + '</b> (' + escapeHtml(data.from.level) + ') 친구가 1:1 대국을 신청했어요!';
      }
      if (bEl) bEl.textContent = data.boardSize + '줄 바둑';
      if (tEl) {
        var tMap = { '1m10s': '1분 (10초 3회)', '5m': '5분 (20초 3회)', '10m': '10분 (30초 3회)', '15m': '15분 (40초 3회)', 'none': '무제한' };
        tEl.textContent = tMap[data.timeRule] || data.timeRule || '10분';
      }

      if (modal) modal.hidden = false;

      var btnAccept = document.getElementById('btnAcceptIncoming');
      var btnReject = document.getElementById('btnRejectIncoming');

      if (btnAccept) {
        btnAccept.onclick = function () {
          playChime();
          if (modal) modal.hidden = true;
          showToast('🟢 대국을 수락했습니다! 대국실로 입장합니다...', 2000);
          sendChallengeResponse(data, true);
          setTimeout(function () {
            window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(data.roomCode) +
              '&boardSize=' + (data.boardSize || 19) +
              '&handicap=' + (data.handicap || 0) + '&timeLimit=' + encodeURIComponent(data.timeRule || '10m') +
              '&p1=' + encodeURIComponent(data.from.name) +
              '&p2=' + encodeURIComponent(myProfile.name);
          }, 800);
        };
      }

      if (btnReject) {
        btnReject.onclick = function () {
          playClick();
          if (modal) modal.hidden = true;
          sendChallengeResponse(data, false);
          showToast('대국 신청을 거절했습니다.');
        };
      }
    }

    // 2. 내가 보낸 대국 신청에 대한 상대방의 응답 수신
    if (data.type === 'challenge_response' && data.toId === myProfile.id) {
      if (data.accept) {
        playChime();
        showToast('🎉 [' + (data.fromName || '상대방') + '] 친구가 대국을 수락했습니다! 대국실로 입장합니다...', 2500);
        setTimeout(function () {
          window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(data.roomCode) +
            '&host=1&boardSize=' + (data.boardSize || 19) +
            '&handicap=' + (data.handicap || 0) + '&timeLimit=' + encodeURIComponent(data.timeRule || '10m') +
            '&p1=' + encodeURIComponent(myProfile.name) +
            '&p2=' + encodeURIComponent(data.fromName || '상대방');
        }, 800);
      } else {
        playClick();
        showToast('상대방이 대국 신청을 거절했습니다.');
      }
    }
  }

  function sendChallengeResponse(reqData, accept, reason) {
    if (!mqttClient || !mqttClient.isConnected()) return;
    try {
      var resp = {
        type: 'challenge_response',
        toId: reqData.from.id,
        fromId: myProfile.id,
        fromName: myProfile.name,
        roomCode: reqData.roomCode,
        boardSize: reqData.boardSize,
        handicap: reqData.handicap || 0,
        accept: accept,
        reason: reason || ''
      };
      var msg = new Paho.MQTT.Message(JSON.stringify(resp));
      msg.destinationName = TOPIC_CHALLENGES;
      mqttClient.send(msg);
    } catch (e) {}
  }

  function handleRoomBroadcast(data) {
    if (!data || !data.room) return;
    var newR = data.room;
    // 목록 맨 앞에 추가
    roomsData.unshift(newR);
    renderRooms();
  }

  function isChallengeRejected(boardSize) {
    var chk19 = document.getElementById('chkAccept19');
    var chk13 = document.getElementById('chkAccept13');
    var chk9 = document.getElementById('chkAccept9');

    if (boardSize === 19 && chk19 && !chk19.checked) return true;
    if (boardSize === 13 && chk13 && !chk13.checked) return true;
    if (boardSize === 9 && chk9 && !chk9.checked) return true;
    return false;
  }

  // --- 토스트 알림 표시 ---
  function showToast(msg, duration) {
    var toast = document.getElementById('loungeToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.hidden = true;
    }, duration || 2800);
  }

  // --- 대국실 목록 렌더링 ---
  function renderRooms() {
    var grid = document.getElementById('roomsGrid');
    if (!grid) return;

    var filtered = roomsData.filter(function (r) {
      if (currentRoomFilter === 'all') return true;
      return String(r.boardSize) === currentRoomFilter;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="padding:40px 20px;text-align:center;color:#94a3b8;font-size:0.95rem;">' +
        '해당 조건의 대국실이 없습니다. 새 대국방을 개설해보세요!</div>';
      return;
    }

    grid.innerHTML = filtered.map(function (room) {
      var statusClass = room.status === 'playing' ? 'status-playing' : (room.status === 'waiting' ? 'status-waiting' : 'status-review');
      var statusBadgeClass = room.status;
      var statusText = room.status === 'playing' ? '진행 중' : (room.status === 'waiting' ? '대기 중' : '복기');

      var whitePlayerHtml = room.pWhite
        ? '<span class="player-item white"><span class="stone-dot"></span> ' + escapeHtml(room.pWhite.name) + ' <span class="player-lvl">' + escapeHtml(room.pWhite.level) + '</span></span>'
        : '<span class="player-item" style="color:#94a3b8;">(입장 대기 중...)</span>';

      var actionBtnHtml = '';
      if (room.status === 'waiting') {
        actionBtnHtml = '<button type="button" class="btn-room-action enter" data-room-id="' + room.id + '">대국 입장</button>';
      } else if (room.status === 'playing') {
        actionBtnHtml = '<button type="button" class="btn-room-action watch" data-room-id="' + room.id + '">관전하기</button>';
      } else {
        actionBtnHtml = '<button type="button" class="btn-room-action watch" data-room-id="' + room.id + '">기보 복기</button>';
      }

      return '<div class="room-card ' + statusClass + '">' +
        '  <div class="room-no-badge">' + room.id + '<small>번방</small></div>' +
        '  <div class="room-info">' +
        '    <div class="room-meta-row">' +
        '      <span class="room-type-tag">' + escapeHtml(room.type) + '</span>' +
        '      <span class="room-board-tag">' + room.boardSize + '줄</span>' +
        '      <span class="room-board-tag">' + (room.timeRule || '10분') + '</span>' +
        '      <span class="room-status-badge ' + statusBadgeClass + '">' + statusText + '</span>' +
        '    </div>' +
        '    <div class="room-players-row">' +
        '      <span class="player-item black"><span class="stone-dot"></span> ' + escapeHtml(room.pBlack.name) + ' <span class="player-lvl">' + escapeHtml(room.pBlack.level) + '</span></span>' +
        '      <span class="vs-divider">VS</span>' +
        whitePlayerHtml +
        '    </div>' +
        '  </div>' +
        '  <div class="room-actions">' + actionBtnHtml + '</div>' +
        '</div>';
    }).join('');

    // 이벤트 리스너 연결
    grid.querySelectorAll('.btn-room-action').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        playClick();
        var rId = btn.dataset.roomId;
        var rObj = roomsData.find(function (r) { return String(r.id) === String(rId); });
        if (rObj) {
          var code = rObj.roomCode || ('JH-' + rObj.id + '00');
          if (rObj.status === 'waiting') {
            showToast('🏠 ' + rId + '번 대국방에 입장합니다! 잠시만 기다려주세요...');
            setTimeout(function () {
              window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(code) +
                '&boardSize=' + rObj.boardSize + '&p2=' + encodeURIComponent(myProfile.name);
            }, 600);
          } else {
            showToast('👀 ' + rObj.pBlack.name + ' vs ' + (rObj.pWhite ? rObj.pWhite.name : '대기') + ' 대국을 관전합니다.');
            setTimeout(function () {
              window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(code) +
                '&boardSize=' + rObj.boardSize + '&watch=1';
            }, 600);
          }
        }
      });
    });
  }

  // --- 접속자 명단 렌더링 (실제 온라인 접속자 + 예시 친구) ---
  function renderUsers() {
    var list = document.getElementById('usersList');
    var badge = document.getElementById('userCount');
    var headerBadge = document.getElementById('onlineCountBadge');
    if (!list) return;

    // 실제 접속자들을 맨 위에 배치
    var allList = [];
    for (var k in realOnlinePeers) {
      allList.push(realOnlinePeers[k]);
    }
    // 예시 친구들 병합
    mockUsers.forEach(function (m) {
      allList.push(m);
    });

    var filtered = allList.filter(function (u) {
      if (currentUserFilter === 'waiting' && u.status !== 'waiting') return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var matchName = u.name.toLowerCase().indexOf(q) !== -1;
        var matchSchool = u.school && u.school.toLowerCase().indexOf(q) !== -1;
        if (!matchName && !matchSchool) return false;
      }
      return true;
    });

    var totalOnline = allList.length;
    if (badge) badge.textContent = totalOnline;
    if (headerBadge) headerBadge.textContent = totalOnline + '명';

    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:0.88rem;">' +
        '조건에 맞는 친구가 없습니다.</div>';
      return;
    }

    list.innerHTML = filtered.map(function (u) {
      var statusClass = u.status;
      var statusText = u.status === 'waiting' ? '대기' : (u.status === 'playing' ? '대국 중' : '휴식');
      var challengeBtn = u.status === 'waiting'
        ? '<button type="button" class="btn-user-challenge" data-user-id="' + u.id + '">신청</button>'
        : '';
      var realIndicator = u.isReal ? '<span style="color:#22c55e;font-size:0.75rem;font-weight:800;">● LIVE</span> ' : '';

      return '<div class="user-item-card ' + (u.isReal ? 'real-user' : '') + '" data-user-id="' + u.id + '">' +
        '  <div class="user-left-info">' +
        '    <img src="' + u.avatar + '" alt="" class="user-avatar-mini">' +
        '    <div class="user-text-info">' +
        '      <div class="user-name-row">' +
        '        <span class="user-name">' + realIndicator + escapeHtml(u.name) + '</span>' +
        '        <span class="user-lvl-pill">' + escapeHtml(u.level) + '</span>' +
        '        <span>' + u.manner + '</span>' +
        '      </div>' +
        '      <span class="user-desc-small">' + escapeHtml(u.school || u.rank) + '</span>' +
        '    </div>' +
        '  </div>' +
        '  <div class="user-right-actions">' +
        '    <span class="status-pill ' + statusClass + '">' + statusText + '</span>' +
        challengeBtn +
        '  </div>' +
        '</div>';
    }).join('');

    // 이벤트 리스너 연결 (더블클릭 또는 클릭 시 신청 모달)
    list.querySelectorAll('.user-item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var uId = card.dataset.userId;
        var uObj = findUserById(uId);
        if (uObj) openChallengeModal(uObj);
      });
    });

    list.querySelectorAll('.btn-user-challenge').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var uId = btn.dataset.userId;
        var uObj = findUserById(uId);
        if (uObj) openChallengeModal(uObj);
      });
    });
  }

  function findUserById(id) {
    if (realOnlinePeers[id]) return realOnlinePeers[id];
    return mockUsers.find(function (m) { return m.id === id; });
  }

  // --- 대국 신청 모달 열기 ---
  function openChallengeModal(targetUser) {
    selectedTargetUser = targetUser;
    playClick();

    var modal = document.getElementById('challengeModal');
    var label = document.getElementById('targetUserLabel');
    if (!modal) return;

    if (label) {
      label.innerHTML = '상대방: <b>' + escapeHtml(targetUser.name) + '</b> (' + escapeHtml(targetUser.level) + ') · ' + escapeHtml(targetUser.school || '');
    }

    modal.hidden = false;
  }

  function closeChallengeModal() {
    playClick();
    var modal = document.getElementById('challengeModal');
    if (modal) modal.hidden = true;
    selectedTargetUser = null;
  }

  // --- 대국 신청 발송 (조이스쿨 1:1 신청 매칭) ---
  function sendChallenge() {
    if (!selectedTargetUser) return;
    playChime();

    var target = selectedTargetUser;
    var bSize = challengeOptions.boardSize;
    var rCode = 'JH-' + Math.floor(1000 + Math.random() * 9000);
    closeChallengeModal();

    showToast('⚔️ [' + target.name + '] 친구에게 ' + bSize + '줄 대국을 신청했습니다! 상대방의 수락을 기다립니다...', 4000);

    // 실제 온라인 접속자인 경우: 실시간 MQTT 도전장 패킷 전송!
    if (target.isReal && mqttClient && mqttClient.isConnected()) {
      var req = {
        type: 'challenge_request',
        toId: target.id,
        from: {
          id: myProfile.id,
          name: myProfile.name,
          level: myProfile.level
        },
        boardSize: bSize,
        timeRule: challengeOptions.timeRule,
        handicap: challengeOptions.handicap,
        roomCode: rCode
      };
      var msg = new Paho.MQTT.Message(JSON.stringify(req));
      msg.destinationName = TOPIC_CHALLENGES;
      mqttClient.send(msg);
      // 상대방이 팝업에서 수락할 때까지 대기합니다.
      return;
    }

    // 예시(가상) 친구인 경우: 2.5초 후 수락 시뮬레이션
    setTimeout(function () {
      playChime();
      showToast('🎉 [' + target.name + '] 친구가 대국 신청을 수락했습니다! 대국실로 입장합니다...', 2500);

      setTimeout(function () {
        window.location.href = '/games/play/index.html?mode=live&room=' + rCode + '&host=1&boardSize=' + bSize +
          '&handicap=' + (challengeOptions.handicap || 0) + '&timeLimit=' + encodeURIComponent(challengeOptions.timeRule || '10m') +
          '&p1=' + encodeURIComponent(myProfile.name) + '&p2=' + encodeURIComponent(target.name);
      }, 1000);
    }, 2500);
  }

  // --- 자동 맞춤 대국 (원클릭 자동 매칭) ---
  function startAutoMatch() {
    playClick();
    showToast('🎲 나와 실력이 가장 비슷한 대기 친구를 찾는 중입니다...', 2500);

    setTimeout(function () {
      // 1. 실제 접속 중인 대기 친구가 있는지 확인
      var realCandidates = [];
      for (var k in realOnlinePeers) {
        if (realOnlinePeers[k].status === 'waiting') realCandidates.push(realOnlinePeers[k]);
      }

      if (realCandidates.length > 0) {
        // 실제 접속자와 즉시 매칭
        var opp = realCandidates[0];
        selectedTargetUser = opp;
        sendChallenge();
        return;
      }

      // 2. 실제 접속자가 없으면 예시 친구 중 매칭
      var mockCandidates = mockUsers.filter(function (u) { return u.status === 'waiting'; });
      var opponent = mockCandidates[Math.floor(Math.random() * mockCandidates.length)];
      var rCode = 'JH-' + Math.floor(1000 + Math.random() * 9000);

      playChime();
      showToast('🎯 매칭 성공! [' + opponent.name + '] 친구와 연결되었습니다!', 2000);
      setTimeout(function () {
        window.location.href = '/games/play/index.html?mode=live&room=' + rCode + '&host=1&boardSize=19&p1=' +
          encodeURIComponent(myProfile.name) + '&p2=' + encodeURIComponent(opponent.name);
      }, 1000);
    }, 1500);
  }

  // --- 새 대국방 개설 모달 & 목록 등록 ---
  var currentCreatedRoomCode = null;

  function createNewRoom() {
    playChime();
    currentCreatedRoomCode = 'JH-' + Math.floor(1000 + Math.random() * 9000);

    var modal = document.getElementById('roomCreatedModal');
    var codeDisplay = document.getElementById('createdRoomCodeDisplay');
    if (codeDisplay) codeDisplay.textContent = currentCreatedRoomCode;
    if (modal) modal.hidden = false;

    // 대국실 리스트에 즉시 방 등록 및 브로드캐스트
    var newRoomId = roomsData.length + 1;
    var newR = {
      id: newRoomId,
      type: '친선대국 (' + currentCreatedRoomCode + ')',
      boardSize: 19,
      status: 'waiting',
      pBlack: { name: myProfile.name, level: myProfile.level },
      pWhite: null,
      timeRule: '10분',
      roomCode: currentCreatedRoomCode
    };

    roomsData.unshift(newR);
    renderRooms();

    // MQTT로 대국방 개설 브로드캐스트
    if (mqttClient && mqttClient.isConnected()) {
      try {
        var msg = new Paho.MQTT.Message(JSON.stringify({ action: 'create_room', room: newR }));
        msg.destinationName = TOPIC_ROOMS;
        mqttClient.send(msg);
      } catch (e) {}
    }
  }

  function initCreatedRoomModal() {
    var modal = document.getElementById('roomCreatedModal');
    var btnCopy = document.getElementById('btnCopyCreatedRoomLink');
    var btnEnter = document.getElementById('btnEnterCreatedRoom');
    var btnClose = document.getElementById('btnCloseCreatedModal');

    if (btnCopy) {
      btnCopy.onclick = function () {
        var inviteUrl = window.location.origin + '/games/play/index.html?mode=live&room=' + encodeURIComponent(currentCreatedRoomCode) + '&boardSize=19';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(inviteUrl).then(function () {
            showToast('📋 초대 링크가 복사되었습니다!');
          }).catch(function () {
            prompt('초대 링크 복사:', inviteUrl);
          });
        } else {
          prompt('초대 링크 복사:', inviteUrl);
        }
      };
    }

    if (btnEnter) {
      btnEnter.onclick = function () {
        playClick();
        window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(currentCreatedRoomCode) + '&host=1&boardSize=19&p1=' + encodeURIComponent(myProfile.name);
      };
    }

    if (btnClose) {
      btnClose.onclick = function () {
        playClick();
        if (modal) modal.hidden = true;
      };
    }
  }

  // --- 방 코드 직접 입력 입장 모달 ---
  function initJoinByCodeModal() {
    var btnOpen = document.getElementById('btnJoinByCode');
    var modal = document.getElementById('joinByCodeModal');
    var input = document.getElementById('inputRoomCode');
    var btnCancel = document.getElementById('btnCancelJoinCode');
    var btnSubmit = document.getElementById('btnSubmitJoinCode');

    if (btnOpen) {
      btnOpen.onclick = function () {
        playClick();
        if (input) input.value = '';
        if (modal) modal.hidden = false;
        setTimeout(function () { if (input) input.focus(); }, 150);
      };
    }

    if (btnCancel) {
      btnCancel.onclick = function () {
        playClick();
        if (modal) modal.hidden = true;
      };
    }

    if (btnSubmit) {
      btnSubmit.onclick = function () {
        var val = (input ? input.value : '').trim().toUpperCase();
        if (!val) {
          showToast('방 코드를 입력해주세요!');
          return;
        }
        if (!val.startsWith('JH-')) {
          val = 'JH-' + val;
        }
        playChime();
        showToast('🔑 ' + val + ' 대국방으로 입장합니다...');
        setTimeout(function () {
          window.location.href = '/games/play/index.html?mode=live&room=' + encodeURIComponent(val) + '&p2=' + encodeURIComponent(myProfile.name);
        }, 600);
      };
    }
  }

  // --- 대화명(닉네임) 변경 지원 ---
  function initProfileEdit() {
    var editIcon = document.querySelector('.avatar-badge-edit');
    var nameEl = document.getElementById('myNickName');

    function promptEdit() {
      var current = myProfile.name;
      var newName = prompt('대기실에서 사용할 이름을 입력하세요 (예: 3학년 하은서):', current);
      if (newName && newName.trim() && newName.trim() !== current) {
        myProfile.name = newName.trim();
        localStorage.setItem('baduk_user_name', myProfile.name);
        if (nameEl) nameEl.textContent = myProfile.name;
        showToast('대화명이 [' + myProfile.name + '](으)로 변경되었습니다!');
        sendHeartbeat();
      }
    }

    if (editIcon) editIcon.addEventListener('click', promptEdit);
    if (nameEl) nameEl.addEventListener('click', promptEdit);
  }

  // --- HTML Escape 헬퍼 ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- DOM 초기화 및 이벤트 등록 ---
  function init() {
    // 1. 내 대화명 표시
    var nameEl = document.getElementById('myNickName');
    if (nameEl) nameEl.textContent = myProfile.name;

    // 2. 대국실 보드 크기 필터 탭
    var roomFilterTabs = document.querySelectorAll('#roomBoardFilter .tab-pill');
    roomFilterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        playClick();
        roomFilterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentRoomFilter = tab.dataset.filter;
        renderRooms();
      });
    });

    // 3. 접속자 상태 필터 탭
    var userFilterTabs = document.querySelectorAll('#userStatusFilter .tab-pill');
    userFilterTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        playClick();
        userFilterTabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentUserFilter = tab.dataset.userFilter;
        renderUsers();
      });
    });

    // 4. 접속자 검색창
    var searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value.trim();
        renderUsers();
      });
    }

    // 5. 모달 옵션 바둑판 크기 버튼들
    var boardSizeBtns = document.querySelectorAll('#optBoardSizeGrid .opt-select-btn');
    boardSizeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        boardSizeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.boardSize = parseInt(btn.dataset.val, 10);
      });
    });

    // 6. 돌 배정 버튼들
    var stoneBtns = document.querySelectorAll('#optStoneGrid .opt-pill-btn');
    stoneBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        stoneBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.stoneColor = btn.dataset.val;
      });
    });

    // 7. 치수 규칙 버튼들
    var handicapBtns = document.querySelectorAll('#optHandicapGrid .opt-pill-btn');
    handicapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        handicapBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.handicap = parseInt(btn.dataset.val, 10);
      });
    });

    // 8. 대국 시간 버튼들
    var timeBtns = document.querySelectorAll('#optTimeGrid .opt-pill-btn');
    timeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        timeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.timeRule = btn.dataset.val;
      });
    });

    // 9. 모달 닫기 및 신청 발송
    var btnCloseModal = document.getElementById('btnCloseChallengeModal');
    var btnCancelChallenge = document.getElementById('btnCancelChallenge');
    var btnSendChallenge = document.getElementById('btnSendChallenge');

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeChallengeModal);
    if (btnCancelChallenge) btnCancelChallenge.addEventListener('click', closeChallengeModal);
    if (btnSendChallenge) btnSendChallenge.addEventListener('click', sendChallenge);

    // 10. 모달 초기화
    initCreatedRoomModal();
    initJoinByCodeModal();
    initProfileEdit();

    // 11. 빠른 액션 버튼: 자동 맞춤 대국 & 대국방 만들기
    var btnAutoMatch = document.getElementById('btnAutoMatch');
    var btnCreateRoom = document.getElementById('btnCreateRoom');

    if (btnAutoMatch) btnAutoMatch.addEventListener('click', startAutoMatch);
    if (btnCreateRoom) btnCreateRoom.addEventListener('click', createNewRoom);

    // 12. 상단 툴바: 효과음 및 전체화면
    var btnSoundToggle = document.getElementById('btnSoundToggle');
    if (btnSoundToggle) {
      btnSoundToggle.addEventListener('click', function () {
        soundEnabled = !soundEnabled;
        btnSoundToggle.textContent = soundEnabled ? '🔊 효과음' : '🔇 음소거';
        showToast(soundEnabled ? '🔊 효과음이 켜졌습니다.' : '🔇 효과음이 꺼졌습니다.');
      });
    }

    var btnFullscreen = document.getElementById('btnFullscreen');
    if (btnFullscreen) {
      btnFullscreen.addEventListener('click', function () {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(function () {});
        } else {
          document.exitFullscreen().catch(function () {});
        }
      });
    }

    // 13. 초기 렌더링 & 실시간 통신 연결
    renderRooms();
    renderUsers();
    initMqtt();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
