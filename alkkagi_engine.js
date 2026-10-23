// =========================================================================
// JH 바둑스쿨 - 🥏 알까기 배틀 물리 엔진 (Alkkagi Physics & AI Engine)
// 1. 2D 탄성 충돌 & 운동량 보존 법칙 (Elastic Collision)
// 2. 바둑판 마찰력 감속 시뮬레이션 (Friction & Rolling)
// 3. 외곽 낙하 탈락(Ring Out) 판정 & 다중 연쇄 충돌 효과음
// 4. 슬링샷(드래그 & 파워 게이지) 조준 시스템
// 5. 스마트 인공지능 (AI 상대돌 조준 & 밀어내기 샷)
// =========================================================================

class AlkkagiEngine {
  constructor(app) {
    this.app = app;
    this.canvas = app.canvas;
    this.ctx = app.ctx;

    // 게임 모드: 'ai' | 'pvp'
    this.mode = 'ai';
    let savedDiff = 'normal';
    try {
      const s = localStorage.getItem('jh_alkkagi_difficulty');
      if (s && ['easy', 'normal', 'hard', 'master'].includes(s)) savedDiff = s;
    } catch(e) {}
    this.difficulty = savedDiff; // 'easy' | 'normal' | 'hard' | 'master'
    this.playerColor = 1; // 1: 흑돌, 2: 백돌
    this.formation = 'line5'; // 'line5' | 'vshape' | 'corners'

    // 물리 파라미터
    this.friction = 0.982; // 매 프레임 감속 계수 (원목 바둑판 마찰력)
    this.minSpeed = 0.08; // 이 속도 이하가 되면 정지
    this.maxPower = 28; // 최대 발사 속도
    this.elasticity = 0.94; // 돌 간 반발 계수

    // 돌 데이터 목록: [{ id, color, x, y, vx, vy, radius, alive, falling, fallScale }]
    this.stones = [];
    this.currentTurn = 1; // 1: 흑돌 선공, 2: 백돌
    this.turnCount = 1;

    // 인터랙션 (드래그 조준)
    this.dragStone = null;
    this.dragStart = null;
    this.dragCurrent = null;
    this.isSimulating = false; // 돌들이 이동 중인지 여부
    this.gameOver = false;
    this.winner = null;

    // AI 조준 상태
    this.isAiThinking = false;

    // 애니메이션 프레임 ID
    this.animId = null;

    // 마지막 충돌 사운드 쓰로틀링 (동시 다발 충돌 시 찢어짐 방지)
    this.lastSoundTime = 0;
  }

  // 바둑판 경기장 경계선 (픽셀 단위)
  getArenaBounds() {
    const size = this.app.displaySize;
    const cellSize = this.app.cellSize;
    // 바둑판 격자 외곽선 기준
    const minX = cellSize;
    const minY = cellSize;
    const maxX = cellSize * this.app.size;
    const maxY = cellSize * this.app.size;
    return { minX, minY, maxX, maxY };
  }

