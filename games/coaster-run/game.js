/**
 * game.js - 바둑 롤러코스터 런 (2안 서행 & 커스텀 주행 모드 엔진)
 * 1인칭 콕핏 HUD, 다이내믹 타이머, 서행 주행 중 문제 풀이, 재가속 로직
 */
(function(window) {
  'use strict';

  class CoasterGame {
    constructor() {
      // 주행 설정 (기본값)
      this.timeLimit = 10;     // 초 단위: 5, 10, 20, 0 (0은 무제한)
      this.failureLimit = 3;  // 탈락 조건: 1, 3, 0 (0은 무제한)
      this.loadSettings();

      this.currentProblemIndex = 0;
      this.lives = this.failureLimit === 0 ? 999 : this.failureLimit;
      this.score = 0;
      this.gameState = 'IDLE'; // 'IDLE' | 'RIDING' | 'GATE' | 'VICTORY' | 'GAMEOVER'

      // 타이머 제어 변수
      this.timerInterval = null;
      this.remainingTime = 0;

      // DOM 캐시
      this.viewportEl = document.getElementById('coasterViewport');
      this.hudOverlay = document.getElementById('hudOverlay');
      this.speedValue = document.getElementById('speedValue');
      this.speedModeTag = document.getElementById('speedModeTag');
      this.livesDisplay = document.getElementById('livesDisplay');
      this.gateBanner = document.getElementById('gateBanner');
      this.gateTitle = document.getElementById('gateTitle');
      this.gateMission = document.getElementById('gateMission');
      this.gateHint = document.getElementById('gateHint');

      // 바둑판 DOM & 윈드실드 HUD
      this.boardModal = document.getElementById('boardModal');
      this.goCanvas = document.getElementById('goCanvas');
      this.goCtx = this.goCanvas.getContext('2d');
      this.hudGateTag = document.getElementById('hudGateTag');
      this.hudTimerBadge = document.getElementById('hudTimerBadge');
      this.timerNumber = document.getElementById('timerNumber');
      this.timerBarFill = document.getElementById('timerBarFill');
      this.hudBoardPrompt = document.getElementById('hudBoardPrompt');
      this.hudFooterGuide = document.getElementById('hudFooterGuide');

      // 모달 & 스타트 스크린
      this.startScreen = document.getElementById('startScreen');
      this.btnStart = document.getElementById('btnStart');
      this.victoryModal = document.getElementById('victoryModal');
      this.gameOverModal = document.getElementById('gameOverModal');
      this.settingsModal = document.getElementById('settingsModal');
      this.startConfigSummary = document.getElementById('startConfigSummary');

      // 초기 진입 시 모달 상태 확실하게 정리 (스타트 화면 표시, 완주/오버 모달 숨김)
      if (this.startScreen) this.startScreen.hidden = false;
      if (this.victoryModal) this.victoryModal.hidden = true;
      if (this.gameOverModal) this.gameOverModal.hidden = true;
      if (this.boardModal) this.boardModal.hidden = true;
      if (this.gateBanner) this.gateBanner.hidden = true;

      // 100% 순수 3D WebGL 모드 (빙하 / 마그마 / 우주)
      this.videoEl = null;
      this.videoCoaster = null;

      // WebGL 3D 은하계 우주 롤러코스터 엔진 인스턴스 생성 (3코스)
      this.spaceCanvas = document.getElementById('spaceCanvas');
      if (window.SpaceCoasterEngine && this.spaceCanvas) {
        this.spaceCoaster = new SpaceCoasterEngine(this.spaceCanvas, {
          onGate: (gate, gateIndex) => this.onGateReached(gateIndex),
          onFinish: () => this.handleVictory(),
          onShake: (intensity) => {
            const viewport = document.getElementById('coasterViewport');
            if (viewport) {
              viewport.style.transform = `translate(${(Math.random()-0.5)*12*intensity}px, ${(Math.random()-0.5)*12*intensity}px)`;
              setTimeout(() => { viewport.style.transform = ''; }, 200);
            }
          }
        });
      } else {
        this.spaceCoaster = null;
      }

      // WebGL 3D 마그마 화산 롤러코스터 엔진 인스턴스 생성 (5코스)
      this.magmaCanvas = document.getElementById('magmaCanvas');
      if (window.MagmaCoasterEngine && this.magmaCanvas) {
        this.magmaCoaster = new MagmaCoasterEngine(this.magmaCanvas, {
          onGate: (gate, gateIndex) => this.onGateReached(gateIndex),
          onFinish: () => this.handleVictory(),
          onShake: (intensity) => {
            const viewport = document.getElementById('coasterViewport');
            if (viewport) {
              viewport.style.transform = `translate(${(Math.random()-0.5)*15*intensity}px, ${(Math.random()-0.5)*15*intensity}px)`;
              setTimeout(() => { viewport.style.transform = ''; }, 200);
            }
          }
        });
      } else {
        this.magmaCoaster = null;
      }

      // 현재 활성화된 엔진 (기본: 비디오 엔진)
      this.coaster = this.magmaCoaster;

      // 코스 데이터 초기화
      this.currentCourseId = 'space';
      this.currentCourse = window.COASTER_COURSES?.space || null;

      this.initEvents();
      this.initSettingsEvents();
      this.initGoBoardEvents();
      this.updateConfigSummary();
      if (this.currentCourse) this.selectCourse('space');
    }

    selectCourse(courseId) {
      const course = window.COASTER_COURSES?.[courseId];
      if (!course) return;
      this.currentCourseId = courseId;
      this.currentCourse = course;

      // 100% 순수 3D WebGL 엔진 모드 전환: 1코스(글래시어), 2코스(마그마), 3코스(원조 우주런), 4코스(1분 사활 우주런)
      if (courseId === 'glacier' && this.magmaCoaster) {
        if (this.spaceCanvas) this.spaceCanvas.style.display = 'none';
        if (this.magmaCanvas) this.magmaCanvas.style.display = 'block';
        this.magmaCoaster.setTheme('glacier');
        this.coaster = this.magmaCoaster;
      } else if (courseId === 'magma' && this.magmaCoaster) {
        if (this.spaceCanvas) this.spaceCanvas.style.display = 'none';
        if (this.magmaCanvas) this.magmaCanvas.style.display = 'block';
        this.magmaCoaster.setTheme('magma');
        this.coaster = this.magmaCoaster;
      } else if ((courseId === 'space' || courseId === 'space_epic') && this.spaceCoaster) {
        if (this.magmaCanvas) this.magmaCanvas.style.display = 'none';
        if (this.spaceCanvas) this.spaceCanvas.style.display = 'block';
        this.coaster = this.spaceCoaster;
      } else if (this.magmaCoaster) {
        if (this.spaceCanvas) this.spaceCanvas.style.display = 'none';
        if (this.magmaCanvas) this.magmaCanvas.style.display = 'block';
        this.magmaCoaster.setTheme('glacier');
        this.coaster = this.magmaCoaster;
      }

      this.coaster.setCourse(course);

      document.querySelectorAll('#courseCardGrid .course-card').forEach(card => {
        card.classList.toggle('active', card.getAttribute('data-course') === courseId);
      });

      const badge = document.getElementById('currentCourseBadge');
      if (badge) {
        let label = '1코스';
        if (courseId === 'glacier') label = '1코스';
        if (courseId === 'magma') label = '2코스';
        if (courseId === 'space') label = '3코스';
        if (courseId === 'space_epic') label = '4코스';
        badge.textContent = `선택됨: ${label}`;
      }

      const hudCourseTag = document.getElementById('hudCourseTag');
      if (hudCourseTag) {
        let hudText = '❄️ 1코스 글래시어';
        if (courseId === 'glacier') hudText = '❄️ 1코스 글래시어';
        if (courseId === 'magma') hudText = '🔥 2코스 마그마';
        if (courseId === 'space') hudText = '🌌 3코스 심우주';
        if (courseId === 'space_epic') hudText = '🚀 4코스 1분 사활';
        hudCourseTag.textContent = hudText;
      }

      if (this.btnStart) {
        let btnTheme = 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)';
        let btnShadow = 'rgba(56, 189, 248, 0.6)';
        if (courseId === 'glacier') {
          btnTheme = 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)';
          btnShadow = 'rgba(56, 189, 248, 0.6)';
        } else if (courseId === 'magma') {
          btnTheme = 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)';
          btnShadow = 'rgba(249, 115, 22, 0.6)';
        } else if (courseId === 'space') {
          btnTheme = 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)';
          btnShadow = 'rgba(168, 85, 247, 0.5)';
        } else if (courseId === 'space_epic') {
          btnTheme = 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)';
          btnShadow = 'rgba(245, 158, 11, 0.6)';
        }
        this.btnStart.style.background = btnTheme;
        this.btnStart.style.boxShadow = `0 10px 30px ${btnShadow}`;
        const cleanTitle = course.title.replace(/제\d코스:\s*/, '');
        this.btnStart.innerHTML = `🚀 <b>${cleanTitle}</b> 탑승 출발!`;
      }

      const featureList = document.getElementById('courseFeatureList');
      if (featureList && course.gates) {
        featureList.innerHTML = course.gates.map((g, idx) => `
          <li>🎢 <b>${g.gateName.split(':')[0]}</b>: ${g.gateName.split(':')[1] || g.gateName}</li>
        `).join('');
      }
    }

    loadSettings() {
      try {
        const saved = localStorage.getItem('bks_coaster_config');
        if (saved) {
          const cfg = JSON.parse(saved);
          if (cfg.timeLimit !== undefined) this.timeLimit = Number(cfg.timeLimit);
          if (cfg.failureLimit !== undefined) this.failureLimit = Number(cfg.failureLimit);
        }
      } catch (e) {
        console.warn('설정 로드 실패:', e);
      }
    }

    saveSettings() {
      try {
        localStorage.setItem('bks_coaster_config', JSON.stringify({
          timeLimit: this.timeLimit,
          failureLimit: this.failureLimit
        }));
      } catch (e) {
        console.warn('설정 저장 실패:', e);
      }
    }

    initEvents() {
      const handleStart = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (window.CoasterAudio) window.CoasterAudio.resume();
        console.log('[CoasterGame] 출발 버튼 활성화 & 실행!');
        this.startGame();
      };

      if (this.btnStart) {
        this.btnStart.onclick = handleStart;
        this.btnStart.addEventListener('click', handleStart);
        this.btnStart.addEventListener('touchend', handleStart, { passive: false });
      }

      // 순수 3D 코스 탑승 버튼
      const btnLaunchGlacier = document.getElementById('btnLaunchCourseGlacier');
      if (btnLaunchGlacier) {
        btnLaunchGlacier.onclick = () => {
          this.selectCourse('glacier');
          this.startGame();
        };
      }

      const btnLaunchMagma = document.getElementById('btnLaunchCourseMagma');
      if (btnLaunchMagma) {
        btnLaunchMagma.onclick = () => {
          this.selectCourse('magma');
          this.startGame();
        };
      }

      const btnLaunchSpace = document.getElementById('btnLaunchCourseSpace');
      if (btnLaunchSpace) {
        btnLaunchSpace.onclick = () => {
          this.selectCourse('space');
          this.startGame();
        };
      }

      const restartHandler = () => this.restartGame();
      const btnRestart = document.getElementById('btnRestart');
      if (btnRestart) btnRestart.onclick = restartHandler;

      const btnRetry = document.getElementById('btnRetry');
      if (btnRetry) btnRetry.onclick = restartHandler;

      const btnStartSettings = document.getElementById('btnStartSettings');
      if (btnStartSettings) btnStartSettings.onclick = () => this.openSettings();

      const btnOpenSettings = document.getElementById('btnOpenSettings');
      if (btnOpenSettings) btnOpenSettings.onclick = () => this.openSettings();

      const btnGameOverSettings = document.getElementById('btnGameOverSettings');
      if (btnGameOverSettings) {
        btnGameOverSettings.onclick = () => {
          this.gameOverModal.hidden = true;
          this.openSettings();
        };
      }

      const btnSound = document.getElementById('btnToggleSound');
      if (btnSound) {
        btnSound.onclick = () => {
          const enabled = CoasterAudio.toggleSound();
          btnSound.textContent = enabled ? '🔊 소리' : '🔇 음소거';
        };
      }

      // 테마 코스 선택 카드 클릭 이벤트
      document.querySelectorAll('#courseCardGrid .course-card').forEach(card => {
        card.onclick = () => {
          const cid = card.getAttribute('data-course');
          if (this.currentCourseId === cid) {
            // 이미 선택된 카드를 다시 누르면 바로 출발!
            this.startGame();
          } else {
            this.selectCourse(cid);
          }
        };
      });
    }

    // 설정 모달 인터랙션
    initSettingsEvents() {
      const timePills = document.querySelectorAll('#timeLimitGrid .setting-pill');
      timePills.forEach(pill => {
        pill.addEventListener('click', () => {
          timePills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.timeLimit = Number(pill.getAttribute('data-time'));
        });
      });

      const failPills = document.querySelectorAll('#failureLimitGrid .setting-pill');
      failPills.forEach(pill => {
        pill.addEventListener('click', () => {
          failPills.forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.failureLimit = Number(pill.getAttribute('data-fail'));
        });
      });

      document.getElementById('btnCloseSettings')?.addEventListener('click', () => this.closeSettings());
      document.getElementById('btnApplySettings')?.addEventListener('click', () => {
        this.saveSettings();
        this.updateConfigSummary();
        this.closeSettings();
      });
    }

    openSettings() {
      // 현재 값으로 뷰 동기화
      document.querySelectorAll('#timeLimitGrid .setting-pill').forEach(pill => {
        pill.classList.toggle('active', Number(pill.getAttribute('data-time')) === this.timeLimit);
      });
      document.querySelectorAll('#failureLimitGrid .setting-pill').forEach(pill => {
        pill.classList.toggle('active', Number(pill.getAttribute('data-fail')) === this.failureLimit);
      });

      this.settingsModal.hidden = false;
    }

    closeSettings() {
      this.settingsModal.hidden = true;
      this.updateConfigSummary();
    }

    updateConfigSummary() {
      if (!this.startConfigSummary) return;
      const timeText = this.timeLimit === 0 ? '무제한' : `${this.timeLimit}초`;
      const failText = this.failureLimit === 0 ? '무제한(자유)' : `${this.failureLimit}회 기회`;
      this.startConfigSummary.innerHTML = `
        <span>⏱️ 제한시간: <b>${timeText}</b></span>
        <span class="sep">|</span>
        <span>🔋 비상정차: <b>${failText}</b></span>
      `;
    }

    startGame() {
      this.startScreen.hidden = true;
      this.settingsModal.hidden = true;
      this.gameState = 'RIDING';
      this.lives = this.failureLimit === 0 ? 999 : this.failureLimit;
      this.currentProblemIndex = 0;
      this.score = 0;
      this.updateHUD();

      // 3D 롤러코스터 시동
      this.coaster.startRide();

      // 사운드 시동 & 오디오 컨텍스트 활성화
      if (window.CoasterAudio) {
        window.CoasterAudio.resume();
        window.CoasterAudio.startRideAudio();
        window.CoasterAudio.startLiftHill();
      }

      // 속도계 HUD 루프 시작
      this.startSpeedometer();
    }

    restartGame() {
      this.clearGateTimer();
      this.victoryModal.hidden = true;
      this.gameOverModal.hidden = true;
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.startScreen.hidden = false;

      this.coaster.resetRide();
      CoasterAudio.stopLiftHill();
      CoasterAudio.stopWind();
      this.gameState = 'IDLE';
      this.updateHUD();
    }

    // 게이트 도달 시 (슬로우 글라이딩 진입 콜백)
    onGateReached(gateIndex) {
      this.gameState = 'GATE';
      this.currentProblemIndex = gateIndex;

      CoasterAudio.stopLiftHill();
      CoasterAudio.playBrakeScreech();

      const problem = (this.currentCourse && this.currentCourse.gates) ?
        this.currentCourse.gates[gateIndex] : COASTER_PROBLEMS[gateIndex];
      if (!problem) return;

      // 상단 관문 배너 갱신
      this.gateBanner.hidden = false;
      this.gateTitle.textContent = problem.gateName;
      this.gateMission.textContent = problem.mission;
      this.gateHint.textContent = `💡 힌트: ${problem.hint}`;

      // 윈드실드 HUD 바둑판 정보 갱신
      this.hudGateTag.textContent = `🔒 ${problem.gateName.split(':')[0]}`;
      this.hudBoardPrompt.textContent = problem.mission;
      this.hudFooterGuide.innerHTML = `🚀 제한 시간 내 정답 시 <b>150km/h 초고속 부스터</b> 점화! (시간 초과 시 일반 순항)`;

      // 바둑판 팝업 표시 및 렌더링
      this.boardModal.hidden = false;
      this.renderGoBoard(problem);

      // 카운트다운 타이머 시작
      this.startGateTimer();
    }

    // 다이내믹 카운트다운 타이머
    startGateTimer() {
      this.clearGateTimer();

      if (this.timeLimit === 0) {
        // 무제한 모드
        this.timerNumber.textContent = '무제한';
        this.timerBarFill.style.width = '100%';
        this.timerBarFill.className = 'timer-bar-fill';
        this.hudTimerBadge.classList.remove('urgent');
        return;
      }

      this.remainingTime = this.timeLimit;
      const totalTime = this.timeLimit;
      const updateInterval = 80; // 80ms 간격 부드러운 갱신

      const tick = () => {
        this.remainingTime = Math.max(0, this.remainingTime - (updateInterval / 1000));
        const pct = (this.remainingTime / totalTime) * 100;

        this.timerNumber.textContent = `${this.remainingTime.toFixed(1)}초`;
        this.timerBarFill.style.width = `${pct}%`;

        // 색상 상태 전이
        if (pct <= 25) {
          this.timerBarFill.className = 'timer-bar-fill danger';
          this.hudTimerBadge.classList.add('urgent');
          if (Math.floor(this.remainingTime * 10) % 10 === 0) {
            CoasterAudio.playTick(true);
          }
        } else if (pct <= 50) {
          this.timerBarFill.className = 'timer-bar-fill warning';
          this.hudTimerBadge.classList.remove('urgent');
        } else {
          this.timerBarFill.className = 'timer-bar-fill';
          this.hudTimerBadge.classList.remove('urgent');
        }

        // 시간 종료
        if (this.remainingTime <= 0.05) {
          this.clearGateTimer();
          this.handleTimeout();
        }
      };

      // 초기화 렌더
      this.timerNumber.textContent = `${this.remainingTime.toFixed(1)}초`;
      this.timerBarFill.style.width = '100%';
      this.timerBarFill.className = 'timer-bar-fill';
      this.hudTimerBadge.classList.remove('urgent');

      this.timerInterval = setInterval(tick, updateInterval);
    }

    clearGateTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }

    // ⭐ 투명 홀로그램 대형 10x10 / 5x5 바둑판 렌더링 (뒤쪽 우주 & 항성 & 운석 트랙이 비쳐 보임) ⭐
    renderGoBoard(problem, userStones = []) {
      const ctx = this.goCtx;
      const size = this.goCanvas.width || 440;
      ctx.clearRect(0, 0, size, size);

      const gridCount = problem.boardSize || 10;
      const padding = (gridCount >= 10) ? 26 : 45;
      const cellSize = (size - padding * 2) / (gridCount - 1);

      // 1. 투명 홀로그램 사이버 글래스 배경 (투과율 75%+)
      ctx.fillStyle = 'rgba(6, 18, 38, 0.22)';
      ctx.fillRect(0, 0, size, size);

      // 외곽 홀로그램 네온 테두리
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.2;
      ctx.strokeRect(6, 6, size - 12, size - 12);
      ctx.restore();

      // 2. 형광 사이언 네온 격자선
      ctx.save();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.shadowColor = 'rgba(56, 189, 248, 0.65)';
      ctx.shadowBlur = 6;
      ctx.lineWidth = (gridCount >= 10) ? 1.6 : 2.0;

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

      // 화점 (10x10인 경우: (0,0), (6,0), (0,6), (6,6) 4개, 5x5인 경우 중앙 1개)
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;

      if (gridCount === 10) {
        const starPoints = [
          { x: 0, y: 0 },
          { x: 6, y: 0 },
          { x: 0, y: 6 },
          { x: 6, y: 6 }
        ];
        starPoints.forEach(sp => {
          const px = padding + sp.x * cellSize;
          const py = padding + sp.y * cellSize;
          ctx.beginPath();
          ctx.arc(px, py, 3.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        const mid = padding + Math.floor(gridCount / 2) * cellSize;
        ctx.beginPath();
        ctx.arc(mid, mid, 5.0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. 문제 기본 돌
      const stoneRadius = cellSize * 0.44;
      problem.stones.forEach(s => {
        const cx = padding + s.x * cellSize;
        const cy = padding + s.y * cellSize;
        this.drawStone(ctx, cx, cy, s.color, stoneRadius);
      });

      // 4. 유저 착수 돌
      userStones.forEach(s => {
        const cx = padding + s.x * cellSize;
        const cy = padding + s.y * cellSize;
        this.drawStone(ctx, cx, cy, s.color, stoneRadius, true);
      });

      // 5. 보기 라벨 (A, B 등)
      if (problem.labels && problem.labels.length > 0) {
        problem.labels.forEach(lbl => {
          const lx = padding + lbl.x * cellSize;
          const ly = padding + lbl.y * cellSize;

          ctx.save();
          // 라운드 뱃지 배경 (글자가 격자선 위에서 명확하게 보이도록)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
          ctx.beginPath();
          ctx.arc(lx, ly, stoneRadius * 0.75, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 8;
          ctx.stroke();

          // A / B 텍스트
          ctx.fillStyle = '#fef08a';
          ctx.font = `bold ${Math.round(stoneRadius * 0.95)}px "Pretendard", "Segoe UI", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lbl.text, lx, ly);
          ctx.restore();
        });
      }
    }

    drawStone(ctx, cx, cy, color, radius, isNew = false) {
      ctx.save();
      if (color === 'b') {
        // 투명 흑돌: 짙은 흑요석/사파이어 크리스털 볼 + 사이언 네온 링
        ctx.shadowColor = isNew ? '#38bdf8' : 'rgba(56, 189, 248, 0.85)';
        ctx.shadowBlur = isNew ? 22 : 12;

        const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.08, cx, cy, radius);
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        grad.addColorStop(0.35, 'rgba(15, 23, 42, 0.92)');
        grad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
      } else {
        // 백돌: 광채를 발하는 프로즌 다이아몬드 크리스털 볼
        ctx.shadowColor = isNew ? '#ffffff' : 'rgba(224, 242, 254, 0.9)';
        ctx.shadowBlur = isNew ? 24 : 14;

        const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.08, cx, cy, radius);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, 'rgba(240, 249, 255, 0.95)');
        grad.addColorStop(1, 'rgba(186, 230, 253, 0.85)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 1.8;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      }
      ctx.restore();
    }

    initGoBoardEvents() {
      this.goCanvas.addEventListener('click', (e) => {
        if (this.gameState !== 'GATE') return;

        const rect = this.goCanvas.getBoundingClientRect();
        const canvasW = this.goCanvas.width || 440;
        const canvasH = this.goCanvas.height || 440;
        const scaleX = canvasW / rect.width;
        const scaleY = canvasH / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const problem = (this.currentCourse && this.currentCourse.gates) ?
          this.currentCourse.gates[this.currentProblemIndex] : COASTER_PROBLEMS[this.currentProblemIndex];

        const gridCount = problem.boardSize || 10;
        const padding = (gridCount >= 10) ? 26 : 45;
        const cellSize = (canvasW - padding * 2) / (gridCount - 1);

        const gridX = Math.round((clickX - padding) / cellSize);
        const gridY = Math.round((clickY - padding) / cellSize);

        if (gridX < 0 || gridX >= gridCount || gridY < 0 || gridY >= gridCount) return;

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
        this.clearGateTimer();
        this.renderGoBoard(problem, [{ x, y, color: 'b' }]);

        this.hudBoardPrompt.innerHTML = `<span style="color:#22c55e; font-weight:900;">🎉 정답! 게이트 부스터 점화!</span>`;
        this.gateMission.innerHTML = `<span style="color:#22c55e; font-weight:900;">🎉 정답! 게이트 개방!</span> ${problem.gateActionName}`;

        setTimeout(() => {
          this.executeGateSuccess(problem);
        }, 550);
      } else {
        // 오답 처리
        CoasterAudio.playWrongAlarm();
        this.coaster.triggerWrong();

        if (this.failureLimit > 0) {
          this.lives--;
          this.updateHUD();
        }

        if (this.failureLimit > 0 && this.lives <= 0) {
          // 비상 정차 탈락
          this.clearGateTimer();
          this.hudBoardPrompt.innerHTML = `<span style="color:#ef4444; font-weight:900;">🚨 배터리 방전! 비상 정차합니다!</span>`;
          setTimeout(() => this.handleGameOver(), 750);
        } else {
          // 계속 도전 기회 제공 (시간이 남아있으면)
          const leftText = this.failureLimit === 0 ? '자유 모드' : `남은 기회: ${this.lives}번`;
          this.hudBoardPrompt.innerHTML = `<span style="color:#ef4444; font-weight:900;">⚠️ 거기가 아닙니다! (${leftText})</span>`;
        }
      }
    }

    // ⭐ 2안 핵심: 시간 초과 시에도 롤러코스터는 멈추지 않고 순항으로 계속 진행! ⭐
    handleTimeout() {
      CoasterAudio.playWrongAlarm();
      CoasterAudio.playPassSwoosh();
      this.coaster.triggerWrong();

      const problem = (this.currentCourse && this.currentCourse.gates) ?
        this.currentCourse.gates[this.currentProblemIndex] : COASTER_PROBLEMS[this.currentProblemIndex];

      if (this.failureLimit > 0) {
        this.lives--;
        this.updateHUD();
      }

      if (this.failureLimit > 0 && this.lives <= 0) {
        // 배터리 전량 소진 ➔ 비상 정차
        this.hudBoardPrompt.innerHTML = `<span style="color:#ef4444; font-weight:900;">🚨 시간 초과 & 배터리 방전! 비상 정차!</span>`;
        setTimeout(() => this.handleGameOver(), 700);
      } else {
        // 배터리가 남아있으면 정답이던 오답이던 트랙을 계속 주행!
        this.hudBoardPrompt.innerHTML = `<span style="color:#f59e0b; font-weight:900;">⚠️ 시간 초과! (부스터 없이 일반 순항 통과)</span>`;
        this.gateMission.innerHTML = `<span style="color:#f59e0b;">시간 초과 통과 — 순항 속도로 주행을 이어갑니다.</span>`;

        setTimeout(() => {
          this.executeGatePassWithoutBoost(problem);
        }, 800);
      }
    }

    // 정답 시: 140km/h 폭풍 부스터 발사 & 낭떠러지 급강하
    executeGateSuccess(problem) {
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.gameState = 'RIDING';

      CoasterAudio.playBoosterLaunch();
      this.coaster.resumeAfterSolve(true); // 140km/h 부스터 가속
      this.coaster.gatePoints[this.currentProblemIndex].solved = true;

      this.score += 100;
      this.updateHUD();

      this.checkAllGatesCompleted();
    }

    // 시간초과/통과 시: 85km/h 일반 순항 속도로 자연스럽게 이어감 (2안)
    executeGatePassWithoutBoost(problem) {
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.gameState = 'RIDING';

      this.coaster.resumeAfterSolve(false); // 85km/h 일반 순항 주행
      this.coaster.gatePoints[this.currentProblemIndex].solved = true;

      this.checkAllGatesCompleted();
    }

    checkAllGatesCompleted() {
      if (this.currentProblemIndex >= COASTER_PROBLEMS.length - 1) {
        setTimeout(() => {
          this.handleVictory();
        }, 6500);
      }
    }

    // 비상 정차 (완전 멈춤)
    handleGameOver() {
      this.clearGateTimer();
      this.gameState = 'GAMEOVER';
      this.boardModal.hidden = true;
      this.gateBanner.hidden = true;
      this.coaster.emergencyStop(); // 0km/h 정차
      this.gameOverModal.hidden = false;
      CoasterAudio.stopWind();
      CoasterAudio.stopLiftHill();
    }

    handleVictory() {
      this.clearGateTimer();
      this.gameState = 'VICTORY';
      this.victoryModal.hidden = false;
      document.getElementById('finalScore').textContent = `${this.score}점`;
      CoasterAudio.playVictory();
      CoasterAudio.stopWind();
    }

    startSpeedometer() {
      const updateSpeed = () => {
        if (this.gameState === 'RIDING') {
          const speedKm = this.coaster.currentSpeedKm || 0;
          if (this.speedValue) this.speedValue.textContent = `${speedKm} km/h`;
          if (window.CoasterAudio) {
            window.CoasterAudio.setRideSpeed(speedKm);
          }

          if (this.speedModeTag) {
            if (speedKm >= 120) {
              this.speedModeTag.textContent = '⚡ 급강하 부스터';
              this.speedModeTag.className = 'speed-mode-tag plunging';
            } else if (speedKm <= 20) {
              this.speedModeTag.textContent = '❄️ 칼날 능선 서행';
              this.speedModeTag.className = 'speed-mode-tag gliding';
            } else if (false) {
              this.speedModeTag.textContent = '🧗 리프트 등반';
              this.speedModeTag.className = 'speed-mode-tag';
            } else {
              this.speedModeTag.textContent = '🚀 질주 순항';
              this.speedModeTag.className = 'speed-mode-tag';
            }
          }
        } else if (this.gameState === 'GATE') {
          const speedKm = Math.max(8, this.coaster.currentSpeedKm || 10);
          if (this.speedValue) this.speedValue.textContent = `${speedKm} km/h`;
          if (this.speedModeTag) {
            this.speedModeTag.textContent = '🐌 문제 구간 서행';
            this.speedModeTag.className = 'speed-mode-tag gliding';
          }
        } else if (this.gameState === 'GAMEOVER') {
          if (this.speedValue) this.speedValue.textContent = '0 km/h';
          if (this.speedModeTag) {
            this.speedModeTag.textContent = '🚨 비상 정차 완료';
            this.speedModeTag.className = 'speed-mode-tag';
          }
        }
        requestAnimationFrame(updateSpeed);
      };
      requestAnimationFrame(updateSpeed);
    }

    updateHUD() {
      if (this.livesDisplay) {
        if (this.failureLimit === 0) {
          this.livesDisplay.textContent = '♾️ 무제한';
        } else {
          this.livesDisplay.textContent = '❤️'.repeat(Math.max(this.lives, 0));
        }
      }
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    window.coasterGame = new CoasterGame();
  });
})(window);