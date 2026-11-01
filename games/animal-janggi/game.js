/**
 * game.js - 미니 동물장기 캔버스 렌더러 & 인터랙션 컨트롤러
 */
(function(window) {
  'use strict';

  // 설정 및 상태 상수
  const COLS = 3;
  const ROWS = 4;
  const CANVAS_W = 600;
  const CANVAS_H = 800;

  class AnimalJanggiGame {
    constructor() {
      this.canvas = document.getElementById('animalBoard');
      this.ctx = this.canvas.getContext('2d');

      this.rules = new AnimalJanggiRules();
      this.ai = new AnimalJanggiAI('medium');

      // 게임 옵션
      this.isAIMode = true;
      this.showGuide = true;
      this.selectedCell = null; // { x, y } 또는 { fromHand: true, piece, index }
      this.validMoves = [];     // 현재 선택된 기물의 이동 가능 위치
      this.lastMove = null;     // 직전 이동 하이라이트

      // UI 요소 캐시
      this.turnBanner = document.getElementById('turnBanner');
      this.turnTitle = document.getElementById('turnTitle');
      this.turnSub = document.getElementById('turnSub');
      this.p1Card = document.getElementById('p1Card');
      this.p2Card = document.getElementById('p2Card');
      this.p1Score = document.getElementById('p1Score');
      this.p2Score = document.getElementById('p2Score');
      this.p1Tray = document.getElementById('p1CapturedTray');
      this.p2Tray = document.getElementById('p2CapturedTray');

      // 모달 요소
      this.resultModal = document.getElementById('resultModal');
      this.resultTitle = document.getElementById('resultTitle');
      this.resultDesc = document.getElementById('resultDesc');
      this.rulesModal = document.getElementById('rulesModal');

      this.initEvents();
      this.updateUI();
      this.render();
    }

    initEvents() {
      // 캔버스 클릭 이벤트
      this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

      // 버튼 이벤트
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

      // 윈도우 리사이즈 시 캔버스 렌더링 유지
      window.addEventListener('resize', () => this.render());
    }

    // 새 게임 시작
    startNewGame() {
      this.rules.reset();
      this.selectedCell = null;
      this.validMoves = [];
      this.lastMove = null;
      AnimalAudio.playSelect();
      this.updateUI();
      this.render();
    }

    // 이동 길잡이(가이드) 토글
    toggleGuide() {
      this.showGuide = !this.showGuide;
      const btn = document.getElementById('btnGuideToggle');
      if (btn) {
        btn.innerHTML = `💡 이동 길잡이: <b>${this.showGuide ? '켜짐' : '꺼짐'}</b>`;
        btn.classList.toggle('active', this.showGuide);
      }
      this.render();
    }

    // 대전 모드 토글 (AI 대전 vs 2인 로컬 대전)
    toggleMode() {
      this.isAIMode = !this.isAIMode;
      const btn = document.getElementById('btnToggleMode');
      const p2Name = document.getElementById('p2Name');
      if (btn) {
        btn.textContent = this.isAIMode ? '🤖 AI 대전' : '👥 2인 대전';
      }
      if (p2Name) {
        p2Name.textContent = this.isAIMode ? '상대 (AI)' : '플레이어 2 (하늘)';
      }
      AnimalAudio.playSelect();
    }

    // 난이도 변경
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

    // 소리 토글
    toggleSound() {
      const enabled = AnimalAudio.toggleSound();
      const btn = document.getElementById('btnToggleSound');
      if (btn) {
        btn.textContent = enabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      }
    }

    // 무르기
    undoMove() {
      if (this.rules.moveHistory.length === 0) return;

      if (this.isAIMode) {
        // AI 모드에서는 내 차례와 AI 차례 둘 다 되돌림
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
      this.updateUI();
      this.render();
    }

    // 캔버스 클릭 핸들러
    handleCanvasClick(e) {
      if (this.rules.winner) return;

      // AI 차례일 때는 플레이어 입력 차단
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

    // 셀 선택 또는 이동 명령
    onCellSelected(x, y) {
      const currentTurn = this.rules.currentTurn;

      // 1. 이미 핸드(포획 동물)를 선택하고 보드 빈칸을 누른 경우 (Drop 실행)
      if (this.selectedCell && this.selectedCell.fromHand) {
        const dropMove = this.validMoves.find(m => m.action === 'drop' && m.to.x === x && m.to.y === y);
        if (dropMove) {
          this.executeMove(dropMove);
          return;
        } else {
          // 다른 빈칸이나 말을 누르면 선택 취소 후 재선택
          this.selectedCell = null;
          this.validMoves = [];
        }
      }

      // 2. 이미 보드 기물을 선택한 상태에서 목표 지점을 클릭한 경우 (Move 실행)
      if (this.selectedCell && !this.selectedCell.fromHand) {
        const boardMove = this.validMoves.find(m => m.action === 'move' && m.to.x === x && m.to.y === y);
        if (boardMove) {
          this.executeMove(boardMove);
          return;
        }
      }

      // 3. 새로 기물 선택
      const piece = this.rules.getPiece(x, y);
      if (piece && piece.owner === currentTurn) {
        this.selectedCell = { x, y, fromHand: false };
        this.validMoves = this.rules.getPieceMoves(x, y);
        AnimalAudio.playSelect();
      } else {
        // 빈칸 또는 상대 말을 누르면 선택 해제
        this.selectedCell = null;
        this.validMoves = [];
      }

      this.render();
      this.updateCapturedTrays();
    }

    // 핸드(잡은 동물) 선택 핸들러
    selectFromHand(player, pieceType, index) {
      if (this.rules.winner) return;
      if (this.rules.currentTurn !== player) return;
      if (this.isAIMode && player === PLAYER_2) return;

      if (this.selectedCell && this.selectedCell.fromHand && this.selectedCell.piece === pieceType && this.selectedCell.index === index) {
        // 재클릭 시 선택 해제
        this.selectedCell = null;
        this.validMoves = [];
      } else {
        this.selectedCell = { fromHand: true, piece: pieceType, index, player };
        // 가능한 모든 드롭 위치 계산
        const allLegal = this.rules.getLegalMoves(player);
        this.validMoves = allLegal.filter(m => m.action === 'drop' && m.piece === pieceType);
        AnimalAudio.playSelect();
      }

      this.render();
      this.updateCapturedTrays();
    }

    // 수 실행
    executeMove(move) {
      const isPromote = move.promoted;
      const isCapture = !!move.captured;
      const isDrop = move.action === 'drop';

      this.rules.applyMove(move);
      this.lastMove = move;
      this.selectedCell = null;
      this.validMoves = [];

      // 효과음 재생
      if (isPromote) {
        AnimalAudio.playPromote();
      } else if (isCapture) {
        AnimalAudio.playCapture();
      } else if (isDrop) {
        AnimalAudio.playDrop();
      } else {
        AnimalAudio.playMove();
      }

      this.updateUI();
      this.render();

      // 승패 확인
      if (this.rules.winner) {
        this.handleGameOver();
        return;
      }

      // AI 턴 처리
      if (this.isAIMode && this.rules.currentTurn === PLAYER_2) {
        this.triggerAIMove();
      }
    }

    // AI 자동 착수
    triggerAIMove() {
      // AI 생각 중 표시
      this.turnSub.textContent = '🤖 AI가 최선의 수를 고민하고 있습니다...';

      setTimeout(() => {
        if (this.rules.winner || this.rules.currentTurn !== PLAYER_2) return;

        const bestMove = this.ai.getBestMove(this.rules);
        if (bestMove) {
          this.executeMove(bestMove);
        }
      }, 550);
    }

    // 게임 종료 처리
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
        const winnerName = isP1Win ? '나 (카피바라)' : (this.isAIMode ? '상대 AI' : '플레이어 2');

        if (reason === 'catch') {
          title = isP1Win ? '🎉 사자 포획 승리!' : '😢 사자가 잡혔습니다!';
          desc = `${winnerName}님이 상대의 사자를 멋지게 잡았습니다! (Catch)`;
        } else if (reason === 'try') {
          title = isP1Win ? '👑 트라이 대승리!' : '🦁 상대의 트라이 성공!';
          desc = `${winnerName}님의 사자가 상대 진영에 당당히 입성하여 승리했습니다! (Try)`;
        }

        if (isP1Win) {
          AnimalAudio.playVictory();
        } else {
          AnimalAudio.playDefeat();
        }
      }

      this.resultTitle.textContent = title;
      this.resultDesc.textContent = desc;
      this.openResultModal();
    }

    // UI 상태 갱신
    updateUI() {
      const turn = this.rules.currentTurn;
      const isP1 = turn === PLAYER_1;

      // 턴 배너
      if (this.turnBanner) {
        this.turnBanner.className = `turn-center-banner ${isP1 ? 'p1' : 'p2'}`;
        this.turnTitle.textContent = isP1 ? '내 차례 — 초록(숲)' : (this.isAIMode ? '상대(AI) 차례 — 하늘' : '플레이어 2 차례 — 하늘');
        this.turnSub.textContent = isP1 ? '동물을 선택해 이동하거나 잡은 동물을 소환하세요' : '상대가 이동할 준비를 하고 있습니다';
      }

      // 플레이어 카드 활성화 상태
      if (this.p1Card) this.p1Card.classList.toggle('active', isP1);
      if (this.p2Card) this.p2Card.classList.toggle('active', !isP1);

      this.updateCapturedTrays();
    }

    // 잡은 동물(벤치) 트레이 갱신
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

      // 2. 격자선 및 테두리
      this.drawGridLines(ctx, colW, rowH);

      // 3. 직전 착수 하이라이트
      if (this.lastMove) {
        this.drawLastMoveHighlight(ctx, colW, rowH);
      }

      // 4. 기물 그리기 (3x4)
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const piece = this.rules.board[y][x];
          if (piece) {
            const isSelected = this.selectedCell && !this.selectedCell.fromHand &&
              this.selectedCell.x === x && this.selectedCell.y === y;
            this.drawAnimalPiece(ctx, x, y, piece, colW, rowH, isSelected);
          }
        }
      }

      // 5. 이동 가능한 위치 길잡이(가이드) 표시
      if (this.showGuide && this.validMoves.length > 0) {
        this.drawGuideMarkers(ctx, colW, rowH);
      }
    }

    // 배경 구역 (하늘: Row 0, 들판: Row 1~2, 숲: Row 3)
    drawBoardBackground(ctx, colW, rowH) {
      // Row 0: 하늘 구역 (상대 진영)
      const gradSky = ctx.createLinearGradient(0, 0, 0, rowH);
      gradSky.addColorStop(0, '#e0f2fe');
      gradSky.addColorStop(1, '#bae6fd');
      ctx.fillStyle = gradSky;
      ctx.fillRect(0, 0, CANVAS_W, rowH);

      // 하늘 구름 / 해 포인트 장식
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(CANVAS_W * 0.18, rowH * 0.45, 24, 0, Math.PI * 2);
      ctx.arc(CANVAS_W * 0.24, rowH * 0.4, 32, 0, Math.PI * 2);
      ctx.arc(CANVAS_W * 0.30, rowH * 0.45, 24, 0, Math.PI * 2);
      ctx.fill();

      // Row 1, 2: 들판 구역 (중립 평원)
      const gradMeadow = ctx.createLinearGradient(0, rowH, 0, rowH * 3);
      gradMeadow.addColorStop(0, '#fef9c3');
      gradMeadow.addColorStop(0.5, '#fef08a');
      gradMeadow.addColorStop(1, '#ecfccb');
      ctx.fillStyle = gradMeadow;
      ctx.fillRect(0, rowH, CANVAS_W, rowH * 2);

      // Row 3: 숲 구역 (내 진영)
      const gradForest = ctx.createLinearGradient(0, rowH * 3, 0, CANVAS_H);
      gradForest.addColorStop(0, '#dcfce7');
      gradForest.addColorStop(1, '#bbf7d0');
      ctx.fillStyle = gradForest;
      ctx.fillRect(0, rowH * 3, CANVAS_W, rowH);

      // 구역 레이블 워터마크 (부드럽고 방해되지 않게 중앙 하단에 미세하게 배치)
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

    // 격자선 및 보드 테두리
    drawGridLines(ctx, colW, rowH) {
      ctx.save();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';

      // 세로선
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * colW, 0);
        ctx.lineTo(c * colW, CANVAS_H);
        ctx.stroke();
      }

      // 가로선
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rowH);
        ctx.lineTo(CANVAS_W, r * rowH);
        ctx.stroke();
      }

      // 외곽 두꺼운 원목 테두리
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, CANVAS_W - 6, CANVAS_H - 6);
      ctx.restore();
    }

    // 직전 수 하이라이트
    drawLastMoveHighlight(ctx, colW, rowH) {
      ctx.save();
      const move = this.lastMove;
      if (move.action === 'move') {
        // 출발지
        ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
        ctx.fillRect(move.from.x * colW + 4, move.from.y * rowH + 4, colW - 8, rowH - 8);
      }
      // 도착지
      ctx.fillStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.fillRect(move.to.x * colW + 4, move.to.y * rowH + 4, colW - 8, rowH - 8);
      ctx.restore();
    }

    // 동물 나무 말(블록) 그리기
    drawAnimalPiece(ctx, x, y, piece, colW, rowH, isSelected) {
      const cx = x * colW + colW / 2;
      const cy = y * rowH + rowH / 2;
      const sizeW = colW * 0.82;
      const sizeH = rowH * 0.82;
      const isP1 = piece.owner === PLAYER_1;

      ctx.save();
      ctx.translate(cx, cy);

      // 상대방 말은 180도 회전하여 마주보는 효과
      if (!isP1) {
        ctx.rotate(Math.PI);
      }

      // 선택된 기물은 공중에 붕 뜨는 효과 (그림자 확대)
      const lift = isSelected ? 8 : 0;
      ctx.translate(0, -lift);

      // 그림자
      ctx.shadowColor = isSelected ? 'rgba(245, 158, 11, 0.45)' : 'rgba(0, 0, 0, 0.22)';
      ctx.shadowBlur = isSelected ? 22 : 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = isSelected ? 12 : 5;

      // 1. 따뜻한 원목 블록 바탕 (둥근 사각형)
      const rx = -sizeW / 2;
      const ry = -sizeH / 2;
      const radius = 18;

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

      // 원목 테두리 (팀별 색상: P1 초록, P2 파랑)
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = isSelected ? 4.5 : 3.5;
      ctx.strokeStyle = isSelected ? '#d97706' : (isP1 ? '#16a34a' : '#0284c7');
      ctx.stroke();

      // 2. 동물 얼굴 이모지 & 한글 이름
      const emoji = this.getPieceEmoji(piece.type);
      const name = this.getPieceName(piece.type);

      // 이모지 (동물 일러스트)
      ctx.font = '54px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 0, -6);

      // 기물 이름 (사자, 기린 등) - 플레이어가 읽기 편하게 항상 정방향으로 렌더링!
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

      // 3. ⭐ 핵심: 이동 방향 빨간 점 (Direction Dots) 그리기 ⭐
      this.drawDirectionDots(ctx, piece.type, sizeW, sizeH);

      ctx.restore();
    }

    // 이동 가능한 방향 빨간 점 (도부츠 쇼기 원본 스타일)
    drawDirectionDots(ctx, type, w, h) {
      const dirs = ANIMAL_MOVES[type] || [];
      const dotRadius = 5.5;
      const marginX = w * 0.42;
      const marginY = h * 0.42;

      ctx.fillStyle = '#dc2626'; // 선명한 루비 레드
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

    // 이동 가능 목표 지점 펄스 링 마커 (가이드)
    drawGuideMarkers(ctx, colW, rowH) {
      const time = performance.now() * 0.004;
      const pulse = Math.sin(time) * 2;

      for (const move of this.validMoves) {
        const cx = move.to.x * colW + colW / 2;
        const cy = move.to.y * rowH + rowH / 2;

        ctx.save();
        // 상대 기물이 있어 포획 가능한 경우: 빨강 타겟 링
        const targetPiece = this.rules.board[move.to.y][move.to.x];
        const isCapture = !!targetPiece;

        ctx.fillStyle = isCapture ? 'rgba(239, 68, 68, 0.32)' : 'rgba(34, 197, 94, 0.28)';
        ctx.fillRect(move.to.x * colW + 6, move.to.y * rowH + 6, colW - 12, rowH - 12);

        // 중앙 동심원 마커
        ctx.beginPath();
        ctx.arc(cx, cy, 14 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = isCapture ? '#ef4444' : '#22c55e';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

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

    // 모달 관리
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