  // 새로운 알까기 경기 시작
  initGame() {
    const cellSize = this.app.cellSize;
    const boardGridSize = this.app.size; // 19줄 바둑판 기본
    const r = cellSize * 0.44; // 바둑돌 반지름

    this.stones = [];
    this.currentTurn = 1; // 흑돌 선공
    this.turnCount = 1;
    this.gameOver = false;
    this.winner = null;
    this.dragStone = null;
    this.isSimulating = false;
    this.isAiThinking = false;

    // 진형 배치 (진형에 따라 흑돌은 하단/백돌은 상단)
    const bounds = this.getArenaBounds();
    const boardWidth = bounds.maxX - bounds.minX;
    const boardHeight = bounds.maxY - bounds.minY;

    if (this.formation === 'line5') {
      // 5개씩 일자 진형
      const count = 5;
      const stepX = boardWidth / (count + 1);

      // 백돌 (상단 4번째 줄 근처)
      const whiteY = bounds.minY + cellSize * 3;
      for (let i = 1; i <= count; i++) {
        this.stones.push({
          id: `w_${i}`,
          color: 2,
          x: bounds.minX + stepX * i,
          y: whiteY,
          vx: 0,
          vy: 0,
          radius: r,
          alive: true,
          falling: false,
          fallScale: 1.0
        });
      }

      // 흑돌 (하단 4번째 줄 근처)
      const blackY = bounds.maxY - cellSize * 3;
      for (let i = 1; i <= count; i++) {
        this.stones.push({
          id: `b_${i}`,
          color: 1,
          x: bounds.minX + stepX * i,
          y: blackY,
          vx: 0,
          vy: 0,
          radius: r,
          alive: true,
          falling: false,
          fallScale: 1.0
        });
      }
    } else if (this.formation === 'vshape') {
      // V자 진형 (공격형 진형 5개)
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const offsets = [
        { dx: 0, dy: 0 },
        { dx: -cellSize * 2.5, dy: -cellSize * 1.5 },
        { dx: cellSize * 2.5, dy: -cellSize * 1.5 },
        { dx: -cellSize * 5, dy: -cellSize * 3 },
        { dx: cellSize * 5, dy: -cellSize * 3 }
      ];

      // 백돌
      const wy = bounds.minY + cellSize * 4.5;
      offsets.forEach((o, i) => {
        this.stones.push({
          id: `w_${i+1}`,
          color: 2,
          x: centerX + o.dx,
          y: wy - o.dy,
          vx: 0, vy: 0,
          radius: r, alive: true, falling: false, fallScale: 1.0
        });
      });

      // 흑돌
      const by = bounds.maxY - cellSize * 4.5;
      offsets.forEach((o, i) => {
        this.stones.push({
          id: `b_${i+1}`,
          color: 1,
          x: centerX + o.dx,
          y: by + o.dy,
          vx: 0, vy: 0,
          radius: r, alive: true, falling: false, fallScale: 1.0
        });
      });
    } else {
      // 7개 대전 진형 (대규모 7 vs 7)
      const count = 7;
      const stepX = boardWidth / (count + 1);
      const whiteY = bounds.minY + cellSize * 3;
      const blackY = bounds.maxY - cellSize * 3;

      for (let i = 1; i <= count; i++) {
        this.stones.push({
          id: `w_${i}`, color: 2,
          x: bounds.minX + stepX * i, y: whiteY,
          vx: 0, vy: 0, radius: r, alive: true, falling: false, fallScale: 1.0
        });
        this.stones.push({
          id: `b_${i}`, color: 1,
          x: bounds.minX + stepX * i, y: blackY,
          vx: 0, vy: 0, radius: r, alive: true, falling: false, fallScale: 1.0
        });
      }
    }

    this.updateUI();
    this.render();

    // AI 모드이고 플레이어가 백돌이면 AI(흑돌)가 첫 턴 발사
    if (this.mode === 'ai' && this.playerColor === 2 && this.currentTurn === 1) {
      setTimeout(() => this.triggerAiShot(), 800);
    }
  }

  // 마우스/터치 시작: 날릴 돌 선택
  handlePointerDown(px, py) {
    if (this.gameOver || this.isSimulating || this.isAiThinking) return;

    // AI 모드일 때 내 차례가 아니면 터치 불가
    if (this.mode === 'ai' && this.currentTurn !== this.playerColor) return;

    // 클릭한 위치에 있는 내 차례의 돌 찾기 (여유로운 히트박스 제공)
    const clickedStone = this.stones.find(s => {
      if (!s.alive || s.falling) return false;
      if (s.color !== this.currentTurn) return false;
      const dist = Math.hypot(s.x - px, s.y - py);
      return dist <= Math.max(s.radius * 1.8, 32); // 클릭/터치 판정 여유 범위 대폭 확대
    });

    if (clickedStone) {
      this.dragStone = clickedStone;
      this.dragStart = { x: px, y: py };
      this.dragCurrent = { x: px, y: py };
      this.render();
    }
  }

  // 마우스/터치 이동: 슬링샷 조준선 갱신 및 커서 모양 변경
  handlePointerMove(px, py) {
    if (this.dragStone) {
      this.dragCurrent = { x: px, y: py };
      this.canvas.style.cursor = 'crosshair';
      this.render();
      return;
    }

    // 마우스 올렸을 때 내 돌이면 커서 모양을 잡기(grab)로 변경
    if (!this.isSimulating && !this.isAiThinking && (!this.mode === 'ai' || this.currentTurn === this.playerColor)) {
      const hoverStone = this.stones.find(s => {
        if (!s.alive || s.falling || s.color !== this.currentTurn) return false;
        return Math.hypot(s.x - px, s.y - py) <= Math.max(s.radius * 1.8, 32);
      });
      this.canvas.style.cursor = hoverStone ? 'grab' : 'default';
    }
  }

