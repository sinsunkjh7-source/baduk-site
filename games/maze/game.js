/* 미로 찾기 — 생성·렌더·입력 */
(function () {
  'use strict';

  var SIZE = 560;                 /* 캔버스 내부 크기 */
  var PAD = 12;                   /* 벽이 잘리지 않도록 두는 여백 */
  var N = 14;
  var duo = false;
  var walls = null;               /* Uint8: 비트 1=N 2=E 4=S 8=W (벽 있음) */
  var players = [];
  var running = false;
  var raf = 0;

  function el(id) { return document.getElementById(id); }
  function msg(t) { var m = el('msg'); if (m) m.textContent = t; }

  /* ---------------- 미로 생성 ---------------- */
  function idx(x, y) { return y * N + x; }

  function generate() {
    walls = new Uint8Array(N * N);
    for (var i = 0; i < walls.length; i++) walls[i] = 15;   /* N|E|S|W */

    var stack = [], visited = new Uint8Array(N * N);
    var cx = 0, cy = 0;
    visited[0] = 1;
    stack.push([0, 0]);

    var DIRS = [
      { dx: 0, dy: -1, wall: 1, opp: 4 },
      { dx: 1, dy: 0, wall: 2, opp: 8 },
      { dx: 0, dy: 1, wall: 4, opp: 1 },
      { dx: -1, dy: 0, wall: 8, opp: 2 }
    ];

    while (stack.length) {
      var cur = stack[stack.length - 1];
      cx = cur[0]; cy = cur[1];
      var opts = [];
      for (var d = 0; d < 4; d++) {
        var nx = cx + DIRS[d].dx, ny = cy + DIRS[d].dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        if (visited[idx(nx, ny)]) continue;
        opts.push([nx, ny, d]);
      }
      if (!opts.length) { stack.pop(); continue; }
      var pick = opts[Math.floor(Math.random() * opts.length)];
      var d0 = DIRS[pick[2]];
      walls[idx(cx, cy)] &= ~d0.wall;
      walls[idx(pick[0], pick[1])] &= ~d0.opp;
      visited[idx(pick[0], pick[1])] = 1;
      stack.push([pick[0], pick[1]]);
    }

    /* 참길(braid): 막다른 길 일부를 열어 순환로 생성 */
    var braid = Math.max(3, Math.round(N * 0.8));
    for (var k = 0; k < braid * 4; k++) {
      var rx = 1 + Math.floor(Math.random() * (N - 2));
      var ry = 1 + Math.floor(Math.random() * (N - 2));
      var dd = DIRS[Math.floor(Math.random() * 4)];
      var tx = rx + dd.dx, ty = ry + dd.dy;
      if (tx < 0 || ty < 0 || tx >= N || ty >= N) continue;
      walls[idx(rx, ry)] &= ~dd.wall;
      walls[idx(tx, ty)] &= ~dd.opp;
    }

    /* 바깥 테두리 복원 (참길로 열린 외곽 벽 되돌리기) */
    for (var bx = 0; bx < N; bx++) {
      walls[idx(bx, 0)] |= 1;
      walls[idx(bx, N - 1)] |= 4;
    }
    for (var by = 0; by < N; by++) {
      walls[idx(0, by)] |= 8;
      walls[idx(N - 1, by)] |= 2;
    }

    /* 출발/도착 테두리 열기 */
    walls[idx(0, 0)] &= ~8;               /* 왼쪽 벽 제거(입구) */
    walls[idx(N - 1, N - 1)] &= ~2;       /* 오른쪽 벽 제거(출구) */
  }

  function canMove(x, y, dir) {          /* dir: 0=N 1=E 2=S 3=W */
    var bit = [1, 2, 4, 8][dir];
    return !(walls[idx(x, y)] & bit);
  }

  /* 최단 경로 (힌트용) */
  function bfsPath(sx, sy, gx, gy) {
    var prev = new Int32Array(N * N).fill(-1);
    var q = [idx(sx, sy)], seen = new Uint8Array(N * N);
    seen[idx(sx, sy)] = 1;
    var DIRS = [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]];
    while (q.length) {
      var c = q.shift(), cx = c % N, cy = (c - cx) / N;
      if (cx === gx && cy === gy) break;
      for (var i = 0; i < 4; i++) {
        if (!canMove(cx, cy, DIRS[i][2])) continue;
        var nx = cx + DIRS[i][0], ny = cy + DIRS[i][1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        var ni = idx(nx, ny);
        if (seen[ni]) continue;
        seen[ni] = 1; prev[ni] = c; q.push(ni);
      }
    }
    var path = [], cur = idx(gx, gy);
    if (!seen[cur]) return [];
    while (cur !== -1) { path.push([cur % N, Math.floor(cur / N)]); cur = prev[cur]; }
    return path.reverse();
  }

  /* ---------------- 플레이어 ---------------- */
  function makePlayer(id, color) {
    return {
      id: id, color: color,
      x: 0, y: 0, fx: 0, fy: 0,     /* 셀 좌표 / 표시 좌표 */
      trail: [[0, 0]],
      moves: 0, startAt: 0, time: 0, done: false,
      hintUntil: 0, hintPath: []
    };
  }

  function layoutBoards() {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bks-nav-h'), 10) || 64;
    var availH = window.innerHeight - navH - 150;
    var stage = el('stage');
    var availW = (stage ? stage.clientWidth : window.innerWidth) - (duo ? 34 : 24);
    var size = Math.min(availH, duo ? availW / 2 : availW, 760);
    size = Math.max(220, Math.floor(size));
    ['maze1', 'maze2'].forEach(function (id) {
      var c = el(id);
      if (!c) return;
      c.style.width = size + 'px';
      c.style.height = size + 'px';
    });
  }

  function reset() {
    generate();
    players = [makePlayer(0, '#2f6fb7'), makePlayer(1, '#c0392b')];
    running = true;
    el('resultPanel').hidden = true;
    el('t1').textContent = '0.0s';
    el('t2').textContent = duo ? '0.0s' : '–';
    document.getElementById('wrap2').hidden = !duo;
    if (!duo) el('t2').textContent = '–';
    layoutBoards();
    drawAll();
    msg(duo ? '1P는 WASD, 2P는 방향키 — 먼저 깃발에 도착하세요!' : '방향키 또는 WASD로 출발점에서 깃발까지 이동하세요.');
  }

  /* ---------------- 렌더 ---------------- */
  function cellPx() { return (SIZE - PAD * 2) / N; }

  function drawStatic(ctx) {
    var cell = cellPx();
    /* 바닥 */
    ctx.clearRect(0, 0, SIZE, SIZE);
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        ctx.fillStyle = ((x + y) % 2 === 0) ? '#f8fcf3' : '#f2f8ec';
        ctx.fillRect(PAD + x * cell, PAD + y * cell, cell, cell);
      }
    }
    /* 벽 */
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(2, cell * 0.16);
    ctx.strokeStyle = '#3b5a2c';
    ctx.beginPath();
    for (var yy = 0; yy < N; yy++) {
      for (var xx = 0; xx < N; xx++) {
        var w = walls[idx(xx, yy)];
        var px = PAD + xx * cell, py = PAD + yy * cell;
        if (w & 1) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
        if (w & 8) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
        if (yy === N - 1 && (w & 4)) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
        if (xx === N - 1 && (w & 2)) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
      }
    }
    ctx.stroke();

    /* 외곽 테두리 — 입구(좌상)·출구(우하) 갭을 두고 또렷하게 */
    var cellW = Math.max(2, cell * 0.16);
    ctx.lineWidth = cellW;
    ctx.strokeStyle = '#3b5a2c';
    ctx.lineJoin = 'round';
    var x0 = PAD, y0 = PAD, x1 = PAD + N * cell, y1 = PAD + N * cell;
    var gap = cell * 0.55;
    ctx.beginPath();
    ctx.moveTo(x0 + gap, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1 - gap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 + gap); ctx.lineTo(x0, y1); ctx.lineTo(x1 - gap, y1);
    ctx.stroke();

    /* 출발 / 도착 */
    ctx.fillStyle = 'rgba(74,138,58,.18)';
    ctx.beginPath(); ctx.arc(PAD + cell * 0.5, PAD + cell * 0.5, cell * 0.34, 0, 6.283); ctx.fill();

    var gx = PAD + (N - 0.5) * cell, gy = PAD + (N - 0.5) * cell;
    ctx.fillStyle = 'rgba(255,210,74,.22)';
    ctx.beginPath(); ctx.arc(gx, gy, cell * 0.42, 0, 6.283); ctx.fill();
  }

  function drawFlag(ctx, t) {
    var cell = cellPx();
    var gx = PAD + (N - 0.5) * cell, gy = PAD + (N - 0.5) * cell;
    var poleH = cell * 0.72;
    ctx.strokeStyle = '#6b4a24';
    ctx.lineWidth = Math.max(2, cell * 0.07);
    ctx.beginPath();
    ctx.moveTo(gx - cell * 0.16, gy + cell * 0.3);
    ctx.lineTo(gx - cell * 0.16, gy + cell * 0.3 - poleH);
    ctx.stroke();

    var wave = Math.sin(t / 260) * cell * 0.05;
    ctx.beginPath();
    ctx.moveTo(gx - cell * 0.16, gy + cell * 0.3 - poleH);
    ctx.quadraticCurveTo(gx + cell * 0.12, gy + cell * 0.26 - poleH + wave,
                         gx + cell * 0.34, gy + cell * 0.34 - poleH * 0.78);
    ctx.quadraticCurveTo(gx + cell * 0.1, gy + cell * 0.42 - poleH * 0.72,
                         gx - cell * 0.16, gy + cell * 0.44 - poleH * 0.62);
    ctx.closePath();
    ctx.fillStyle = '#e2543a';
    ctx.fill();
  }

  function drawPlayer(ctx, p, t) {
    var cell = cellPx();
    /* 흔적 */
    if (p.trail.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(3, cell * 0.22);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = p.color + '55';
      for (var i = 0; i < p.trail.length; i++) {
        var tx = PAD + (p.trail[i][0] + 0.5) * cell, ty = PAD + (p.trail[i][1] + 0.5) * cell;
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }
    /* 힌트 경로 */
    if (t < p.hintUntil && p.hintPath.length > 1) {
      ctx.beginPath();
      ctx.setLineDash([cell * 0.22, cell * 0.18]);
      ctx.lineWidth = Math.max(2, cell * 0.12);
      ctx.strokeStyle = '#f0a11c';
      for (var k = 0; k < p.hintPath.length; k++) {
        var hx = PAD + (p.hintPath[k][0] + 0.5) * cell, hy = PAD + (p.hintPath[k][1] + 0.5) * cell;
        if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    /* 공 */
    var px = PAD + (p.fx + 0.5) * cell, py = PAD + (p.fy + 0.5) * cell, r = cell * 0.31;
    ctx.beginPath();
    ctx.arc(px + 1.5, py + 2.5, r, 0, 6.283);
    ctx.fillStyle = 'rgba(20,40,15,.18)';
    ctx.fill();

    var g = ctx.createRadialGradient(px - r * 0.35, py - r * 0.4, r * 0.2, px, py, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, p.color);
    g.addColorStop(1, p.color);
    ctx.beginPath();
    ctx.arc(px, py, r, 0, 6.283);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, cell * 0.045);
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.stroke();
  }

  function renderCanvas(cv, p, t) {
    var ctx = cv.getContext('2d');
    drawStatic(ctx);
    drawFlag(ctx, t);
    drawPlayer(ctx, p, t);
  }

  function drawAll(t) {
    t = t || performance.now();
    renderCanvas(el('maze1'), players[0], t);
    if (duo) renderCanvas(el('maze2'), players[1], t);
  }

  /* ---------------- 이동 ---------------- */
  function move(p, dir) {
    if (!p || p.done || !running) return;
    var dx = [0, 1, 0, -1][dir], dy = [-1, 0, 1, 0][dir];
    if (!canMove(p.x, p.y, dir)) return;
    var nx = p.x + dx, ny = p.y + dy;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;

    p.x = nx; p.y = ny;
    p.moves++;
    if (!p.startAt) p.startAt = performance.now();
    var last = p.trail[p.trail.length - 1];
    if (!last || last[0] !== nx || last[1] !== ny) p.trail.push([nx, ny]);

    if (nx === N - 1 && ny === N - 1) win(p);
  }

  function win(p) {
    p.done = true;
    p.time = (performance.now() - p.startAt) / 1000;
    if (duo) {
      running = false;
      finishDuo(p.id);
    } else {
      running = false;
      el('resultTitle').textContent = '도착!';
      el('resultDesc').textContent = '기록 ' + p.time.toFixed(1) + '초 · ' + p.moves + '걸음';
      el('resultPanel').hidden = false;
      msg('축하합니다! ' + p.time.toFixed(1) + '초 걸렸습니다.');
    }
  }

  function finishDuo(winnerId) {
    var w = players[winnerId], l = players[1 - winnerId];
    el('resultTitle').textContent = (winnerId === 0 ? '1P' : '2P') + ' 승리!';
    el('resultDesc').textContent = (winnerId === 0 ? '1P ' : '2P ') + w.time.toFixed(1) + '초 · ' +
      (1 - winnerId === 0 ? '1P ' : '2P ') + (l.startAt ? '미완주(' + l.moves + '걸음)' : '출발 전');
    el('resultPanel').hidden = false;
  }

  /* ---------------- 입력 ---------------- */
  function keyToDir(e, which) {
    var k = e.key.toLowerCase();
    var map1 = { w: 0, d: 1, s: 2, a: 3 };
    var map2 = { arrowup: 0, arrowright: 1, arrowdown: 2, arrowleft: 3 };
    var isArrow = k.indexOf('arrow') === 0;
    if (which === 0) {
      if (k in map1) return map1[k];
      if (!duo && isArrow) return map2[k];
      return -1;
    }
    return isArrow ? map2[k] : -1;
  }

  document.addEventListener('keydown', function (e) {
    if (document.getElementById('rulesPanel') && !document.getElementById('rulesPanel').hidden) return;
    var d0 = keyToDir(e, 0);
    if (d0 >= 0) { e.preventDefault(); move(players[0], d0); }
    if (duo) {
      var d1 = keyToDir(e, 1);
      if (d1 >= 0) { e.preventDefault(); move(players[1], d1); }
    }
    if (e.key.toLowerCase() === 'h') {
      var p = players[0];
      if (p && !p.done) {
        p.hintPath = bfsPath(p.x, p.y, N - 1, N - 1);
        p.hintUntil = performance.now() + 1400;
      }
    }
  });

  /* 터치: 캔버스 위 문지르기 */
  function bindSwipe(cv, pid) {
    var start = null;
    cv.addEventListener('pointerdown', function (e) {
      start = { x: e.clientX, y: e.clientY };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var cellScreen = cv.getBoundingClientRect().width / N;
      var thr = Math.max(14, cellScreen * 0.55);
      if (Math.abs(dx) < thr && Math.abs(dy) < thr) return;
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
      move(players[pid], dir);
      start = { x: e.clientX, y: e.clientY };
    });
    cv.addEventListener('pointerup', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var cellScreen = cv.getBoundingClientRect().width / N;
      if (Math.hypot(dx, dy) < Math.max(8, cellScreen * 0.3)) {
        /* 탭: 셀 중심 기준 방향 */
        var r = cv.getBoundingClientRect();
        var sx = (e.clientX - r.left) / r.width * N;
        var sy = (e.clientY - r.top) / r.height * N;
        var p = players[pid];
        var ddx = sx - (p.x + 0.5), ddy = sy - (p.y + 0.5);
        var dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 1 : 3) : (ddy > 0 ? 2 : 0);
        move(p, dir);
      }
      start = null;
    });
    cv.addEventListener('pointercancel', function () { start = null; });
  }

  /* ---------------- 루프 ---------------- */
  function loop(t) {
    /* 부드러운 이동 + 타이머 */
    players.forEach(function (p) {
      p.fx += (p.x - p.fx) * 0.35;
      p.fy += (p.y - p.fy) * 0.35;
      if (Math.abs(p.x - p.fx) < 0.01) p.fx = p.x;
      if (Math.abs(p.y - p.fy) < 0.01) p.fy = p.y;
    });

    if (running) {
      var now = performance.now();
      if (!players[0].done) el('t1').textContent = players[0].startAt ? ((now - players[0].startAt) / 1000).toFixed(1) + 's' : '0.0s';
      if (duo && !players[1].done) el('t2').textContent = players[1].startAt ? ((now - players[1].startAt) / 1000).toFixed(1) + 's' : '0.0s';
      drawAll(t);
    } else {
      drawAll(t);
    }
    raf = requestAnimationFrame(loop);
  }

  /* ---------------- 자체 검증 ---------------- */
  function selftest() {
    if (!/[?&]selftest=1/.test(location.search)) return;
    var log = [], ok = true;
    /* 연결성 */
    var path = bfsPath(0, 0, N - 1, N - 1);
    if (!path.length) { ok = false; log.push('no-path'); }
    /* 벽 대칭 */
    var DIRS = [[0, -1, 1], [1, 0, 2], [0, 1, 4], [-1, 0, 8]];
    var OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        for (var i = 0; i < 4; i++) {
          if (!(walls[idx(x, y)] & DIRS[i][2])) continue;
          var nx = x + DIRS[i][0], ny = y + DIRS[i][1];
          if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
          if (!(walls[idx(nx, ny)] & OPP[DIRS[i][2]])) { ok = false; log.push('wall@' + x + ',' + y); }
        }
      }
    }
    /* BFS 경로를 따라 실제 이동 → 도착하는지 */
    var p = players[0];
    p.x = 0; p.y = 0; p.trail = [[0, 0]]; p.moves = 0; p.done = false;
    for (var k = 1; k < path.length; k++) {
      var px = p.x, py = p.y;
      var dx = path[k][0] - px, dy = path[k][1] - py;
      var dir = dy === -1 ? 0 : dx === 1 ? 1 : dy === 1 ? 2 : 3;
      move(p, dir);
    }
    if (!p.done) { ok = false; log.push('walk'); }

    document.body.setAttribute('data-selftest',
      (ok ? 'PASS' : 'FAIL') + '|n=' + N + '|path=' + path.length + '|moves=' + p.moves + '|' + log.join(','));
  }

  /* ---------------- 초기화 ---------------- */
  function init() {
    el('sizeSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.m-segbtn');
      if (!b) return;
      N = parseInt(b.dataset.n, 10);
      Array.prototype.forEach.call(document.querySelectorAll('.m-segbtn'), function (x) {
        x.classList.toggle('active', x === b);
      });
      reset();
    });

    el('modeSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.m-modebtn');
      if (!b) return;
      duo = b.dataset.mode === 'duo';
      Array.prototype.forEach.call(document.querySelectorAll('.m-modebtn'), function (x) {
        x.classList.toggle('active', x === b);
      });
      reset();
    });

    el('btnNew').addEventListener('click', reset);
    el('btnAgain').addEventListener('click', reset);
    el('btnNext').addEventListener('click', reset);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    window.addEventListener('resize', function () { layoutBoards(); drawAll(); });

    bindSwipe(el('maze1'), 0);
    bindSwipe(el('maze2'), 1);

    reset();
    selftest();
    raf = requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
