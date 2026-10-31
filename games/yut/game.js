/* 윷놀이 — 바둑스쿨 Fun
   판: 29밭 (외곽 20 + 대각선 8 + 중앙 1) · 지름길 이동 */
(function () {
  'use strict';

  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 640, H = 640, PAD = 70, SIDE = W - PAD * 2;
  var PIECE_R = 17;

  var START = 0, CENTER = 20;
  var NAMES = { 1: '도', 2: '개', 3: '걸', 4: '윷', 5: '모' };
  var CORNERS = { 0: 27, 5: 21, 10: 23, 15: 25 };
  var IN_NEXT = { 21: 22, 22: CENTER, 23: 24, 24: CENTER, 25: 26, 26: CENTER, 27: 28, 28: CENTER };
  var OUT_NEXT = { 26: 25, 25: 15, 28: 27, 27: 0, 22: 21, 21: 5, 24: 23, 23: 10 };
  var CENTER_OUT = { 22: 26, 24: 28, 26: 22, 28: 24 };

  var nodes = [];
  var players = [
    { id: 0, name: '나', color: '#2f6fb7', pieces: [], done: 0 },
    { id: 1, name: '상대', color: '#c0392b', pieces: [], done: 0 }
  ];
  var turn = 0, phase = 'throw', pending = 0, vsAI = true, over = false;
  var moving = false, selected = -1;

  var el = {
    p1: document.getElementById('p1home'),
    p2: document.getElementById('p2home'),
    turn: document.getElementById('turnBar'),
    sticks: document.getElementById('sticks'),
    btn: document.getElementById('btnThrow'),
    result: document.getElementById('result'),
    msg: document.getElementById('msg'),
    modeBtn: document.getElementById('btnMode')
  };

  /* ---------- 판 (29밭) ---------- */
  function buildNodes() {
    nodes = [];
    var ring = [
      [PAD, PAD + SIDE], [PAD, PAD + SIDE * 0.8], [PAD, PAD + SIDE * 0.6], [PAD, PAD + SIDE * 0.4], [PAD, PAD + SIDE * 0.2],
      [PAD, PAD],
      [PAD + SIDE * 0.2, PAD], [PAD + SIDE * 0.4, PAD], [PAD + SIDE * 0.6, PAD], [PAD + SIDE * 0.8, PAD],
      [PAD + SIDE, PAD],
      [PAD + SIDE, PAD + SIDE * 0.2], [PAD + SIDE, PAD + SIDE * 0.4], [PAD + SIDE, PAD + SIDE * 0.6], [PAD + SIDE, PAD + SIDE * 0.8],
      [PAD + SIDE, PAD + SIDE],
      [PAD + SIDE * 0.8, PAD + SIDE], [PAD + SIDE * 0.6, PAD + SIDE], [PAD + SIDE * 0.4, PAD + SIDE], [PAD + SIDE * 0.2, PAD + SIDE]
    ];
    ring.forEach(function (p) { nodes.push({ x: p[0], y: p[1] }); });

    nodes.push({ x: PAD + SIDE / 2, y: PAD + SIDE / 2 });   /* 20 중앙 */

    function arm(ci) {
      var c = ring[ci], mx = PAD + SIDE / 2, my = PAD + SIDE / 2;
      nodes.push({ x: c[0] + (mx - c[0]) / 3, y: c[1] + (my - c[1]) / 3 });
      nodes.push({ x: c[0] + (mx - c[0]) * 2 / 3, y: c[1] + (my - c[1]) * 2 / 3 });
    }
    arm(5); arm(10); arm(15); arm(0);
  }

  function nodePos(i) { return nodes[i] || nodes[0]; }

  /* ---------- 경로 ---------- */
  function makePiece(pid, n) {
    return { owner: pid, idx: n, pos: START, enterFrom: null, goingOut: false, skipDiag: false, finished: false };
  }

  function nextNode(p) {
    if (p.pos === CENTER) {
      p.goingOut = true;
      var ex = CENTER_OUT[p.enterFrom];
      return ex === undefined ? 0 : ex;
    }
    if (p.goingOut && OUT_NEXT[p.pos] !== undefined) {
      var o = OUT_NEXT[p.pos];
      if (o === 0 || o === 5 || o === 10 || o === 15) { p.goingOut = false; p.skipDiag = true; }
      return o;
    }
    if (IN_NEXT[p.pos] !== undefined) {
      var n = IN_NEXT[p.pos];
      if (n === CENTER) p.enterFrom = p.pos;
      return n;
    }
    if (CORNERS[p.pos] !== undefined) {
      if (p.skipDiag) { p.skipDiag = false; return (p.pos + 1) % 20; }
      return CORNERS[p.pos];
    }
    return (p.pos + 1) % 20;
  }

  /* ---------- 게임 ---------- */
  function newGame() {
    players.forEach(function (pl) {
      pl.pieces = [0, 1, 2, 3].map(function (n) { return makePiece(pl.id, n); });
      pl.done = 0;
    });
    turn = 0; phase = 'throw'; pending = 0; over = false; selected = -1; moving = false;
    el.sticks.innerHTML = '';
    for (var i = 0; i < 4; i++) {
      var s = document.createElement('span');
      s.className = 'y-stick';
      el.sticks.appendChild(s);
    }
    el.result.textContent = '—';
    msg('');
    update(); draw();
  }

  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }
  function finished(pl) { return pl.pieces.filter(function (p) { return p.finished; }).length; }

  function update() {
    el.p1.textContent = finished(players[0]);
    el.p2.textContent = finished(players[1]);
    el.turn.textContent = over ? '게임 종료'
      : (vsAI && turn === 1 ? '상대(AI) 차례' : (turn === 0 ? '내 차례' : '상대 차례'));
    el.btn.disabled = over || moving || phase !== 'throw' || (vsAI && turn === 1);
  }

  function rollSticks() {
    var backs = 0, sticks = el.sticks.children;
    for (var i = 0; i < 4; i++) {
      var back = Math.random() < 0.5;
      if (back) backs++;
      sticks[i].classList.toggle('back', back);
    }
    var steps = (4 - backs) === 0 ? 5 : (4 - backs);
    el.result.textContent = NAMES[steps] + ' (' + steps + ')';
    return steps;
  }

  function movable(pl) { return pl.pieces.filter(function (p) { return !p.finished; }); }

  function throwYut() {
    if (over || moving || phase !== 'throw') return;
    var steps = rollSticks();
    pending = steps; phase = 'move'; selected = -1;
    update(); draw();
    msg(NAMES[steps] + '! 움직일 말을 고르세요');
    if (vsAI && turn === 1) setTimeout(aiPick, 520);
  }

  function walk(p, steps, cb) {
    var left = steps;
    moving = true; update(); draw();
    (function step() {
      if (left <= 0) { moving = false; draw(); cb(); return; }

      var nx = nextNode(p);
      if (nx === START && p.pos !== START) {
        p.pos = START; p.finished = true; p.exitQueue = null;
        left--; draw();
        setTimeout(function () { moving = false; cb(); }, 140);
        return;
      }
      p.pos = nx; left--;
      draw();
      setTimeout(step, 110);
    })();
  }

  function movePiece(pl, piece, steps) {
    walk(piece, steps, function () {
      var captured = false;
      if (!piece.finished) {
        players[1 - pl.id].pieces.forEach(function (o) {
          if (!o.finished && o.pos === piece.pos) { o.pos = START; o.exitQueue = null; captured = true; }
        });
      }

      if (finished(pl) === 4) {
        over = true; msg(pl.id === 0 ? '내가 이겼습니다!' : '상대(AI) 승리');
        phase = 'throw'; update(); draw(); return;
      }

      var extra = captured || steps === 4 || steps === 5;
      if (extra) {
        phase = 'throw';
        msg(captured ? '잡았습니다! 한 번 더' : NAMES[steps] + '! 한 번 더');
        if (vsAI && pl.id === 1) setTimeout(throwYut, 550);
      } else {
        turn = 1 - turn; phase = 'throw'; msg('');
        if (vsAI && turn === 1) setTimeout(throwYut, 550);
      }
      update(); draw();
    });
  }

  function aiPick() {
    var pl = players[1], opts = movable(pl);
    if (!opts.length) { phase = 'throw'; turn = 0; update(); return; }
    var best = opts[0], bestScore = -1;
    opts.forEach(function (pc) {
      var sim = { pos: pc.pos, exitQueue: pc.exitQueue ? pc.exitQueue.slice() : null };
      for (var i = 0; i < pending; i++) sim.pos = nextNode(sim);
      var sc = sim.pos === START ? 100 : 0;
      players[0].pieces.forEach(function (o) { if (!o.finished && o.pos === sim.pos) sc += 50; });
      if (sc > bestScore) { bestScore = sc; best = pc; }
    });
    movePiece(pl, best, pending);
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f7edd9'); g.addColorStop(0.5, '#f0e0c2'); g.addColorStop(1, '#e6d0a8');
    ctx.fillStyle = g;
    roundRect(ctx, 6, 6, W - 12, H - 12, 22); ctx.fill();

    ctx.strokeStyle = 'rgba(122,79,36,.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(PAD, PAD, SIDE, SIDE);

    ctx.beginPath();
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD + SIDE, PAD + SIDE);
    ctx.moveTo(PAD + SIDE, PAD); ctx.lineTo(PAD, PAD + SIDE);
    ctx.strokeStyle = 'rgba(122,79,36,.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    nodes.forEach(function (n, i) {
      var isCorner = (i === 0 || i === 5 || i === 10 || i === 15);
      var isDiag = i > CENTER;
      ctx.beginPath();
      ctx.arc(n.x, n.y, isCorner || i === CENTER ? 7 : (isDiag ? 5.2 : 5.6), 0, 6.283);
      ctx.fillStyle = i === CENTER ? 'rgba(122,79,36,.85)' : 'rgba(122,79,36,.7)';
      ctx.fill();
    });

    [0, 1].forEach(function (pid) {
      var pl = players[pid], groups = {};
      pl.pieces.forEach(function (p) {
        if (p.finished) return;
        (groups[p.pos] = groups[p.pos] || []).push(p);
      });
      Object.keys(groups).forEach(function (key) {
        var list = groups[key];
        list.forEach(function (p, k) {
          var pt = pieceAt(+key, k, list.length, pid);
          drawStone(pt.x, pt.y, pid, pid === turn && selected === p.idx);
        });
      });
    });
  }

  function pieceAt(pos, k, total, pid) {
    var n = nodePos(pos);
    var side = pid === 0 ? -1 : 1;
    var ang = -Math.PI / 2 + (k / Math.max(total, 1)) * Math.PI * 2;
    var r = total > 1 ? PIECE_R * 0.8 : 0;
    return {
      x: n.x + side * (total > 1 ? PIECE_R * 0.5 : PIECE_R * 0.6) + Math.cos(ang) * r,
      y: n.y + Math.sin(ang) * r
    };
  }

  function drawStone(x, y, pid, sel) {
    var R = PIECE_R;
    ctx.beginPath();
    ctx.ellipse(x + 1.5, y + 3, R * 0.95, R * 0.82, 0, 0, 6.283);
    ctx.fillStyle = 'rgba(60,40,20,.22)';
    ctx.fill();

    var rg = ctx.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.15, x, y, R);
    if (pid === 0) { rg.addColorStop(0, '#8fc0ee'); rg.addColorStop(0.6, '#2f6fb7'); rg.addColorStop(1, '#1d4a7d'); }
    else { rg.addColorStop(0, '#f0938a'); rg.addColorStop(0.6, '#c0392b'); rg.addColorStop(1, '#8a2a1f'); }

    ctx.beginPath();
    ctx.arc(x, y, R, 0, 6.283);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.lineWidth = sel ? 3 : 1.5;
    ctx.strokeStyle = sel ? '#ffd257' : 'rgba(255,255,255,.55)';
    ctx.stroke();
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

  /* ---------- 입력 ---------- */
  cv.addEventListener('click', function (e) {
    if (over || moving || phase !== 'move' || (vsAI && turn === 1)) return;
    var r = cv.getBoundingClientRect();
    var px = (e.clientX - r.left) * (W / r.width);
    var py = (e.clientY - r.top) * (H / r.height);

    var pl = players[turn], best = null, bd = 1e9, groups = {};
    pl.pieces.forEach(function (p) { if (!p.finished) (groups[p.pos] = groups[p.pos] || []).push(p); });

    Object.keys(groups).forEach(function (key) {
      var list = groups[key];
      list.forEach(function (p, k) {
        var pt = pieceAt(+key, k, list.length, turn);
        var d = Math.hypot(px - pt.x, py - pt.y);
        if (d < bd) { bd = d; best = p; }
      });
    });

    if (best && bd < PIECE_R * 2.4) {
      selected = best.idx; draw();
      setTimeout(function () { movePiece(pl, best, pending); }, 100);
    }
  });

  el.btn.addEventListener('click', throwYut);
  document.getElementById('btnNew').addEventListener('click', newGame);
  el.modeBtn.addEventListener('click', function () {
    vsAI = !vsAI;
    el.modeBtn.textContent = vsAI ? 'AI 대전 중' : '2인 대전 중';
    newGame();
    msg(vsAI ? 'AI와 대전합니다 (나는 파랑)' : '한 기기에서 2인 대전');
  });

  function fit() {
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    draw();
  }

  window.addEventListener('resize', fit);
  buildNodes();
  newGame();
  fit();

  if (/[?&]selftest=1/.test(location.search)) {
    try {
      var p = makePiece(0, 0);
      var path = [p.pos];
      for (var i = 0; i < 40; i++) {
        var nx = nextNode(p);
        path.push(nx);
        if (nx === START) break;
        p.pos = nx;
      }
      document.body.setAttribute('data-yut',
        'nodes=' + nodes.length + '|path=' + path.join('>'));
    } catch (e) {
      document.body.setAttribute('data-yut', 'ERR ' + e.message);
    }
  }
})();