  // 마우스/터치 놓기: 알 발사!
  handlePointerUp() {
    if (!this.dragStone || !this.dragCurrent || !this.dragStart) {
      this.dragStone = null;
      this.dragStart = null;
      this.dragCurrent = null;
      return;
    }

    const dx = this.dragStart.x - this.dragCurrent.x;
    const dy = this.dragStart.y - this.dragCurrent.y;
    const pullDist = Math.hypot(dx, dy);

    // 너무 살짝 터치한 경우 취소
    if (pullDist < 8) {
      this.dragStone = null;
      this.dragStart = null;
      this.dragCurrent = null;
      this.render();
      return;
    }

    // 파워 계산 (최대 160px 당김을 maxPower로 스케일링)
    const powerRatio = Math.min(pullDist / 150, 1.0);
    const speed = powerRatio * this.maxPower;
    const angle = Math.atan2(dy, dx);

    this.dragStone.vx = Math.cos(angle) * speed;
    this.dragStone.vy = Math.sin(angle) * speed;

    // 발사 사운드
    if (window.badukAudio) window.badukAudio.playStone();

    this.dragStone = null;
    this.dragStart = null;
    this.dragCurrent = null;

    this.startPhysicsSimulation();
  }

  // 물리 시뮬레이션 루프 시작 (60FPS requestAnimationFrame)
  startPhysicsSimulation() {
    this.isSimulating = true;

    const simulateStep = () => {
      const isStillMoving = this.updatePhysics();
      this.render();

      if (isStillMoving) {
        this.animId = requestAnimationFrame(simulateStep);
      } else {
        // 모든 돌이 정지 완료됨 -> 턴 정리 및 승패 판정
        this.isSimulating = false;
        this.finishTurn();
      }
    };

    if (this.animId) cancelAnimationFrame(this.animId);
    this.animId = requestAnimationFrame(simulateStep);
  }

  // 1 프레임 물리 엔진 갱신
  updatePhysics() {
    const bounds = this.getArenaBounds();
    let hasMotion = false;

    // 1. 돌 위치 이동 및 감속
    for (const stone of this.stones) {
      if (!stone.alive) continue;

      if (stone.falling) {
        // 판 밖으로 떨어지는 애니메이션 (크기 축소 및 투명화)
        stone.fallScale -= 0.055;
        hasMotion = true;
        if (stone.fallScale <= 0.1) {
          stone.alive = false;
          stone.falling = false;
        }
        continue;
      }

      // 속도가 있으면 이동
      if (Math.abs(stone.vx) > 0.001 || Math.abs(stone.vy) > 0.001) {
        stone.x += stone.vx;
        stone.y += stone.vy;
        stone.vx *= this.friction;
        stone.vy *= this.friction;

        if (Math.hypot(stone.vx, stone.vy) < this.minSpeed) {
          stone.vx = 0;
          stone.vy = 0;
        } else {
          hasMotion = true;
        }

        // 바둑판 밖으로 나갔는지 판정 (중심이 외곽선을 벗어나면 낙하)
        const margin = stone.radius * 0.45;
        if (
          stone.x < bounds.minX - margin ||
          stone.x > bounds.maxX + margin ||
          stone.y < bounds.minY - margin ||
          stone.y > bounds.maxY + margin
        ) {
          stone.falling = true;
          hasMotion = true;
          // 낙하 탈락 효과음
          if (window.badukAudio) window.badukAudio.playDdang();
        }
      }
    }

    // 2. 돌 간 2D 탄성 충돌 검사 (모든 쌍 비교)
    for (let i = 0; i < this.stones.length; i++) {
      const s1 = this.stones[i];
      if (!s1.alive || s1.falling) continue;

      for (let j = i + 1; j < this.stones.length; j++) {
        const s2 = this.stones[j];
        if (!s2.alive || s2.falling) continue;

        const dx = s2.x - s1.x;
        const dy = s2.y - s1.y;
        const dist = Math.hypot(dx, dy);
        const minDist = s1.radius + s2.radius;

        if (dist < minDist && dist > 0) {
          // 충돌 발생!
          hasMotion = true;

          // 겹침 보정 (Overlap Resolution)
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;

          s1.x -= nx * overlap;
          s1.y -= ny * overlap;
          s2.x += nx * overlap;
          s2.y += ny * overlap;

          // 상대 속도 계산
          const kx = s1.vx - s2.vx;
          const ky = s1.vy - s2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2; // 질량이 같으므로 m1=m2

          // 탄성 충돌 속도 교환
          s1.vx -= p * nx * this.elasticity;
          s1.vy -= p * ny * this.elasticity;
          s2.vx += p * nx * this.elasticity;
          s2.vy += p * ny * this.elasticity;

          // 충돌 타격음 재생
          const now = Date.now();
          if (now - this.lastSoundTime > 65) {
            this.lastSoundTime = now;
            if (window.badukAudio) window.badukAudio.playStone();
          }
        }
      }
    }

    return hasMotion;
  }

