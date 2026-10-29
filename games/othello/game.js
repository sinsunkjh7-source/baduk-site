/* 오델로 — 바둑스쿨 Fun (8×8 · 뒤집기 · AI 대전) */
(function () {
  'use strict';

  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var N = 8, CELL = 640 / N;
  var EMPTY = 0, BLACK = 1, WHITE = 2;

  var board = [];
  var turn = BLACK;
  var vsAI = true;
  var over = false;
  var history = [];
  var legal = [];
  var lastMove = -1;
  var thinking = false;
  var hover = -1;

  var DIRS = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  var WEIGHTS = [
    120,-20, 20,  5,  5, 20,-20,120,
    -20,-40, -5, -5, -5, -5,-40,-20,
     20, -5, 15,  3,  3, 15, -5, 20,
      5, -5,  3,  3,  3,  3, -5,  5,
      5, -5,  3,  3,  3,  3, -5,  5,
     20, -5, 15,  3,  3, 15, -5, 20,
    -20,-40, -5, -5, -5, -5,-40,-20,
    120,-20, 20,  5,  5, 20,-20,120
  ];

  var el = {
    cb: document.getElementById('cntBlack'),
    cw: document.getElementById('cntWhite'),
    turn: document.getElementById('turnBar'),
    msg: document.getElementById('msg'),
    mode: document.getElementById('btnMode')
  };

  function init() {
    board = new Array(64).fill(EMPTY);
    board[27] = WHITE; board[36] = WHITE;
    board[28] = BLACK; board[35] = BLACK;
    turn = BLACK; over = false; history = []; lastMove = -1; thinking = false;
    legal = moves(board, turn);
    msg('');
    draw(); update();
  }

  function opp(p) { return p === BLACK ? WHITE : BLACK; }
  function cnt(b, p) { var n = 0; for (var i = 0; i < 64; i++) if (b[i] === p) n++; return n; }
  function xy(i) { return [i % N, Math.floor(i / N)]; }
  function idx(x, y) { return y * N + x; }

  function flipsFor(b, i, p) {
    if (b[i] !== EMPTY) return null;
    var x = i % N, y = Math.floor(i / N), out = [];
    for (var d = 0; d < 8; d++) {
      var dx = DIRS[d][0], dy = DIRS[d][1];
      var cx = x + dx, cy = y + dy, line = [];
      while (cx >= 0 && cx < N && cy >= 0 && cy < N && b[idx(cx, cy)] === opp(p)) {
        line.push(idx(cx, cy));
        cx += dx; cy += dy;
      }
      if (line.length && cx >= 0 && cx < N && cy >= 0 && cy < N && b[idx(cx, cy)] === p) {
        out = out.concat(line);
      }
    }
    return out.length ? out : null;
  }

  function moves(b, p) {
    var res = [];
    for (var i = 0; i < 64; i++) {
      var f = flipsFor(b, i, p);
      if (f) res.push({ i: i, flips: f });
    }
    return res;
  }

  function place(b, mv, p) {
    var nb = b.slice();
    nb[mv.i] = p;
    mv.flips.forEach(function (j) { nb[j] = p; });
    return nb;
  }

  /* ---------- AI ---------- */
  function evalBoard(b) {
    var s = 0;
    for (var i = 0; i < 64; i++) {
      if (b[i] === BLACK) s += WEIGHTS[i];
      else if (b[i] === WHITE) s -= WEIGHTS[i];
    }
    s += (moves(b, BLACK).length - moves(b, WHITE).length) * 3;
    return s;
  }

  function search(b, p, depth, alpha, beta) {
    var mv = moves(b, p);
    if (!mv.length) {
      if (!moves(b, opp(p)).length) {
        var d = cnt(b, BLACK) - cnt(b, WHITE);
        return d === 0 ? 0 : (d > 0 ? 999 : -999);
      }
      return search(b, opp(p), depth, alpha, beta);
    }
    if (depth === 0) return evalBoard(b);

    if (p === BLACK) {
      var best = -Infinity;
      for (var i = 0; i < mv.length; i++) {
        var v = search(place(b, mv[i], p), opp(p), depth - 1, alpha, beta);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    var worst = Infinity;
    for (var j = 0; j < mv.length; j++) {
      var v2 = search(place(b, mv[j], p), opp(p), depth - 1, alpha, beta);
      if (v2 < worst) worst = v2;
      if (worst < beta) beta = worst;
      if (alpha >= beta) break;
    }
    return worst;
  }

  function aiMove() {
    var mv = moves(board, WHITE);
    if (!mv.length) return null;
    var best = null, bv = Infinity;
    for (var i = 0; i < mv.length; i++) {
      var v = search(place(board, mv[i], WHITE), BLACK, 4, -Infinity, Infinity);
      if (v < bv) { bv = v; best = mv[i]; }
    }
    return best;
  }

  /* ---------- 흐름 ---------- */
  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  function update() {
    el.cb.textContent = cnt(board, BLACK);
    el.cw.textContent = cnt(board, WHITE);
    el.turn.textContent = over ? '게임 종료' : (turn === BLACK ? '흑 차례' : '백 차례');
  }

  function afterMove() {
    legal = moves(board, turn);
    if (!legal.length) {
      var other = moves(board, opp(turn));
      if (!other.length) {
        over = true;
        var b = cnt(board, BLACK), w = cnt(board, WHITE);
        msg(b === w ? '무승부 (' + b + ':' + w + ')'
          : (b > w ? '흑 승리! (' + b + ':' + w + ')' : '백 승리! (' + b + ':' + w + ')'));
      } else {
        msg((turn === BLACK ? '흑' : '백') + '이 둘 곳이 없어 차례를 넘깁니다');
        turn = opp(turn);
        legal = moves(board, turn);
      }
    }
    draw(); update();

    if (!over && vsAI && turn === WHITE) {
      thinking = true;
      setTimeout(function () {
        var mv = aiMove();
        thinking = false;
        if (mv) doMove(mv, WHITE);
        else afterMove();
      }, 420);
    }
  }

  function doMove(mv, p) {
    history.push({ b: board.slice(), t: turn });
    if (history.length > 40) history.shift();
    board = place(board, mv, p);
    lastMove = mv.i;
    turn = opp(p);
    afterMove();
  }

  cv.addEventListener('click', function (e) {
    if (over || thinking || !legal.length) return;
    if (vsAI && turn === WHITE) return;
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) / (r.width / N);
    var y = (e.clientY - r.top) / (r.height / N);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    var i = idx(Math.floor(x), Math.floor(y));
    var mv = legal.filter(function (m) { return m.i === i; })[0];
    if (mv) doMove(mv, turn);
  });

  cv.addEventListener('pointermove', function (e) {
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) / (r.width / N);
    var y = (e.clientY - r.top) / (r.height / N);
    if (x < 0 || y < 0 || x >= N || y >= N) { hover = -1; }
    else { hover = idx(Math.floor(x), Math.floor(y)); }
    draw();
  });

  document.getElementById('btnNew').addEventListener('click', init);

  document.getElementById('btnUndo').addEventListener('click', function () {
    if (!history.length || thinking) return;
    var steps = (vsAI && history.length >= 2) ? 2 : 1;
    for (var k = 0; k < steps && history.length; k++) {
      var h = history.pop();
      board = h.b; turn = h.t;
    }
    over = false; lastMove = -1;
    legal = moves(board, turn);
    msg(''); draw(); update();
  });

  el.mode.addEventListener('click', function (e) {
    vsAI = !vsAI;
    e.currentTarget.textContent = vsAI ? 'AI 대전 중' : '2인 대전 중';
    init();
    msg(vsAI ? 'AI와 대전합니다 (나는 흑)' : '한 기기에서 2인 대전');
  });

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 640, 640);

    var g = ctx.createLinearGradient(0, 0, 640, 640);
    g.addColorStop(0, '#3f8f52'); g.addColorStop(1, '#2f7a44');
    ctx.fillStyle = g;
    roundRect(ctx, 0, 0, 640, 640, 14); ctx.fill();

    ctx.strokeStyle = 'rgba(20,60,35,.55)';
    ctx.lineWidth = 1.5;
    for (var i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 640); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(640, i * CELL); ctx.stroke();
    }

    /* 둘 수 있는 자리 */
    legal.forEach(function (m) {
      var x = (m.i % N) * CELL + CELL / 2, y = Math.floor(m.i / N) * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(x, y, CELL * 0.13, 0, 6.283);
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fill();
      if (m.i === hover) {
        ctx.beginPath();
        ctx.arc(x, y, CELL * 0.30, 0, 6.283);
        ctx.strokeStyle = 'rgba(255,255,255,.5)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    /* 돌 */
    for (var k = 0; k < 64; k++) {
      var v = board[k];
      if (!v) continue;
      var cx = (k % N) * CELL + CELL / 2;
      var cy = Math.floor(k / N) * CELL + CELL / 2;
      var R = CELL * 0.38;

      ctx.beginPath();
      ctx.ellipse(cx + 1.5, cy + 3, R * 0.96, R * 0.86, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fill();

      var rg = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.12, cx, cy, R);
      if (v === BLACK) { rg.addColorStop(0, '#5f5f5f'); rg.addColorStop(0.55, '#1e1e1e'); rg.addColorStop(1, '#050505'); }
      else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.65, '#f0f0f0'); rg.addColorStop(1, '#c9c9c9'); }

      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, 6.283);
      ctx.fillStyle = rg;
      ctx.fill();

      if (k === lastMove) {
        ctx.beginPath();
        ctx.arc(cx, cy, R + 3, 0, 6.283);
        ctx.strokeStyle = 'rgba(255,215,90,.85)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
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

  function fit() {
    cv.width = Math.round(640 * DPR);
    cv.height = Math.round(640 * DPR);
    draw();
  }

  window.addEventListener('resize', fit);
  init();
  fit();

  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var mv = legal[0] || moves(board, turn)[0];
      if (mv) doMove(mv, turn);
      setTimeout(function () {
        document.title = 'T|black=' + cnt(board, BLACK) + '|white=' + cnt(board, WHITE)
          + '|turn=' + turn + '|legal=' + legal.length + '|last=' + lastMove;
      }, 1600);
    }, 500);
  }
})();
