/**
 * Curling Main Game Controller & Canvas Renderer
 */
(function() {
  'use strict';

  var canvas = document.getElementById('rinkCanvas');
  var ctx = canvas.getContext('2d');
  var engine = new CurlingEngine();
  var audio = window.CurlingAudio;

  // DOM Elements
  var statusMessage = document.getElementById('statusMessage');
  var endIndicator = document.getElementById('endIndicator');
  var sweepOverlay = document.getElementById('sweepOverlay');

  var p1Card = document.getElementById('p1Card');
  var p2Card = document.getElementById('p2Card');
  var p1Name = document.getElementById('p1Name');
  var p2Name = document.getElementById('p2Name');
  var p1Badge = document.getElementById('p1Badge');
  var p2Badge = document.getElementById('p2Badge');
  var p1Score = document.getElementById('p1Score');
  var p2Score = document.getElementById('p2Score');
  var p1TurnPill = document.getElementById('p1TurnPill');
  var p2TurnPill = document.getElementById('p2TurnPill');
  var p1StonesCount = document.getElementById('p1StonesCount');
  var p2StonesCount = document.getElementById('p2StonesCount');
  var p1StonesList = document.getElementById('p1StonesList');
  var p2StonesList = document.getElementById('p2StonesList');
  var p1Avatar = document.getElementById('p1Avatar');
  var p2Avatar = document.getElementById('p2Avatar');

  var tblP1Name = document.getElementById('tblP1Name');
  var tblP2Name = document.getElementById('tblP2Name');
  var scoreP1Tot = document.getElementById('score-p1-tot');
  var scoreP2Tot = document.getElementById('score-p2-tot');

  var btnNew = document.getElementById('btnNew');
  var btnUndo = document.getElementById('btnUndo');
  var btnMode = document.getElementById('btnMode');
  var btnResign = document.getElementById('btnResign');
  var selStoneStyle = document.getElementById('selStoneStyle');
  var selLevel = document.getElementById('selLevel');
  var selIceSkin = document.getElementById('selIceSkin');
  var selSound = document.getElementById('selSound');

  var btnMobNew = document.getElementById('btnMobNew');
  var btnMobUndo = document.getElementById('btnMobUndo');
  var btnMobSweep = document.getElementById('btnMobSweep');
  var btnMobResign = document.getElementById('btnMobResign');

  var endModal = document.getElementById('endModal');
  var endTitle = document.getElementById('endTitle');
  var endSub = document.getElementById('endSub');
  var btnNextEnd = document.getElementById('btnNextEnd');

  var gameOverModal = document.getElementById('gameOverModal');
  var goIcon = document.getElementById('goIcon');
  var goTitle = document.getElementById('goTitle');
  var goSub = document.getElementById('goSub');
  var btnRestartModal = document.getElementById('btnRestartModal');
  var btnCloseModal = document.getElementById('btnCloseModal');

  // Game States
  var state = {
    gameMode: 'ai', // 'ai' or 'pvp'
    aiLevel: 2,
    stoneStyle: 'olympic', // 'olympic' or 'baduk'
    iceSkin: 'blue',
    isAiming: false,
    aimStartX: 0,
    aimStartY: 0,
    aimCurrentX: 0,
    aimCurrentY: 0,
    isThrowing: false,
    particles: [],
    sweepBrushX: 0,
    sweepBrushY: 0,
    sweepBrushVisible: false,
    aiTimeout: null,
    history: []
  };

  // Sound collision listener
  engine.onCollision(function(impactSpeed) {
    var vol = Math.min(impactSpeed / 10, 1.0);
    audio.playHit(vol);
  });

  // -------------------------------------------------------------
  // High-DPI Canvas Resizing
  // -------------------------------------------------------------
  var scale = 1;
  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    scale = dpr;
    canvas.width = 400 * dpr;
    canvas.height = 900 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // -------------------------------------------------------------
  // Particle System (Ice shavings when sweeping / sliding)
  // -------------------------------------------------------------
  function addIceParticles(x, y, count) {
    for (var i = 0; i < count; i++) {
      state.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        alpha: 0.9,
        size: Math.random() * 2.5 + 1
      });
    }
  }

  function updateParticles() {
    for (var i = state.particles.length - 1; i >= 0; i--) {
      var p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      if (p.alpha <= 0) {
        state.particles.splice(i, 1);
      }
    }
  }

  // -------------------------------------------------------------
  // Render Rink Sheet & Elements
  // -------------------------------------------------------------
  function render() {
    ctx.clearRect(0, 0, 400, 900);

    // 1. Ice Background
    var grad = ctx.createLinearGradient(0, 0, 400, 900);
    if (state.iceSkin === 'mint') {
      grad.addColorStop(0, '#ecfdf5');
      grad.addColorStop(1, '#ccfbf1');
    } else if (state.iceSkin === 'night') {
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#0f172a');
    } else {
      // Classic Tournament Blue Ice
      grad.addColorStop(0, '#f0f9ff');
      grad.addColorStop(0.5, '#e0f2fe');
      grad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 900);

    // Ice surface pebble dots
    ctx.fillStyle = (state.iceSkin === 'night') ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)';
    for (var d = 0; d < 30; d++) {
      var px = (d * 83) % 380 + 10;
      var py = (d * 149) % 880 + 10;
      ctx.fillRect(px, py, 2, 2);
    }

    // Side Borders / Foam bumpers
    ctx.fillStyle = (state.iceSkin === 'night') ? '#334155' : '#0369a1';
    ctx.fillRect(0, 0, 16, 900);
    ctx.fillRect(384, 0, 16, 900);

    // 2. Lines & Markings
    ctx.save();
    var isDark = (state.iceSkin === 'night');

    // Back line (y = 55)
    ctx.strokeStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, engine.rink.backLineY);
    ctx.lineTo(384, engine.rink.backLineY);
    ctx.stroke();

    // Center Line
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(engine.rink.teeX, 40);
    ctx.lineTo(engine.rink.teeX, 860);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. THE HOUSE (Circles at Tee: 200, 180)
    var tx = engine.rink.teeX;
    var ty = engine.rink.teeY;

    // 12-foot ring (Blue)
    ctx.fillStyle = isDark ? '#1d4ed8' : '#3b82f6';
    ctx.beginPath();
    ctx.arc(tx, ty, engine.rink.houseRadius12, 0, Math.PI * 2);
    ctx.fill();

    // 8-foot ring (White)
    ctx.fillStyle = isDark ? '#334155' : '#ffffff';
    ctx.beginPath();
    ctx.arc(tx, ty, engine.rink.houseRadius8, 0, Math.PI * 2);
    ctx.fill();

    // 4-foot ring (Red)
    ctx.fillStyle = isDark ? '#b91c1c' : '#ef4444';
    ctx.beginPath();
    ctx.arc(tx, ty, engine.rink.houseRadius4, 0, Math.PI * 2);
    ctx.fill();

    // Button (Center White / Red Pin)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tx, ty, engine.rink.buttonRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fill();

    // Tee Line
    ctx.strokeStyle = isDark ? '#94a3b8' : '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, ty);
    ctx.lineTo(384, ty);
    ctx.stroke();

    // Hog Line (y = 420)
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(16, engine.rink.hogLineY);
    ctx.lineTo(384, engine.rink.hogLineY);
    ctx.stroke();

    // Hog Line Label
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOG LINE (호그 라인 - 이 선을 넘어야 유효)', tx, engine.rink.hogLineY - 6);

    // Hack Line (Delivery Area y = 820)
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(100, engine.rink.hackY);
    ctx.lineTo(300, engine.rink.hackY);
    ctx.stroke();

    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DELIVERY HACK (투구 위치)', tx, engine.rink.hackY + 22);

    ctx.restore();

    // 4. Render Particles
    for (var pIdx = 0; pIdx < state.particles.length; pIdx++) {
      var pt = state.particles[pIdx];
      ctx.fillStyle = 'rgba(255, 255, 255, ' + pt.alpha + ')';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Render Stones
    for (var sIdx = 0; sIdx < engine.stones.length; sIdx++) {
      var s = engine.stones[sIdx];
      if (!s.inPlay) continue;
      drawStone(s);
    }

    // Draw active stone if not yet delivered
    if (engine.activeStone && !engine.activeStone.isMoving) {
      drawStone(engine.activeStone);
    }

    // 6. Draw Aiming Slingshot Drag Arrow
    if (state.isAiming) {
      drawAimArrow();
    }

    // 7. Draw Sweeping Brush Animation
    if (state.sweepBrushVisible) {
      drawSweepingBrush(state.sweepBrushX, state.sweepBrushY);
    }
  }

  // -------------------------------------------------------------
  // Draw Individual Stone
  // -------------------------------------------------------------
  function drawStone(stone) {
    ctx.save();
    ctx.translate(stone.x, stone.y);
    ctx.rotate(stone.rotation);

    var r = stone.radius;

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;

    // Granite body
    var bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    if (state.stoneStyle === 'baduk') {
      if (stone.team === 'red') {
        // Black Baduk Stone
        bodyGrad.addColorStop(0, '#475569');
        bodyGrad.addColorStop(0.7, '#1e293b');
        bodyGrad.addColorStop(1, '#0f172a');
      } else {
        // White Baduk Stone
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.8, '#f1f5f9');
        bodyGrad.addColorStop(1, '#cbd5e1');
      }
    } else {
      // Olympic Granite Stone
      bodyGrad.addColorStop(0, '#e2e8f0');
      bodyGrad.addColorStop(0.6, '#94a3b8');
      bodyGrad.addColorStop(1, '#64748b');
    }

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Metallic rim band
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = (state.stoneStyle === 'baduk') ? '#334155' : '#cbd5e1';
    ctx.stroke();

    // Top Handle Plate & Color Handle
    var handleColor = (stone.team === 'red') ? '#ef4444' : '#f59e0b';
    if (state.stoneStyle === 'baduk') {
      handleColor = (stone.team === 'red') ? '#38bdf8' : '#f97316';
    }

    // Handle center hub
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();

    // Colored Grip
    ctx.fillStyle = handleColor;
    ctx.beginPath();
    ctx.roundRect(-4, -r * 0.75, 8, r * 1.5, 4);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Aiming Indicator
  // -------------------------------------------------------------
  function drawAimArrow() {
    var sx = engine.rink.teeX;
    var sy = engine.rink.hackY;
    var dx = sx - state.aimCurrentX;
    var dy = sy - state.aimCurrentY;

    var dragDist = Math.sqrt(dx * dx + dy * dy);
    var power = Math.min(dragDist, 180);
    var ratio = power / 180;

    // Arrow pointing forward
    var angle = Math.atan2(-dy, -dx);
    var arrowLen = power * 2.2;

    ctx.save();
    // Power circle indicator
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(sx, sy, 35 + power * 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Trajectory dashed guideline
    ctx.strokeStyle = (ratio > 0.8) ? '#ef4444' : ((ratio > 0.4) ? '#0284c7' : '#10b981');
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(angle) * arrowLen, sy + Math.sin(angle) * arrowLen);
    ctx.stroke();

    // Power text
    ctx.setLineDash([]);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('파워: ' + Math.round(ratio * 100) + '%', sx, sy + 50);

    ctx.restore();
  }

  // -------------------------------------------------------------
  // Draw Sweeping Brush
  // -------------------------------------------------------------
  function drawSweepingBrush(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.font = '26px sans-serif';
    ctx.fillText('🧹', -12, 0);

    // Sparkling sweep lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 6);
    ctx.lineTo(15, 6);
    ctx.moveTo(-10, 10);
    ctx.lineTo(10, 10);
    ctx.stroke();

    ctx.restore();
  }

  // -------------------------------------------------------------
  // User Input Events (Slingshot Aim & Sweeping)
  // -------------------------------------------------------------
  function getCanvasCoords(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    var clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    return {
      x: (clientX - rect.left) * (400 / rect.width),
      y: (clientY - rect.top) * (900 / rect.height)
    };
  }

  function onPointerDown(e) {
    if (engine.gameOver || engine.endOver) return;

    var pos = getCanvasCoords(e);

    // If stone is moving, clicking/tapping triggers SWEEPING!
    if (state.isThrowing) {
      triggerSweepingAction(pos.x, pos.y);
      return;
    }

    // Check if it's human player's turn to shoot
    if (!canHumanShoot()) return;

    // Check touch near hack
    var d = Math.sqrt(Math.pow(pos.x - engine.rink.teeX, 2) + Math.pow(pos.y - engine.rink.hackY, 2));
    if (d < 80) {
      state.isAiming = true;
      state.aimStartX = pos.x;
      state.aimStartY = pos.y;
      state.aimCurrentX = pos.x;
      state.aimCurrentY = pos.y;
    }
  }

  function onPointerMove(e) {
    var pos = getCanvasCoords(e);

    if (state.isThrowing) {
      // Brushing across canvas while moving also triggers sweeping!
      triggerSweepingAction(pos.x, pos.y);
      return;
    }

    if (state.isAiming) {
      state.aimCurrentX = pos.x;
      state.aimCurrentY = pos.y;
    }
  }

  function onPointerUp() {
    if (!state.isAiming) return;
    state.isAiming = false;

    var sx = engine.rink.teeX;
    var sy = engine.rink.hackY;
    var dx = sx - state.aimCurrentX;
    var dy = sy - state.aimCurrentY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) return; // Too small, cancel

    var power = Math.min(dist, 180);
    var speedRatio = power / 180;
    var angle = Math.atan2(-dy, -dx);

    var maxVelocity = 15.5;
    var launchSpeed = speedRatio * maxVelocity;

    var vx = Math.cos(angle) * launchSpeed;
    var vy = Math.sin(angle) * launchSpeed;

    executeThrow(vx, vy);
  }

  function triggerSweepingAction(x, y) {
    engine.triggerSweep(30);
    audio.playSweep();
    addIceParticles(x, y, 6);

    state.sweepBrushX = x;
    state.sweepBrushY = y;
    state.sweepBrushVisible = true;
    setTimeout(function() {
      state.sweepBrushVisible = false;
    }, 180);
  }

  function canHumanShoot() {
    if (engine.gameOver || engine.endOver || state.isThrowing) return false;
    if (state.gameMode === 'ai' && engine.currentTurn === 'yellow') return false;
    return true;
  }

  function executeThrow(vx, vy) {
    state.isThrowing = true;
    audio.playSlide();
    sweepOverlay.hidden = false;

    engine.deliverStone(vx, vy);
    updateUI();
  }

  // -------------------------------------------------------------
  // AI Automation
  // -------------------------------------------------------------
  function checkAITurn() {
    if (engine.gameOver || engine.endOver || state.isThrowing) return;
    if (state.gameMode === 'ai' && engine.currentTurn === 'yellow') {
      statusMessage.textContent = '🤖 AI가 최적의 투구 코스를 계산 중입니다...';

      state.aiTimeout = setTimeout(function() {
        if (engine.gameOver || engine.endOver) return;

        engine.prepareNextThrow();
        var shot = engine.computeAIShot(state.aiLevel);
        executeThrow(shot.vx, shot.vy);

        // Smart AI sweeping during slide
        scheduleAISweeping();
      }, 1000);
    }
  }

  function scheduleAISweeping() {
    // If AI stone needs a tiny boost to enter the house, AI sweeps!
    var checkInterval = setInterval(function() {
      if (!state.isThrowing || !engine.activeStone) {
        clearInterval(checkInterval);
        return;
      }
      var s = engine.activeStone;
      // If stone passed hogline and is slowing down near house
      if (s.y < engine.rink.hogLineY && s.y > engine.rink.teeY) {
        var spd = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
        if (spd < 2.0 && spd > 0.4 && state.aiLevel >= 2) {
          triggerSweepingAction(s.x, s.y - 30);
        }
      }
    }, 200);
  }

  // -------------------------------------------------------------
  // Game Loop (60 FPS)
  // -------------------------------------------------------------
  function gameLoop() {
    var isMoving = engine.update();
    updateParticles();

    if (state.isThrowing && !isMoving) {
      // Throw complete!
      state.isThrowing = false;
      sweepOverlay.hidden = true;
      onThrowFinished();
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function onThrowFinished() {
    updateUI();

    if (engine.endOver) {
      handleEndFinished();
    } else {
      prepareNextTurn();
    }
  }

  function prepareNextTurn() {
    engine.prepareNextThrow();
    updateUI();

    if (canHumanShoot()) {
      statusMessage.textContent = (engine.currentTurn === 'red')
        ? '🔴 레드(나) 차례! 스톤을 당겨 투구하세요.'
        : '🟡 옐로우 차례! 스톤을 당겨 투구하세요.';
    } else {
      checkAITurn();
    }
  }

  // -------------------------------------------------------------
  // End & Game Over Handling
  // -------------------------------------------------------------
  function handleEndFinished() {
    var lastEndIdx = engine.currentEnd - 1;
    var redPts = engine.scores.red[lastEndIdx];
    var yellowPts = engine.scores.yellow[lastEndIdx];

    audio.playScore();

    // Update scoreboard cells
    updateScoreTable();

    if (engine.gameOver) {
      // Final Game Over!
      var total = engine.getTotalScore();
      var userWon = (state.gameMode === 'ai' && total.red > total.yellow) || (total.red > total.yellow);
      var draw = (total.red === total.yellow);

      if (userWon) {
        audio.playVictory();
        goIcon.textContent = '🏆';
        goTitle.textContent = '최종 경기 승리!';
        goSub.textContent = '총점 ' + total.red + ' : ' + total.yellow + ' 로 완벽한 승리를 거두었습니다!';
      } else if (draw) {
        audio.playScore();
        goIcon.textContent = '🤝';
        goTitle.textContent = '무승부 (Draw)';
        goSub.textContent = '총점 ' + total.red + ' : ' + total.yellow + ' 로 팽팽한 접전 끝에 비겼습니다!';
      } else {
        audio.playDefeat();
        goIcon.textContent = '🛡️';
        goTitle.textContent = '경기 종료 (패배)';
        goSub.textContent = '총점 ' + total.red + ' : ' + total.yellow + ' 로 아쉽게 패배했습니다. 다시 도전해 보세요!';
      }
      gameOverModal.hidden = false;
    } else {
      // End result modal
      endTitle.textContent = '제 ' + engine.currentEnd + ' 엔드 종료';
      if (redPts > 0) {
        endSub.textContent = '🔴 레드 팀이 ' + redPts + '점을 획득했습니다!';
      } else if (yellowPts > 0) {
        endSub.textContent = '🟡 옐로우 팀이 ' + yellowPts + '점을 획득했습니다!';
      } else {
        endSub.textContent = '양 팀 모두 하우스에 넣지 못해 무득점(0:0)으로 끝났습니다.';
      }
      endModal.hidden = false;
    }
  }

  btnNextEnd.addEventListener('click', function() {
    endModal.hidden = true;
    engine.currentEnd++;
    engine.startNewEnd();
    prepareNextTurn();
  });

  // -------------------------------------------------------------
  // UI Synchronization
  // -------------------------------------------------------------
  function updateUI() {
    endIndicator.textContent = '제 ' + engine.currentEnd + ' / ' + engine.totalEnds + ' 엔드';

    // Player 1 Card
    var isP1Turn = (engine.currentTurn === 'red');
    p1Card.classList.toggle('active', isP1Turn);
    p1TurnPill.textContent = isP1Turn ? '투구 준비 중' : '대기 중';
    p1StonesCount.textContent = engine.redRemaining + ' / ' + engine.stonesPerTeam;

    // Player 2 Card
    var isP2Turn = (engine.currentTurn === 'yellow');
    p2Card.classList.toggle('active', isP2Turn);
    p2TurnPill.textContent = isP2Turn ? '투구 준비 중' : '대기 중';
    p2StonesCount.textContent = engine.yellowRemaining + ' / ' + engine.stonesPerTeam;

    // Update Stone Pips
    renderPips(p1StonesList, engine.stonesPerTeam, engine.redRemaining, 'p1-pip');
    renderPips(p2StonesList, engine.stonesPerTeam, engine.yellowRemaining, 'p2-pip');

    updateScoreTable();
  }

  function renderPips(container, total, remaining, pipClass) {
    container.innerHTML = '';
    for (var i = 0; i < total; i++) {
      var span = document.createElement('span');
      span.className = 'stone-pip ' + pipClass + (i >= remaining ? ' used' : '');
      container.appendChild(span);
    }
  }

  function updateScoreTable() {
    var tot = engine.getTotalScore();
    p1Score.textContent = tot.red + '점';
    p2Score.textContent = tot.yellow + '점';

    scoreP1Tot.textContent = tot.red;
    scoreP2Tot.textContent = tot.yellow;

    for (var e = 1; e <= engine.totalEnds; e++) {
      var cell1 = document.getElementById('score-p1-' + e);
      var cell2 = document.getElementById('score-p2-' + e);
      if (cell1 && cell2) {
        if (e < engine.currentEnd || (e === engine.currentEnd && engine.endOver)) {
          cell1.textContent = engine.scores.red[e - 1];
          cell2.textContent = engine.scores.yellow[e - 1];
        } else {
          cell1.textContent = '-';
          cell2.textContent = '-';
        }
      }
    }
  }

  function updateTeamLabels() {
    var isBaduk = (state.stoneStyle === 'baduk');
    var p1Label = isBaduk ? '흑돌 (Black)' : '레드 (Red)';
    var p2Label = isBaduk ? '백돌 (White)' : '옐로우 (Yellow)';

    p1Badge.textContent = '선공: ' + p1Label;
    p2Badge.textContent = '후공: ' + p2Label;

    tblP1Name.textContent = p1Label;
    tblP2Name.textContent = p2Label;

    p1Avatar.textContent = isBaduk ? '⚫' : '🥌';
    p2Avatar.textContent = isBaduk ? '⚪' : '🥌';
  }

  // -------------------------------------------------------------
  // Controls & Settings Listeners
  // -------------------------------------------------------------
  function newGame() {
    clearTimeout(state.aiTimeout);
    endModal.hidden = true;
    gameOverModal.hidden = true;
    sweepOverlay.hidden = true;
    state.isAiming = false;
    state.isThrowing = false;
    state.particles = [];

    engine.initGame(3, 4);
    updateTeamLabels();
    prepareNextTurn();
  }

  btnNew.addEventListener('click', newGame);
  if (btnMobNew) btnMobNew.addEventListener('click', newGame);
  btnRestartModal.addEventListener('click', newGame);
  btnCloseModal.addEventListener('click', function() {
    gameOverModal.hidden = true;
  });

  // Undo (무르기)
  btnUndo.addEventListener('click', function() {
    if (state.isThrowing) return;
    if (engine.stones.length > 0) {
      var removed = engine.stones.pop();
      if (removed.team === 'red') engine.redRemaining++;
      else engine.yellowRemaining++;
      engine.currentTurn = removed.team;
      prepareNextTurn();
    }
  });
  if (btnMobUndo) btnMobUndo.addEventListener('click', function() { btnUndo.click(); });

  // Mode Toggle
  btnMode.addEventListener('click', function() {
    state.gameMode = (state.gameMode === 'ai') ? 'pvp' : 'ai';
    btnMode.innerHTML = (state.gameMode === 'ai')
      ? '<span class="btn-icon">🤖</span><span class="btn-text">AI 대전</span>'
      : '<span class="btn-icon">👥</span><span class="btn-text">2인 대전</span>';
    p2Name.textContent = (state.gameMode === 'ai') ? '상대 (AI ' + state.aiLevel + '단계)' : '플레이어 2';
    newGame();
  });

  // Resign (기권)
  function handleResign() {
    if (engine.gameOver) {
      alert('이미 종료된 경기입니다.');
      return;
    }
    if (!confirm('정말 경기를 기권하시겠습니까? 기권패로 처리됩니다.')) return;

    engine.gameOver = true;
    audio.playDefeat();
    goIcon.textContent = '🏳️';
    goTitle.textContent = '경기 기권패';
    goSub.textContent = '기권을 선택하셨습니다. 상대방의 승리로 경기가 종료되었습니다.';
    gameOverModal.hidden = false;
  }

  btnResign.addEventListener('click', handleResign);
  if (btnMobResign) btnMobResign.addEventListener('click', handleResign);

  // Settings
  selStoneStyle.addEventListener('change', function() {
    state.stoneStyle = selStoneStyle.value;
    updateTeamLabels();
  });

  selLevel.addEventListener('change', function() {
    state.aiLevel = parseInt(selLevel.value, 10);
    if (state.gameMode === 'ai') {
      p2Name.textContent = '상대 (AI ' + state.aiLevel + '단계)';
    }
  });

  selIceSkin.addEventListener('change', function() {
    state.iceSkin = selIceSkin.value;
  });

  selSound.addEventListener('change', function() {
    audio.setMuted(selSound.value === 'off');
  });

  if (btnMobSweep) {
    btnMobSweep.addEventListener('click', function() {
      if (state.isThrowing) {
        triggerSweepingAction(engine.rink.teeX, engine.rink.hogLineY + 50);
      }
    });
  }

  // Pointer Events on Canvas
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  window.addEventListener('resize', resizeCanvas);

  // Start
  resizeCanvas();
  newGame();
  requestAnimationFrame(gameLoop);

})();