  // 한 턴의 모든 물리 이동 종료 시
  finishTurn() {
    // 살아있는 돌 카운트
    const blackAlive = this.stones.filter(s => s.alive && s.color === 1).length;
    const whiteAlive = this.stones.filter(s => s.alive && s.color === 2).length;

    this.updateUI();

    // 승패 판정
    if (blackAlive === 0 && whiteAlive === 0) {
      this.gameOver = true;
      this.winner = 0; // 무승부 (동시 탈락)
      if (window.badukAudio) window.badukAudio.playSuccess();
      setTimeout(() => alert('🤝 양쪽 돌이 동시에 모두 떨어져 무승부입니다!'), 300);
      this.render();
      return;
    } else if (blackAlive === 0) {
      this.gameOver = true;
      this.winner = 2; // 백돌 승리
      if (window.badukAudio) window.badukAudio.playSuccess();
      const winName = (this.mode === 'ai' && this.playerColor === 1) ? '🤖 AI(백돌)' : '⚪ 백돌';
      setTimeout(() => alert(`🎉 축하합니다! ${winName}이 승리했습니다! 🏆`), 300);
      this.render();
      return;
    } else if (whiteAlive === 0) {
      this.gameOver = true;
      this.winner = 1; // 흑돌 승리
      if (window.badukAudio) window.badukAudio.playSuccess();
      const winName = (this.mode === 'ai' && this.playerColor === 2) ? '🤖 AI(흑돌)' : '⚫ 흑돌';
      setTimeout(() => alert(`🎉 축하합니다! ${winName}이 승리했습니다! 🏆`), 300);
      this.render();
      return;
    }

    // 턴 교체
    this.currentTurn = (this.currentTurn === 1) ? 2 : 1;
    this.turnCount++;
    this.updateUI();
    this.render();

    // AI 차례인 경우 AI 발사 실행
    if (this.mode === 'ai' && this.currentTurn !== this.playerColor && !this.gameOver) {
      this.triggerAiShot();
    }
  }

