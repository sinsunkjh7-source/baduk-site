/* 당구 — 바둑스쿨 Fun
   모드: 3구 / 4구 / 포켓볼 (한 페이지에서 선택) */
(function () {
  'use strict';

  var cv = document.getElementById('table');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 960, H = 480, RAIL = 36;
  var MINX = RAIL, MAXX = W - RAIL, MINY = RAIL, MAXY = H - RAIL;
  var R = 15, POCKET_R = 26;
  var FRICTION = 0.9885, STOP = 0.06, CUSHION = 0.92, MAX_POWER = 26;

  var POCKET_COLORS = ['#f2c53d', '#2e6fb7', '#c0392b', '#7d3fa8', '#e07b2a', '#2f8f5b', '#8e2418', '#1d1d1d', '#e6d34a'];

  var mode = 'three';
  var balls = [], pockets = [], cue = null;
  var dragging = false, aim = { x: 0, y: 0, power: 0 }, moving = false;
  var touches = {};
  var score = 0, shots = 0;
  var best = +(localStorage.getItem('bkBillBest') || 0);
  var over = false;

  var el = {
    score: document.getElementById('score'),
    shots: document.getElementById('shots'),
    best: document.getElementById('best'),
    turn: document.getElementById('turnBar'),
    power: document.getElementById('powerFill'),
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
    var off = 8;
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
    if (el.power) el.power.style.width = '0%';
    syncText();
    updateStats();
    draw();
  }

  function newGame() {
    score = 0; shots = 0;
    msg('');
    setup();
  }

  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  function syncText() {
    var t = mode === 'three' ? '당구 3구' : mode === 'four' ? '당구 4구' : '포켓볼';
    if (el.title) el.title.textContent = t;
    if (el.desc) {
      el.desc.innerHTML = mode === 'three'
        ? '내 공(흰색)으로 빨강·노랑을 <b>모두 맞히면</b> 1점입니다.'
        : mode === 'four'
          ? '내 공(흰색)으로 <b>빨강과 검정</b>을 모두 맞히면 1점입니다. 노랑은 상대 공입니다.'
          : '색공을 포켓에 넣으면 1점. <b>흰 공을 넣으면 파울</b>(–1점)입니다.';
    }
    if (el.leftWrap) el.leftWrap.hidden = mode !== 'pocket';
  }

  function objectLeft() {
    return balls.filter(function (b) { return b.kind === 'object' && b.alive; }).length;
  }

  function updateStats() {
    if (el.score) el.score.textContent = score;
    if (el.shots) el.shots.textContent = shots;
    if (score > best) { best = score; localStorage.setItem('bkBillBest', String(best)); }
    if (el.best) el.best.textContent = best;
    if (el.left) el.left.textContent = String(objectLeft());
    if (el.turn) el.turn.textContent = moving ? '공이 움직이는 중…' : (over ? '게임 종료' : '당신 차례');
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

      if (b.x - b.r < MINX) { b.x = MINX + b.r; b.vx = -b.vx * CUSHION; }
      if (b.x + b.r > MAXX) { b.x = MAXX - b.r; b.vx = -b.vx * CUSHION; }
      if (b.y - b.r < MINY) { b.y = MINY + b.r; b.vy = -b.vy * CUSHION; }
      if (b.y + b.r > MAXY) { b.y = MAXY - b.r; b.vy = -b.vy * CUSHION; }

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

        if (A.kind === 'cue' && B.kind !== 'cue') touches[B.kind] = true;
        if (B.kind === 'cue' && A.kind !== 'cue') touches[A.kind] = true;
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
              score = Math.max(0, score - 1);
              msg('파울! 흰 공을 넣었습니다 (–1점)');
              setTimeout(function () {
                cue.x = 230; cue.y = H / 2; cue.vx = cue.vy = 0; cue.alive = true;
              }, 450);
            } else {
              score++;
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

  function endShot() {
    moving = false;

    if (mode === 'pocket') {
      if (objectLeft() === 0 && !over) {
        over = true;
        msg('클리어! ' + shots + '번 시도 · ' + score + '점');
      }
    } else {
      var need = mode === 'four' ? ['red', 'black'] : ['red', 'yellow'];
      var hitBoth = need.every(function (k) { return touches[k]; });
      if (hitBoth) {
        score++;
        msg('득점! (' + (mode === 'four' ? '빨강 + 검정' : '빨강 + 노랑') + ')');
      } else {
        msg((touches.red || touches.yellow || touches.black) ? '한 쪽만 맞혔습니다 — 다시 시도' : '빗나갔습니다 — 다시 시도');
      }
      touches = {};
    }

    updateStats();
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var wood = ctx.createLinearGradient(0, 0, 0, H);
    wood.addColorStop(0, '#8a5a33'); wood.addColorStop(0.5, '#6b4526'); wood.addColorStop(1, '#7d5230');
    ctx.fillStyle = wood;
    roundRect(ctx, 0, 0, W, H, 18); ctx.fill();

    var felt = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, Math.max(W, H) * 0.7);
    felt.addColorStop(0, '#35905b'); felt.addColorStop(1, '#20643d');
    ctx.fillStyle = felt;
    roundRect(ctx, RAIL, RAIL, W - RAIL * 2, H - RAIL * 2, 10); ctx.fill();

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
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_R, 0, 6.283);
        ctx.fillStyle = '#0e1410';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.stroke();
      });
    }

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

      ctx.beginPath();
      ctx.arc(cue.x, cue.y, cue.r + 5 + aim.power * 8, 0, 6.283);
      ctx.strokeStyle = 'rgba(255,235,150,' + (0.35 + aim.power * 0.5) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    balls.forEach(function (b) {
      if (!b.alive) return;

      ctx.beginPath();
      ctx.ellipse(b.x + 2, b.y + 4, b.r * 0.98, b.r * 0.86, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fill();

      var g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.15, b.x, b.y, b.r);
      if (b.kind === 'cue') { g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#f2f1ea'); g.addColorStop(1, '#d8d6cc'); }
      else if (b.kind === 'red') { g.addColorStop(0, '#e05a48'); g.addColorStop(0.65, '#c0392b'); g.addColorStop(1, '#8e2418'); }
      else if (b.kind === 'black') { g.addColorStop(0, '#5a5a5a'); g.addColorStop(0.65, '#262626'); g.addColorStop(1, '#0b0b0b'); }
      else if (b.kind === 'yellow') { g.addColorStop(0, '#f6dd76'); g.addColorStop(0.65, '#e8c33a'); g.addColorStop(1, '#b8921f'); }
      else { g.addColorStop(0, '#ffffff77'); g.addColorStop(0.3, b.color); g.addColorStop(1, '#00000055'); }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.stroke();

      if (b.kind === 'object') {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 0.52, 0, 6.283);
        ctx.fillStyle = '#fffaf0';
        ctx.fill();
        ctx.fillStyle = '#22301a';
        ctx.font = '700 ' + Math.round(b.r * 0.95) + 'px "Pretendard","Malgun Gothic",sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(b.num), b.x, b.y + 0.5);
      }
    });
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
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var p = toWorld(e);
    var dx = p.x - cue.x, dy = p.y - cue.y, d = Math.hypot(dx, dy) || 1;
    aim.x = dx / d; aim.y = dy / d;
    aim.power = Math.min(1, d / 240);
    if (el.power) el.power.style.width = Math.round(aim.power * 100) + '%';
    draw();
  });

  cv.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    if (aim.power < 0.06) { aim.power = 0; if (el.power) el.power.style.width = '0%'; draw(); return; }

    shots++;
    touches = {};
    cue.vx = aim.x * MAX_POWER * aim.power;
    cue.vy = aim.y * MAX_POWER * aim.power;
    moving = true;
    updateStats();
    aim.power = 0;
    if (el.power) el.power.style.width = '0%';
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

  function fit() {
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    draw();
  }

  window.addEventListener('resize', fit);

  var um = /[?&]mode=(three|four|pocket)/.exec(location.search);
  if (um) {
    mode = um[1];
    if (modeSeg) Array.prototype.forEach.call(modeSeg.children, function (x) {
      x.classList.toggle('active', x.dataset.mode === mode);
    });
  }

  newGame();
  fit();
  requestAnimationFrame(loop);

  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var target = balls[1];
      var dx = target.x - cue.x, dy = target.y - cue.y, d = Math.hypot(dx, dy) || 1;
      cue.vx = dx / d * MAX_POWER * 0.9;
      cue.vy = dy / d * MAX_POWER * 0.9;
      moving = true; shots++; touches = {};
      var seen = {};
      for (var i = 0; i < 900; i++) {
        step();
        Object.keys(touches).forEach(function (k) { seen[k] = true; });
      }
      document.title = 'T|mode=' + mode + '|shots=' + shots + '|score=' + score
        + '|balls=' + balls.length + '|left=' + objectLeft()
        + '|seen=' + Object.keys(seen).join(',') + '|pockets=' + pockets.length;
    }, 400);
  }
})();
