/* 포켓볼 — 바둑스쿨 Fun
   6개 포켓 · 색공 9개 · 흰 공 파울 */
(function () {
  'use strict';

  var cv = document.getElementById('table');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 960, H = 480, RAIL = 36;
  var MINX = RAIL, MAXX = W - RAIL, MINY = RAIL, MAXY = H - RAIL;
  var R = 15, POCKET_R = 27;
  var FRICTION = 0.9885, STOP = 0.06, CUSHION = 0.92, MAX_POWER = 26;

  var COLORS = ['#f2c53d', '#2e6fb7', '#c0392b', '#7d3fa8', '#e07b2a', '#2f8f5b', '#8e2418', '#1d1d1d', '#e6d34a'];

  var balls = [], pockets = [], cue = null;
  var dragging = false, aim = { x: 0, y: 0, power: 0 }, moving = false;
  var score = 0, shots = 0, potted = 0;
  var el = {
    score: document.getElementById('score'),
    left: document.getElementById('left'),
    shots: document.getElementById('shots'),
    turn: document.getElementById('turnBar'),
    power: document.getElementById('powerFill'),
    msg: document.getElementById('msg')
  };

  function mkBall(x, y, color, kind, num) {
    return { x: x, y: y, vx: 0, vy: 0, color: color, kind: kind, num: num || 0, r: R, alive: true };
  }

  function buildPockets() {
    var off = 10;
    pockets = [
      { x: MINX + off, y: MINY + off },
      { x: W / 2, y: MINY + off * 0.4 },
      { x: MAXX - off, y: MINY + off },
      { x: MINX + off, y: MAXY - off },
      { x: W / 2, y: MAXY - off * 0.4 },
      { x: MAXX - off, y: MAXY - off }
    ];
  }

  function resetPositions() {
    balls = [];
    cue = mkBall(250, H / 2, '#f6f5ef', 'cue', 0);
    balls.push(cue);

    var cx = 660, cy = H / 2, gap = R * 2.08;
    var idx = 0;
    for (var row = 0; row < 4 && idx < 9; row++) {
      for (var col = 0; col <= row && idx < 9; col++) {
        var x = cx + row * gap * 0.87;
        var y = cy - row * gap / 2 + col * gap;
        balls.push(mkBall(x, y, COLORS[idx], 'object', idx + 1));
        idx++;
      }
    }
    potted = 0;
    moving = false;
    aim.power = 0;
    el.power.style.width = '0%';
    el.left.textContent = String(balls.length - 1);
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

  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  function updateTurn() {
    el.turn.textContent = moving ? '공이 움직이는 중…' : '당신 차례';
    el.score.textContent = score;
    el.shots.textContent = shots;
    el.left.textContent = String(balls.filter(function (b) { return b.kind === 'object' && b.alive; }).length);
  }

  function step() {
    var active = false;

    balls.forEach(function (b) {
      if (!b.alive) return;
      b.x += b.vx; b.y += b.vy;
      b.vx *= FRICTION; b.vy *= FRICTION;
      if (Math.abs(b.vx) < STOP) b.vx = 0;
      if (Math.abs(b.vy) < STOP) b.vy = 0;

      if (b.x - b.r < MINX) { b.x = MINX + b.r; b.vx = -b.vx * CUSHION; }
      if (b.x + b.r > MAXX) { b.x = MAXX - b.r; b.vx = -b.vx * CUSHION; }
      if (b.y - b.r < MINY) { b.y = MINY + b.r; b.vy = -b.vy * CUSHION; }
      if (b.y + b.r > MAXY) { b.y = MAXY - b.r; b.vy = -b.vy * CUSHION; }

      if (b.vx || b.vy) active = true;
    });

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
      }
    }

    /* 포켓 판정 */
    balls.forEach(function (b) {
      if (!b.alive) return;
      for (var i = 0; i < pockets.length; i++) {
        if (Math.hypot(b.x - pockets[i].x, b.y - pockets[i].y) < POCKET_R * 0.82) {
          b.alive = false;
          b.vx = b.vy = 0;
          if (b.kind === 'cue') {
            score = Math.max(0, score - 1);
            msg('파울! 흰 공을 넣었습니다 (–1점)');
            setTimeout(function () {
              cue.x = 250; cue.y = H / 2; cue.vx = cue.vy = 0; cue.alive = true;
            }, 500);
          } else {
            score++;
            potted++;
            msg('득점! (' + score + '점)');
          }
          break;
        }
      }
    });

    if (moving && !active) endShot();
    return active;
  }

  function endShot() {
    moving = false;
    var remaining = balls.filter(function (b) { return b.kind === 'object' && b.alive; }).length;
    if (remaining === 0) {
      msg('클리어! ' + shots + '번 시도 · ' + score + '점');
    }
    updateTurn();
  }

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

    /* 포켓 */
    pockets.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R, 0, 6.283);
      ctx.fillStyle = '#0e1410';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,.14)';
      ctx.stroke();
    });

    /* 다이아몬드 */
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    for (var i = 1; i <= 7; i++) {
      var x = RAIL + (W - RAIL * 2) * (i / 8);
      diamond(x, RAIL / 2); diamond(x, H - RAIL / 2);
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

      ctx.beginPath();
      ctx.arc(cue.x, cue.y, cue.r + 5 + aim.power * 8, 0, 6.283);
      ctx.strokeStyle = 'rgba(255,235,150,' + (0.35 + aim.power * 0.5) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    /* 공 */
    balls.forEach(function (b) {
      if (!b.alive) return;
      ctx.beginPath();
      ctx.ellipse(b.x + 2, b.y + 4, b.r * 0.98, b.r * 0.86, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(0,0,0,.25)';
      ctx.fill();

      var g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.15, b.x, b.y, b.r);
      if (b.kind === 'cue') {
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#f2f1ea'); g.addColorStop(1, '#d8d6cc');
      } else {
        g.addColorStop(0, '#ffffff88');
        g.addColorStop(0.25, b.color);
        g.addColorStop(1, '#00000066');
      }

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, 6.283);
      ctx.fillStyle = g;
      ctx.fill();

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

  function toWorld(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  cv.addEventListener('pointerdown', function (e) {
    if (moving || !cue.alive) return;
    var p = toWorld(e);
    if (Math.hypot(p.x - cue.x, p.y - cue.y) > R * 4) return;
    dragging = true;
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var p = toWorld(e);
    var dx = p.x - cue.x, dy = p.y - cue.y, d = Math.hypot(dx, dy) || 1;
    aim.x = dx / d; aim.y = dy / d;
    aim.power = Math.min(1, d / 240);
    el.power.style.width = Math.round(aim.power * 100) + '%';
    draw();
  });

  cv.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    if (aim.power < 0.06) { aim.power = 0; el.power.style.width = '0%'; draw(); return; }
    shots++;
    cue.vx = aim.x * MAX_POWER * aim.power;
    cue.vy = aim.y * MAX_POWER * aim.power;
    moving = true;
    updateTurn();
    aim.power = 0;
    el.power.style.width = '0%';
    draw();
  });

  cv.addEventListener('pointercancel', function () { dragging = false; });

  document.getElementById('btnNew').addEventListener('click', newGame);
  document.getElementById('btnReset').addEventListener('click', function () {
    if (moving) return;
    resetPositions(); msg('공을 다시 배치했습니다');
  });

  function fit() {
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    draw();
  }

  window.addEventListener('resize', fit);
  buildPockets();
  newGame();
  fit();
  requestAnimationFrame(loop);

  /* AUTO_TEST: 색공을 향해 한 번 칩니다 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var target = balls[1];
      var dx = target.x - cue.x, dy = target.y - cue.y, d = Math.hypot(dx, dy) || 1;
      cue.vx = dx / d * MAX_POWER * 0.9;
      cue.vy = dy / d * MAX_POWER * 0.9;
      moving = true; shots++;
      var before = score;
      for (var i = 0; i < 900; i++) step();
      document.title = 'T|shots=' + shots + '|score=' + score
        + '|before=' + before
        + '|left=' + balls.filter(function (b) { return b.kind === 'object' && b.alive; }).length
        + '|pockets=' + pockets.length;
    }, 400);
  }
})();