  // 🤖 인공지능 발사 계산 및 실행 (인간처럼 조준선을 보여주고 쏘도록 개선)
  triggerAiShot() {
    this.isAiThinking = true;
    this.updateUI();

    // 1. AI 수읽기 대기 (1초)
    setTimeout(() => {
      if (this.gameOver || !this.app.isAlkkagiMode) {
        this.isAiThinking = false;
        return;
      }

      const aiColor = this.currentTurn;
      const oppColor = (aiColor === 1) ? 2 : 1;

      const myStones = this.stones.filter(s => s.alive && s.color === aiColor);
      const oppStones = this.stones.filter(s => s.alive && s.color === oppColor);

      if (myStones.length === 0 || oppStones.length === 0) {
        this.isAiThinking = false;
        return;
      }

      // AI 전략: 난이도별 최적 타겟 계산
      const bounds = this.getArenaBounds();
      let bestPair = null;
      let bestScore = -Infinity;

      for (const my of myStones) {
        for (const opp of oppStones) {
          const dist = Math.hypot(opp.x - my.x, opp.y - my.y);
          if (dist < 1) continue;

          // 기본 점수: 가까울수록 고득점
          let score = 1000 - dist;

          if (this.difficulty === 'master' || this.difficulty === 'hard') {
            // 외곽에 몰린 상대 돌일수록 떨어뜨리기 쉬우므로 가산점
            const oppMarginX = Math.min(opp.x - bounds.minX, bounds.maxX - opp.x);
            const oppMarginY = Math.min(opp.y - bounds.minY, bounds.maxY - opp.y);
            const oppEdgeMargin = Math.min(oppMarginX, oppMarginY);
            score += Math.max(0, (150 - oppEdgeMargin) * 3.5);

            // 마스터: 내 돌이 위험한 외곽에 있으면 발사 반동으로 인한 자폭 방지
            if (this.difficulty === 'master') {
              const myMarginX = Math.min(my.x - bounds.minX, bounds.maxX - my.x);
              const myMarginY = Math.min(my.y - bounds.minY, bounds.maxY - my.y);
              const myEdgeMargin = Math.min(myMarginX, myMarginY);
              if (myEdgeMargin < 30) score -= 250;
            }
          }

          if (score > bestScore) {
            bestScore = score;
            bestPair = { shooter: my, target: opp, dist };
          }
        }
      }

      if (bestPair) {
        const { shooter, target, dist } = bestPair;
        let angle = Math.atan2(target.y - shooter.y, target.x - shooter.x);

        // 4단계별 물리 정밀도 및 파워 조절
        let powerRatio = Math.min((dist + 75) / 250, 1.0);
        if (this.difficulty === 'easy') {
          // 초급: 큰 조준 오차(약 +-16도), 파워 변동 -> 아이들이 신나게 이김
          angle += (Math.random() - 0.5) * 0.28;
          powerRatio *= (0.55 + Math.random() * 0.45);
        } else if (this.difficulty === 'normal') {
          // 중급: 표준 조준 오차(약 +-5.7도), 안정적 파워
          angle += (Math.random() - 0.5) * 0.10;
          powerRatio = Math.max(powerRatio, 0.70);
        } else if (this.difficulty === 'hard') {
          // 고급: 정밀 조준(약 +-2도), 강력한 넉아웃 파워
          angle += (Math.random() - 0.5) * 0.035;
          powerRatio = Math.min(Math.max(powerRatio * 1.15, 0.85), 1.0);
        } else {
          // 👑 마스터: 초정밀 스나이퍼 조준(약 +-0.3도), 100% 명중 풀파워 강타
          angle += (Math.random() - 0.5) * 0.006;
          powerRatio = Math.min(Math.max(powerRatio * 1.30, 0.95), 1.0);
        }

        // 2. AI 조준선 시각 피드백 (플레이어가 볼 수 있게 조준 화살표 표시)
        this.aiAimPreview = {
          stone: shooter,
          angle: angle,
          length: 25 + powerRatio * 110
        };
        this.render();

        // 3. 조준선 보여준 뒤 600ms 후 실제 발사
        setTimeout(() => {
          this.aiAimPreview = null;
          const speed = Math.min(powerRatio * this.maxPower, this.maxPower);
          shooter.vx = Math.cos(angle) * speed;
          shooter.vy = Math.sin(angle) * speed;

          if (window.badukAudio) window.badukAudio.playStone();

          this.isAiThinking = false;
          this.startPhysicsSimulation();
        }, 700);

      } else {
        this.isAiThinking = false;
      }
    }, 900);
  }

