/* 당구 3구 (캐롬) — 바둑스쿨 Fun */
(function () {
  'use strict';

  var cv = document.getElementById('table');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 960, H = 480;           /* 논리 좌표 */
  var RAIL = 36;                   /* 나무 테두리 두께 */
  var MINX = RAIL, MAXX = W - RAIL, MINY = RAIL, MAXY = H - RAIL;
  var R = 13;                      /* 공 반지름 */
  var FRICTION = 0.9885;
  var STOP = 0.06;
  var CUSHION = 0.92;
  var MAX_POWER = 26;

  var balls = [];
  var cue = null;
  var dragging = false;
  var aim = { x: 0, y: 0, power: 0 };
  var moving = false;
  var touches = {};
  var mode = 'three';        /* three: 3구 / four: 4구 */
  var score = 0, shots = 0;
  var best = +(localStorage.getItem('bkBillBest') || 0);

  var el = {
    score: document.getElementById('score'),
    shots: document.getElementById('shots'),
    best: document.getElementById('best'),
    turn: document.getElementById('turnBar'),
    power: document.getElementById('powerFill'),
    msg: document.getElementById('msg')
  };

  function mkBall(x, y, color, kind) {
    return { x: x, y: y, vx: 0, vy: 0, color: color, kind: kind, r: R };
  }

  function resetPositions() {
    if (mode === 'four') {
      balls = [
        mkBall(230, 240, '#f6f5ef', 'cue'),
        mkBall(430, 120, '#e8c33a', 'yellow'),
        mkBall(650, 200, '#c0392b', 'red'),
        mkBall(650, 345, '#262626', 'black')
      ];
    } else {
      balls = [
        mkBall(240, 240, '#f6f5ef', 'cue'),
        mkBall(640, 170, '#c0392b', 'red'),
        mkBall(640, 320, '#e8c33a', 'yellow')
      ];
    }
    cue = balls[0];
    touches = {};
    moving = false;
    aim.power = 0;
    el.power.style.width = '0%';
    draw();
  }

  function newGame() {
    score = 0; shots = 0;
    el.score.textContent = '0';
    el.shots.textContent = '0';
    msg('');
    resetPositions();
    updateTurn();
  }

  function msg(t) {
    el.msg.hidden = !t;
    el.msg.textContent = t || '';
  }

  function updateTurn() {
    el.turn.textContent = moving ? '공이 움직이는 중…' : '당신 차례';
    el.score.textContent = score;
    el.shots.textContent = shots;
    if (score > best) { best = score; localStorage.setItem('bkBillBest', String(best)); }
    el.best.textContent = best;
  }

  /* ---------- 물리 ---------- */
  function step() {
    var active = false;

    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      b.x += b.vx; b.y += b.vy;
      b.vx *= FRICTION; b.vy *= FRICTION;
      if (Math.abs(b.vx) < STOP) b.vx = 0;
      if (Math.abs(b.vy) < STOP) b.vy = 0;

      /* 쿠션 */
      if (b.x - b.r < MINX) { b.x = MINX + b.r; b.vx = -b.vx * CUSHION; }
      if (b.x + b.r > MAXX) { b.x = MAXX - b.r; b.vx = -b.vx * CUSHION; }
      if (b.y - b.r < MINY) { b.y = MINY + b.r; b.vy = -b.vy * CUSHION; }
      if (b.y + b.r > MAXY) { b.y = MAXY - b.r; b.vy = -b.vy * CUSHION; }

      if (b.vx || b.vy) active = true;
    }

    /* 공 충돌 */
    for (var a = 0; a < balls.length; a++) {
      for (var c = a + 1; c < balls.length; c++) {
        var A = balls[a], B = balls[c];
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

        if (A.kind === 'cue' && B.kind !== 'cue') touches[B.kind] = true;
        if (B.kind === 'cue' && A.kind !== 'cue') touches[A.kind] = true;
      }
    }

    if (moving && !active) endShot();
    return active;
  }

  function endShot() {
    moving = false;
    var need = mode === 'four' ? ['red', 'black'] : ['red', 'yellow'];
    var hitBoth = need.every(function (k) { return touches[k]; });
    if (hitBoth) {
      score++;
      msg('득점! (' + (mode === 'four' ? '빨강 + 검정' : '빨강 + 노랑') + ')');
    } else {
      msg((touches.red || touches.yellow || touches.black) ? '한 쪽만 맞혔습니다 — 다시 시도' : '빗나갔습니다 — 다시 시도');
    }
    touches = {};
    updateTurn();
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* 나무 테두리 */
    var wood = ctx.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, '#8a5a33'); wood.addColorStop(0.5, '#6b4526'); wood.addColorStop(1, '#7d5230');
    ctx.fillStyle = wood;
    roundRect(ctx, 0, 0, W, H, 18); ctx.fill();

    /* 펠트 */
    var felt = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, Math.max(W, H) * 0.7);
    felt.addColorStop(0, '#35905b'); felt.addColorStop(1, '#20643d');
    ctx.fillStyle = felt;
    roundRect(ctx, RAIL, RAIL, W - RAIL * 2, H - RAIL * 2, 10); ctx.fill();

    /* 다이아몬드 표시 */
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    for (var i = 1; i <= 7; i++) {
      var x = RAIL + (W - RAIL * 2) * (i / 8);
      diamond(x, RAIL / 2); diamond(x, H - RAIL / 2);
    }
    for (var j = 1; j <= 3; j++) {
      var y = RAIL + (H - RAIL * 2) * (j / 4);
      diamond(RAIL / 2, y); diamond(W - RAIL / 2, y);
    }

    /* 조준선 */
    if (dragging && aim.power > 0) {
      var len = 40 + aim.power * 260;
      ctx.save();
      ctx.setLineDash([10, 9]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255,255,255,.75)';
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + aim.x * len, cue.y + aim.y * len);
      ctx.stroke();
      ctx.restore();

      /* 힘 방향 화살 */
      ctx.beginPath();
      ctx.arc(cue.x, cue.y, cue.r + 5 + aim.power * 8, 0, 6.283);
      ctx.strokeStyle = 'rgba(255,235,150,' + (0.35 + aim.power * 0.5) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    /* 공 */
    balls.forEach(function (b) {
      ctx.beginPath();
      ctx.ellipse(b.x + 2, b.y + 4, b.r * 0.98, b.r * 0.86, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fill();

      var g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.15, b.x, b.y, b.r);
      if (b.kind === 'cue') { g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#f2f1ea'); g.addColorStop(1, '#d8d6cc'); }
      else if (b.kind === 'red') { g.addColorStop(0, '#e05a48'); g.addColorStop(0.65, '#c0392b'); g.addColorStop(1, '#8e2418'); }
      else if (b.kind === 'black') { g.addColorStop(0, '#5a5a5a'); g.addColorStop(0.65, '#262626'); g.addColorStop(1, '#0b0b0b'); }
      else { g.addColorStop(0, '#f6dd76'); g.addColorStop(0.65, '#e8c33a'); g.addColorStop(1, '#b8921f'); }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.stroke();
    });
  }

  function diamond(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
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

  /* ---------- 루프 ---------- */
  function loop() {
    var active = moving ? step() : false;
    draw();
    if (moving && !active) { /* endShot은 step 안에서 처리 */ }
    requestAnimationFrame(loop);
  }

  /* ---------- 입력 ---------- */
  function toWorld(e) {
    var r = cv.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }

  cv.addEventListener('pointerdown', function (e) {
    if (moving) return;
    var p = toWorld(e);
    if (Math.hypot(p.x - cue.x, p.y - cue.y) > R * 3.4) return;
    dragging = true;
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var p = toWorld(e);
    var dx = p.x - cue.x, dy = p.y - cue.y;
    var d = Math.hypot(dx, dy) || 1;
    aim.x = dx / d; aim.y = dy / d;
    aim.power = Math.min(1, d / 240);
    el.power.style.width = Math.round(aim.power * 100) + '%';
    draw();
  });

  cv.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    dragging = false;
    if (aim.power < 0.06) { aim.power = 0; el.power.style.width = '0%'; draw(); return; }

    shots++;
    touches = {};
    cue.vx = aim.x * MAX_POWER * aim.power;
    cue.vy = aim.y * MAX_POWER * aim.power;

    moving = true;
    updateTurn();
    aim.power = 0;
    el.power.style.width = '0%';
    draw();
  });

  cv.addEventListener('pointercancel', function () { dragging = false; });

  var modeSeg = document.getElementById('modeSeg');
  if (modeSeg) {
    modeSeg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-mode]');
      if (!b || moving) return;
      mode = b.dataset.mode;
      Array.prototype.forEach.call(modeSeg.children, function (x) {
        x.classList.toggle('active', x === b);
      });
      newGame();
      syncModeText();
      msg(mode === 'four' ? '4구: 빨강과 검정을 모두 맞히면 득점' : '3구: 빨강과 노랑을 모두 맞히면 득점');
    });
  }

  function syncModeText() {
    var ti = document.getElementById('modeTitle');
    var de = document.getElementById('modeDesc');
    if (ti) ti.textContent = mode === 'four' ? '당구 4구' : '당구 3구';
    if (de) {
      de.innerHTML = mode === 'four'
        ? '내 공(흰색)으로 <b>빨강과 검정</b>을 모두 맞히면 1점입니다. 노랑은 상대 공입니다.'
        : '내 공(흰색)으로 빨강·노랑을 <b>모두 맞히면</b> 1점입니다. 공을 드래그해 방향과 세기를 정하세요.';
    }
  }
  window.bkSyncModeText = syncModeText;

  document.getElementById('btnNew').addEventListener('click', newGame);
  document.getElementById('btnReset').addEventListener('click', function () {
    if (moving) return;
    resetPositions(); msg('공 위치를 초기화했습니다');
  });

  function fitCanvas() {
    var css = cv.getBoundingClientRect().width || W;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.aspectRatio = W + ' / ' + H;
    draw();
  }

  window.addEventListener('resize', fitCanvas);
  newGame();
  syncModeText();
  fitCanvas();
  requestAnimationFrame(loop);

  /* URL_MODE: ?mode=four 로 4구 진입 (검증용) */
  var _um = /[?&]mode=(three|four)/.exec(location.search);
  if (_um) {
    mode = _um[1];
    var seg = document.getElementById('modeSeg');
    if (seg) {
      Array.prototype.forEach.call(seg.children, function (x) {
        x.classList.toggle('active', x.dataset.mode === mode);
      });
    }
    newGame();
    syncModeText();
  }

  /* AUTO_TEST: ?auto=1 — 물리를 동기적으로 600스텝 돌려 결과를 title에 남긴다 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var dx = balls[1].x - cue.x, dy = balls[1].y - cue.y;
      var d = Math.hypot(dx, dy) || 1;
      cue.vx = dx / d * MAX_POWER * 0.9;
      cue.vy = dy / d * MAX_POWER * 0.9;
      moving = true; shots++; touches = {};

      var seen = {};
      for (var i = 0; i < 700; i++) {
        step();
        Object.keys(touches).forEach(function (k) { seen[k] = true; });
      }

      document.title = 'T|shots=' + shots + '|score=' + score
        + '|seen=' + Object.keys(seen).join(',')
        + '|cue=' + Math.round(cue.x) + ',' + Math.round(cue.y)
        + '|moving=' + moving + '|mode=' + mode + '|balls=' + balls.length;
    }, 400);
  }
})();
