/* 당구 — 바둑스쿨 Fun
   모드: 3구 / 4구 / 포켓볼 (한 페이지에서 선택) */
(function () {
  'use strict';

  var cv = document.getElementById('table');
  var ctx = cv.getContext('2d');
  var RS = 1;   /* 렌더 배율: 화면 폭에 맞춰 1~2.5배로 그린다 */

  var W = 960, H = 516, RAIL = 36;
  var MINX = RAIL, MAXX = W - RAIL, MINY = RAIL, MAXY = H - RAIL;
  var FL = W - RAIL * 2;
  var R = 9.5, POCKET_R = 0;

  /* 공식 규격 (플레이필드 2:1 고정) */
  var FOLLOW_K = 2.6, SIDE_K = 1.1;   /* 당점 효과 세기 */
  var BALL_SCALE = 1.3;   /* 보기용 배율: 규격 1/46.2 → 1/35.6 (화면에서 작아 보여 보정) */
  var bs = /[?&]ballscale=(\d+(?:\.\d+)?)/.exec(location.search);
  if (bs) BALL_SCALE = Math.max(1, parseFloat(bs[1]));

  var SPEC = {
    carom: { rail: 135 / 2840, ball: 61.5 / 2840 },   /* UMB 캐럼 2840×1420, 공 61.5mm, 레일 135mm */
    pool:  { rail: 150 / 2540, ball: 57.15 / 2540 }   /* 9ft 풀 2540×1270, 공 57.15mm, 레일 150mm */
  };

  /* 모드에 맞춰 레일 폭·판 높이·공 크기를 규격 비율로 재계산 */
  function applySpec() {
    var sp = (mode === 'pocket') ? SPEC.pool : SPEC.carom;
    RAIL = +(W * sp.rail / (1 + 2 * sp.rail)).toFixed(2);   /* 레일/필드 비율 유지 */
    FL = +(W - RAIL * 2).toFixed(2);
    H = +(FL / 2 + RAIL * 2).toFixed(1);                    /* 필드 2:1 유지 */
    MINX = RAIL; MAXX = W - RAIL; MINY = RAIL; MAXY = H - RAIL;
    R = +(FL * sp.ball / 2 * BALL_SCALE).toFixed(2);
    POCKET_R = (mode === 'pocket') ? +(FL * sp.ball * 2.1).toFixed(2) : 0;
  }
  var FRICTION = 0.9885, STOP = 0.06, CUSHION = 0.92, MAX_POWER = 26;

  var POCKET_COLORS = ['#f2c53d', '#2e6fb7', '#c0392b', '#7d3fa8', '#e07b2a', '#2f8f5b', '#8e2418', '#1d1d1d', '#e6d34a'];

  var mode = 'three';
  var balls = [], pockets = [], cue = null;
  var dragging = false, aim = { x: 0, y: 0, power: 0 }, moving = false;
  var touches = {};
  var score = 0, shots = 0;
  /* 2인 교대 · 목표 점수 */
  var p1Score = 0, p2Score = 0, turnP = 0, TARGET = 5;
  var mt = /[?&]target=(\d+)/.exec(location.search); if (mt) TARGET = Math.max(1, parseInt(mt[1], 10));
  var cushionCount = 0, hitList = [], pottedThisShot = 0, foulThisShot = false, lastCushion = 0;
  var spin = { x: 0, y: 0 };
  var lastAim = { x: 1, y: 0, power: 0 }, spinZone = false;   /* 당점: x=-1(좌)~1(우), y=-1(하)~1(상) */
  if (/[?&]spin=top/.test(location.search)) spin.y = 1;
  if (/[?&]spin=bottom/.test(location.search)) spin.y = -1;
  if (/[?&]spin=left/.test(location.search)) spin.x = -1;
  if (/[?&]spin=right/.test(location.search)) spin.x = 1;
  var best = +(localStorage.getItem('bkBillBest') || 0);
  var over = false;

  var el = {
    score: document.getElementById('score'),
    p1: document.getElementById('p1'),
    p2: document.getElementById('p2'),
    target: document.getElementById('target'),
    panel: document.getElementById('resultPanel'),
    rTitle: document.getElementById('resultTitle'),
    rDesc: document.getElementById('resultDesc'),
    shots: document.getElementById('shots'),
    best: document.getElementById('best'),
    turn: document.getElementById('turnBar'),
    power: document.getElementById('powerFill'),
    range: document.getElementById('powerRange'),
    powerVal: document.getElementById('powerVal'),
    msg: document.getElementById('msg'),
    title: document.getElementById('modeTitle'),
    desc: document.getElementById('modeDesc'),
    leftWrap: document.getElementById('leftWrap'),
    left: document.getElementById('left')
  };

  function mkBall(x, y, color, kind, num) {
    return { x: x, y: y, vx: 0, vy: 0, color: color, kind: kind, num: num || 0, r: R, alive: true };
  }

  function buildPockets() {
    var off = 2;
    pockets = [
      { x: MINX + off, y: MINY + off },
      { x: W / 2, y: MINY + off * 0.35 },
      { x: MAXX - off, y: MINY + off },
      { x: MINX + off, y: MAXY - off },
      { x: W / 2, y: MAXY - off * 0.35 },
      { x: MAXX - off, y: MAXY - off }
    ];
  }

  function setup() {
    applySpec();
    balls = []; pockets = []; over = false;
    cue = mkBall(230, H / 2, '#f6f5ef', 'cue', 0);
    balls.push(cue);

    if (mode === 'three') {
      balls.push(mkBall(660, 180, '#c0392b', 'red'));
      balls.push(mkBall(660, 320, '#e8c33a', 'yellow'));
    } else if (mode === 'four') {
      balls.push(mkBall(430, 120, '#e8c33a', 'yellow'));
      balls.push(mkBall(680, 200, '#c0392b', 'red'));
      balls.push(mkBall(680, 340, '#262626', 'black'));
    } else {
      buildPockets();
      var cx = 640, cy = H / 2, gap = R * 2.16, idx = 0;
      for (var row = 0; row < 4 && idx < 9; row++) {
        for (var col = 0; col <= row && idx < 9; col++) {
          balls.push(mkBall(cx + row * gap * 0.87, cy - row * gap / 2 + col * gap,
            POCKET_COLORS[idx], 'object', idx + 1));
          idx++;
        }
      }
    }

    touches = {};
    moving = false;
    aim.power = 0;
    syncPowerUI();
    syncText();
    updateStats();
    draw();
  }

  function newGame() {
    score = 0; shots = 0; p1Score = 0; p2Score = 0; turnP = 0; over = false;
    if (el.panel) el.panel.hidden = true;
    msg('');
    setup();
  }

  function syncPowerUI() {
    var pct = Math.round(aim.power * 100);
    if (el.power) el.power.style.width = pct + '%';
    if (el.range && +el.range.value !== pct) el.range.value = String(pct);
    if (el.powerVal) el.powerVal.textContent = pct + '%';
  }

  function fitCanvas() {
    var dw = cv.clientWidth || W;
    RS = Math.max(1, Math.min(2.5, dw / W));
    cv.width = Math.round(W * RS);
    cv.height = Math.round(H * RS);
    draw();
  }

  function addPoint(n) {
    if (turnP === 0) p1Score = Math.max(0, p1Score + n);
    else p2Score = Math.max(0, p2Score + n);
    score = turnP === 0 ? p1Score : p2Score;
  }

  function beginShot() {
    cushionCount = 0; hitList = []; pottedThisShot = 0; foulThisShot = false; touches = {};
  }

  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  function syncText() {
    var t = mode === 'three' ? '당구 3구' : mode === 'four' ? '당구 4구' : '포켓볼';
    if (el.title) el.title.textContent = t;
    if (el.desc) {
      el.desc.innerHTML = mode === 'three'
        ? '<b>3쿠션</b> · 흰 공으로 빨강·노랑을 모두 맞히고, <b>두 번째 공에 닿기 전 쿠션 3회 이상</b>이면 1점.'
        : mode === 'four'
          ? '<b>4구</b> · 흰 공으로 <b>빨강과 검정</b>을 모두 맞히면 1점. 노랑은 상대 공입니다.'
          : '<b>포켓</b> · 색공을 넣으면 1점(계속 칩니다). <b>흰 공을 넣으면 –1점</b>이고 차례가 넘어갑니다.';
    }
    if (el.leftWrap) el.leftWrap.hidden = mode !== 'pocket';
  }

  function objectLeft() {
    return balls.filter(function (b) { return b.kind === 'object' && b.alive; }).length;
  }

  function updateStats() {
    score = turnP === 0 ? p1Score : p2Score;
    if (el.p1) el.p1.textContent = p1Score;
    if (el.p2) el.p2.textContent = p2Score;
    if (el.target) el.target.textContent = TARGET;
    if (el.shots) el.shots.textContent = shots;
    if (el.left) el.left.textContent = String(objectLeft());
    if (el.turn) {
      el.turn.textContent = moving ? '공이 움직이는 중…'
        : over ? '게임 종료'
        : (turnP === 0 ? '1P 차례' : '2P 차례');
    }
    var pc = document.querySelectorAll('.b-score');
    for (var i = 0; i < pc.length; i++) {
      pc[i].classList.toggle('active-turn',
        (pc[i].classList.contains('p1') && turnP === 0 && !over) ||
        (pc[i].classList.contains('p2') && turnP === 1 && !over));
    }
  }

  /* ---------- 물리 ---------- */
  function step() {
    var active = false;

    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      if (!b.alive) continue;

      b.x += b.vx; b.y += b.vy;
      b.vx *= FRICTION; b.vy *= FRICTION;
      if (Math.abs(b.vx) < STOP) b.vx = 0;
      if (Math.abs(b.vy) < STOP) b.vy = 0;

      var bounced = false;
      if (b.x - b.r < MINX) { b.x = MINX + b.r; b.vx = -b.vx * CUSHION; if (b.kind === 'cue') b.vy += spin.x * SIDE_K * (b.vx > 0 ? 1 : -1); bounced = true; }
      if (b.x + b.r > MAXX) { b.x = MAXX - b.r; b.vx = -b.vx * CUSHION; if (b.kind === 'cue') b.vy += spin.x * SIDE_K * (b.vx > 0 ? 1 : -1); bounced = true; }
      if (b.y - b.r < MINY) { b.y = MINY + b.r; b.vy = -b.vy * CUSHION; if (b.kind === 'cue') b.vx -= spin.x * SIDE_K * (b.vy > 0 ? 1 : -1); bounced = true; }
      if (b.y + b.r > MAXY) { b.y = MAXY - b.r; b.vy = -b.vy * CUSHION; if (b.kind === 'cue') b.vx -= spin.x * SIDE_K * (b.vy > 0 ? 1 : -1); bounced = true; }
      if (bounced && b.kind === 'cue' && hitList.length < 2) cushionCount++;

      if (b.vx || b.vy) active = true;
    }

    for (var a = 0; a < balls.length; a++) {
      for (var c = a + 1; c < balls.length; c++) {
        var A = balls[a], B = balls[c];
        if (!A.alive || !B.alive) continue;

        var dx = B.x - A.x, dy = B.y - A.y;
        var d = Math.hypot(dx, dy);
        if (d === 0 || d >= A.r + B.r) continue;

        var nx = dx / d, ny = dy / d;
        var overlap = (A.r + B.r) - d;
        A.x -= nx * overlap / 2; A.y -= ny * overlap / 2;
        B.x += nx * overlap / 2; B.y += ny * overlap / 2;

        var rvx = B.vx - A.vx, rvy = B.vy - A.vy;
        var vn = rvx * nx + rvy * ny;
        if (vn > 0) continue;

        var imp = vn * 0.98;
        A.vx += imp * nx; A.vy += imp * ny;
        B.vx -= imp * nx; B.vy -= imp * ny;

        /* 당점(상·하) → 밀어치기/끌어치기 */
        if (A.kind === 'cue' && B.kind !== 'cue' && Math.abs(spin.y) > 0.1) {
          A.vx += nx * spin.y * FOLLOW_K; A.vy += ny * spin.y * FOLLOW_K;
          spin.y *= 0.55;
        }
        if (B.kind === 'cue' && A.kind !== 'cue' && Math.abs(spin.y) > 0.1) {
          B.vx -= nx * spin.y * FOLLOW_K; B.vy -= ny * spin.y * FOLLOW_K;
          spin.y *= 0.55;
        }

        if (A.kind === 'cue' && B.kind !== 'cue') { touches[B.kind] = true; if (B.kind !== 'object') hitList.push(B.kind); }
        if (B.kind === 'cue' && A.kind !== 'cue') { touches[A.kind] = true; if (A.kind !== 'object') hitList.push(A.kind); }
      }
    }

    if (mode === 'pocket') {
      for (var k = 0; k < balls.length; k++) {
        var bb = balls[k];
        if (!bb.alive) continue;
        for (var pi = 0; pi < pockets.length; pi++) {
          if (Math.hypot(bb.x - pockets[pi].x, bb.y - pockets[pi].y) < POCKET_R * 0.8) {
            bb.alive = false; bb.vx = bb.vy = 0;
            if (bb.kind === 'cue') {
              addPoint(-1);
              foulThisShot = true;
              msg('파울! 흰 공을 넣었습니다 (–1점)');
              setTimeout(function () {
                cue.x = 230; cue.y = H / 2; cue.vx = cue.vy = 0; cue.alive = true;
              }, 450);
            } else {
              addPoint(1);
              pottedThisShot++;
              msg('득점! (' + score + '점)');
            }
            updateStats();
            break;
          }
        }
      }
    }

    if (moving && !active) endShot();
    return active;
  }

  /* 순수 규칙 판정 — 합성 입력으로 검증 가능 */
  function judgeShot(m, touches, cushions) {
    if (m === 'pocket') return { scored: touches.potted > 0 && !touches.foul };
    var need = (m === 'four') ? ['red', 'black'] : ['red', 'yellow'];
    var both = need.every(function (k) { return !!touches[k]; });
    if (m === 'three') return { scored: both && cushions >= 3 };
    return { scored: both };
  }

  function finishGame(winner) {
    over = true;
    if (el.rTitle) {
      el.rTitle.textContent = winner === 'draw' ? '무승부'
        : (winner === 0 ? '1P 승리!' : '2P 승리!');
    }
    if (el.rDesc) {
      el.rDesc.textContent = '1P ' + p1Score + ' : ' + p2Score + ' 2P · 목표 ' + TARGET + '점';
    }
    if (el.panel) el.panel.hidden = false;
    updateStats();
  }

  function checkWin() {
    if (over) return true;
    if (p1Score >= TARGET) { finishGame(0); return true; }
    if (p2Score >= TARGET) { finishGame(1); return true; }
    if (mode === 'pocket' && objectLeft() === 0) {
      finishGame(p1Score === p2Score ? 'draw' : (p1Score > p2Score ? 0 : 1));
      return true;
    }
    return false;
  }

  function endShot() {
    moving = false;
    lastCushion = cushionCount;
    var scored = false, note = '';

    if (mode === 'pocket') {
      scored = pottedThisShot > 0 && !foulThisShot;
      if (foulThisShot) note = '파울 — 차례가 넘어갑니다';
      else if (pottedThisShot > 0) note = '득점! (' + pottedThisShot + '개) · 계속 칩니다';
      else note = '실패 — 차례가 넘어갑니다';
    } else {
      var need = mode === 'four' ? ['red', 'black'] : ['red', 'yellow'];
      var hitBoth = need.every(function (k) { return touches[k]; });
      if (mode === 'three') {
        scored = judgeShot(mode, touches, cushionCount).scored;
        note = !hitBoth ? '실패 — 두 공을 모두 맞혀야 합니다'
          : (scored ? '득점! (3쿠션 성공) · 계속 칩니다'
                    : '쿠션 부족 (' + cushionCount + '/3) — 무득점');
      } else {
        scored = hitBoth;
        note = hitBoth ? '득점! (빨강 + 검정) · 계속 칩니다'
                       : '실패 — 두 공을 모두 맞혀야 합니다';
      }
      if (scored) addPoint(1);
    }

    msg(note);
    updateStats();
    if (checkWin()) return;

    if (!scored) {
      turnP = 1 - turnP;
      updateStats();
    }

    touches = {}; hitList = []; cushionCount = 0;
    pottedThisShot = 0; foulThisShot = false;
  }

  function drawSpinDot() {
    if (!cue || !cue.alive) return;
    var ox = spin.x * cue.r * 0.52, oy = -spin.y * cue.r * 0.52;
    ctx.beginPath();
    ctx.arc(cue.x + ox, cue.y + oy, Math.max(1.4, cue.r * 0.16), 0, 6.283);
    ctx.fillStyle = 'rgba(40,52,34,.55)';
    ctx.fill();
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(RS, 0, 0, RS, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* 외곽 그림자 */
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fillStyle = '#3a2413';
    ctx.fill();
    ctx.restore();

    /* 나무 레일 — 결이 보이도록 다중 그라디언트 */
    var wood = ctx.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, '#a9744a');
    wood.addColorStop(0.18, '#8b5a34');
    wood.addColorStop(0.5, '#71452a');
    wood.addColorStop(0.82, '#5e3a22');
    wood.addColorStop(1, '#7b4d2c');
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fillStyle = wood;
    ctx.fill();

    /* 나무 결 */
    ctx.save();
    roundRect(ctx, 0, 0, W, H, 20); ctx.clip();
    for (var gw = 0; gw < 26; gw++) {
      var gy = (gw / 26) * H + Math.sin(gw) * 2;
      ctx.strokeStyle = 'rgba(60,32,14,' + (0.05 + (gw % 3) * 0.02) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (var gx = 0; gx <= W; gx += 24) {
        var yy = gy + Math.sin((gx / W) * 6 + gw) * 2.5;
        if (gx === 0) ctx.moveTo(gx, yy); else ctx.lineTo(gx, yy);
      }
      ctx.stroke();
    }
    /* 상단 하이라이트 */
    var sheen = ctx.createLinearGradient(0, 0, 0, RAIL * 1.1);
    sheen.addColorStop(0, 'rgba(255,225,180,.30)');
    sheen.addColorStop(1, 'rgba(255,225,180,0)');
    roundRect(ctx, 0, 0, W, RAIL + 4, 18);
    ctx.fillStyle = sheen; ctx.fill();
    ctx.restore();

    /* 펠트 바닥 */
    var felt = ctx.createRadialGradient(W * 0.42, H * 0.34, 30, W / 2, H / 2, Math.max(W, H) * 0.78);
    felt.addColorStop(0, '#3aa066');
    felt.addColorStop(0.55, '#2c8152');
    felt.addColorStop(1, '#1b5334');
    roundRect(ctx, RAIL, RAIL, W - RAIL * 2, H - RAIL * 2, 8);
    ctx.fillStyle = felt;
    ctx.fill();

    /* 펠트 안쪽 그림자(레일이 눌린 느낌) */
    ctx.save();
    roundRect(ctx, RAIL, RAIL, W - RAIL * 2, H - RAIL * 2, 8);
    ctx.clip();
    ctx.lineWidth = 16;
    ctx.strokeStyle = 'rgba(0,0,0,.20)';
    roundRect(ctx, RAIL, RAIL, W - RAIL * 2, H - RAIL * 2, 8);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,.12)';
    ctx.stroke();
    ctx.restore();

    /* 레일 안쪽 베벨 */
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    roundRect(ctx, RAIL - 1.5, RAIL - 1.5, W - RAIL * 2 + 3, H - RAIL * 2 + 3, 9);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    roundRect(ctx, RAIL + 1, RAIL + 1, W - RAIL * 2 - 2, H - RAIL * 2 - 2, 8);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,.42)';
    for (var i = 1; i <= 7; i++) {
      var x = RAIL + (W - RAIL * 2) * (i / 8);
      diamond(x, RAIL / 2); diamond(x, H - RAIL / 2);
    }
    for (var j = 1; j <= 3; j++) {
      var y = RAIL + (H - RAIL * 2) * (j / 4);
      diamond(RAIL / 2, y); diamond(W - RAIL / 2, y);
    }

    if (mode === 'pocket') {
      pockets.forEach(function (p) {
        var pg = ctx.createRadialGradient(p.x, p.y - POCKET_R * 0.28, POCKET_R * 0.1, p.x, p.y, POCKET_R * 1.05);
        pg.addColorStop(0, '#000000');
        pg.addColorStop(0.62, '#0a0f0b');
        pg.addColorStop(1, '#1b2a1e');
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_R * 0.9, 0, 6.283);
        ctx.fillStyle = pg;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.10)';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(p.x, p.y - POCKET_R * 0.28, POCKET_R * 0.72, Math.PI * 1.08, Math.PI * 1.92);
        ctx.strokeStyle = 'rgba(255,255,255,.18)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    /* ---------- 조준 예측 + 큐대 ---------- */
    if (dragging || aim.power > 0) {
      var dir = { x: aim.x || 1, y: aim.y || 0 };
      var hit = raycastCue(dir);
      var hitLen = Math.min(hit.t, 900);
      var hx = cue.x + dir.x * hitLen, hy = cue.y + dir.y * hitLen;

      /* 진행선 */
      ctx.save();
      ctx.setLineDash([9, 8]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + aim.power * 0.45) + ')';
      ctx.beginPath();
      ctx.moveTo(cue.x + dir.x * (R + 2), cue.y + dir.y * (R + 2));
      ctx.lineTo(hx, hy);
      ctx.stroke();
      ctx.restore();

      /* 컨택트 지점 고스트 볼 */
      ctx.beginPath();
      ctx.arc(hx, hy, R, 0, 6.283);
      ctx.setLineDash([4, 5]);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.stroke();
      ctx.setLineDash([]);

      /* 맞은 공이 날아갈 방향 */
      if (hit.ball) {
        var bx = hit.ball.x - hx, by = hit.ball.y - hy;
        var bl = Math.hypot(bx, by) || 1;
        bx /= bl; by /= bl;
        var alen = 74 + aim.power * 70;
        arrow(hx + bx * R, hy + by * R, hx + bx * (R + alen), hy + by * (R + alen), 'rgba(255,232,140,.95)');

        /* 접선(수직) 방향 미세 표시 */
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = 'rgba(180,240,255,.9)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(hx - by * 26, hy + bx * 26);
        ctx.lineTo(hx + by * 26, hy - bx * 26);
        ctx.stroke();
        ctx.restore();
      }

      /* 큐대 */
      var back = R + 10 + aim.power * 54;
      var sx = cue.x - dir.x * back, sy = cue.y - dir.y * back;
      var ex = sx - dir.x * 168, ey = sy - dir.y * 168;
      var cg = ctx.createLinearGradient(sx, sy, ex, ey);
      cg.addColorStop(0, '#f3e2c0');
      cg.addColorStop(0.12, '#d8b678');
      cg.addColorStop(0.6, '#a97a44');
      cg.addColorStop(1, '#6d4826');
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineWidth = 7;
      ctx.strokeStyle = cg;
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      /* 팁 */
      ctx.beginPath();
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#2f6fb7';
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - dir.x * 8, sy - dir.y * 8);
      ctx.stroke();
    }

    balls.forEach(function (b) {
      if (!b.alive) return;

      /* 바닥 접촉 그림자 */
      var sh = ctx.createRadialGradient(b.x + b.r * 0.12, b.y + b.r * 0.42, b.r * 0.15, b.x + b.r * 0.12, b.y + b.r * 0.42, b.r * 1.25);
      sh.addColorStop(0, 'rgba(0,0,0,.40)');
      sh.addColorStop(0.55, 'rgba(0,0,0,.16)');
      sh.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.beginPath();
      ctx.ellipse(b.x + b.r * 0.12, b.y + b.r * 0.42, b.r * 1.18, b.r * 0.92, 0, 0, 6.283);
      ctx.fillStyle = sh;
      ctx.fill();

      /* 구 본체 */
      var g = ctx.createRadialGradient(b.x - b.r * 0.38, b.y - b.r * 0.45, b.r * 0.06, b.x, b.y, b.r * 1.02);
      if (b.kind === 'cue') {
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#f7f5ec');
        g.addColorStop(0.82, '#ddd9cc'); g.addColorStop(1, '#b9b4a4');
      } else if (b.kind === 'red') {
        g.addColorStop(0, '#ff8f78'); g.addColorStop(0.42, '#e0452f');
        g.addColorStop(0.82, '#a8271a'); g.addColorStop(1, '#6d150c');
      } else if (b.kind === 'black') {
        g.addColorStop(0, '#7d7d7d'); g.addColorStop(0.45, '#2b2b2b');
        g.addColorStop(0.85, '#111111'); g.addColorStop(1, '#000000');
      } else if (b.kind === 'yellow') {
        g.addColorStop(0, '#fff3b0'); g.addColorStop(0.42, '#f0cd45');
        g.addColorStop(0.82, '#bf9518'); g.addColorStop(1, '#8a6a0c');
      } else {
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.34, b.color);
        g.addColorStop(0.85, 'rgba(0,0,0,.35)');
        g.addColorStop(1, 'rgba(0,0,0,.55)');
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = g;
      ctx.fill();

      /* 아래쪽 반사광 */
      var bl = ctx.createRadialGradient(b.x + b.r * 0.22, b.y + b.r * 0.55, b.r * 0.05, b.x + b.r * 0.22, b.y + b.r * 0.55, b.r * 0.85);
      bl.addColorStop(0, 'rgba(255,255,255,.22)');
      bl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = bl;
      ctx.fill();

      /* 하이라이트(반사) */
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 0.96, 0, 6.283);
      ctx.clip();
      var hl = ctx.createRadialGradient(b.x - b.r * 0.36, b.y - b.r * 0.44, 0, b.x - b.r * 0.36, b.y - b.r * 0.44, b.r * 0.42);
      hl.addColorStop(0, 'rgba(255,255,255,.95)');
      hl.addColorStop(0.55, 'rgba(255,255,255,.35)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.34, b.y - b.r * 0.42, b.r * 0.30, b.r * 0.22, -0.6, 0, 6.283);
      ctx.fillStyle = hl;
      ctx.fill();
      ctx.restore();

      /* 스펙큘러 하이라이트 (작고 밝은 반사점) */
      var sp = ctx.createRadialGradient(
        b.x - b.r * 0.42, b.y - b.r * 0.46, 0,
        b.x - b.r * 0.42, b.y - b.r * 0.46, b.r * 0.34
      );
      sp.addColorStop(0, 'rgba(255,255,255,1)');
      sp.addColorStop(0.42, 'rgba(255,255,255,.72)');
      sp.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(b.x - b.r * 0.40, b.y - b.r * 0.44, b.r * 0.30, b.r * 0.24, -0.5, 0, 6.283);
      ctx.fillStyle = sp;
      ctx.fill();



      if (b.kind === 'object') {
        /* 흰 숫자 원 */
        var nc = ctx.createRadialGradient(b.x - b.r * 0.15, b.y - b.r * 0.2, 1, b.x, b.y, b.r * 0.56);
        nc.addColorStop(0, '#ffffff');
        nc.addColorStop(0.8, '#f7f3e6');
        nc.addColorStop(1, '#ded7c4');
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.52, 0, 6.283);
        ctx.fillStyle = nc;
        ctx.fill();
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = 'rgba(0,0,0,.15)';
        ctx.stroke();
        ctx.fillStyle = '#1d2a14';
        ctx.font = '800 ' + Math.round(b.r * 0.92) + 'px "Pretendard","Malgun Gothic",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.num), b.x, b.y + 0.5);
      }
    });
      drawSpinDot();
  }

  function arrow(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var a = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.4) * 10, y2 - Math.sin(a - 0.4) * 10);
    ctx.lineTo(x2 - Math.cos(a + 0.4) * 10, y2 - Math.sin(a + 0.4) * 10);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function raycastCue(dir) {
    var best = { t: 1e9, ball: null };
    var i, b, ox, oy, bq, c, disc, t;

    for (i = 0; i < balls.length; i++) {
      b = balls[i];
      if (!b.alive || b === cue) continue;
      ox = cue.x - b.x; oy = cue.y - b.y;
      bq = ox * dir.x + oy * dir.y;
      c = ox * ox + oy * oy - (2 * R) * (2 * R);
      disc = bq * bq - c;
      if (disc < 0) continue;
      t = -bq - Math.sqrt(disc);
      if (t > 0.5 && t < best.t) best = { t: t, ball: b };
    }

    var tx = dir.x > 0 ? (MAXX - R - cue.x) / dir.x : dir.x < 0 ? (MINX + R - cue.x) / dir.x : 1e9;
    var ty = dir.y > 0 ? (MAXY - R - cue.y) / dir.y : dir.y < 0 ? (MINY + R - cue.y) / dir.y : 1e9;
    var tw = Math.max(0, Math.min(tx, ty));
    if (tw > 0.5 && tw < best.t) best = { t: tw, ball: null };
    return best;
  }

  function diamond(x, y) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8); ctx.restore();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function loop() {
    if (moving) step();
    draw();
    requestAnimationFrame(loop);
  }

  /* ---------- 입력 ---------- */
  function toWorld(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  cv.addEventListener('pointerdown', function (e) {
    if (moving || !cue.alive || over) return;
    var p = toWorld(e);
    if (Math.hypot(p.x - cue.x, p.y - cue.y) > R * 3.4) return;
    dragging = true;
    if (spinPad) spinPad.classList.add('is-aiming');
    showSpinFloat();
  });

  var floatDrag = false;

  function inFloat(e) {
    if (!spinFloat || spinFloat.hidden) return false;
    var r = spinFloat.getBoundingClientRect();
    return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  }

  var SPIN_ZONE_K = 3.2;   /* 공 반지름 × 이 배수 안쪽 = 당점 조정 */

  window.addEventListener('pointermove', function (e) {
    if (floatDrag) { setSpinFromEvent(e, spinFloat); return; }
    if (!dragging) return;
    var p = toWorld(e);
    var dx = p.x - cue.x, dy = p.y - cue.y;
    var d = Math.hypot(dx, dy) || 0.0001;
    var zone = R * SPIN_ZONE_K;

    if (d < zone) {
      /* 공 위로 되돌리면 당점 조정 (조준·세기는 마지막 값 유지) */
      var nx = dx / zone, ny = dy / zone;
      var len = Math.hypot(nx, ny);
      if (len > 1) { nx /= len; ny /= len; }
      spin.x = +nx.toFixed(3);
      spin.y = +(-ny).toFixed(3);
      spinZone = true;
      if (spinCv) spinCv.setAttribute('aria-valuetext', spin.x + ',' + spin.y);
      spinFloat.classList.add('is-spin-mode');
      showSpinFloat();
      paintSpinBall(spinCv); paintSpinBall(spinFloat);
      draw();
      return;
    }

    spinZone = false;
    if (spinFloat) spinFloat.classList.remove('is-spin-mode');
    hideSpinFloat();
    aim.x = dx / d; aim.y = dy / d;
    aim.power = Math.min(1, d / 240);
    lastAim = { x: aim.x, y: aim.y, power: aim.power };
    syncPowerUI();
    draw();
  });

  window.addEventListener('pointerup', function (e) {
    if (floatDrag) { floatDrag = false; paintSpinBall(); draw(); return; }
    if (!dragging) return;
    dragging = false;
    spinZone = false;
    if (spinPad) spinPad.classList.remove('is-aiming');
    if (spinFloat) spinFloat.classList.remove('is-spin-mode');
    hideSpinFloat();
    var shotPower = lastAim.power;
    if (shotPower < 0.06) { aim.power = 0; syncPowerUI(); draw(); return; }

    shots++;
    beginShot();
    cue.vx = lastAim.x * MAX_POWER * shotPower;
    cue.vy = lastAim.y * MAX_POWER * shotPower;
    aim.x = lastAim.x; aim.y = lastAim.y;
    moving = true;
    updateStats();
    aim.power = 0;
    syncPowerUI();
    draw();
  });

  cv.addEventListener('pointercancel', function () { dragging = false; if (spinPad) spinPad.classList.remove('is-aiming'); hideSpinFloat(); });

  function showSpinFloat() {
    if (!spinFloat) return;
    spinFloat.hidden = false;
    paintSpinBall(spinFloat);
    moveSpinFloat();
  }

  function hideSpinFloat() {
    if (!spinFloat) return;
    spinFloat.hidden = true;
  }

  function moveSpinFloat() {
    if (!spinFloat || spinFloat.hidden) return;
    var r = cv.getBoundingClientRect();
    var size = spinFloat.offsetWidth || 132, pad = 10;
    /* 공 위쪽에 확대경처럼 띄워 조준선을 가리지 않게 */
    var sx = r.left + (cue.x / W) * r.width;
    var sy = r.top + (cue.y / H) * r.height;
    var x = sx - size / 2, y = sy - size - 18;
    if (y < pad) y = sy + 18;
    if (x < pad) x = pad;
    if (x + size > window.innerWidth - pad) x = window.innerWidth - size - pad;
    spinFloat.style.left = Math.round(x) + 'px';
    spinFloat.style.top = Math.round(y) + 'px';
    paintSpinBall(spinFloat);
  }

  /* ---------- 당점 다이얼 (공 그림 위 클릭/드래그) ---------- */
  var spinCv = document.getElementById('spinBall');
  var spinPad = document.getElementById('spinPad');
  var spinFloat = document.getElementById('spinFloat');
  var SCOPE = 0.82;   /* 공 반지름 대비 유효 범위 */

  function paintSpinBall(target) {
    var cvx = target || spinCv;
    if (!cvx) return;
    var c = cvx.getContext('2d');
    var S = cvx.width, R2 = S / 2 - 6;
    c.clearRect(0, 0, S, S);

    /* 공 본체 */
    var g = c.createRadialGradient(S * 0.38, S * 0.34, R2 * 0.15, S * 0.5, S * 0.5, R2 * 1.05);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.55, '#f4f6ef');
    g.addColorStop(1, '#cfd8c6');
    c.beginPath(); c.arc(S / 2, S / 2, R2, 0, 6.283); c.fillStyle = g; c.fill();

    /* 십자선 */
    c.strokeStyle = 'rgba(90,110,80,.28)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(S / 2, S / 2 - R2 * 0.88); c.lineTo(S / 2, S / 2 + R2 * 0.88);
    c.moveTo(S / 2 - R2 * 0.88, S / 2); c.lineTo(S / 2 + R2 * 0.88, S / 2);
    c.stroke();

    /* 유효 범위 링 */
    c.beginPath(); c.arc(S / 2, S / 2, R2 * SCOPE, 0, 6.283);
    c.strokeStyle = 'rgba(74,138,58,.22)'; c.lineWidth = 1.5; c.stroke();

    /* 선택된 당점 */
    var px = S / 2 + spin.x * R2 * SCOPE;
    var py = S / 2 - spin.y * R2 * SCOPE;
    c.beginPath(); c.arc(px, py, R2 * 0.115, 0, 6.283);
    c.fillStyle = '#3f7a33'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.stroke();
  }

  function setSpinFromEvent(ev, source) {
    var ref = source || spinCv;
    if (!ref) return;
    var r = ref.getBoundingClientRect();
    var R2 = r.width / 2 - (6 / ref.width) * r.width;
    var nx = (ev.clientX - r.left - r.width / 2) / (R2 * SCOPE);
    var ny = (ev.clientY - r.top - r.height / 2) / (R2 * SCOPE);
    var len = Math.hypot(nx, ny);
    if (len > 1) { nx /= len; ny /= len; }
    spin.x = +nx.toFixed(3);
    spin.y = +(-ny).toFixed(3);
    spinCv.setAttribute('aria-valuetext', spin.x + ',' + spin.y);
    paintSpinBall();
    paintSpinBall(spinFloat);
    draw();
  }

  if (spinCv) {
    var spinDrag = false;
    spinCv.addEventListener('pointerdown', function (ev) {
      spinDrag = true; spinCv.setPointerCapture(ev.pointerId); setSpinFromEvent(ev);
    });
    spinCv.addEventListener('pointermove', function (ev) { if (spinDrag) setSpinFromEvent(ev); });
    spinCv.addEventListener('pointerup', function () { spinDrag = false; });
    spinCv.addEventListener('pointercancel', function () { spinDrag = false; });
    if (spinFloat) {
      spinFloat.style.pointerEvents = 'auto';
      spinFloat.addEventListener('pointerdown', function (ev) {
        ev.stopPropagation();
        floatDrag = true;
        setSpinFromEvent(ev, spinFloat);
      });
    }

    spinCv.addEventListener('dblclick', function () {
      spin.x = 0; spin.y = 0; paintSpinBall(); draw();
    });
    paintSpinBall();
  }

  var btnAgain = document.getElementById('btnAgain');
  var btnCloseResult = document.getElementById('btnCloseResult');
  if (btnAgain) btnAgain.addEventListener('click', function () { newGame(); });
  if (btnCloseResult) btnCloseResult.addEventListener('click', function () {
    if (el.panel) el.panel.hidden = true;
  });

  var modeSeg = document.getElementById('modeSeg');
  if (modeSeg) {
    modeSeg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]');
      if (!b || moving) return;
      mode = b.dataset.mode;
      applySpec();
      if (typeof fitCanvas === 'function') fitCanvas();
      Array.prototype.forEach.call(modeSeg.children, function (x) {
        x.classList.toggle('active', x === b);
      });
      newGame();
      msg(mode === 'three' ? '3구: 빨강과 노랑을 모두 맞히면 득점'
        : mode === 'four' ? '4구: 빨강과 검정을 모두 맞히면 득점'
          : '포켓볼: 색공을 넣으세요 (흰 공은 파울)');
    });
  }

  document.getElementById('btnNew').addEventListener('click', newGame);
  document.getElementById('btnReset').addEventListener('click', function () {
    if (moving) return;
    setup(); msg('공 위치를 초기화했습니다');
  });

  window.addEventListener('resize', fitCanvas);

  /* 세기 슬라이더 (정밀 조정) */
  if (el.range) {
    el.range.addEventListener('input', function () {
      if (moving || over) { el.range.value = String(Math.round(aim.power * 100)); return; }
      aim.power = Math.max(0, Math.min(1, (+el.range.value) / 100));
      syncPowerUI();
      draw();
    });
  }

  /* 키보드 미세 조정: ←→ 방향, ↑↓ 세기 */
  window.addEventListener('keydown', function (e) {
    if (moving || over) return;
    var k = e.key;
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === '+' || k === '-') {
      e.preventDefault();
      var step = e.shiftKey ? 0.1 : 0.01;
      aim.power = Math.max(0, Math.min(1, aim.power + (k === 'ArrowUp' || k === '+' ? step : -step)));
      syncPowerUI();
      draw();
    }
  });

  var um = /[?&]mode=(three|four|pocket)/.exec(location.search);
  if (um) {
    mode = um[1];
    if (modeSeg) Array.prototype.forEach.call(modeSeg.children, function (x) {
      x.classList.toggle('active', x.dataset.mode === mode);
    });
  }

  newGame();
  fitCanvas();
  requestAnimationFrame(loop);

  if (/[?&]rulecheck=1/.test(location.search)) {
    var cases = [
      ['three', { red: 1, yellow: 1 }, 3, true],
      ['three', { red: 1, yellow: 1 }, 2, false],
      ['three', { red: 1 }, 3, false],
      ['four', { red: 1, black: 1 }, 0, true],
      ['four', { red: 1 }, 0, false],
      ['pocket', { potted: 1, foul: false }, 0, true],
      ['pocket', { potted: 1, foul: true }, 0, false],
      ['pocket', { potted: 0, foul: false }, 0, false]
    ];
    var okAll = true, log = [];
    for (var ci = 0; ci < cases.length; ci++) {
      var c = cases[ci];
      var got = judgeShot(c[0], c[1], c[2]).scored;
      if (got !== c[3]) okAll = false;
      log.push(c[0] + ':' + (got ? 'O' : 'X'));
    }
    document.body.setAttribute('data-rulecheck', (okAll ? 'PASS' : 'FAIL') + '|' + log.join(','));
  }

  if (/[?&]spec=1/.test(location.search)) {
    setTimeout(function () {
      var fh = H - RAIL * 2;
      document.body.setAttribute('data-spec',
        'mode=' + mode +
        '|canvas=' + W + 'x' + H.toFixed(1) +
        '|felt=' + FL.toFixed(1) + 'x' + fh.toFixed(1) +
        '|feltRatio=' + (FL / fh).toFixed(3) +
        '|railPct=' + (RAIL / FL * 100).toFixed(2) +
        '|ballD=' + (R * 2).toFixed(2) +
        '|ballRatio=1/' + (FL / (R * 2)).toFixed(1) +
        '|pocket=' + POCKET_R);
    }, 900);
  }

  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var ma = /[?&]angle=(-?\d+(?:\.\d+)?)/.exec(location.search);
      if (ma) {
        var ang = parseFloat(ma[1]) * Math.PI / 180;
        cue.vx = Math.cos(ang) * MAX_POWER * 0.9;
        cue.vy = Math.sin(ang) * MAX_POWER * 0.9;
      } else {
        var target = balls[1];
        var dx = target.x - cue.x, dy = target.y - cue.y, d = Math.hypot(dx, dy) || 1;
        cue.vx = dx / d * MAX_POWER * 0.9;
        cue.vy = dy / d * MAX_POWER * 0.9;
      }
      moving = true; shots++; beginShot();
      var seen = {};
      var d0 = Math.hypot(cue.vx, cue.vy) || 1, dx0 = cue.vx / d0, dy0 = cue.vy / d0;
      var afterDot = null;
      for (var i = 0; i < 900; i++) {
        var hadTouch = Object.keys(touches).length > 0;
        step();
        if (!hadTouch && Object.keys(touches).length > 0 && afterDot === null) {
          afterDot = cue.vx * dx0 + cue.vy * dy0;
        }
        Object.keys(touches).forEach(function (k) { seen[k] = true; });
      }
      var msg2 = 'T|mode=' + mode + '|shots=' + shots + '|score=' + score
        + '|balls=' + balls.length + '|left=' + objectLeft()
        + '|seen=' + Object.keys(seen).join(',') + '|pockets=' + pockets.length
        + '|moved=' + (Math.round(cue.x) + ',' + Math.round(cue.y))
        + '|p1=' + p1Score + '|p2=' + p2Score + '|turn=' + turnP
        + '|afterDot=' + (afterDot === null ? 'na' : afterDot.toFixed(2))
        + '|spin=' + spin.x + ',' + spin.y
        + '|cushion=' + cushionCount + '|lastCushion=' + lastCushion + '|over=' + over;
      document.body.setAttribute('data-auto', msg2);
    }, 400);
  }
})();
