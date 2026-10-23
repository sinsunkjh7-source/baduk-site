// ==============================================================================
// AI Match Manager for BadukSchool
// Manages real-time matches against GNU Go WebAssembly Engine
// ==============================================================================

(function (window) {
  'use strict';

  class AIMatchManager {
    constructor(game) {
      this.game = game;
      this.controller = window.gnugoController;
      this.isActive = false;
      this.aiColor = 2; // 1: 흑, 2: 백
      this.userColor = 1;
      this.currentLevel = 3;
      this.handicap = 0;
      this.handicapStones = [];
      this.komi = 6.5;
      this.isThinking = false;
      this.consecutivePasses = 0;

      window.badukAIMatch = this;
      this.initEvents();
      this.initModalUI();
    }

    initModalUI() {
      // 탭 전환 전역 등록
      window.switchMatchModalTab = function (tab) {
        const tabAi = document.getElementById('tabBtnAiMatch');
        const tabP2p = document.getElementById('tabBtnP2pMatch');
        const paneAi = document.getElementById('paneAiMatch');
        const paneP2p = document.getElementById('paneP2pMatch');
        const badge = document.getElementById('modalMainBadge');

        if (tab === 'ai') {
          if (tabAi) tabAi.classList.add('active');
          if (tabP2p) tabP2p.classList.remove('active');
          if (paneAi) paneAi.style.display = 'block';
          if (paneP2p) paneP2p.style.display = 'none';
          if (badge) badge.textContent = '🤖 JH 바둑 AI 대국실';
        } else {
          if (tabAi) tabAi.classList.remove('active');
          if (tabP2p) tabP2p.classList.add('active');
          if (paneAi) paneAi.style.display = 'none';
          if (paneP2p) paneP2p.style.display = 'block';
          if (badge) badge.textContent = '🌐 JH 바둑 대국실';
        }
      };

      // 1. AI 레벨 카드 클릭
      const levelBtns = document.querySelectorAll('#aiLevelsGrid .ai-level-btn');
      levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          levelBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // 2. 바둑판 크기 버튼 클릭
      const sizeBtns = document.querySelectorAll('#aiBoardSizeOptions .board-size-btn');
      sizeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          sizeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
      });

      // 3. 대국 돌 배정 버튼 클릭
      const colorBtns = document.querySelectorAll('#aiColorOptions .stone-pick-btn');
      const handicapGroup = document.getElementById('aiHandicapGroup');
      colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          colorBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const col = btn.dataset.color;
          if (handicapGroup) {
            handicapGroup.style.display = (col === 'black') ? 'block' : 'none';
          }
        });
      });

      // 4. AI 대국 시작 버튼 클릭
      const btnStart = document.getElementById('btnStartAiMatch');
      if (btnStart) {
        btnStart.addEventListener('click', () => {
          let selectedLevel = 3;
          const activeLevelBtn = document.querySelector('#aiLevelsGrid .ai-level-btn.active');
          if (activeLevelBtn) selectedLevel = parseInt(activeLevelBtn.dataset.level, 10);

          let selectedSize = 19;
          const activeSizeBtn = document.querySelector('#aiBoardSizeOptions .board-size-btn.active');
          if (activeSizeBtn) selectedSize = parseInt(activeSizeBtn.dataset.size, 10);

          let selectedColor = 'black';
          const activeColorBtn = document.querySelector('#aiColorOptions .stone-pick-btn.active');
          if (activeColorBtn) selectedColor = activeColorBtn.dataset.color;

          let selectedHandicap = 0;
          const handicapSelect = document.getElementById('aiHandicapSelect');
          if (handicapSelect && selectedColor === 'black') {
            selectedHandicap = parseInt(handicapSelect.value, 10);
          }

          this.startMatch({
            level: selectedLevel,
            size: selectedSize,
            color: selectedColor,
            handicap: selectedHandicap
          });
        });
      }
    }

    initEvents() {
      // 대국 조작 버튼 바인딩
      const btnUndo = document.getElementById('btnMatchUndo');
      if (btnUndo) {
        btnUndo.addEventListener('click', () => {
          if (this.isActive) this.requestUndo();
        });
      }

      const btnResign = document.getElementById('btnMatchResign');
      if (btnResign) {
        btnResign.addEventListener('click', () => {
          if (this.isActive) this.resign();
        });
      }

      const btnLeave = document.getElementById('btnMatchLeave');
      if (btnLeave) {
        btnLeave.addEventListener('click', () => {
          if (this.isActive) this.leaveMatch();
        });
      }
    }

    // AI 대국 시작
    async startMatch(options = {}) {
      const level = options.level || 3;
      const size = options.size || 19;
      let colorPref = options.color || 'black';
      const handicapCount = options.handicap || 0;

      // 돌 가리기 처리
      if (colorPref === 'nigiri') {
        colorPref = Math.random() < 0.5 ? 'black' : 'white';
      }

      this.userColor = (colorPref === 'black') ? 1 : 2;
      this.aiColor = (this.userColor === 1) ? 2 : 1;
      this.currentLevel = level;
      this.handicap = (this.userColor === 1) ? handicapCount : 0; // 접바둑은 흑돌 플레이어만 적용
      this.komi = (this.handicap > 0) ? 0.5 : 6.5;
      this.isActive = true;
      this.isThinking = false;
      this.consecutivePasses = 0;

      // 게임 객체 상태 동기화
      this.game.isAIMatch = true;
      this.game.isOnlineMatch = false;
      this.game.isLectureMode = false;
      this.game.isMissionActive = false;
      this.game.isOmokMode = false;
      this.game.isAlkkagiMode = false;
      this.game.myOnlineColor = this.userColor;

      // 바둑판 크기 변경
      this.game.changeBoardSize(size);

      // 접바둑 화점 돌 계산 및 배치
      if (this.handicap > 0) {
        const rawCoords = this.controller.getHandicapCoordinates(size, this.handicap);
        this.handicapStones = rawCoords.map(c => ({ x: c.x, y: c.y, color: 1 }));
        this.game.engine.setInitialStones(this.handicapStones);
      } else {
        this.handicapStones = [];
        this.game.engine.setInitialStones([]);
      }

      // 모달 닫기
      const modal = document.getElementById('onlineModal');
      if (modal) modal.classList.remove('show');

      // 좌측 대국실 UI 전환
      this.setupMatchPanel(size);

      // 첫 턴 결정: 접바둑일 경우 백(후공)이 1수를 둠
      if (this.handicap > 0) {
        // 백이 첫 수
        if (this.aiColor === 2) {
          this.triggerAIMove(500);
        }
      } else {
        // 호선(맞바둑): 흑이 첫 수
        if (this.aiColor === 1) {
          this.triggerAIMove(500);
        }
      }

      this.game.render();
      this.updateStatus();
      window.badukAudio.playSuccess();
    }

    // 대국실 좌측 패널 정보 렌더링
    setupMatchPanel(size) {
      const missionPanel = document.getElementById('missionStoryPanel');
      const onlinePanel = document.getElementById('onlineMatchPanel');
      const lectureToolbar = document.getElementById('lectureToolbar');
      const choiceBar = document.getElementById('choiceOptionsBar');

      if (missionPanel) missionPanel.style.display = 'none';
      if (onlinePanel) onlinePanel.style.display = 'flex';
      if (lectureToolbar) lectureToolbar.style.display = 'none';
      if (choiceBar) choiceBar.style.display = 'none';

      const levelInfo = this.controller.getLevelInfo(this.currentLevel);

      // 패널 헤더 갱신
      const roomBadge = document.querySelector('.match-badge');
      if (roomBadge) roomBadge.innerHTML = '🤖 어린이 AI 바둑 대국실';

      const roomTitle = document.getElementById('matchRoomTitle');
      if (roomTitle) roomTitle.textContent = `${levelInfo.avatar} ${levelInfo.title} 대전`;

      const sizeBadge = document.getElementById('matchBoardSizeBadge');
      if (sizeBadge) sizeBadge.textContent = `${size}줄 바둑판`;

      const nigiriBadge = document.getElementById('matchNigiriBadge');
      if (nigiriBadge) {
        if (this.handicap > 0) nigiriBadge.textContent = `⚔️ ${this.handicap}점 접바둑 (덤 0.5집)`;
        else nigiriBadge.textContent = (this.userColor === 1) ? '⚫ 내가 흑돌 (선공)' : '⚪ 내가 백돌 (덤 6.5집)';
      }

      const timeBadge = document.getElementById('matchTimeBadge');
      if (timeBadge) timeBadge.textContent = '⏱️ 자유 대국 (무제한)';

      // 흑 vs 백 대국자 아바타 & 이름
      const avatarIconB = document.getElementById('avatarIconBlack');
      const avatarNameB = document.getElementById('avatarNameBlack');
      const badgeRoleB = document.getElementById('badgeBlackRole');

      const avatarIconW = document.getElementById('avatarIconWhite');
      const avatarNameW = document.getElementById('avatarNameWhite');
      const badgeRoleW = document.getElementById('badgeWhiteRole');

      if (this.userColor === 1) {
        // 내가 흑돌, AI가 백돌
        if (avatarIconB) avatarIconB.textContent = '👦';
        if (avatarNameB) avatarNameB.textContent = '나 (도전자)';
        if (badgeRoleB) { badgeRoleB.textContent = '나'; badgeRoleB.className = 'player-role-badge me'; }

        if (avatarIconW) avatarIconW.textContent = levelInfo.avatar;
        if (avatarNameW) avatarNameW.textContent = `${levelInfo.name} (${levelInfo.rank})`;
        if (badgeRoleW) { badgeRoleW.textContent = '인공지능'; badgeRoleW.className = 'player-role-badge'; }
      } else {
        // AI가 흑돌, 내가 백돌
        if (avatarIconB) avatarIconB.textContent = levelInfo.avatar;
        if (avatarNameB) avatarNameB.textContent = `${levelInfo.name} (${levelInfo.rank})`;
        if (badgeRoleB) { badgeRoleB.textContent = '인공지능'; badgeRoleB.className = 'player-role-badge'; }

        if (avatarIconW) avatarIconW.textContent = '👦';
        if (avatarNameW) avatarNameW.textContent = '나 (도전자)';
        if (badgeRoleW) { badgeRoleW.textContent = '나'; badgeRoleW.className = 'player-role-badge me'; }
      }

      // 조작 버튼 텍스트 변경
      const btnUndo = document.getElementById('btnMatchUndo');
      if (btnUndo) btnUndo.innerHTML = '↩️ 한 수 무르기';

      // 한 수 쉬기 / 형세 판단 추가 버튼 주입 (없을 경우)
      this.ensureCustomActionButtons();
    }

    ensureCustomActionButtons() {
      const actGroup = document.querySelector('.match-action-group');
      if (!actGroup) return;

      let btnPass = document.getElementById('btnAiMatchPass');
      if (!btnPass) {
        btnPass = document.createElement('button');
        btnPass.id = 'btnAiMatchPass';
        btnPass.className = 'match-act-btn';
        btnPass.style.background = '#475569';
        btnPass.innerHTML = '✋ 한 수 쉬기';
        btnPass.title = '착수하지 않고 차례를 넘깁니다';
        btnPass.addEventListener('click', () => this.userPass());
        actGroup.insertBefore(btnPass, document.getElementById('btnMatchResign'));
      }
      btnPass.style.display = 'block';

      let btnScore = document.getElementById('btnAiMatchScore');
      if (!btnScore) {
        btnScore = document.createElement('button');
        btnScore.id = 'btnAiMatchScore';
        btnScore.className = 'match-act-btn';
        btnScore.style.background = '#0284c7';
        btnScore.innerHTML = '📊 형세 판단';
        btnScore.title = '현재 판세를 AI 엔진으로 분석합니다';
        btnScore.addEventListener('click', () => this.checkScore());
        actGroup.insertBefore(btnScore, document.getElementById('btnMatchResign'));
      }
      btnScore.style.display = 'block';
    }

    // 현재 누구 차례인지 계산
    getCurrentTurn() {
      // 초기 접바둑 돌이 있으면 1수부터 시작
      const moveCount = this.game.engine.moves.length;
      if (this.handicap > 0) {
        // 0번째 move는 백돌(2), 1번째는 흑돌(1)
        return (moveCount % 2 === 0) ? 2 : 1;
      } else {
        // 0번째 move는 흑돌(1), 1번째는 백돌(2)
        return (moveCount % 2 === 0) ? 1 : 2;
      }
    }

    // 사용자가 보드에 착수했을 때 호출
    onUserMove(x, y) {
      if (!this.isActive || this.isThinking) return false;

      const currentTurn = this.getCurrentTurn();
      if (currentTurn !== this.userColor) {
        this.game.showBoardToast('⏳ 인공지능이 생각 중입니다!', '⏳');
        return false;
      }

      const res = this.game.engine.playMove(x, y, this.userColor);
      if (!res.success) {
        if (res.reason === 'SUICIDE') {
          this.game.showBoardToast("그곳은 '착수금지(자충수)'입니다", "🚫");
        } else if (res.reason === 'KO') {
          this.game.showBoardToast("패(Ko) 상태입니다! 다른 곳에 먼저 두세요.", "⚠️");
        }
        return false;
      }

      // 사석 소리
      if (res.captures.length > 0) window.badukAudio.playCapture();
      else window.badukAudio.playStone();

      this.consecutivePasses = 0;
      this.game.render();
      this.updateStatus();

      // 상대방(AI) 응수 트리거
      this.triggerAIMove(600);
      return true;
    }

    // 사용자 한 수 쉬기 (Pass)
    userPass() {
      if (!this.isActive || this.isThinking) return;
      const currentTurn = this.getCurrentTurn();
      if (currentTurn !== this.userColor) {
        this.game.showBoardToast('⏳ 인공지능 차례입니다!', '⏳');
        return;
      }

      this.game.engine.pass(this.userColor);
      this.consecutivePasses++;
      this.game.showBoardToast('✋ 한 수 쉬었습니다.', '✋');
      window.badukAudio.playStone();

      this.game.render();
      this.updateStatus();

      if (this.consecutivePasses >= 2) {
        this.endGameByPass();
      } else {
        this.triggerAIMove(600);
      }
    }

    // AI 착수 실행
    async triggerAIMove(delayMs = 500) {
      if (!this.isActive || this.isThinking) return;
      this.isThinking = true;
      this.updateStatus();

      const levelInfo = this.controller.getLevelInfo(this.currentLevel);

      setTimeout(async () => {
        try {
          const size = this.game.size;
          const moves = this.game.engine.moves;
          const aiMove = await this.controller.getAIMove(
            size,
            this.handicapStones,
            moves,
            this.aiColor,
            this.currentLevel,
            this.komi
          );

          if (!this.isActive) return;

          if (aiMove.isPass) {
            this.game.engine.pass(this.aiColor);
            this.consecutivePasses++;
            this.game.showBoardToast(`🤖 ${levelInfo.name}이(가) '한 수 쉬기(패스)'를 했습니다.`, '✋');
            window.badukAudio.playStone();

            if (this.consecutivePasses >= 2) {
              this.endGameByPass();
            }
          } else {
            this.consecutivePasses = 0;
            let moveX = aiMove.x;
            let moveY = aiMove.y;

            if (aiMove.fallbackRequired || moveX === undefined) {
              const fb = this.findAnyLegalMove(this.aiColor);
              if (fb) {
                moveX = fb.x;
                moveY = fb.y;
              }
            }

            let res = this.game.engine.playMove(moveX, moveY, this.aiColor);
            if (!res.success) {
              // 착수 실패 시 임의로 패스하지 않고 반드시 유효한 빈자리 탐색
              const fb = this.findAnyLegalMove(this.aiColor);
              if (fb) {
                res = this.game.engine.playMove(fb.x, fb.y, this.aiColor);
              }
            }

            if (res && res.success) {
              if (res.captures.length > 0) window.badukAudio.playCapture();
              else window.badukAudio.playStone();
            } else {
              // 보드에 둘 곳이 전혀 없는 극단적 상황에서만 패스
              this.game.engine.pass(this.aiColor);
              this.consecutivePasses++;
            }
          }
        } catch (err) {
          console.error('[AI Match] 착수 실행 실패:', err);
          this.game.showBoardToast('AI 착수 중 일시적 지연이 발생했습니다.', '⚠️');
        } finally {
          this.isThinking = false;
          this.game.render();
          this.updateStatus();
        }
      }, delayMs);
    }

    // 합법적인 빈자리 탐색 (AI 조기 패스 및 착수 거부 방지용 안전망)
    findAnyLegalMove(color) {
      const size = this.game.size;
      const board = this.game.engine.board;
      const candidates = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          if (board[y][x] === 0) {
            // 자충수 검사
            const oppColor = (color === 1) ? 2 : 1;
            let hasLib = false;
            for (const n of this.game.engine.getNeighbors(x, y)) {
              if (board[n.y][n.x] === 0 || board[n.y][n.x] === color) {
                hasLib = true;
                break;
              }
            }
            if (hasLib) {
              let score = 0;
              const distFromEdge = Math.min(x, size - 1 - x, y, size - 1 - y);
              if (distFromEdge === 2 || distFromEdge === 3) score += 3;
              for (const n of this.game.engine.getNeighbors(x, y)) {
                if (board[n.y][n.x] !== 0) score += 2;
              }
              candidates.push({ x, y, score });
            }
          }
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        return candidates[0];
      }
      return null;
    }

    // 한 수 무르기
    requestUndo() {
      if (!this.isActive || this.isThinking) return;
      const moves = this.game.engine.moves;
      if (moves.length === 0) {
        this.game.showBoardToast('물릴 수순이 없습니다.', 'ℹ️');
        return;
      }

      // AI의 마지막 수 + 사용자의 마지막 수 총 2수를 무름 (내 차례로 복귀)
      let undoCount = 0;
      if (this.getCurrentTurn() === this.userColor) {
        undoCount = 2; // AI수 + 내수
      } else {
        undoCount = 1; // 내수만
      }

      const targetStep = Math.max(0, this.game.engine.currentStep - undoCount);
      this.game.engine.goToStep(targetStep);
      this.game.engine.moves = this.game.engine.moves.slice(0, targetStep);
      this.consecutivePasses = 0;

      window.badukAudio.playStone();
      this.game.showBoardToast('↩️ 한 수를 물렀습니다! 다시 착수하세요.', '↩️');
      this.game.render();
      this.updateStatus();
    }

    // 형세 판단 (Score)
    async checkScore() {
      if (!this.isActive) return;
      this.game.showBoardToast('📊 AI 엔진으로 형세를 정밀 분석 중...', '⏳');

      try {
        const score = await this.controller.evaluateScore(
          this.game.size,
          this.handicapStones,
          this.game.engine.moves,
          this.komi
        );

        const absScore = Math.abs(score).toFixed(1);
        let msg = '';
        if (Math.abs(score) < 0.5) {
          msg = '⚖️ 현재 미세한 반집 승부입니다!';
        } else if (score > 0) {
          msg = (this.userColor === 1)
            ? `🟢 흑돌(나)이 약 ${absScore}집 우세합니다! 👍`
            : `🔴 흑돌(AI)이 약 ${absScore}집 앞서고 있습니다.`;
        } else {
          msg = (this.userColor === 2)
            ? `🟢 백돌(나)이 약 ${absScore}집 우세합니다! 👍`
            : `🔴 백돌(AI)이 약 ${absScore}집 앞서고 있습니다.`;
        }

        this.game.showBoardToast(msg, '📊');
      } catch (e) {
        console.error(e);
        this.game.showBoardToast('형세 판단을 완료하지 못했습니다.', '⚠️');
      }
    }

    // 양자 패스로 인한 종국 및 계가
    async endGameByPass() {
      this.isActive = false;
      this.game.showBoardToast('🏁 양 대국자 연속 패스로 대국이 종료되었습니다!', '🏆');

      const score = await this.controller.evaluateScore(
        this.game.size,
        this.handicapStones,
        this.game.engine.moves,
        this.komi
      );

      const absScore = Math.abs(score).toFixed(1);
      const isBlackWin = score > 0;
      const isUserWin = (isBlackWin && this.userColor === 1) || (!isBlackWin && this.userColor === 2);
      const winnerName = isBlackWin ? '흑돌' : '백돌';

      this.showResultModal({
        title: `${winnerName} ${absScore}집 승리!`,
        desc: isUserWin
          ? `축하합니다! ${absScore}집 차이로 멋진 승리를 거두었습니다! 🎉`
          : `아쉽게도 AI가 ${absScore}집 차이로 승리했습니다. 복기하며 다음 판을 준비해보세요!`,
        isUserWin
      });
    }

    // 기권패
    resign() {
      if (!this.isActive) return;
      const confirmResign = confirm('정말 기권하시겠습니까?');
      if (!confirmResign) return;

      this.isActive = false;
      const winnerName = (this.userColor === 1) ? '백돌(AI)' : '흑돌(AI)';

      this.showResultModal({
        title: `${winnerName} 불계승`,
        desc: '내가 기권하여 인공지능이 승리했습니다. 복기로 수순을 탐색해보세요.',
        isUserWin: false
      });
    }

    // 결과 모달 표시
    showResultModal({ title, desc, isUserWin }) {
      const modal = document.getElementById('matchResultModal');
      const badge = document.getElementById('resultModalBadge');
      const icon = document.getElementById('resultModalIcon');
      const t = document.getElementById('resultModalTitle');
      const d = document.getElementById('resultModalDesc');

      if (badge) badge.textContent = isUserWin ? '🎉 승리 축하!' : '🏆 대국 종료';
      if (icon) icon.textContent = isUserWin ? '🏆' : '👏';
      if (t) t.textContent = title;
      if (d) d.textContent = desc;

      if (modal) modal.classList.add('show');
      if (isUserWin) window.badukAudio.playLevelUp();
      else window.badukAudio.playSuccess();
    }

    // 대국실 나가기
    leaveMatch() {
      const confirmLeave = confirm('AI 대국실을 나가 메인으로 돌아가시겠습니까?');
      if (!confirmLeave) return;

      this.isActive = false;
      this.game.isAIMatch = false;
      this.game.switchMode('lecture');
    }

    // 대국 화면 상태 갱신
    updateStatus() {
      const turnText = document.getElementById('matchTurnText');
      const turnDot = document.getElementById('matchTurnDot');
      const stepCounter = document.getElementById('matchStepCounter');

      const currentTurn = this.getCurrentTurn();
      const isMyTurn = (currentTurn === this.userColor);

      if (turnText) {
        if (this.isThinking) {
          turnText.textContent = '⏳ AI가 최선의 수를 수읽기 중...';
          turnText.style.color = '#f59e0b';
        } else if (isMyTurn) {
          turnText.textContent = `🟢 [내 차례] 착수하세요! (${this.userColor === 1 ? '흑돌' : '백돌'})`;
          turnText.style.color = '#38bdf8';
        } else {
          turnText.textContent = '⏳ 인공지능 생각 중...';
          turnText.style.color = '#94a3b8';
        }
      }

      if (turnDot) {
        turnDot.style.background = isMyTurn ? '#38bdf8' : '#f59e0b';
      }

      if (stepCounter) {
        stepCounter.textContent = `${this.game.engine.currentStep}수`;
      }

      // 사석함 갱신
      const bCaptures = document.getElementById('blackCaptureCount');
      const wCaptures = document.getElementById('whiteCaptureCount');
      if (bCaptures) bCaptures.textContent = this.game.engine.blackCaptures;
      if (wCaptures) wCaptures.textContent = this.game.engine.whiteCaptures;

      // 액션 버튼 표시 제어
      const btnPass = document.getElementById('btnAiMatchPass');
      const btnScore = document.getElementById('btnAiMatchScore');
      if (btnPass) btnPass.style.display = this.isActive ? 'block' : 'none';
      if (btnScore) btnScore.style.display = this.isActive ? 'block' : 'none';
    }
  }

  window.AIMatchManager = AIMatchManager;

})(typeof window !== 'undefined' ? window : global);
