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
    name: localStorage.getItem('baduk_user_name') || ('참가자 ' + storedId.slice(-4)),
    level: '참가자',
    rank: '',
    avatar: '/assets/stat_1.png',
    status: 'waiting', // 'waiting' | 'playing' | 'rest'
    wins: 0,
    losses: 0
  };

  // 실시간 접속자 목록 (실제 접속자만)
  var presenceConnected = false;
  var presenceState = 'connecting';
  var heartbeatTimer = null, pruneTimer = null, reconnectTimer = null;
  var isLeaving = false;
  var realOnlinePeers = {}; // { id: { id, name, level, status, lastSeen } }

  var roomsData = [];

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

  function setPresenceState(status) {
    presenceState = status;
    presenceConnected = status === 'connected';
    if (!presenceConnected) { realOnlinePeers = {}; roomsData = []; }
    renderUsers(); renderRooms();
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    clearInterval(heartbeatTimer); clearInterval(pruneTimer);
    heartbeatTimer = null; pruneTimer = null;
    if (!isLeaving) reconnectTimer = setTimeout(initMqtt, 4000);
  }

  function initMqtt() {
    if (isLeaving) return;
    if (typeof Paho === 'undefined' || !Paho.MQTT) {
      setPresenceState('error');
      return;
    }
    try {
      var clientId = 'jh_lobby_' + myProfile.id + '_' + Math.floor(Math.random() * 1000000);
      var client = new Paho.MQTT.Client('broker.hivemq.com', 8884, clientId);
      mqttClient = client;
      var will = new Paho.MQTT.Message(JSON.stringify({ action: 'leave', user: { id: myProfile.id } }));
      will.destinationName = TOPIC_PRESENCE;
      client.onConnectionLost = function () {
        if (mqttClient !== client) return;
        setPresenceState('error'); scheduleReconnect();
      };
      client.onMessageArrived = function (message) {
        if (mqttClient !== client) return;
        try {
          var data = JSON.parse(message.payloadString);
          if (message.destinationName === TOPIC_PRESENCE) handlePresenceMessage(data);
          else if (message.destinationName === TOPIC_CHALLENGES) handleChallengeMessage(data);
          else if (message.destinationName === TOPIC_ROOMS) handleRoomBroadcast(data);
        } catch (e) { console.warn('[LobbyMQTT] Invalid message'); }
      };
      client.connect({
        useSSL: true, timeout: 6, keepAliveInterval: 15, cleanSession: true, willMessage: will,
        onSuccess: function () {
          if (mqttClient !== client || isLeaving) { client.disconnect(); return; }
          client.subscribe(TOPIC_PRESENCE, { onSuccess: function () {
            if (mqttClient !== client) return;
            setPresenceState('connected'); sendHeartbeat();
            var hello = new Paho.MQTT.Message(JSON.stringify({ action: 'hello', user: { id: myProfile.id } }));
            hello.destinationName = TOPIC_PRESENCE; client.send(hello);
          }});
          client.subscribe(TOPIC_CHALLENGES); client.subscribe(TOPIC_ROOMS);
          clearInterval(heartbeatTimer); clearInterval(pruneTimer);
          heartbeatTimer = setInterval(sendHeartbeat, 4000);
          pruneTimer = setInterval(pruneOfflinePeers, 3000);
        },
        onFailure: function () {
          if (mqttClient !== client) return;
          setPresenceState('error'); scheduleReconnect();
        }
      });
    } catch (e) { setPresenceState('error'); scheduleReconnect(); }
  }

  function leaveLobby() {
    isLeaving = true;
    clearTimeout(reconnectTimer); clearInterval(heartbeatTimer); clearInterval(pruneTimer);
    if (mqttClient && mqttClient.isConnected()) {
      try {
        var msg = new Paho.MQTT.Message(JSON.stringify({ action: 'leave', user: { id: myProfile.id } }));
        msg.destinationName = TOPIC_PRESENCE; mqttClient.send(msg); mqttClient.disconnect();
      } catch (e) {}
    }
  }
  window.addEventListener('pagehide', leaveLobby);
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) { isLeaving = false; setPresenceState('connecting'); initMqtt(); }
  });

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
      roomsData.filter(function (room) { return room.ownerId === myProfile.id; }).forEach(function (room) {
        room.lastSeen = Date.now();
        var roomMsg = new Paho.MQTT.Message(JSON.stringify({ action: 'room_heartbeat', room: room }));
        roomMsg.destinationName = TOPIC_ROOMS; mqttClient.send(roomMsg);
      });
    } catch (e) {}
  }

  function handlePresenceMessage(data) {
    if (!data || !data.user) return;
    var u = data.user;
    if (typeof u.id !== 'string' || !/^[A-Za-z0-9_-]{1,96}$/.test(u.id) || u.id === myProfile.id || u.id.indexOf('u_mock_') === 0) return;
    if (data.action === 'hello') { sendHeartbeat(); return; }
    if (data.action !== 'leave' && data.action !== 'heartbeat') return;

    if (data.action === 'leave') {
      delete realOnlinePeers[u.id];
      roomsData = roomsData.filter(function (room) { return room.ownerId !== u.id; });
      renderRooms();
    } else {
      realOnlinePeers[u.id] = {
        id: u.id,
        name: typeof u.name === 'string' ? u.name.slice(0, 40) : '참가자',
        level: '참가자',
        rank: '',
        status: ['waiting', 'playing', 'rest'].indexOf(u.status) >= 0 ? u.status : 'waiting',
        avatar: '/assets/stat_2.png',
        manner: '🌟',
        school: '실시간 접속 참가자',
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
    var oldRoomCount = roomsData.length;
    roomsData = roomsData.filter(function (room) { return room.ownerId === myProfile.id || now - room.lastSeen <= 12000; });
    if (oldRoomCount !== roomsData.length) renderRooms();
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
    if (!presenceConnected || !data || !data.room) return;
    var room = data.room;
    if (typeof room.roomCode !== 'string' || !/^JH-[A-Z0-9-]{4,24}$/.test(room.roomCode) || typeof room.ownerId !== 'string' || !/^[A-Za-z0-9_-]{1,96}$/.test(room.ownerId) || !Number.isSafeInteger(room.id) || room.id < 1 || !room.pBlack || typeof room.pBlack.name !== 'string' || [9, 13, 19].indexOf(room.boardSize) < 0 || ['waiting', 'playing', 'review'].indexOf(room.status) < 0) return;
    if (room.pWhite && typeof room.pWhite.name !== 'string') return;
    room.lastSeen = Date.now();
    var index = roomsData.findIndex(function (r) { return r.roomCode === room.roomCode; });
    if (index >= 0) roomsData[index] = room; else roomsData.unshift(room);
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
        (presenceConnected ? '현재 개설된 대국실이 없습니다. 참가자를 선택해 신청하거나 새 방을 만들어 보세요.' : '대기실 연결 후 실제 개설된 대국실을 표시합니다.') + '</div>';
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

  // --- 접속자 명단 렌더링 (실제 온라인 접속자만) ---
  function renderUsers() {
    var list = document.getElementById('usersList');
    var badge = document.getElementById('userCount');
    var headerBadge = document.getElementById('onlineCountBadge');
    if (!list) return;

    // 서버 연결로 확인한 다른 참가자만 표시
    var allList = [];
    for (var k in realOnlinePeers) {
      allList.push(realOnlinePeers[k]);
    }


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
    if (badge) badge.textContent = presenceConnected ? totalOnline : '-';
    if (headerBadge) headerBadge.textContent = presenceConnected ? (totalOnline + 1) + '명' : '-';
    var connectionStatus = document.getElementById('lobbyConnectionStatus');
    if (connectionStatus) connectionStatus.textContent = presenceConnected ? '실시간 연결됨 · 친구 목록은 나를 제외한 접속자입니다.' : (presenceState === 'error' ? '대기실 연결에 실패했습니다. 재연결을 시도하고 있습니다.' : '실시간 접속자를 확인하고 있습니다.');

    if (filtered.length === 0) {
      list.innerHTML = '<div style="padding:24px;text-align:center;color:#94a3b8;font-size:0.88rem;">' +
        (presenceConnected ? (totalOnline === 0 ? '현재 대기 중인 다른 참가자가 없습니다.' : '조건에 맞는 참가자가 없습니다.') : (presenceState === 'error' ? '연결 상태를 확인해 주세요. 접속자 수를 확인할 수 없습니다.' : '실시간 접속자를 확인하고 있습니다.')) + '</div>';
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
    return realOnlinePeers[id] || null;
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
    var target = findUserById(selectedTargetUser.id);
    if (!presenceConnected || !mqttClient || !mqttClient.isConnected()) { showToast('대기실 연결을 확인한 뒤 다시 신청해 주세요.'); return; }
    if (!target || target.status !== 'waiting' || Date.now() - target.lastSeen > 12000) { closeChallengeModal(); showToast('상대방이 대기실을 떠났거나 신청할 수 없는 상태입니다.'); return; }
    var req = {
      type: 'challenge_request', toId: target.id,
      from: { id: myProfile.id, name: myProfile.name, level: myProfile.level },
      boardSize: challengeOptions.boardSize, timeRule: challengeOptions.timeRule,
      handicap: challengeOptions.handicap, roomCode: 'JH-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    };
    try {
      var msg = new Paho.MQTT.Message(JSON.stringify(req)); msg.destinationName = TOPIC_CHALLENGES; mqttClient.send(msg);
      closeChallengeModal(); playChime();
      showToast('[' + target.name + '] 참가자에게 대국을 신청했습니다. 상대방의 수락을 기다립니다.', 4000);
    } catch (e) { showToast('대국 신청을 보내지 못했습니다. 연결 상태를 확인해 주세요.'); }
  }

  // --- 자동 맞춤 대국 (원클릭 자동 매칭) ---
  function startAutoMatch() {
    playClick(); pruneOfflinePeers();
    if (!presenceConnected) { showToast('대기실 연결을 확인한 뒤 다시 시도해 주세요.'); return; }
    var candidates = Object.keys(realOnlinePeers).map(function (id) { return realOnlinePeers[id]; }).filter(function (u) { return u.status === 'waiting'; });
    if (!candidates.length) { showToast('현재 대국을 신청할 수 있는 참가자가 없습니다. 다른 참가자가 들어올 때까지 기다려 주세요.', 4000); return; }
    selectedTargetUser = candidates[0]; sendChallenge();
  }

  // --- 새 대국방 개설 모달 & 목록 등록 ---
  var currentCreatedRoomCode = null;

  function createNewRoom() {
    if (!presenceConnected) { showToast('대기실 연결을 확인한 뒤 방을 만들어 주세요.'); return; }
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
      roomCode: currentCreatedRoomCode,
      ownerId: myProfile.id,
      lastSeen: Date.now()
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
