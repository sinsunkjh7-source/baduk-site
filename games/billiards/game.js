/* 당구 — 바둑스쿨 Fun
   모드: 3구 / 4구 / 포켓볼 (한 페이지에서 선택) */
(function () {
  'use strict';

  var cv = document.getElementById('table');
  var ctx = cv.getContext('2d');
  var RS = 1;   /* 렌더 배율: 화면 폭에 맞춰 1~2.5배로 그린다 */

  var W = 960, H = 516, RAIL = 36;
  var MINX = RAIL, MAXX = W - RAIL, MINY = RAIL, MAXY = H - RAIL;
  var FL = 888;                        /* 플레이필드 길이(px) = W - 2*RAIL */
  var R = +(FL * (61.5 / 2840) / 2).toFixed(2);   /* 캐럼 규격: 지름 61.5mm / 2840mm */
  var POCKET_R = 0;
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
    /* 모드별 실제 규격 비율 */
    if (mode === 'pocket') {
      R = +(FL * (57.15 / 2540) / 2).toFixed(2);   /* 풀 규격: 지름 57.15mm / 2540mm */
      POCKET_R = +(R * 2.1).toFixed(2);            /* 코너 포켓 ≈ 공 2개 폭 */
    } else {
      R = +(FL * (61.5 / 2840) / 2).toFixed(2);    /* 캐럼 규격 */
      POCKET_R = 0;
    }
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
    score = 0; shots = 0;
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
        var pg = ctx.createRadialGradient(p.x, p.y - POCKET_R * 0.3, POCKET_R * 0.1, p.x, p.y, POCKET_R * 1.25);
        pg.addColorStop(0, '#000000');
        pg.addColorStop(0.62, '#0a0f0b');
        pg.addColorStop(1, '#1b2a1e');
        ctx.beginPath();
        ctx.arc(p.x, p.y, POCKET_R * 1.06, 0, 6.283);
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
    cv.setPointerCapture(e.pointerId);
  });

  cv.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    var p = toWorld(e);
    var dx = p.x - cue.x, dy = p.y - cue.y, d = Math.hypot(dx, dy) || 1;
    aim.x = dx / d; aim.y = dy / d;
    aim.power = Math.min(1, d / 240);
    syncPowerUI();
    draw();
  });

  cv.addEventListener('pointerup', function () {
    if (!dragging) return;
    dragging = false;
    if (aim.power < 0.06) { aim.power = 0; syncPowerUI(); draw(); return; }

    shots++;
    touches = {};
    cue.vx = aim.x * MAX_POWER * aim.power;
    cue.vy = aim.y * MAX_POWER * aim.power;
    moving = true;
    updateStats();
    aim.power = 0;
    syncPowerUI();
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
