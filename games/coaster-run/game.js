/**
 * game.js - 바둑 롤러코스터 런 인터랙션 & HUD 게임 루프 컨트롤러
 */
(function(window) {
  'use strict';

  class CoasterGame {
    constructor() {
      this.currentProblemIndex = 0;
      this.lives = 3;
      this.score = 0;
      this.gameState = 'IDLE'; // 'IDLE' | 'RIDING' | 'GATE' | 'VICTORY' | 'GAMEOVER'

      // DOM 요소 캐시
      this.viewportEl = document.getElementById('coasterViewport');
      this.hudOverlay = document.getElementById('hudOverlay');
      this.speedValue = document.getElementById('speedValue');
      this.livesDisplay = document.getElementById('livesDisplay');
      this.gateBanner = document.getElementById('gateBanner');
      this.gateTitle = document.getElementById('gateTitle');
      this.gateMission = document.getElementById('gateMission');
      this.gateHint = document.getElementById('gateHint');

      // 바둑판 DOM & 캔버스
      this.boardModal = document.getElementById('boardModal');
      this.goCanvas = document.getElementById('goCanvas');
      this.goCtx = this.goCanvas.getContext('2d');

      // 모달 & 스타트 스크린
      this.startScreen = document.getElementById('startScreen');
      this.btnStart = document.getElementById('btnStart');
      this.victoryModal = document.getElementById('victoryModal');
      this.gameOverModal = document.getElementById('gameOverModal');

      // 3D 롤러코스터 인스턴스
      this.coaster = new Coaster3D(this.viewportEl, {
        onGateReached: (gateIndex) => this.onGateReached(gateIndex)
      });

      this.initEvents();
      this.initGoBoardEvents();
    }

    initEvents() {
      this.btnStart?.addEventListener('click', () => this.startGame());
      document.getElementById('btnRestart')?.addEventListener('click', () => this.restartGame());
      document.getElementById('btnRetry')?.addEventListener('click', () => this.restartGame());
      document.getElementById('btnToggleSound')?.addEventListener('click', () => {
        const enabled = CoasterAudio.toggleSound();
        document.getElementById('btnToggleSound').textContent = enabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      });
    }

    startGame() {
      this.startScreen.hidden = true;
      this.gameState = 'RIDING';
      this.lives = 3;
      this.currentProblemIndex = 0;
      this.score = 0;
      this.updateHUD();

      // 사운드 시동
      CoasterAudio.startWind();
      CoasterAudio.startLiftHill();

      // 속도계 HUD 루프 시작
      this.startSpeedometer();
    }

    restartGame() {
      this.victoryModal.hidden = true;
      this.gameOverModal.hidden = true;
      this.boardModal.hidden = true;
      this.startScreen.hidden = false;
      this.coaster.trackProgress = 0.0;
      this.coaster.isPausedAtGate = false;
      this.coaster.currentGateIndex = -1;
      this.coaster.gatePoints.forEach(g => g.solved = false);
      this.coaster.gateMeshes.forEach(m => {
        m.group.visible = true;
        m.group.scale.set(1, 1, 1);
        m.group.children.forEach(c => c.material.opacity = 0.7);
      });
      CoasterAudio.stopLiftHill();
      CoasterAudio.stopWind();
      this.gameState = 'IDLE';
    }

    // 게이트 도달 시 호출 (3D 엔진에서 콜백)
    onGateReached(gateIndex) {
      this.gameState = 'GATE';
      this.currentProblemIndex = gateIndex;

      // 브레이크 끼이익 사운드 & 리프트 체인 정지
      CoasterAudio.stopLiftHill();
      CoasterAudio.playBrakeScreech();

      // 현재 문제 데이터 로드
      const problem = COASTER_PROBLEMS[gateIndex];
      if (!problem) return;

      // 관문 안내 배너 표시
      this.gateBanner.hidden = false;
      this.gateTitle.textContent = problem.gateName;
      this.gateMission.textContent = problem.mission;
      this.gateHint.textContent = `💡 힌트: ${problem.hint}`;

      // 바둑판 팝업 표시 및 렌더링
      this.boardModal.hidden = false;
      this.renderGoBoard(problem);
    }

    // 5x5 바둑판 렌더링
    renderGoBoard(problem, userStones = []) {
      const ctx = this.goCtx;
      const size = 380;
      ctx.clearRect(0, 0, size, size);

      const gridCount = problem.boardSize; // 5
      const padding = 45;
      const cellSize = (size - padding * 2) / (gridCount - 1);

      // 1. 네온 미래형 바둑판 배경
      const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // 테두리 네온 글로우
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(6, 6, size - 12, size - 12);

      // 2. 격자선
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.0;

      for (let i = 0; i < gridCount; i++) {
        const pos = padding + i * cellSize;

        // 세로선
        ctx.beginPath();
        ctx.moveTo(pos, padding);
        ctx.lineTo(pos, size - padding);
        ctx.stroke();

        // 가로선
        ctx.beginPath();
        ctx.moveTo(padding, pos);
        ctx.lineTo(size - padding, pos);
        ctx.stroke();
      }

      // 화점 (가운데 1개)
      const mid = padding + 2 * cellSize;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(mid, mid, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. 문제 기본 돌 렌더링
      problem.stones.forEach(s => {
        const cx = padding + s.x * cellSize;
        const cy = padding + s.y * cellSize;
        this.drawStone(ctx, cx, cy, s.color, cellSize * 0.44);
      });

      // 4. 유저가 놓은 돌 렌더링
      userStones.forEach(s => {
        const cx = padding + s.x * cellSize;
        const cy = padding + s.y * cellSize;
        this.drawStone(ctx, cx, cy, s.color, cellSize * 0.44, true);
      });
    }

    drawStone(ctx, cx, cy, color, radius, isNew = false) {
      ctx.save();
      ctx.shadowColor = color === 'b' ? 'rgba(0, 220, 255, 0.4)' : 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = isNew ? 18 : 8;

      const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
      if (color === 'b') {
        grad.addColorStop(0, '#475569');
        grad.addColorStop(0.7, '#0f172a');
        grad.addColorStop(1, '#020617');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.7, '#e2e8f0');
        grad.addColorStop(1, '#94a3b8');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = color === 'b' ? '#38bdf8' : '#ffffff';
      ctx.stroke();
      ctx.restore();
    }

    // 바둑판 클릭 이벤트
    initGoBoardEvents() {
      this.goCanvas.addEventListener('click', (e) => {
        if (this.gameState !== 'GATE') return;

        const rect = this.goCanvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const problem = COASTER_PROBLEMS[this.currentProblemIndex];
        const padding = 45;
        const cellSize = (380 - padding * 2) / (problem.boardSize - 1);

        // 가장 가까운 교차점 계산
        const gridX = Math.round((clickX - padding) / cellSize);
        const gridY = Math.round((clickY - padding) / cellSize);

        if (gridX < 0 || gridX >= problem.boardSize || gridY < 0 || gridY >= problem.boardSize) return;

        // 이미 돌이 있는 곳은 클릭 무시
        const occupied = problem.stones.some(s => s.x === gridX && s.y === gridY);
        if (occupied) return;

        this.handleMoveAttempt(gridX, gridY, problem);
      });
    }

    // 착수 정답/오답 판정
    handleMoveAttempt(x, y, problem) {
      CoasterAudio.playStoneClack();

      const isCorrect = (x === problem.correct.x && y === problem.correct.y);

      if (isCorrect) {
        // 정답 착수 돌 표시
        this.renderGoBoard(problem, [{ x, y, color: 'b' }]);

        // 축하 텍스트
        this.gateMission.innerHTML = `<span style="color:#22c55e; font-weight:900;">🎉 정답! 게이트가 열립니다!</span> ${problem.gateActionName}`;

        setTimeout(() => {
          this.executeGateSuccess(problem);
        }, 600);
      } else {
        // 오답 처리
        CoasterAudio.playWrongAlarm();
        this.coaster.triggerWrong();
        this.lives--;
        this.updateHUD();

        this.gateMission.innerHTML = `<span style="color:#ef4444; font-weight:900;">⚠️ 앗, 거기가 아닙니다!</span> 다시 생각해보세요.`;

        if (this.lives <= 0) {
          setTimeout(() => this.handleGameOver(), 800);
        }
      }
    }

    // 정답 시: 롤러코스터 부스터 발사 & 낭떠러지 수직낙하!
    executeGateSuccess(problem) {
      // 바둑판 닫기
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.gameState = 'RIDING';

      // 1. 로켓 부스터 사운드 폭발
      CoasterAudio.playBoosterLaunch();

      // 2. 3D 엔진: 게이트 파괴 & 140km/h 초고속 수직 낙하 시작!
      this.coaster.resumeAfterSolve();
      this.coaster.gatePoints[this.currentProblemIndex].solved = true;

      this.score += 100;
      this.updateHUD();

      // 모든 관문 통과 체크 (제3관문 완료 시 골인)
      if (this.currentProblemIndex >= COASTER_PROBLEMS.length - 1) {
        setTimeout(() => {
          this.handleVictory();
        }, 6500); // 워프 터널 질주 후 승리 화면
      }
    }

    handleGameOver() {
      this.gameState = 'GAMEOVER';
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.gameOverModal.hidden = false;
      CoasterAudio.stopWind();
      CoasterAudio.stopLiftHill();
    }

    handleVictory() {
      this.gameState = 'VICTORY';
      this.victoryModal.hidden = false;
      document.getElementById('finalScore').textContent = `${this.score}점`;
      CoasterAudio.playVictory();
      CoasterAudio.stopWind();
    }

    startSpeedometer() {
      const updateSpeed = () => {
        if (this.gameState === 'RIDING') {
          // Three.js currentSpeed를 km/h(0~140)로 변환
          const speedKm = Math.round((this.coaster.currentSpeed / 0.0024) * 140);
          if (this.speedValue) this.speedValue.textContent = `${speedKm} km/h`;
        } else if (this.gameState === 'GATE') {
          if (this.speedValue) this.speedValue.textContent = '0 km/h (정지)';
        }
        requestAnimationFrame(updateSpeed);
      };
      requestAnimationFrame(updateSpeed);
    }

    updateHUD() {
      if (this.livesDisplay) {
        this.livesDisplay.textContent = '❤️'.repeat(Math.max(this.lives, 0));
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.coasterGame = new CoasterGame();
  });
})(window);
