/* ========================================================
   미로 탐험대 (Maze Explorer) - Pro Edition
   바둑스쿨 Fun: 스테이지 모드 (1~10단계) & 자유 연습 (시간/걸음 기록 경쟁)
   ======================================================== */
(function () {
  'use strict';

  var CANVAS_SIZE = 640;
  var PAD = 14;

  var STAGES = [
    { level: 1, n: 9, name: '1단계 — 가벼운 출발' },
    { level: 2, n: 11, name: '2단계 — 골목 탐색' },
    { level: 3, n: 13, name: '3단계 — 갈림길의 시작' },
    { level: 4, n: 15, name: '4단계 — 미로 속으로' },
    { level: 5, n: 19, name: '5단계 — 중간 관문' },
    { level: 6, n: 23, name: '6단계 — 깊어지는 미궁' },
    { level: 7, n: 27, name: '7단계 — 혼돈의 통로' },
    { level: 8, n: 31, name: '8단계 — 거대 미로' },
    { level: 9, n: 35, name: '9단계 — 탈출 불가?' },
    { level: 10, n: 39, name: '10단계 — 파이널 마스터 미궁' }
  ];

  var state = {
    mode: 'stage',       // 'stage' | 'free'
    stageIndex: 0,       // 0 ~ 9
    unlockedStage: 0,
    freeN: 21,
    N: 9,
    theme: 'dungeon',
    fog: false,
    running: false,
    walls: null,          // Uint8: bit 1=N, 2=E, 4=S, 8=W
    player: null,
    keyState: {},
    rafId: 0
  };

  /* ---------------- Sound Synthesizer (Web Audio) ---------------- */
  var audioCtx = null;
  function getAudio() {
    if (!audioCtx) {
      var AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  var sfx = {
    step: function () {
      var ctx = getAudio(); if (!ctx) return;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.05);
      g.gain.setValueAtTime(0.06, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.05);
    },
    bump: function () {
      var ctx = getAudio(); if (!ctx) return;
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.08);
      g.gain.setValueAtTime(0.08, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(g); g.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.08);
    },
    win: function () {
      var ctx = getAudio(); if (!ctx) return;
      var fanfare = [
        { f: 523.25, t: 0.00, d: 0.12 },
        { f: 659.25, t: 0.10, d: 0.12 },
        { f: 783.99, t: 0.20, d: 0.12 },
        { f: 1046.50, t: 0.32, d: 0.40 }
      ];
      fanfare.forEach(function (n) {
        var osc = ctx.createOscillator(), g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, ctx.currentTime + n.t);
        g.gain.setValueAtTime(0.18, ctx.currentTime + n.t);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + n.t + n.d);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(ctx.currentTime + n.t);
        osc.stop(ctx.currentTime + n.t + n.d);
      });
    }
  };

  /* ---------------- Helpers ---------------- */
  function el(id) { return document.getElementById(id); }
  function msg(t) { var m = el('msg'); if (m) m.textContent = t; }
  function idx(x, y) { return y * state.N + x; }

  function canMove(x, y, dir) { // 0=N, 1=E, 2=S, 3=W
    var bit = [1, 2, 4, 8][dir];
    return !(state.walls[idx(x, y)] & bit);
  }

  /* ---------------- Maze Generator (Recursive Backtracker) ---------------- */
  function generateMaze() {
    var N = state.N;
    state.walls = new Uint8Array(N * N);
    for (var i = 0; i < state.walls.length; i++) state.walls[i] = 15; // all 4 walls closed

    var stack = [];
    var visited = new Uint8Array(N * N);
    visited[0] = 1;
    stack.push([0, 0, -1]); // [x, y, lastDir]

    var DIRS = [
      { dx: 0, dy: -1, wall: 1, opp: 4, dir: 0 },
      { dx: 1, dy: 0, wall: 2, opp: 8, dir: 1 },
      { dx: 0, dy: 1, wall: 4, opp: 1, dir: 2 },
      { dx: -1, dy: 0, wall: 8, opp: 2, dir: 3 }
    ];

    while (stack.length) {
      var cur = stack[stack.length - 1];
      var cx = cur[0], cy = cur[1], lastDir = cur[2];
      var candidates = [];

      for (var d = 0; d < 4; d++) {
        var nx = cx + DIRS[d].dx, ny = cy + DIRS[d].dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        if (!visited[idx(nx, ny)]) {
          var weight = (d === lastDir) ? 2.5 : 1.0;
          candidates.push({ nx: nx, ny: ny, d: d, weight: weight });
        }
      }

      if (!candidates.length) {
        stack.pop();
        continue;
      }

      var totalW = candidates.reduce(function (sum, c) { return sum + c.weight; }, 0);
      var rnd = Math.random() * totalW;
      var pick = candidates[0];
      for (var c = 0; c < candidates.length; c++) {
        rnd -= candidates[c].weight;
        if (rnd <= 0) { pick = candidates[c]; break; }
      }

      var d0 = DIRS[pick.d];
      state.walls[idx(cx, cy)] &= ~d0.wall;
      state.walls[idx(pick.nx, pick.ny)] &= ~d0.opp;
      visited[idx(pick.nx, pick.ny)] = 1;
      stack.push([pick.nx, pick.ny, pick.d]);
    }

    // Braiding: only for introductory stages (N <= 13) add 1~2 small shortcuts
    // For N >= 15: Zero Braid (Pure Authentic Labyrinth!)
    if (N <= 13) {
      var loops = Math.max(1, Math.round(N * 0.15));
      for (var k = 0; k < loops; k++) {
        var rx = 1 + Math.floor(Math.random() * (N - 2));
        var ry = 1 + Math.floor(Math.random() * (N - 2));
        var dd = DIRS[Math.floor(Math.random() * 4)];
        var tx = rx + dd.dx, ty = ry + dd.dy;
        if (tx >= 0 && ty >= 0 && tx < N && ty < N) {
          state.walls[idx(rx, ry)] &= ~dd.wall;
          state.walls[idx(tx, ty)] &= ~dd.opp;
        }
      }
    }

    // Outer border restoration
    for (var bx = 0; bx < N; bx++) {
      state.walls[idx(bx, 0)] |= 1;
      state.walls[idx(bx, N - 1)] |= 4;
    }
    for (var by = 0; by < N; by++) {
      state.walls[idx(0, by)] |= 8;
      state.walls[idx(N - 1, by)] |= 2;
    }

    // Open entrance (top-left) & exit (bottom-right)
    state.walls[idx(0, 0)] &= ~8;
    state.walls[idx(N - 1, N - 1)] &= ~2;
  }

  /* ---------------- Optimal Path (BFS for Hint) ---------------- */
  function bfsPath(sx, sy, gx, gy) {
    var N = state.N;
    var prev = new Int32Array(N * N).fill(-1);
    var q = [idx(sx, sy)], seen = new Uint8Array(N * N);
    seen[idx(sx, sy)] = 1;
    var DIRS = [[0, -1, 0], [1, 0, 1], [0, 1, 2], [-1, 0, 3]];

    while (q.length) {
      var c = q.shift(), cx = c % N, cy = Math.floor(c / N);
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

  /* ---------------- Player Entity ---------------- */
  function makePlayer() {
    return {
      x: 0, y: 0,
      fx: 0, fy: 0,
      lookDir: 1, // 0=N, 1=E, 2=S, 3=W
      trail: [[0, 0]],
      moves: 0,
      startAt: 0,
      time: 0,
      done: false,
      hintUntil: 0,
      hintPath: []
    };
  }

  /* ---------------- Responsive Sizing ---------------- */
  function layoutBoards() {
    var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bks-nav-h'), 10) || 64;
    var availH = window.innerHeight - navH - 180;
    var stage = el('stage');
    var availW = (stage ? stage.clientWidth : window.innerWidth) - 24;
    var size = Math.min(availH, availW, 760);
    size = Math.max(280, Math.floor(size));

    var c = el('maze1');
    if (c) {
      c.style.width = size + 'px';
      c.style.height = size + 'px';
    }
  }

  function resetGame() {
    if (state.mode === 'stage') {
      state.N = STAGES[state.stageIndex].n;
      el('stageNum').textContent = state.stageIndex + 1;
      el('stageSizeLabel').textContent = '(' + state.N + '×' + state.N + ')';
    } else {
      state.N = state.freeN;
    }

    generateMaze();
    state.player = makePlayer();
    state.running = true;

    el('resultPanel').hidden = true;
    el('t1').textContent = '0.0s';
    el('m1').textContent = '0걸음';

    layoutBoards();
    drawAll();

    if (state.mode === 'stage') {
      msg('🏆 ' + STAGES[state.stageIndex].name + ' — 출발점에서 출구까지 미로를 돌파하세요!');
    } else {
      msg('🎲 자유 연습 (' + state.N + '×' + state.N + ') — 출발점에서 출구까지 미로를 통과하세요!');
    }
  }

  /* ---------------- Rendering Engine ---------------- */
  function cellPx() { return (CANVAS_SIZE - PAD * 2) / state.N; }

  // Theme Color Configurations
  var THEMES = {
    dungeon: {
      floorA: '#1e293b', floorB: '#1a2434',
      wallBase: '#0f172a', wallTop: '#475569', wallShadow: 'rgba(0,0,0,0.45)',
      gridLine: 'rgba(255,255,255,0.03)',
      portalA: '#f59e0b', portalB: '#d97706'
    },
    forest: {
      floorA: '#14532d', floorB: '#166534',
      wallBase: '#064e3b', wallTop: '#22c55e', wallShadow: 'rgba(2,44,34,0.5)',
      gridLine: 'rgba(255,255,255,0.04)',
      portalA: '#10b981', portalB: '#059669'
    },
    neon: {
      floorA: '#090d16', floorB: '#0f172a',
      wallBase: '#1e1b4b', wallTop: '#06b6d4', wallShadow: 'rgba(6,182,212,0.3)',
      gridLine: 'rgba(6,182,212,0.07)',
      portalA: '#8b5cf6', portalB: '#ec4899'
    }
  };

  function drawFloorAndWalls(ctx) {
    var N = state.N;
    var cell = cellPx();
    var th = THEMES[state.theme] || THEMES.dungeon;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Floor Pattern
    for (var y = 0; y < N; y++) {
      for (var x = 0; x < N; x++) {
        ctx.fillStyle = ((x + y) % 2 === 0) ? th.floorA : th.floorB;
        ctx.fillRect(PAD + x * cell, PAD + y * cell, cell, cell);
      }
    }

    // 2. Subtle Grid
    ctx.strokeStyle = th.gridLine;
    ctx.lineWidth = 1;
    ctx.strokeRect(PAD, PAD, N * cell, N * cell);

    // 3. Walls (3D Drop Shadow + Beveled Corridors)
    var wallW = Math.max(2.5, cell * 0.16);

    // Shadow pass
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = wallW + 2.5;
    ctx.strokeStyle = th.wallShadow;
    ctx.beginPath();
    for (var sy = 0; sy < N; sy++) {
      for (var sx = 0; sx < N; sx++) {
        var sw = state.walls[idx(sx, sy)];
        var spx = PAD + sx * cell, spy = PAD + sy * cell + 1.5;
        if (sw & 1) { ctx.moveTo(spx, spy); ctx.lineTo(spx + cell, spy); }
        if (sw & 8) { ctx.moveTo(spx, spy); ctx.lineTo(spx, spy + cell); }
        if (sy === N - 1 && (sw & 4)) { ctx.moveTo(spx, spy + cell); ctx.lineTo(spx + cell, spy + cell); }
        if (sx === N - 1 && (sw & 2)) { ctx.moveTo(spx + cell, spy); ctx.lineTo(spx + cell, spy + cell); }
      }
    }
    ctx.stroke();

    // Wall Base pass
    ctx.lineWidth = wallW;
    ctx.strokeStyle = th.wallBase;
    ctx.beginPath();
    for (var yy = 0; yy < N; yy++) {
      for (var xx = 0; xx < N; xx++) {
        var w = state.walls[idx(xx, yy)];
        var px = PAD + xx * cell, py = PAD + yy * cell;
        if (w & 1) { ctx.moveTo(px, py); ctx.lineTo(px + cell, py); }
        if (w & 8) { ctx.moveTo(px, py); ctx.lineTo(px, py + cell); }
        if (yy === N - 1 && (w & 4)) { ctx.moveTo(px, py + cell); ctx.lineTo(px + cell, py + cell); }
        if (xx === N - 1 && (w & 2)) { ctx.moveTo(px + cell, py); ctx.lineTo(px + cell, py + cell); }
      }
    }
    ctx.stroke();

    // Wall Highlight pass
    ctx.lineWidth = Math.max(1.2, wallW * 0.45);
    ctx.strokeStyle = th.wallTop;
    ctx.stroke();

    // Outer Boundary Walls (with open entrance & exit)
    ctx.lineWidth = wallW + 1;
    ctx.strokeStyle = th.wallTop;
    var x0 = PAD, y0 = PAD, x1 = PAD + N * cell, y1 = PAD + N * cell;
    var gap = cell * 0.6;
    ctx.beginPath();
    ctx.moveTo(x0 + gap, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y1 - gap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0, y0 + gap); ctx.lineTo(x0, y1); ctx.lineTo(x1 - gap, y1);
    ctx.stroke();
  }

  /* ---------------- Animated Goal (Treasure Chest / Portal) ---------------- */
  function drawGoal(ctx, t) {
    var cell = cellPx();
    var N = state.N;
    var gx = PAD + (N - 0.5) * cell, gy = PAD + (N - 0.5) * cell;
    var th = THEMES[state.theme] || THEMES.dungeon;

    // Glowing aura
    var pulse = 0.85 + Math.sin(t * 0.005) * 0.15;
    var auraGrad = ctx.createRadialGradient(gx, gy, cell * 0.1, gx, gy, cell * 0.48 * pulse);
    auraGrad.addColorStop(0, th.portalA);
    auraGrad.addColorStop(0.6, th.portalB + '88');
    auraGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(gx, gy, cell * 0.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(gx, gy);
    if (state.theme === 'dungeon') {
      var cw = cell * 0.55, ch = cell * 0.42;
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-cw / 2, -ch / 2 + 3, cw, ch);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-cw / 2 + 1, -ch / 2 + 4, cw - 2, ch - 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, -ch / 2 + 5, 4, 6);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(-cw / 2, -ch / 2 + 3, cw, ch);
    } else {
      ctx.rotate(t * 0.003);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1.5, cell * 0.08);
      ctx.beginPath();
      ctx.arc(0, 0, cell * 0.28, 0, Math.PI * 1.5);
      ctx.stroke();
      ctx.rotate(-t * 0.006);
      ctx.strokeStyle = th.portalA;
      ctx.lineWidth = Math.max(1.2, cell * 0.06);
      ctx.beginPath();
      ctx.arc(0, 0, cell * 0.18, 0, Math.PI * 1.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---------------- Baduk Explorer Character ---------------- */
  function drawPlayer(ctx, p, t) {
    var cell = cellPx();

    // 1. Trail Line
    if (p.trail.length > 1) {
      ctx.beginPath();
      ctx.lineWidth = Math.max(2.5, cell * 0.18);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
      for (var i = 0; i < p.trail.length; i++) {
        var tx = PAD + (p.trail[i][0] + 0.5) * cell, ty = PAD + (p.trail[i][1] + 0.5) * cell;
        if (i === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
      }
      ctx.stroke();
    }

    // 2. Hint Line
    if (t < p.hintUntil && p.hintPath.length > 1) {
      ctx.beginPath();
      ctx.setLineDash([cell * 0.22, cell * 0.16]);
      ctx.lineWidth = Math.max(2.5, cell * 0.14);
      ctx.strokeStyle = '#fbbf24';
      for (var k = 0; k < p.hintPath.length; k++) {
        var hx = PAD + (p.hintPath[k][0] + 0.5) * cell, hy = PAD + (p.hintPath[k][1] + 0.5) * cell;
        if (k === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Cute Baduk Character Body
    var px = PAD + (p.fx + 0.5) * cell;
    var py = PAD + (p.fy + 0.5) * cell;
    var bob = Math.sin(t * 0.012) * (cell * 0.04);
    py += bob;
    var r = cell * 0.32;

    // Soft Contact Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(px, py + r * 0.9 - bob, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3D Baduk Stone Body (Glossy Obsidian Black Stone)
    ctx.save();
    ctx.translate(px, py);

    var bodyGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.15, 0, 0, r);
    bodyGrad.addColorStop(0, '#64748b');
    bodyGrad.addColorStop(0.4, '#1e293b');
    bodyGrad.addColorStop(1, '#090d16');

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = Math.max(1.5, cell * 0.05);
    ctx.stroke();

    // Explorer Headband
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.rect(-r * 0.85, -r * 0.55, r * 1.7, r * 0.28);
    ctx.fill();

    // Headband ribbon knot
    ctx.beginPath();
    ctx.arc(r * 0.85, -r * 0.4, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Cute Expressive Eyes
    var eyeOffset = (p.lookDir === 1) ? 2 : (p.lookDir === 3) ? -2 : 0;
    var eyeY = -r * 0.05;
    var eyeSpacing = r * 0.35;

    // Eye whites
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing + eyeOffset, eyeY, r * 0.22, r * 0.26, 0, 0, Math.PI * 2);
    ctx.ellipse(eyeSpacing + eyeOffset, eyeY, r * 0.22, r * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#0f172a';
    var pupilX = eyeOffset * 1.5;
    ctx.beginPath();
    ctx.arc(-eyeSpacing + eyeOffset + pupilX, eyeY, r * 0.12, 0, Math.PI * 2);
    ctx.arc(eyeSpacing + eyeOffset + pupilX, eyeY, r * 0.12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ---------------- Fog of War (Torchlight Mask) ---------------- */
  function applyFogOfWar(ctx, p) {
    if (!state.fog) return;
    var cell = cellPx();
    var px = PAD + (p.fx + 0.5) * cell;
    var py = PAD + (p.fy + 0.5) * cell;
    var rInner = cell * 2.8;
    var rOuter = cell * 4.6;

    ctx.save();
    var fogGrad = ctx.createRadialGradient(px, py, rInner, px, py, rOuter);
    fogGrad.addColorStop(0, 'rgba(3, 7, 18, 0)');
    fogGrad.addColorStop(0.7, 'rgba(3, 7, 18, 0.75)');
    fogGrad.addColorStop(1, 'rgba(3, 7, 18, 0.98)');

    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.restore();
  }

  function renderCanvas(cv, p, t) {
    var ctx = cv.getContext('2d');
    drawFloorAndWalls(ctx);
    drawGoal(ctx, t);
    drawPlayer(ctx, p, t);
    applyFogOfWar(ctx, p);
  }

  function drawAll(t) {
    t = t || performance.now();
    var cv = el('maze1');
    if (cv && state.player) {
      renderCanvas(cv, state.player, t);
    }
  }

  /* ---------------- Movement & Game Logic ---------------- */
  function move(p, dir) {
    if (!p || p.done || !state.running) return;
    var dx = [0, 1, 0, -1][dir], dy = [-1, 0, 1, 0][dir];
    p.lookDir = dir;

    if (!canMove(p.x, p.y, dir)) {
      sfx.bump();
      return;
    }

    var nx = p.x + dx, ny = p.y + dy;
    if (nx < 0 || ny < 0 || nx >= state.N || ny >= state.N) return;

    p.x = nx; p.y = ny;
    p.moves++;
    sfx.step();

    var movesEl = el('m1');
    if (movesEl) movesEl.textContent = p.moves + '걸음';

    if (!p.startAt) p.startAt = performance.now();
    var last = p.trail[p.trail.length - 1];
    if (!last || last[0] !== nx || last[1] !== ny) p.trail.push([nx, ny]);

    // Check Victory (Reached bottom-right corner)
    if (nx === state.N - 1 && ny === state.N - 1) {
      winGame(p);
    }
  }

  function winGame(p) {
    p.done = true;
    p.time = (performance.now() - p.startAt) / 1000;
    state.running = false;
    sfx.win();

    var timeStr = p.time.toFixed(1) + '초';
    var recordKey = (state.mode === 'stage') ? ('bks_maze_best_stage_' + (state.stageIndex + 1)) : ('bks_maze_best_free_' + state.N);
    var prevBest = null;
    try {
      prevBest = parseFloat(localStorage.getItem(recordKey));
    } catch (e) {}

    var isNewBest = false;
    if (isNaN(prevBest) || !prevBest || p.time < prevBest) {
      isNewBest = true;
      try { localStorage.setItem(recordKey, p.time.toFixed(1)); } catch (e) {}
    }

    var bestEl = el('resultBest');
    if (bestEl) {
      if (isNewBest) {
        bestEl.textContent = '🌟 신기록 달성! (최고: ' + timeStr + ')';
        bestEl.hidden = false;
      } else {
        bestEl.textContent = '현재 최고 기록: ' + prevBest.toFixed(1) + '초';
        bestEl.hidden = false;
      }
    }

    if (state.mode === 'stage') {
      var isFinal = (state.stageIndex >= STAGES.length - 1);
      if (isFinal) {
        el('resultBadge').textContent = '👑';
        el('resultTitle').textContent = '전 스테이지 정복 완료!';
        el('resultDesc').textContent = '축하합니다! 총 10개의 모든 미궁을 완벽하게 클리어했습니다! (' + timeStr + ' · ' + p.moves + '걸음)';
        el('btnNextStage').textContent = '🔄 1단계부터 다시 도전';
        msg('👑 전 스테이지 정복! 진정한 미궁 마스터 탄생!');
      } else {
        state.unlockedStage = Math.max(state.unlockedStage, state.stageIndex + 1);
        try { localStorage.setItem('bks_maze_unlocked', state.unlockedStage); } catch (e) {}

        el('resultBadge').textContent = '🏆';
        el('resultTitle').textContent = (state.stageIndex + 1) + '단계 돌파 성공!';
        el('resultDesc').textContent = STAGES[state.stageIndex].name + ' 클리어! · 기록: ' + timeStr + ' · ' + p.moves + '걸음';
        el('btnNextStage').textContent = '🚀 다음 ' + (state.stageIndex + 2) + '단계 도전!';
        msg('🎉 축하합니다! ' + (state.stageIndex + 1) + '단계를 통과했습니다!');
      }
    } else { // Free play
      el('resultBadge').textContent = '🏆';
      el('resultTitle').textContent = '미로 탈출 성공!';
      el('resultDesc').textContent = '기록: ' + timeStr + ' · ' + p.moves + '걸음';
      el('btnNextStage').textContent = '🎲 다른 미로 풀기';
      msg('🎉 축하합니다! ' + timeStr + ' 만에 미로를 탈출했습니다!');
    }

    el('resultPanel').hidden = false;
  }

  /* ---------------- Input Handling (Continuous Keyboard, Swipe, D-Pad) ---------------- */
  function keyToDir(e) {
    var k = e.key.toLowerCase();
    var map1 = { w: 0, d: 1, s: 2, a: 3 };
    var map2 = { arrowup: 0, arrowright: 1, arrowdown: 2, arrowleft: 3 };
    if (k in map1) return map1[k];
    if (k in map2) return map2[k];
    return -1;
  }

  document.addEventListener('keydown', function (e) {
    if (el('rulesPanel') && !el('rulesPanel').hidden) return;
    if (el('resultPanel') && !el('resultPanel').hidden) return;

    var d0 = keyToDir(e);
    if (d0 >= 0) {
      e.preventDefault();
      state.keyState['p0_' + d0] = true;
      move(state.player, d0);
    }

    if (e.key.toLowerCase() === 'h') {
      showHint();
    }
  });

  document.addEventListener('keyup', function (e) {
    var d0 = keyToDir(e);
    if (d0 >= 0) delete state.keyState['p0_' + d0];
  });

  function showHint() {
    var p = state.player;
    if (p && !p.done) {
      p.hintPath = bfsPath(p.x, p.y, state.N - 1, state.N - 1);
      p.hintUntil = performance.now() + 1800;
      msg('💡 1.8초 동안 목표 지점까지의 최단 경로가 표시됩니다!');
    }
  }

  // Mobile Swipe Gesture
  function bindSwipe(cv) {
    var start = null;
    cv.addEventListener('pointerdown', function (e) {
      start = { x: e.clientX, y: e.clientY };
      cv.setPointerCapture(e.pointerId);
    });

    cv.addEventListener('pointermove', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var cellScreen = cv.getBoundingClientRect().width / state.N;
      var thr = Math.max(12, cellScreen * 0.5);
      if (Math.abs(dx) < thr && Math.abs(dy) < thr) return;
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0);
      move(state.player, dir);
      start = { x: e.clientX, y: e.clientY };
    });

    cv.addEventListener('pointerup', function (e) {
      if (!start) return;
      var dx = e.clientX - start.x, dy = e.clientY - start.y;
      var cellScreen = cv.getBoundingClientRect().width / state.N;
      if (Math.hypot(dx, dy) < Math.max(8, cellScreen * 0.3)) {
        var r = cv.getBoundingClientRect();
        var sx = (e.clientX - r.left) / r.width * state.N;
        var sy = (e.clientY - r.top) / r.height * state.N;
        var p = state.player;
        var ddx = sx - (p.x + 0.5), ddy = sy - (p.y + 0.5);
        var dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 1 : 3) : (ddy > 0 ? 2 : 0);
        move(p, dir);
      }
      start = null;
    });

    cv.addEventListener('pointercancel', function () { start = null; });
  }

  // Virtual Onscreen D-Pad
  function bindDpad() {
    var dpad = el('mobileDpad');
    if (!dpad) return;
    dpad.addEventListener('click', function (e) {
      var btn = e.target.closest('.dpad-btn');
      if (!btn) return;
      var dir = parseInt(btn.dataset.dir, 10);
      move(state.player, dir);
    });
  }

  /* ---------------- Main Game Loop ---------------- */
  function loop(t) {
    if (state.player) {
      var p = state.player;
      p.fx += (p.x - p.fx) * 0.36;
      p.fy += (p.y - p.fy) * 0.36;
      if (Math.abs(p.x - p.fx) < 0.01) p.fx = p.x;
      if (Math.abs(p.y - p.fy) < 0.01) p.fy = p.y;
    }

    if (state.running && state.player && !state.player.done && state.player.startAt) {
      var now = performance.now();
      el('t1').textContent = ((now - state.player.startAt) / 1000).toFixed(1) + 's';
    }

    drawAll(t);
    state.rafId = requestAnimationFrame(loop);
  }

  /* ---------------- Initialization & Event Wiring ---------------- */
  function init() {
    try {
      var savedUnlocked = parseInt(localStorage.getItem('bks_maze_unlocked'), 10);
      if (!isNaN(savedUnlocked)) state.unlockedStage = savedUnlocked;
    } catch (e) {}

    // 1. Mode Selector (Stage vs Free Play)
    el('modeSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.m-modebtn');
      if (!b) return;
      state.mode = b.dataset.mode;

      document.querySelectorAll('.m-modebtn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });

      if (state.mode === 'stage') {
        el('stagePill').hidden = false;
        el('sizeSeg').hidden = true;
      } else {
        el('stagePill').hidden = true;
        el('sizeSeg').hidden = false;
      }

      resetGame();
    });

    // 2. Free Difficulty Selector
    el('sizeSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.m-segbtn');
      if (!b) return;
      state.freeN = parseInt(b.dataset.n, 10);
      document.querySelectorAll('.m-segbtn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      resetGame();
    });

    // 3. Theme Selector
    el('themeSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.m-theme-btn');
      if (!b) return;
      state.theme = b.dataset.theme;
      document.body.setAttribute('data-theme', state.theme);
      document.querySelectorAll('.m-theme-btn').forEach(function (x) {
        x.classList.toggle('active', x === b);
      });
      drawAll();
    });

    // 4. Fog of War Toggle
    el('btnFog').addEventListener('click', function () {
      state.fog = !state.fog;
      this.classList.toggle('active', state.fog);
      this.textContent = state.fog ? '🔦 안개: ON' : '🔦 안개: OFF';
      drawAll();
    });

    // 5. Next Stage Action (from Result Modal)
    el('btnNextStage').addEventListener('click', function () {
      el('resultPanel').hidden = true;
      if (state.mode === 'stage') {
        if (state.stageIndex >= STAGES.length - 1) {
          state.stageIndex = 0;
        } else {
          state.stageIndex++;
        }
      }
      resetGame();
    });

    // 6. Action Buttons
    el('btnNew').addEventListener('click', resetGame);
    el('btnAgain').addEventListener('click', function () {
      el('resultPanel').hidden = true;
      resetGame();
    });
    el('btnHint').addEventListener('click', showHint);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    window.addEventListener('resize', function () {
      layoutBoards();
      drawAll();
    });

    bindSwipe(el('maze1'));
    bindDpad();

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('theme')) {
      state.theme = urlParams.get('theme');
      document.body.setAttribute('data-theme', state.theme);
      document.querySelectorAll('.m-theme-btn').forEach(function (x) {
        x.classList.toggle('active', x.dataset.theme === state.theme);
      });
    }
    if (urlParams.get('mode') === 'free') {
      state.mode = 'free';
      el('stagePill').hidden = true;
      el('sizeSeg').hidden = false;
      document.querySelectorAll('.m-modebtn').forEach(function (x) {
        x.classList.toggle('active', x.dataset.mode === 'free');
      });
    }

    resetGame();
    state.rafId = requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