  // 렌더링 루프 (바둑판 바탕 위에 알까기 돌 및 슬링샷 가이드 렌더링)
  render() {
    if (!this.app.isAlkkagiMode) return;

    // 바둑판 기본 판 먼저 렌더링
    this.app.renderBoardGridOnly();

    const ctx = this.ctx;
    const bounds = this.getArenaBounds();

    // 1. 알까기 장외 경계선 안내 강조 (테두리에 원목 링 안전선)
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(bounds.minX, bounds.minY, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
    ctx.restore();

    // 2. 살아있는 돌 렌더링
    for (const s of this.stones) {
      if (!s.alive) continue;

      ctx.save();
      const currentRadius = s.radius * (s.falling ? s.fallScale : 1.0);

      // 턴인 돌은 부드러운 오라 링 강조
      if (!this.isSimulating && s.color === this.currentTurn && !s.falling) {
        ctx.strokeStyle = (s.color === 1) ? 'rgba(59, 130, 246, 0.75)' : 'rgba(245, 158, 11, 0.8)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, currentRadius + 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 캐릭터 바둑돌 그리기
      this.app.drawCharacterStone(s.x, s.y, currentRadius, s.color, false, null);
      ctx.restore();
    }

    // 3. 슬링샷 조준 가이드 (화살표 & 파워 게이지 궤적)
    if (this.dragStone && this.dragStart && this.dragCurrent) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 6) {
        const powerRatio = Math.min(pullDist / 150, 1.0);
        const aimAngle = Math.atan2(dy, dx);
        const aimLength = 25 + powerRatio * 110;

        const targetX = this.dragStone.x + Math.cos(aimAngle) * aimLength;
        const targetY = this.dragStone.y + Math.sin(aimAngle) * aimLength;

        ctx.save();

        // 파워에 따른 색상 (초록 -> 노랑 -> 빨강)
        let strokeColor = '#22c55e';
        if (powerRatio > 0.75) strokeColor = '#ef4444';
        else if (powerRatio > 0.4) strokeColor = '#f59e0b';

        // 궤적 점선
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5 + powerRatio * 2;
        ctx.lineCap = 'round';
        ctx.setLineDash([6, 5]);

        ctx.beginPath();
        ctx.moveTo(this.dragStone.x, this.dragStone.y);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        // 조준 화살촉
        ctx.setLineDash([]);
        const headLen = 14 + powerRatio * 6;
        const headAngle = 0.45;

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(targetX, targetY);
        ctx.lineTo(
          targetX - headLen * Math.cos(aimAngle - headAngle),
          targetY - headLen * Math.sin(aimAngle - headAngle)
        );
        ctx.lineTo(
          targetX - headLen * Math.cos(aimAngle + headAngle),
          targetY - headLen * Math.sin(aimAngle + headAngle)
        );
        ctx.closePath();
        ctx.fill();

        // 드래그 고무줄 선 (반대 방향)
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.dragStone.x, this.dragStone.y);
        ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
        ctx.stroke();

        ctx.restore();
      }
    }

    // 4. AI 조준선 프리뷰 렌더링 (AI 차례일 때 상대 조준선 시각 표시)
    if (this.aiAimPreview && this.aiAimPreview.stone) {
      const p = this.aiAimPreview;
      const targetX = p.stone.x + Math.cos(p.angle) * p.length;
      const targetY = p.stone.y + Math.sin(p.angle) * p.length;

      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.moveTo(p.stone.x, p.stone.y);
      ctx.lineTo(targetX, targetY);
      ctx.stroke();

      ctx.setLineDash([]);
      const headLen = 15;
      const headAngle = 0.45;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(targetX, targetY);
      ctx.lineTo(
        targetX - headLen * Math.cos(p.angle - headAngle),
        targetY - headLen * Math.sin(p.angle - headAngle)
      );
      ctx.lineTo(
        targetX - headLen * Math.cos(p.angle + headAngle),
        targetY - headLen * Math.sin(p.angle + headAngle)
      );
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 사이드 패널 UI 상태 갱신
  updateUI() {
    const blackAlive = this.stones.filter(s => s.alive && s.color === 1).length;
    const whiteAlive = this.stones.filter(s => s.alive && s.color === 2).length;

    const bCountEl = document.getElementById('alkkagiBlackCount');
    const wCountEl = document.getElementById('alkkagiWhiteCount');
    const turnTextEl = document.getElementById('alkkagiTurnText');
    const turnDotEl = document.getElementById('alkkagiTurnDot');
    const stepEl = document.getElementById('alkkagiTurnCounter');

    if (bCountEl) bCountEl.textContent = `${blackAlive}개`;
    if (wCountEl) wCountEl.textContent = `${whiteAlive}개`;
    if (stepEl) stepEl.textContent = `${this.turnCount}턴`;

    if (turnTextEl) {
      if (this.gameOver) {
        turnTextEl.textContent = "🏆 게임 종료!";
      } else if (this.isAiThinking) {
        turnTextEl.textContent = "🤖 AI가 조준 중입니다...";
      } else {
        const turnName = (this.currentTurn === 1) ? "⚫ 흑돌 차례입니다" : "⚪ 백돌 차례입니다";
        turnTextEl.textContent = turnName;
      }
    }

    if (turnDotEl) {
      turnDotEl.classList.toggle('waiting', this.isAiThinking);
    }
  }
}

window.AlkkagiEngine = AlkkagiEngine;
