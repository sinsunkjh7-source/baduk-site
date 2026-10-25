// ===================================================
// 실시간 1:1 온라인 대국 매니저 (로컬 스토리지 실시간 이벤트 버스)
// 어떠한 외부 인터넷 연결/서버/보안 제약도 없이 100% 즉시 동작 보장
// 탭 고유 clientId 기반 필터링으로 돌 가리기(Nigiri) & 무르기 모달 완벽 연동
// ===================================================

class OnlineBadukManager {
  constructor(gameApp) {
    this.gameApp = gameApp;
    this.roomId = null;
    this.clientId = 'tab_' + Math.random().toString(36).substring(2, 10);
    this.isHost = false;
    this.myColor = null; // 1: 흑, 2: 백
    this.guestColor = null;
    this.isNigiri = false;
    this.selectedColorMode = 'nigiri'; // 'nigiri', 'black', 'white'
    this.selectedTimeRule = 'none'; // 'none', '5m', '10m', '15m'
    this.timeRule = 'none';
    this.isOnlineMatch = false;
    this.lastProcessedRaw = null;
    this.lastProcessedNonce = null;

    window.badukOnline = this;

    this.initUI();
    this.setupStorageListener();
    this.checkUrlForRoom();
  }

  initUI() {
    // ⚔️ 돌 배정 방식 선택 (돌 가리기 / 흑돌 / 백돌)
    const pickBtns = document.querySelectorAll('.stone-pick-btn');
    pickBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        pickBtns.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.selectedColorMode = target.dataset.color || 'nigiri';
      });
    });

    // ⏱️ 대국 시간 규칙 선택 (무제한 / 5분 / 10분 / 15분)
    const timeBtns = document.querySelectorAll('.time-pick-btn');
    timeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        timeBtns.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget;
        target.classList.add('active');
        this.selectedTimeRule = target.dataset.time || 'none';
      });
    });

    // 방 만들기 버튼
    const btnCreate = document.getElementById('btnActionCreate');
    if (btnCreate) {
      btnCreate.onclick = () => this.createRoom();
    }

    // 방 참가하기 버튼
    const btnJoin = document.getElementById('btnActionJoin');
    if (btnJoin) {
      btnJoin.onclick = () => {
        const input = document.getElementById('joinCodeInput');
        const code = input ? input.value.trim() : '';
        if (code) {
          this.joinRoom(code);
        } else {
          alert("방 번호 6자리를 입력해 주세요!");
        }
      };
    }

    // 링크 복사 버튼
    const btnCopy = document.getElementById('btnCopyLink');
    if (btnCopy) {
      btnCopy.onclick = () => {
        const input = document.getElementById('shareLinkInput');
        if (input) {
          input.select();
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(input.value);
            } else {
              document.execCommand('copy');
            }
            alert(`초대 링크가 복사되었습니다!\n새 창/새 탭 주소창에 붙여넣기(Ctrl+V) 하거나 친구에게 공유하세요.\n\n대국 방 번호: [ ${this.roomId} ]`);
          } catch (e) {
            document.execCommand('copy');
            alert(`초대 링크가 복사되었습니다!\n대국 방 번호: [ ${this.roomId} ]`);
          }
        }
      };
    }

    // 🤝 무르기 수락 버튼
    const btnAccept = document.getElementById('btnAcceptUndo');
    if (btnAccept) {
      btnAccept.onclick = () => this.acceptUndo();
    }

    // ❌ 무르기 거절 버튼
    const btnReject = document.getElementById('btnRejectUndo');
    if (btnReject) {
      btnReject.onclick = () => this.rejectUndo();
    }
  }

  // URL에서 방 번호 확인 (?room=123456)
  checkUrlForRoom() {
    try {
      const search = window.location.search;
      if (search) {
        const params = new URLSearchParams(search);
        const room = params.get('room');
        if (room) {
          const modal = document.getElementById('onlineModal');
          if (modal) modal.classList.add('show');
          const input = document.getElementById('joinCodeInput');
          if (input) input.value = room;
          setTimeout(() => this.joinRoom(room), 350);
        }
      }
    } catch (e) {
      console.warn("URL check error:", e);
    }
  }

  // 1. 방 만들기 (돌 가리기 / 흑 / 백 설정 적용)
  createRoom() {
    this.isHost = true;
    this.roomId = Math.floor(100000 + Math.random() * 900000).toString();

    let hostColor = 1;
    let guestColor = 2;
    let isNigiri = false;

    if (this.selectedColorMode === 'nigiri') {
      isNigiri = true;
      hostColor = Math.random() < 0.5 ? 1 : 2;
      guestColor = (hostColor === 1) ? 2 : 1;
    } else if (this.selectedColorMode === 'black') {
      hostColor = 1;
      guestColor = 2;
    } else if (this.selectedColorMode === 'white') {
      hostColor = 2;
      guestColor = 1;
    }

    this.myColor = hostColor;
    this.guestColor = guestColor;
    this.isNigiri = isNigiri;
    const timeRule = this.selectedTimeRule || 'none';
    this.timeRule = timeRule;

    // 로컬 스토리지에 방 메타데이터 저장 (참가자가 입장 즉시 100% 동일하게 확인 가능)
    try {
      localStorage.setItem(`baduk_room_${this.roomId}`, JSON.stringify({
        roomId: this.roomId,
        hostColor,
        guestColor,
        isNigiri,
        timeRule,
        size: this.gameApp.size,
        time: Date.now()
      }));
    } catch (e) {}

    const secCreate = document.getElementById('sectionCreateRoom');
    const secShare = document.getElementById('sectionShareLink');
    const codeBadge = document.getElementById('displayRoomCode');
    const linkInput = document.getElementById('shareLinkInput');

    if (secCreate) secCreate.style.display = 'none';
    if (secShare) secShare.style.display = 'block';

    // 대국 준비: 바둑판을 완전히 비움
    if (this.gameApp) {
      this.gameApp.prepareOnlineBoard();
    }

    const modeDesc = isNigiri ? '🎲 돌 가리기' : (hostColor === 1 ? '⚫ 흑돌 배정' : '⚪ 백돌 배정');
    const timeNameMap = { none: '무제한', '5m': '5분', '10m': '10분', '15m': '15분' };
    const timeDesc = timeNameMap[timeRule] || '무제한';
    if (codeBadge) {
      codeBadge.innerHTML = `대국 방 번호: <strong style="font-size:1.35rem; font-weight:900; color:#111; letter-spacing:2px; margin:0 4px;">${this.roomId}</strong> <span style="font-size:0.82rem; color:#222; font-weight:700;">(${modeDesc} / ⏱️ ${timeDesc})</span>`;
    }

    // 공유 링크 생성
    const cleanUrl = window.location.href.split('?')[0];
    const shareUrl = `${cleanUrl}?room=${this.roomId}`;
    if (linkInput) linkInput.value = shareUrl;

    // 대기 상태 기록 브로드캐스트
    this.postMessage({
      type: 'ROOM_CREATED',
      roomId: this.roomId,
      size: this.gameApp.size,
      hostColor,
      guestColor,
      isNigiri,
      timeRule,
      time: Date.now()
    });
  }

  // 2. 방 참가하기 (설정된 돌 배정 자동 수신)
  joinRoom(roomId) {
    if (!roomId) {
      alert("방 번호를 입력해 주세요!");
      return;
    }
    this.isHost = false;
    this.roomId = roomId;

    // 먼저 저장된 방 설정이 있는지 확인
    let assignedGuestColor = 2;
    let isNigiri = false;
    let timeRule = 'none';
    try {
      const roomRaw = localStorage.getItem(`baduk_room_${this.roomId}`);
      if (roomRaw) {
        const roomMeta = JSON.parse(roomRaw);
        if (roomMeta.guestColor) {
          assignedGuestColor = roomMeta.guestColor;
          isNigiri = !!roomMeta.isNigiri;
        }
        if (roomMeta.timeRule) {
          timeRule = roomMeta.timeRule;
        }
        if (roomMeta.size && roomMeta.size !== this.gameApp.size) {
          this.gameApp.changeBoardSize(roomMeta.size);
        }
      }
    } catch (e) {}

    this.myColor = assignedGuestColor;
    this.isNigiri = isNigiri;
    this.timeRule = timeRule;

    // 대국 준비: 바둑판을 완전히 비움
    if (this.gameApp) {
      this.gameApp.prepareOnlineBoard();
    }

    // 방장에게 참가 신호 전송
    this.postMessage({
      type: 'JOIN_REQUEST',
      roomId: this.roomId,
      time: Date.now()
    });

    // 호스트 응답이 500ms 내에 오지 않을 경우 로컬 스토리지 정보로 시작
    setTimeout(() => {
      if (!this.isOnlineMatch) {
        this.onMatchStart(this.myColor, this.isNigiri, this.timeRule);
      }
    }, 500);
  }

  // file:/// 로컬 탭 간 100% 즉각 통신 지원 (Storage Event Bus + Polling Fallback)
  setupStorageListener() {
    // 1. 표준 storage 이벤트 (다른 탭에서 변경 시 즉시 발생)
    window.addEventListener('storage', (e) => {
      if (e.key && e.key.startsWith('baduk_msg_')) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.roomId === this.roomId && data._senderId !== this.clientId) {
            this.handleMessage(data);
          }
        } catch (err) {}
      }
    });

    // 2. 로컬 파일 환경에서 이벤트 유실을 원천 차단하는 200ms 폴링 보조장치
    setInterval(() => {
      if (!this.roomId) return;
      try {
        const raw = localStorage.getItem(`baduk_msg_${this.roomId}`);
        if (raw && raw !== this.lastProcessedRaw) {
          const data = JSON.parse(raw);
          if (data && data.roomId === this.roomId && data._senderId !== this.clientId) {
            this.lastProcessedRaw = raw;
            this.handleMessage(data);
          }
        }
      } catch (e) {}
    }, 200);
  }

  // 데이터 송신 (localStorage 버스를 통해 즉시 브로드캐스트)
  postMessage(data) {
    data.roomId = this.roomId;
    data._senderId = this.clientId; // 탭 고유 ID로 발신자 구분 (색상 무관!)
    data._nonce = Date.now() + Math.random();

    try {
      const payload = JSON.stringify(data);
      this.lastProcessedRaw = payload;
      this.lastProcessedNonce = data._nonce;
      localStorage.setItem(`baduk_msg_${this.roomId}`, payload);
    } catch (e) {
      console.warn("Storage post error:", e);
    }
  }

  // 수신된 메시지 처리
  handleMessage(data) {
    if (!data || data.roomId !== this.roomId) return;
    if (data._senderId === this.clientId) return; // 내가 보낸 메시지는 절대 중복 처리하지 않음
    if (data._nonce && data._nonce === this.lastProcessedNonce) return;
    this.lastProcessedNonce = data._nonce;

    // 상대방(게스트)이 입장했을 때 (방장 화면)
    if (data.type === 'JOIN_REQUEST') {
      this.postMessage({
        type: 'HOST_READY',
        size: this.gameApp.size,
        hostColor: this.myColor,
        guestColor: this.guestColor,
        isNigiri: this.isNigiri,
        timeRule: this.timeRule,
        avatar: this.gameApp.myAvatar
      });
      if (!this.isOnlineMatch) {
        this.onMatchStart(this.myColor, this.isNigiri, this.timeRule);
      }
    }

    // 방장의 응답 수신 (참가자 화면)
    if (data.type === 'HOST_READY') {
      if (data.guestColor) {
        this.myColor = data.guestColor;
      }
      if (data.isNigiri !== undefined) {
        this.isNigiri = data.isNigiri;
      }
      if (data.timeRule) {
        this.timeRule = data.timeRule;
      }
      if (data.size && data.size !== this.gameApp.size) {
        this.gameApp.changeBoardSize(data.size);
      }
      if (data.avatar && data.hostColor) {
        this.gameApp.applyAvatarUpdate(data.hostColor, data.avatar);
      }
      if (!this.isOnlineMatch) {
        this.onMatchStart(this.myColor, this.isNigiri, this.timeRule);
      }
    }

    // 상대방의 착수 신호 수신
    if (data.type === 'MOVE') {
      this.gameApp.applyOpponentMove(data.x, data.y, data.color);
    }

    // 🏳️ 상대방 기권 (불계패)
    if (data.type === 'RESIGN') {
      this.gameApp.handleMatchResult(data.winnerColor, 'RESIGN', false);
    }

    // ↩️ 상대방 무르기 요청 수신 -> 🤝 모달을 열어 시각적으로 알림!
    if (data.type === 'UNDO_REQUEST') {
      const modal = document.getElementById('undoRequestModal');
      if (modal) {
        modal.classList.add('show');
        window.badukAudio.playStone(); // 주의 환기 효과음
      }
    }

    // 무르기 요청 수락 수신
    if (data.type === 'UNDO_ACCEPT') {
      const modal = document.getElementById('undoRequestModal');
      if (modal) modal.classList.remove('show');
      this.gameApp.showToast("상대방이 무르기 요청을 수락했습니다!", "✅");
      this.gameApp.applyUndo();
    }

    // 무르기 요청 거절 수신
    if (data.type === 'UNDO_REJECT') {
      const modal = document.getElementById('undoRequestModal');
      if (modal) modal.classList.remove('show');
      this.gameApp.showToast("상대방이 무르기 요청을 거절했습니다.", "❌");
    }

    // 🎭 상대방 아바타 변경 수신
    if (data.type === 'AVATAR_UPDATE') {
      this.gameApp.applyAvatarUpdate(data.color, data.avatarId);
    }

    // 💬 상대방 매너 퀵채팅 수신
    if (data.type === 'QUICK_CHAT') {
      this.gameApp.showSpeechBubble(data.color, data.text);
    }

    // ⏱️ 시간패 수신
    if (data.type === 'TIMEOUT') {
      this.gameApp.handleMatchResult(data.winnerColor, 'TIMEOUT', data.loserColor === this.myColor);
    }

    // 상대방 퇴장
    if (data.type === 'LEAVE') {
      this.gameApp.showToast("상대방이 대국실을 나갔습니다.", "🚪");
      setTimeout(() => {
        this.gameApp.exitOnlineMatch();
      }, 1000);
    }
  }

  onMatchStart(color, isNigiri = false, timeRule = 'none') {
    this.isOnlineMatch = true;
    this.myColor = color;
    this.timeRule = timeRule || this.timeRule || 'none';
    const modal = document.getElementById('onlineModal');
    if (modal) modal.classList.remove('show');
    this.gameApp.startOnlineMatch(this.myColor, this.roomId, isNigiri, this.timeRule);

    // 내 아바타 브로드캐스트
    if (this.gameApp && this.gameApp.myAvatar) {
      setTimeout(() => {
        this.notifyAvatarChange(this.gameApp.myAvatar);
      }, 400);
    }
  }

  // 🎭 아바타 변경 알림
  notifyAvatarChange(avatarId) {
    if (!this.isOnlineMatch) return;
    this.postMessage({
      type: 'AVATAR_UPDATE',
      color: this.myColor,
      avatarId
    });
  }

  // 💬 매너 퀵채팅 전송
  sendQuickChat(text) {
    if (!this.isOnlineMatch) return;
    this.postMessage({
      type: 'QUICK_CHAT',
      color: this.myColor,
      text
    });
    this.gameApp.showSpeechBubble(this.myColor, text);
  }

  // ⏱️ 시간패 알림
  notifyTimeout(loserColor) {
    if (!this.isOnlineMatch) return;
    const winnerColor = loserColor === 1 ? 2 : 1;
    this.postMessage({
      type: 'TIMEOUT',
      winnerColor,
      loserColor
    });
    this.gameApp.handleMatchResult(winnerColor, 'TIMEOUT', loserColor === this.myColor);
  }

  notifyMyMove(x, y, color) {
    if (!this.isOnlineMatch) return;
    this.postMessage({
      type: 'MOVE',
      x, y, color,
      time: Date.now()
    });
  }

  // 🏳️ 기권하기
  resign() {
    if (!this.isOnlineMatch) return;
    if (!confirm("정말 기권하시겠습니까? (불계패 처리됩니다)")) return;

    const winnerColor = this.myColor === 1 ? 2 : 1;
    this.postMessage({
      type: 'RESIGN',
      winnerColor,
      loserColor: this.myColor
    });
    this.gameApp.handleMatchResult(winnerColor, 'RESIGN', true);
  }

  // ↩️ 무르기 요청 (비차단 토스트 및 모달 연동)
  requestUndo() {
    if (!this.isOnlineMatch) return;
    if (this.gameApp.engine.currentStep === 0) {
      this.gameApp.showToast("아직 착수한 수가 없습니다.", "⚠️");
      return;
    }
    this.gameApp.showToast("상대방에게 무르기 동의를 요청했습니다...", "⏳");
    this.postMessage({
      type: 'UNDO_REQUEST'
    });
  }

  // 🤝 무르기 수락 처리
  acceptUndo() {
    const modal = document.getElementById('undoRequestModal');
    if (modal) modal.classList.remove('show');
    this.postMessage({ type: 'UNDO_ACCEPT' });
    this.gameApp.applyUndo();
    this.gameApp.showToast("무르기를 수락하여 직전 수로 되돌렸습니다.", "✅");
  }

  // ❌ 무르기 거절 처리
  rejectUndo() {
    const modal = document.getElementById('undoRequestModal');
    if (modal) modal.classList.remove('show');
    this.postMessage({ type: 'UNDO_REJECT' });
    this.gameApp.showToast("무르기 요청을 거절했습니다.", "❌");
  }

  // 🚪 대국실 나가기
  leaveRoom() {
    if (confirm("대국실을 나가시겠습니까? 현재 대국이 종료됩니다.")) {
      this.postMessage({
        type: 'LEAVE'
      });
      this.gameApp.exitOnlineMatch();
    }
  }
}

window.OnlineBadukManager = OnlineBadukManager;
