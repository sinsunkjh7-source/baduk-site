/**
 * JH 바둑스쿨 — 실시간 대국 라운지 (대기실) 인터랙션 로직
 * Real-time Go Lobby & Matchmaking Controller
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
    } catch (e) {
      // Audio not supported or blocked
    }
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

  // --- 상태 및 기본 데이터 ---
  var myProfile = {
    name: '김진홍선생님',
    level: 'Lv2',
    rank: '2단',
    avatar: '/assets/stat_1.png',
    wins: 12,
    losses: 4,
    rating19: 292,
    rating13: 69,
    rating9: 45
  };

  var usersData = [
    { id: 'u1', name: '시연선생님', level: 'Lv1', rank: '1단', status: 'rest', avatar: '/assets/stat_2.png', manner: '😊', school: '강남지도교사' },
    { id: 'u2', name: '최현우선생님', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '😎', school: '마포지도교사' },
    { id: 'u3', name: '독수리 포에버', level: 'Lv48', rank: '4단', status: 'waiting', avatar: '/assets/stat_4.png', manner: '🦁', school: '대치초 4학년' },
    { id: 'u4', name: '은하수바둑', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_5.png', manner: '😊', school: '서초초 3학년' },
    { id: 'u5', name: '정지율', level: 'Lv21', rank: '2단', status: 'playing', avatar: '/assets/stat_1.png', manner: '🔥', school: '잠실초 5학년' },
    { id: 'u6', name: '염리초 하은서', level: 'Lv1', rank: '1단', status: 'waiting', avatar: '/assets/stat_1.png', manner: '⭐', school: '염리초 2학년' },
    { id: 'u7', name: '신명민', level: 'Lv7', rank: '7급', status: 'waiting', avatar: '/assets/stat_2.png', manner: '😄', school: '목동초 3학년' },
    { id: 'u8', name: '대남초 백승우', level: 'Lv3', rank: '3단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '🌱', school: '대남초 4학년' },
    { id: 'u9', name: '김태린', level: 'Lv27', rank: '2단', status: 'playing', avatar: '/assets/stat_4.png', manner: '🏆', school: '반포초 6학년' },
    { id: 'u10', name: '염리초 이시온', level: 'Lv2', rank: '2단', status: 'playing', avatar: '/assets/stat_5.png', manner: '🌟', school: '염리초 3학년' },
    { id: 'u11', name: '바둑왕 민재', level: 'Lv12', rank: '1단', status: 'waiting', avatar: '/assets/stat_3.png', manner: '👑', school: '청담초 4학년' },
    { id: 'u12', name: '꿈나무 서현', level: 'Lv5', rank: '5급', status: 'waiting', avatar: '/assets/stat_1.png', manner: '✨', school: '도곡초 2학년' }
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
      timeRule: '5분'
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
      timeRule: '무제한'
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
  var currentRoomFilter = 'all'; // 'all', '19', '13', '9'
  var currentUserFilter = 'waiting'; // 'waiting', 'all'
  var searchQuery = '';

  // 신청 중인 상대 정보
  var selectedTargetUser = null;
  var challengeOptions = {
    boardSize: 19,
    stoneColor: 'nigiri', // 'nigiri', 'black', 'white'
    handicap: 0,
    timeRule: '10m'
  };

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
        '      <span class="room-board-tag">' + room.timeRule + '</span>' +
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
          if (rObj.status === 'waiting') {
            showToast('🏠 ' + rId + '번 대국방에 입장합니다! 잠시만 기다려주세요...');
            setTimeout(function () {
              window.location.href = '/games/play/index.html?mode=pvp&boardSize=' + rObj.boardSize + '&roomId=' + rId;
            }, 800);
          } else {
            showToast('👀 ' + rObj.pBlack.name + ' vs ' + (rObj.pWhite ? rObj.pWhite.name : '대기') + ' 대국을 관전합니다.');
            setTimeout(function () {
              window.location.href = '/games/play/index.html?mode=pvp&boardSize=' + rObj.boardSize + '&watch=1&roomId=' + rId;
            }, 800);
          }
        }
      });
    });
  }

  // --- 접속자 명단 렌더링 ---
  function renderUsers() {
    var list = document.getElementById('usersList');
    var badge = document.getElementById('userCount');
    var headerBadge = document.getElementById('onlineCountBadge');
    if (!list) return;

    var filtered = usersData.filter(function (u) {
      if (currentUserFilter === 'waiting' && u.status !== 'waiting') return false;
      if (searchQuery) {
        var q = searchQuery.toLowerCase();
        var matchName = u.name.toLowerCase().indexOf(q) !== -1;
        var matchSchool = u.school && u.school.toLowerCase().indexOf(q) !== -1;
        if (!matchName && !matchSchool) return false;
      }
      return true;
    });

    if (badge) badge.textContent = usersData.length;
    if (headerBadge) headerBadge.textContent = usersData.length + '명';

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

      return '<div class="user-item-card" data-user-id="' + u.id + '">' +
        '  <div class="user-left-info">' +
        '    <img src="' + u.avatar + '" alt="" class="user-avatar-mini">' +
        '    <div class="user-text-info">' +
        '      <div class="user-name-row">' +
        '        <span class="user-name">' + escapeHtml(u.name) + '</span>' +
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

    // 이벤트 리스너 연결
    list.querySelectorAll('.user-item-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var uId = card.dataset.userId;
        var uObj = usersData.find(function (u) { return u.id === uId; });
        if (uObj) {
          openChallengeModal(uObj);
        }
      });
    });

    list.querySelectorAll('.btn-user-challenge').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var uId = btn.dataset.userId;
        var uObj = usersData.find(function (u) { return u.id === uId; });
        if (uObj) {
          openChallengeModal(uObj);
        }
      });
    });
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

  // --- 대국 신청 발송 처리 ---
  function sendChallenge() {
    if (!selectedTargetUser) return;
    playChime();

    var targetName = selectedTargetUser.name;
    var bSize = challengeOptions.boardSize;
    closeChallengeModal();

    showToast('⚔️ [' + targetName + ']님에게 ' + bSize + '줄 대국을 신청했습니다! 상대방의 응답을 기다립니다...', 4000);

    // 2.5초 후 상대방 수락 시뮬레이션
    setTimeout(function () {
      playChime();
      showToast('🎉 [' + targetName + ']님이 대국 신청을 수락했습니다! 대국실로 입장합니다...', 2500);

      setTimeout(function () {
        window.location.href = '/games/play/index.html?mode=pvp&boardSize=' + bSize + '&p1=' + encodeURIComponent(myProfile.name) + '&p2=' + encodeURIComponent(targetName);
      }, 1500);
    }, 2800);
  }

  // --- 수신 알림 모달 열기 시뮬레이션 ---
  function triggerIncomingChallenge(challenger) {
    challenger = challenger || usersData[1]; // 최현우선생님
    playIncomingAlert();

    var modal = document.getElementById('incomingModal');
    var textEl = document.getElementById('incomingSenderText');
    if (!modal) return;

    if (textEl) {
      textEl.innerHTML = '<b>' + escapeHtml(challenger.name) + '</b> (' + escapeHtml(challenger.level) + ') 친구가 대국을 신청했어요!';
    }

    modal.hidden = false;

    var btnAccept = document.getElementById('btnAcceptIncoming');
    var btnReject = document.getElementById('btnRejectIncoming');

    if (btnAccept) {
      btnAccept.onclick = function () {
        playChime();
        modal.hidden = true;
        showToast('🟢 대국을 수락했습니다! 대국실로 입장합니다...', 2000);
        setTimeout(function () {
          window.location.href = '/games/play/index.html?mode=pvp&boardSize=19&p1=' + encodeURIComponent(challenger.name) + '&p2=' + encodeURIComponent(myProfile.name);
        }, 1200);
      };
    }

    if (btnReject) {
      btnReject.onclick = function () {
        playClick();
        modal.hidden = true;
        showToast('대국 신청을 정중히 거절했습니다.');
      };
    }
  }

  // --- 자동 맞춤 대국 ---
  function startAutoMatch() {
    playClick();
    showToast('🎲 나와 실력이 가장 비슷한 친구를 찾는 중입니다...', 2500);

    setTimeout(function () {
      var candidates = usersData.filter(function (u) { return u.status === 'waiting'; });
      if (candidates.length > 0) {
        var opponent = candidates[Math.floor(Math.random() * candidates.length)];
        playChime();
        showToast('🎯 매칭 성공! [' + opponent.name + '] 친구와 연결되었습니다!', 2000);
        setTimeout(function () {
          window.location.href = '/games/play/index.html?mode=pvp&boardSize=19&p1=' + encodeURIComponent(myProfile.name) + '&p2=' + encodeURIComponent(opponent.name);
        }, 1200);
      }
    }, 1800);
  }

  // --- 새 대국방 만들기 ---
  function createNewRoom() {
    playClick();
    var newRoomId = roomsData.length + 1;
    var newRoom = {
      id: newRoomId,
      type: '친선대국',
      boardSize: 19,
      status: 'waiting',
      pBlack: { name: myProfile.name, level: myProfile.level },
      pWhite: null,
      timeRule: '10분'
    };

    roomsData.unshift(newRoom);
    renderRooms();
    showToast('🏠 ' + newRoomId + '번 새 대국방을 개설했습니다! 상대방이 입장할 때까지 대기합니다.');
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
    // 1. 대국실 보드 크기 필터 탭
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

    // 2. 접속자 상태 필터 탭
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

    // 3. 접속자 검색창
    var searchInput = document.getElementById('userSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        searchQuery = e.target.value.trim();
        renderUsers();
      });
    }

    // 4. 모달 옵션 바둑판 크기 버튼들
    var boardSizeBtns = document.querySelectorAll('#optBoardSizeGrid .opt-select-btn');
    boardSizeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        boardSizeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.boardSize = parseInt(btn.dataset.val, 10);
      });
    });

    // 5. 돌 배정 버튼들
    var stoneBtns = document.querySelectorAll('#optStoneGrid .opt-pill-btn');
    stoneBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        stoneBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.stoneColor = btn.dataset.val;
      });
    });

    // 6. 치수 규칙 버튼들
    var handicapBtns = document.querySelectorAll('#optHandicapGrid .opt-pill-btn');
    handicapBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        handicapBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.handicap = parseInt(btn.dataset.val, 10);
      });
    });

    // 7. 대국 시간 버튼들
    var timeBtns = document.querySelectorAll('#optTimeGrid .opt-pill-btn');
    timeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        playClick();
        timeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        challengeOptions.timeRule = btn.dataset.val;
      });
    });

    // 8. 모달 닫기 및 신청 발송
    var btnCloseModal = document.getElementById('btnCloseChallengeModal');
    var btnCancelChallenge = document.getElementById('btnCancelChallenge');
    var btnSendChallenge = document.getElementById('btnSendChallenge');

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeChallengeModal);
    if (btnCancelChallenge) btnCancelChallenge.addEventListener('click', closeChallengeModal);
    if (btnSendChallenge) btnSendChallenge.addEventListener('click', sendChallenge);

    // 9. 빠른 액션 버튼: 자동 맞춤 대국 & 대국방 만들기
    var btnAutoMatch = document.getElementById('btnAutoMatch');
    var btnCreateRoom = document.getElementById('btnCreateRoom');

    if (btnAutoMatch) btnAutoMatch.addEventListener('click', startAutoMatch);
    if (btnCreateRoom) btnCreateRoom.addEventListener('click', createNewRoom);

    // 10. 상단 툴바: 효과음 및 전체화면
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

    // 초기 렌더링
    renderRooms();
    renderUsers();

    // 사용자가 대기실에 머무를 때 생동감을 위해 12초 후 대국 신청 알림 팝업 샘플 시연
    setTimeout(function () {
      var modal = document.getElementById('challengeModal');
      if (modal && modal.hidden) {
        triggerIncomingChallenge(usersData[1]); // 최현우선생님의 도전 신청
      }
    }, 12000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
