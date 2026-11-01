/**
 * game.js - 미니 동물장기 생동감 넘치는 애니메이션, 파티클, 타격감 & 마스코트 반응 엔진
 */
(function(window) {
  'use strict';

  const COLS = 3;
  const ROWS = 4;
  const CANVAS_W = 600;
  const CANVAS_H = 800;

  // 마스코트 표정 이미지 경로
  const AVATARS = {
    p1: {
      idle: '/games/alkkagi/capybara/01-idle.png',
      happy: '/games/alkkagi/capybara/04-happy.png',
      worried: '/games/alkkagi/capybara/05-worried.png',
      surprised: '/games/alkkagi/capybara/06-surprised.png',
      victory: '/games/alkkagi/capybara/07-victory.png',
      defeat: '/games/alkkagi/capybara/08-defeat.png',
      smile: '/games/alkkagi/capybara/09-smile.png'
    },
    p2: {
      idle: '/games/alkkagi/robot-clean-01-idle.v1.png',
      happy: '/games/alkkagi/robot-clean-04-happy.v1.png',
      worried: '/games/alkkagi/robot-clean-05-worried.v1.png',
      surprised: '/games/alkkagi/robot-clean-06-surprised.v1.png',
      victory: '/games/alkkagi/robot-clean-07-victory.v1.png',
      defeat: '/games/alkkagi/robot-clean-08-defeat.v1.png'
    }
  };

  class AnimalJanggiGame {
    constructor() {
      this.canvas = document.getElementById('animalBoard');
      this.ctx = this.canvas.getContext('2d');
      this.boardWrapper = document.querySelector('.board-wrapper');

      this.rules = new AnimalJanggiRules();
      this.ai = new AnimalJanggiAI('medium');

      // 게임 옵션 & 상태
      this.isAIMode = true;
      this.showGuide = true;
      this.selectedCell = null;
      this.validMoves = [];
      this.lastMove = null;

      // 애니메이션 & 파티클 시스템
      this.particles = [];
      this.floatingTexts = [];
      this.animatingPiece = null; // { piece, startX, startY, targetX, targetY, startTime, duration }
      this.hoverCell = null;

      // UI 요소 캐시
      this.turnBanner = document.getElementById('turnBanner');
      this.turnTitle = document.getElementById('turnTitle');
      this.turnSub = document.getElementById('turnSub');
      this.p1Card = document.getElementById('p1Card');
      this.p2Card = document.getElementById('p2Card');
      this.p1Avatar = document.getElementById('p1Avatar');
      this.p2Avatar = document.getElementById('p2Avatar');
      this.p1Bubble = document.getElementById('p1Bubble');
      this.p2Bubble = document.getElementById('p2Bubble');
      this.p1Tray = document.getElementById('p1CapturedTray');
      this.p2Tray = document.getElementById('p2CapturedTray');

      // 모달 요소
      this.resultModal = document.getElementById('resultModal');
      this.resultTitle = document.getElementById('resultTitle');
      this.resultDesc = document.getElementById('resultDesc');
      this.rulesModal = document.getElementById('rulesModal');

      this.initEvents();
      this.updateUI();
      this.startLoop();
    }

    initEvents() {
      this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
      this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => { this.hoverCell = null; });

      document.getElementById('btnNewGame')?.addEventListener('click', () => this.startNewGame());
      document.getElementById('btnUndo')?.addEventListener('click', () => this.undoMove());
      document.getElementById('btnGuideToggle')?.addEventListener('click', () => this.toggleGuide());
      document.getElementById('btnToggleMode')?.addEventListener('click', () => this.toggleMode());
      document.getElementById('btnDifficulty')?.addEventListener('click', () => this.cycleDifficulty());
      document.getElementById('btnToggleSound')?.addEventListener('click', () => this.toggleSound());
      document.getElementById('btnShowRules')?.addEventListener('click', () => this.openRulesModal());
      document.getElementById('btnCloseRules')?.addEventListener('click', () => this.closeRulesModal());
      document.getElementById('btnModalNewGame')?.addEventListener('click', () => {
        this.closeResultModal();
        this.startNewGame();
      });

      window.addEventListener('resize', () => this.render());
    }

    // 마스코트 감정 표정 및 말풍선 트리거
    triggerMascotReaction(player, emotion, bubbleText = '') {
      const isP1 = player === PLAYER_1;
      const avatarEl = isP1 ? this.p1Avatar : this.p2Avatar;
      const bubbleEl = isP1 ? this.p1Bubble : this.p2Bubble;
      const avatarMap = isP1 ? AVATARS.p1 : AVATARS.p2;

      if (avatarEl && avatarMap[emotion]) {
        avatarEl.src = avatarMap[emotion];
      }

      if (bubbleEl && bubbleText) {
        bubbleEl.textContent = bubbleText;
        bubbleEl.hidden = false;
      }

      // 2.3초 후 기본 표정으로 자동 복귀
      clearTimeout(avatarEl._resetTimer);
      avatarEl._resetTimer = setTimeout(() => {
        if (avatarEl) avatarEl.src = avatarMap.idle;
        if (bubbleEl) bubbleEl.hidden = true;
      }, 2300);
    }

    // 화면 타격감 흔들림 (Screen Shake)
    triggerScreenShake() {
      if (!this.boardWrapper) return;
      this.boardWrapper.classList.remove('screen-shake');
      void this.boardWrapper.offsetWidth; // 트리거 리플로우
      this.boardWrapper.classList.add('screen-shake');
      setTimeout(() => {
        this.boardWrapper.classList.remove('screen-shake');
      }, 280);
    }

    // 파티클 생성기 (별, 폭죽, 마법 반짝이)
    spawnParticles(x, y, count = 16, type = 'star', colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899']) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2.5;
        this.particles.push({
          x: x,
          y: y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (type === 'firework' ? 4 : 1),
          gravity: 0.16,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 7 + 4,
          alpha: 1.0,
          decay: Math.random() * 0.025 + 0.015,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          type: type
        });
      }
    }

    // 플로팅 만화 텍스트 생성기
    spawnFloatingText(text, x, y, color = '#f59e0b', size = 26) {
      this.floatingTexts.push({
        text: text,
        x: x,
        y: y,
        vy: -2.2,
        alpha: 1.0,
        color: color,
        size: size,
        scale: 0.7
      });
    }

    // 게임 루프 시작 (초당 60프레임 부드러운 렌더링)
    startLoop() {
      const loop = () => {
        this.update();
        this.render();
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    update() {
      // 1. 파티클 물리 업데이트
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
        }
      }

      // 2. 플로팅 텍스트 업데이트
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const t = this.floatingTexts[i];
        t.y += t.vy;
        t.vy *= 0.94;
        t.alpha -= 0.018;
        if (t.scale < 1.1) t.scale += 0.06;

        if (t.alpha <= 0) {
          this.floatingTexts.splice(i, 1);
        }
      }

      // 3. 이동 애니메이션 완료 체크
      if (this.animatingPiece) {
        const now = performance.now();
        const elapsed = now - this.animatingPiece.startTime;
        if (elapsed >= this.animatingPiece.duration) {
          if (this.animatingPiece.onComplete) {
            this.animatingPiece.onComplete();
          }
          this.animatingPiece = null;
        }
      }
    }

    startNewGame() {
      this.rules.reset();
      this.selectedCell = null;
      this.validMoves = [];
      this.lastMove = null;
      this.particles = [];
      this.floatingTexts = [];
      this.animatingPiece = null;

      AnimalAudio.playSelect();
      this.triggerMascotReaction(PLAYER_1, 'smile', '새 게임 시작!');
      this.triggerMascotReaction(PLAYER_2, 'idle', '');
      this.updateUI();
    }

    toggleGuide() {
      this.showGuide = !this.showGuide;
      const btn = document.getElementById('btnGuideToggle');
      if (btn) {
        btn.innerHTML = `💡 이동 길잡이: <b>${this.showGuide ? '켜짐' : '꺼짐'}</b>`;
        btn.classList.toggle('active', this.showGuide);
      }
    }

    toggleMode() {
      this.isAIMode = !this.isAIMode;
      const btn = document.getElementById('btnToggleMode');
      const p2Name = document.getElementById('p2Name');
      if (btn) {
        btn.textContent = this.isAIMode ? '🤖 AI 대전' : '👥 2인 대전';
      }
      if (p2Name) {
        p2Name.textContent = this.isAIMode ? '상대 (AI 로봇)' : '플레이어 2 (하늘)';
      }
      AnimalAudio.playSelect();
    }

    cycleDifficulty() {
      const order = ['easy', 'medium', 'hard'];
      const names = { easy: '쉬움 (초급)', medium: '보통 (중급)', hard: '어려움 (고급)' };
      const currentIdx = order.indexOf(this.ai.difficulty);
      const nextIdx = (currentIdx + 1) % order.length;
      const nextDiff = order[nextIdx];
      this.ai.setDifficulty(nextDiff);

      const btn = document.getElementById('btnDifficulty');
      if (btn) {
        btn.textContent = `🎯 난이도: ${names[nextDiff]}`;
      }
      AnimalAudio.playSelect();
    }

    toggleSound() {
      const enabled = AnimalAudio.toggleSound();
      const btn = document.getElementById('btnToggleSound');
      if (btn) {
        btn.textContent = enabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      }
    }

    undoMove() {
      if (this.rules.moveHistory.length === 0) return;

      if (this.isAIMode) {
        this.rules.undo();
        this.rules.undo();
      } else {
        this.rules.undo();
      }

      this.selectedCell = null;
      this.validMoves = [];
      this.lastMove = this.rules.moveHistory.length > 0 ?
        this.rules.moveHistory[this.rules.moveHistory.length - 1].move : null;

      AnimalAudio.playSelect();
      this.triggerMascotReaction(PLAYER_1, 'idle', '한 수 무르기!');
      this.updateUI();
    }

    handleCanvasMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const colW = CANVAS_W / COLS;
      const rowH = CANVAS_H / ROWS;
      const cellX = Math.floor(clickX / colW);
      const cellY = Math.floor(clickY / rowH);

      if (cellX >= 0 && cellX < COLS && cellY >= 0 && cellY < ROWS) {
        this.hoverCell = { x: cellX, y: cellY };
      } else {
        this.hoverCell = null;
      }
    }

    handleCanvasClick(e) {
      if (this.rules.winner || this.animatingPiece) return;
      if (this.isAIMode && this.rules.currentTurn === PLAYER_2) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const colW = CANVAS_W / COLS;
      const rowH = CANVAS_H / ROWS;
      const cellX = Math.floor(clickX / colW);
      const cellY = Math.floor(clickY / rowH);

      if (cellX < 0 || cellX >= COLS || cellY < 0 || cellY >= ROWS) return;

      this.onCellSelected(cellX, cellY);
    }

    onCellSelected(x, y) {
      const currentTurn = this.rules.currentTurn;

      // 1. 포획 동물 드롭 실행
      if (this.selectedCell && this.selectedCell.fromHand) {
        const dropMove = this.validMoves.find(m => m.action === 'drop' && m.to.x === x && m.to.y === y);
        if (dropMove) {
          this.executeMoveWithAnimation(dropMove);
          return;
        } else {
          this.selectedCell = null;
          this.validMoves = [];
        }
      }

      // 2. 보드 기물 이동 실행
      if (this.selectedCell && !this.selectedCell.fromHand) {
        const boardMove = this.validMoves.find(m => m.action === 'move' && m.to.x === x && m.to.y === y);
        if (boardMove) {
          this.executeMoveWithAnimation(boardMove);
          return;
        }
      }

      // 3. 기물 선택
      const piece = this.rules.getPiece(x, y);
      if (piece && piece.owner === currentTurn) {
        this.selectedCell = { x, y, fromHand: false };
        this.validMoves = this.rules.getPieceMoves(x, y);
        AnimalAudio.playSelect();

        // 선택 동물 울음소리 재생
        this.playPieceSound(piece.type);
      } else {
        this.selectedCell = null;
        this.validMoves = [];
      }

      this.updateCapturedTrays();
    }

    selectFromHand(player, pieceType, index) {
      if (this.rules.winner || this.animatingPiece) return;
      if (this.rules.currentTurn !== player) return;
      if (this.isAIMode && player === PLAYER_2) return;

      if (this.selectedCell && this.selectedCell.fromHand && this.selectedCell.piece === pieceType && this.selectedCell.index === index) {
        this.selectedCell = null;
        this.validMoves = [];
      } else {
        this.selectedCell = { fromHand: true, piece: pieceType, index, player };
        const allLegal = this.rules.getLegalMoves(player);
        this.validMoves = allLegal.filter(m => m.action === 'drop' && m.piece === pieceType);
        AnimalAudio.playSelect();
        this.playPieceSound(pieceType);
      }

      this.updateCapturedTrays();
    }

    // 동물별 고유 울음소리
    playPieceSound(type) {
      switch (type) {
        case 'lion':
          AnimalAudio.playLionRoar();
          break;
        case 'chick':
          AnimalAudio.playChickChirp();
          break;
        case 'giraffe':
          AnimalAudio.playGiraffeSound();
          break;
        case 'elephant':
          AnimalAudio.playElephantSound();
          break;
      }
    }

    // 애니메이션 및 화려한 특수효과와 함께 수 실행
    executeMoveWithAnimation(move) {
      const colW = CANVAS_W / COLS;
      const rowH = CANVAS_H / ROWS;
      const isPlayerMove = move.owner === PLAYER_1;

      // 1. 이동 전 준비
      const isDrop = move.action === 'drop';
      const isCapture = !!move.captured;
      const isPromote = move.promoted;

      const targetCenterX = move.to.x * colW + colW / 2;
      const targetCenterY = move.to.y * rowH + rowH / 2;

      // 보드 이동 애니메이션 설정
      if (!isDrop) {
        const startCenterX = move.from.x * colW + colW / 2;
        const startCenterY = move.from.y * rowH + rowH / 2;

        this.animatingPiece = {
          piece: this.rules.getPiece(move.from.x, move.from.y),
          startX: startCenterX,
          startY: startCenterY,
          targetX: targetCenterX,
          targetY: targetCenterY,
          startTime: performance.now(),
          duration: 220,
          onComplete: () => {
            this.finalizeMove(move, targetCenterX, targetCenterY, isCapture, isPromote, isDrop, isPlayerMove);
          }
        };
      } else {
        // 드롭은 즉시 소환 마법 연출
        this.finalizeMove(move, targetCenterX, targetCenterY, isCapture, isPromote, isDrop, isPlayerMove);
      }

      this.selectedCell = null;
      this.validMoves = [];
    }

    // 이동 완료 후 사운드, 파티클, 마스코트 표정 분기
    finalizeMove(move, cx, cy, isCapture, isPromote, isDrop, isPlayerMove) {
      this.rules.applyMove(move);
      this.lastMove = move;

      // 1. 포획(Capture) 시 대폭발 연출
      if (isCapture) {
        AnimalAudio.playCapture();
        this.triggerScreenShake();
        this.spawnParticles(cx, cy, 24, 'star', ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff']);
        this.spawnFloatingText('💥 쿵! 포획!', cx, cy - 20, '#ef4444', 30);

        if (isPlayerMove) {
          this.triggerMascotReaction(PLAYER_1, 'happy', '잡았다!');
          this.triggerMascotReaction(PLAYER_2, 'surprised', '으악!');
        } else {
          this.triggerMascotReaction(PLAYER_2, 'happy', '포획 성공!');
          this.triggerMascotReaction(PLAYER_1, 'worried', '앗, 내 동물이!');
        }
      }
      // 2. 닭 승급(Promote) 시 환호 팡파르
      else if (isPromote) {
        AnimalAudio.playPromote();
        this.spawnParticles(cx, cy, 32, 'firework', ['#fbbf24', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981']);
        this.spawnFloatingText('🐓 꼬끼오~! 닭으로 진화!', cx, cy - 25, '#f59e0b', 30);

        if (isPlayerMove) {
          this.triggerMascotReaction(PLAYER_1, 'victory', '닭으로 진화 완료!');
        }
      }
      // 3. 소환(Drop) 시 마법 반짝이
      else if (isDrop) {
        AnimalAudio.playDrop();
        this.spawnParticles(cx, cy, 18, 'circle', ['#38bdf8', '#818cf8', '#fbbf24', '#ffffff']);
        this.spawnFloatingText('✨ 소환 완료!', cx, cy - 20, '#0284c7', 28);
      }
      // 4. 일반 이동
      else {
        AnimalAudio.playMove();
        this.playPieceSound(move.piece);
      }

      this.updateUI();

      // 게임 종료 확인
      if (this.rules.winner) {
        this.handleGameOver();
        return;
      }

      // AI 턴 자동 실행
      if (this.isAIMode && this.rules.currentTurn === PLAYER_2) {
        this.triggerAIMove();
      }
    }

    triggerAIMove() {
      this.turnSub.textContent = '🤖 AI가 최선의 수를 고민하고 있습니다...';

      setTimeout(() => {
        if (this.rules.winner || this.rules.currentTurn !== PLAYER_2) return;

        const bestMove = this.ai.getBestMove(this.rules);
        if (bestMove) {
          this.executeMoveWithAnimation(bestMove);
        }
      }, 550);
    }

    handleGameOver() {
      const winner = this.rules.winner;
      const reason = this.rules.winReason;

      let title = '';
      let desc = '';

      if (winner === 'draw') {
        title = '🤝 무승부!';
        desc = '같은 국면이 3회 반복(선일수)되어 무승부로 끝났습니다.';
      } else {
        const isP1Win = winner === PLAYER_1;
        const winnerName = isP1Win ? '나 (카피바라)' : (this.isAIMode ? '상대 AI 로봇' : '플레이어 2');

        if (reason === 'catch') {
          title = isP1Win ? '🎉 사자 포획 대승리!' : '😢 사자가 잡혔습니다!';
          desc = `${winnerName}님이 상대의 사자를 멋지게 잡았습니다! (Catch)`;
        } else if (reason === 'try') {
          title = isP1Win ? '👑 트라이(Try) 대승리!' : '🦁 상대의 트라이 성공!';
          desc = `${winnerName}님의 사자가 상대 진영을 정복하여 승리했습니다!`;
        }

        if (isP1Win) {
          AnimalAudio.playVictory();
          this.triggerMascotReaction(PLAYER_1, 'victory', '우와 내가 이겼다!! 🏆');
          this.triggerMascotReaction(PLAYER_2, 'defeat', '분하다 삐리릭...');
          this.spawnParticles(CANVAS_W / 2, CANVAS_H / 2, 45, 'firework');
        } else {
          AnimalAudio.playDefeat();
          this.triggerMascotReaction(PLAYER_1, 'defeat', '다음엔 이길 거야!');
          this.triggerMascotReaction(PLAYER_2, 'happy', '내가 이겼다 삐릭!');
        }
      }

      this.resultTitle.textContent = title;
      this.resultDesc.textContent = desc;
      this.openResultModal();
    }

    updateUI() {
      const turn = this.rules.currentTurn;
      const isP1 = turn === PLAYER_1;

      if (this.turnBanner) {
        this.turnBanner.className = `turn-center-banner ${isP1 ? 'p1' : 'p2'}`;
        this.turnTitle.textContent = isP1 ? '내 차례 — 초록(숲)' : (this.isAIMode ? '상대(AI) 차례 — 하늘' : '플레이어 2 차례 — 하늘');
        this.turnSub.textContent = isP1 ? '동물을 선택해 이동하거나 잡은 동물을 소환하세요' : '상대가 이동할 준비를 하고 있습니다';
      }

      if (this.p1Card) this.p1Card.classList.toggle('active', isP1);
      if (this.p2Card) this.p2Card.classList.toggle('active', !isP1);

      this.updateCapturedTrays();
    }

    updateCapturedTrays() {
      const p1Hand = this.rules.hands[PLAYER_1];
      const p2Hand = this.rules.hands[PLAYER_2];

      const renderTray = (trayEl, hand, player) => {
        if (!trayEl) return;
        trayEl.innerHTML = '';

        if (hand.length === 0) {
          trayEl.innerHTML = '<span class="empty-tray">잡은 동물 없음</span>';
          return;
        }

        hand.forEach((pieceType, index) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'captured-piece-btn';

          const isSelected = this.selectedCell &&
            this.selectedCell.fromHand &&
            this.selectedCell.piece === pieceType &&
            this.selectedCell.index === index;

          if (isSelected) btn.classList.add('selected');

          const icon = this.getPieceEmoji(pieceType);
          const name = this.getPieceName(pieceType);

          btn.innerHTML = `<span class="cap-emoji">${icon}</span><span class="cap-name">${name}</span>`;

          btn.addEventListener('click', () => {
            this.selectFromHand(player, pieceType, index);
          });

          trayEl.appendChild(btn);
        });
      };

      renderTray(this.p1Tray, p1Hand, PLAYER_1);
      renderTray(this.p2Tray, p2Hand, PLAYER_2);
    }

    getPieceEmoji(type) {
      switch (type) {
        case 'lion': return '🦁';
        case 'giraffe': return '🦒';
        case 'elephant': return '🐘';
        case 'chick': return '🐥';
        case 'hen': return '🐓';
        default: return '🐾';
      }
    }

    getPieceName(type) {
      switch (type) {
        case 'lion': return '사자';
        case 'giraffe': return '기린';
        case 'elephant': return '코끼리';
        case 'chick': return '병아리';
        case 'hen': return '닭';
        default: return '';
      }
    }

    // ==============================================================
    // 캔버스 렌더링 파이프라인
    // ==============================================================
    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      const colW = CANVAS_W / COLS;
      const rowH = CANVAS_H / ROWS;

      // 1. 3개 구역 (하늘 / 들판 / 숲) 배경 그리기
      this.drawBoardBackground(ctx, colW, rowH);

      // 2. 마우스 호버 셀 강조
      if (this.hoverCell && !this.animatingPiece) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fillRect(this.hoverCell.x * colW + 4, this.hoverCell.y * rowH + 4, colW - 8, rowH - 8);
        ctx.restore();
      }

      // 3. 격자선 및 테두리
      this.drawGridLines(ctx, colW, rowH);

      // 4. 직전 착수 하이라이트
      if (this.lastMove) {
        this.drawLastMoveHighlight(ctx, colW, rowH);
      }

      // 5. 기물 그리기 (3x4)
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const piece = this.rules.board[y][x];
          // 애니메이션 중인 기물의 출발지는 그리지 않음
          if (this.animatingPiece && this.lastMove && this.lastMove.from && this.lastMove.from.x === x && this.lastMove.from.y === y) {
            continue;
          }

          if (piece) {
            const isSelected = this.selectedCell && !this.selectedCell.fromHand &&
              this.selectedCell.x === x && this.selectedCell.y === y;
            this.drawAnimalPiece(ctx, x * colW + colW / 2, y * rowH + rowH / 2, piece, colW, rowH, isSelected);
          }
        }
      }

      // 6. 점프 애니메이션 중인 기물 그리기
      if (this.animatingPiece) {
        this.drawFlyingPiece(ctx, colW, rowH);
      }

      // 7. 이동 가능한 위치 길잡이(가이드) 표시
      if (this.showGuide && this.validMoves.length > 0 && !this.animatingPiece) {
        this.drawGuideMarkers(ctx, colW, rowH);
      }

      // 8. 특수효과 파티클 렌더링
      this.renderParticles(ctx);

      // 9. 플로팅 텍스트 렌더링
      this.renderFloatingTexts(ctx);
    }

    drawBoardBackground(ctx, colW, rowH) {
      // Row 0: 하늘 구역
      const gradSky = ctx.createLinearGradient(0, 0, 0, rowH);
      gradSky.addColorStop(0, '#e0f2fe');
      gradSky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = gradSky;
      ctx.fillRect(0, 0, CANVAS_W, rowH);

      // 구름 장식
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.beginPath();
      ctx.arc(CANVAS_W * 0.18, rowH * 0.45, 24, 0, Math.PI * 2);
      ctx.arc(CANVAS_W * 0.24, rowH * 0.4, 32, 0, Math.PI * 2);
      ctx.arc(CANVAS_W * 0.30, rowH * 0.45, 24, 0, Math.PI * 2);
      ctx.fill();

      // Row 1, 2: 들판 구역
      const gradMeadow = ctx.createLinearGradient(0, rowH, 0, rowH * 3);
      gradMeadow.addColorStop(0, '#fef9c3');
      gradMeadow.addColorStop(0.5, '#fef08a');
      gradMeadow.addColorStop(1, '#ecfccb');
      ctx.fillStyle = gradMeadow;
      ctx.fillRect(0, rowH, CANVAS_W, rowH * 2);

      // Row 3: 숲 구역
      const gradForest = ctx.createLinearGradient(0, rowH * 3, 0, CANVAS_H);
      gradForest.addColorStop(0, '#dcfce7');
      gradForest.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradForest;
      ctx.fillRect(0, rowH * 3, CANVAS_W, rowH);

      // 구역 레이블 워터마크
      ctx.save();
      ctx.font = '800 13px Pretendard, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      ctx.fillStyle = 'rgba(2, 132, 199, 0.4)';
      ctx.fillText('☁️ 하늘 구역 (상대 진영)', CANVAS_W / 2, rowH - 6);

      ctx.fillStyle = 'rgba(161, 98, 7, 0.35)';
      ctx.fillText('🌱 들판 구역', CANVAS_W / 2, rowH * 2.5);

      ctx.fillStyle = 'rgba(21, 128, 61, 0.4)';
      ctx.fillText('🌲 숲 구역 (내 진영)', CANVAS_W / 2, CANVAS_H - 8);
      ctx.restore();
    }

    drawGridLines(ctx, colW, rowH) {
      ctx.save();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * colW, 0);
        ctx.lineTo(c * colW, CANVAS_H);
        ctx.stroke();
      }

      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rowH);
        ctx.lineTo(CANVAS_W, r * rowH);
        ctx.stroke();
      }

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
      ctx.restore();
    }

    drawLastMoveHighlight(ctx, colW, rowH) {
      ctx.save();
      const move = this.lastMove;
      if (move.action === 'move') {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.fillRect(move.from.x * colW + 4, move.from.y * rowH + 4, colW - 8, rowH - 8);
      }
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.fillRect(move.to.x * colW + 4, move.to.y * rowH + 4, colW - 8, rowH - 8);
      ctx.restore();
    }

    // 날아가는 기물 애니메이션 (포물선 점프 효과)
    drawFlyingPiece(ctx, colW, rowH) {
      const anim = this.animatingPiece;
      const progress = Math.min((performance.now() - anim.startTime) / anim.duration, 1.0);

      // 베지에 곡선 호
      const curX = anim.startX + (anim.targetX - anim.startX) * progress;
      const curY = anim.startY + (anim.targetY - anim.startY) * progress;
      const jumpHeight = Math.sin(progress * Math.PI) * 45; // 공중 높이

      ctx.save();
      // 바닥 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(curX, curY + 20, colW * 0.35, rowH * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // 공중 말
      this.drawAnimalPiece(ctx, curX, curY - jumpHeight, anim.piece, colW, rowH, true);
      ctx.restore();
    }

    drawAnimalPiece(ctx, cx, cy, piece, colW, rowH, isSelected) {
      const sizeW = colW * 0.82;
      const sizeH = rowH * 0.82;
      const isP1 = piece.owner === PLAYER_1;

      ctx.save();
      ctx.translate(cx, cy);

      // 선택된 기물은 숨쉬듯 위아래로 동동 뜨는 모션 (Breathing bob)
      let bob = 0;
      if (isSelected) {
        bob = Math.sin(performance.now() * 0.008) * 6 - 8;
        ctx.translate(0, bob);
      }

      if (!isP1) {
        ctx.rotate(Math.PI);
      }

      // 그림자
      ctx.shadowColor = isSelected ? 'rgba(245, 158, 11, 0.55)' : 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = isSelected ? 26 : 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isSelected ? 14 : 5;

      const rx = -sizeW / 2;
      const ry = -sizeH / 2;
      const radius = 18;

      // 1. 따뜻한 원목 블록 바탕
      const woodGrad = ctx.createLinearGradient(rx, ry, rx, ry + sizeH);
      if (isSelected) {
        woodGrad.addColorStop(0, '#fef08a');
        woodGrad.addColorStop(1, '#fde047');
      } else {
        woodGrad.addColorStop(0, '#fef3c7');
        woodGrad.addColorStop(1, '#fde68a');
      }

      ctx.fillStyle = woodGrad;
      this.drawRoundedRect(ctx, rx, ry, sizeW, sizeH, radius);
      ctx.fill();

      // 원목 테두리
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = isSelected ? 5.0 : 3.5;
      ctx.strokeStyle = isSelected ? '#d97706' : (isP1 ? '#16a34a' : '#0284c7');
      ctx.stroke();

      // 2. 동물 얼굴 이모지 & 한글 이름
      const emoji = this.getPieceEmoji(piece.type);
      const name = this.getPieceName(piece.type);

      ctx.font = '54px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, -6);

      // 기물 이름 (정방향 렌더링)
      ctx.save();
      if (!isP1) {
        ctx.rotate(Math.PI);
        ctx.font = '900 14px Pretendard, sans-serif';
        ctx.fillStyle = '#075985';
        ctx.fillText(name, 0, -sizeH * 0.32);
      } else {
        ctx.font = '900 14px Pretendard, sans-serif';
        ctx.fillStyle = '#14532d';
        ctx.fillText(name, 0, sizeH * 0.32);
      }
      ctx.restore();

      // 3. 이동 방향 빨간 점 (Direction Dots)
      this.drawDirectionDots(ctx, piece.type, sizeW, sizeH);

      ctx.restore();
    }

    drawDirectionDots(ctx, type, w, h) {
      const dirs = ANIMAL_MOVES[type] || [];
      const dotRadius = 5.5;
      const marginX = w * 0.42;
      const marginY = h * 0.42;

      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;

      for (const d of dirs) {
        const dotX = d.dx * marginX;
        const dotY = d.dy * marginY;

        ctx.beginPath();
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    drawGuideMarkers(ctx, colW, rowH) {
      const time = performance.now() * 0.005;
      const pulse = Math.sin(time) * 3;

      for (const move of this.validMoves) {
        const cx = move.to.x * colW + colW / 2;
        const cy = move.to.y * rowH + rowH / 2;

        ctx.save();
        const targetPiece = this.rules.board[move.to.y][move.to.x];
        const isCapture = !!targetPiece;

        ctx.fillStyle = isCapture ? 'rgba(239, 68, 68, 0.35)' : 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(move.to.x * colW + 6, move.to.y * rowH + 6, colW - 12, rowH - 12);

        // 중앙 펄스 링
        ctx.beginPath();
        ctx.arc(cx, cy, 15 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = isCapture ? '#ef4444' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.0;
        ctx.stroke();

        ctx.restore();
      }
    }

    // 파티클 렌더링
    renderParticles(ctx) {
      for (const p of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(p.alpha, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.type === 'star') {
          this.drawStar(ctx, 0, 0, 5, p.size, p.size * 0.45);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let x = cx;
      let y = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    }

    // 플로팅 텍스트 렌더링
    renderFloatingTexts(ctx) {
      for (const t of this.floatingTexts) {
        ctx.save();
        ctx.globalAlpha = Math.max(t.alpha, 0);
        ctx.translate(t.x, t.y);
        ctx.scale(t.scale, t.scale);

        ctx.font = `900 ${t.size}px Pretendard, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 텍스트 외곽선
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4.5;
        ctx.lineJoin = 'round';
        ctx.strokeText(t.text, 0, 0);

        // 텍스트 본체
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, 0, 0);

        ctx.restore();
      }
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    }

    openResultModal() {
      if (this.resultModal) this.resultModal.hidden = false;
    }
    closeResultModal() {
      if (this.resultModal) this.resultModal.hidden = true;
    }
    openRulesModal() {
      if (this.rulesModal) this.rulesModal.hidden = false;
    }
    closeRulesModal() {
      if (this.rulesModal) this.rulesModal.hidden = true;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.animalJanggiGame = new AnimalJanggiGame();
  });
})(window);
