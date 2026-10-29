/* 오델로 — 바둑스쿨 Fun
   8×8 · 뒤집기 · AI(난이도 3단계) · 미리보기(3단계) · 힌트 · 뒤집힘 애니메이션 */
(function () {
  'use strict';

  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var N = 8, CELL = 640 / N;
  var EMPTY = 0, BLACK = 1, WHITE = 2;
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

  var board = [], turn = BLACK, vsAI = true, over = false;
  var history = [], legal = [], lastMove = -1, thinking = false;
  var hover = -1, previewMode = 'off', depth = 4, hintMove = -1;
  var anim = null, dirty = true;

  var el = {
    cb: document.getElementById('cntBlack'),
    cw: document.getElementById('cntWhite'),
    turn: document.getElementById('turnBar'),
    msg: document.getElementById('msg'),
    mode: document.getElementById('btnMode'),
    level: document.getElementById('selLevel'),
    preview: document.getElementById('selPreview')
  };

  function opp(p) { return p === BLACK ? WHITE : BLACK; }
  function cnt(b, p) { var n = 0; for (var i = 0; i < 64; i++) if (b[i] === p) n++; return n; }
  function idx(x, y) { return y * N + x; }
  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  /* ---------- 규칙 ---------- */
  function flipsFor(b, i, p) {
    if (b[i] !== EMPTY) return null;
    var x = i % N, y = (i / N) | 0, out = [];
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
    for (var k = 0; k < mv.flips.length; k++) nb[mv.flips[k]] = p;
    return nb;
  }

  /* 패스/종료 판정 (순수 함수) */
  function nextTurn(b, p) {
    var mv = moves(b, p);
    if (mv.length) return { turn: p, legal: mv, pass: false, over: false };
    var other = moves(b, opp(p));
    if (other.length) return { turn: opp(p), legal: other, pass: true, over: false };
    return { turn: p, legal: [], pass: true, over: true };
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

  function search(b, p, d, alpha, beta) {
    var mv = moves(b, p);
    if (!mv.length) {
      if (!moves(b, opp(p)).length) {
        var diff = cnt(b, BLACK) - cnt(b, WHITE);
        return diff === 0 ? 0 : (diff > 0 ? 999 : -999);
      }
      return search(b, opp(p), d, alpha, beta);
    }
    if (d === 0) return evalBoard(b);

    if (p === BLACK) {
      var best = -Infinity;
      for (var i = 0; i < mv.length; i++) {
        var v = search(place(b, mv[i], p), opp(p), d - 1, alpha, beta);
        if (v > best) best = v;
        if (best > alpha) alpha = best;
        if (alpha >= beta) break;
      }
      return best;
    }
    var worst = Infinity;
    for (var j = 0; j < mv.length; j++) {
      var v2 = search(place(b, mv[j], p), opp(p), d - 1, alpha, beta);
      if (v2 < worst) worst = v2;
      if (worst < beta) beta = worst;
      if (alpha >= beta) break;
    }
    return worst;
  }

  function bestMove(b, p) {
    var mv = moves(b, p);
    if (!mv.length) return null;
    var best = null, bv = (p === BLACK ? -Infinity : Infinity);
    for (var i = 0; i < mv.length; i++) {
      var v = search(place(b, mv[i], p), opp(p), depth - 1, -Infinity, Infinity);
      if (p === BLACK ? v > bv : v < bv) { bv = v; best = mv[i]; }
    }
    return best;
  }

  /* ---------- 흐름 ---------- */
  function init() {
    board = new Array(64).fill(EMPTY);
    board[27] = WHITE; board[36] = WHITE;
    board[28] = BLACK; board[35] = BLACK;
    turn = BLACK; over = false; history = []; lastMove = -1;
    thinking = false; hintMove = -1; anim = null;
    legal = moves(board, turn);
    msg('');
    dirty = true; update();
  }

  function update() {
    el.cb.textContent = cnt(board, BLACK);
    el.cw.textContent = cnt(board, WHITE);
    el.turn.textContent = over ? '게임 종료' : (turn === BLACK ? '흑 차례' : '백 차례');
  }

  function afterMove() {
    var nt = nextTurn(board, turn);
    /* turn 은 이미 상대로 바뀐 상태 */
    if (nt.pass && !nt.over) msg((turn === BLACK ? '흑' : '백') + '이 둘 곳이 없어 차례를 넘깁니다');

    if (nt.over) {
      over = true;
      var b = cnt(board, BLACK), w = cnt(board, WHITE);
      msg(b === w ? '무승부 (' + b + ':' + w + ')'
        : (b > w ? '흑 승리! (' + b + ':' + w + ')' : '백 승리! (' + b + ':' + w + ')'));
      legal = [];
    } else {
      turn = nt.turn;
      legal = nt.legal;
    }

    dirty = true; update();

    if (!over && vsAI && turn === WHITE) {
      thinking = true;
      setTimeout(function () {
        var mv = bestMove(board, WHITE);
        thinking = false;
        if (mv) doMove(mv, WHITE);
        else afterMove();
      }, 380);
    }
  }

  function doMove(mv, p) {
    history.push({ b: board.slice(), t: turn });
    if (history.length > 60) history.shift();

    board = place(board, mv, p);
    lastMove = mv.i;
    hintMove = -1;
    turn = opp(p);

    anim = { start: performance.now(), items: mv.flips.map(function (i) { return { i: i, from: opp(p), to: p }; }) };
    dirty = true;
    requestAnimationFrame(tick);

    setTimeout(afterMove, 60);
  }

  /* ---------- 그리기 ---------- */
  function tick() {
    var now = performance.now();
    if (anim && now - anim.start > 420) anim = null;
    if (anim) dirty = true;
    if (dirty) { draw(now); dirty = false; }
    if (anim) requestAnimationFrame(tick);
  }

  function draw(now) {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, 640, 640);

    var g = ctx.createLinearGradient(0, 0, 640, 640);
    g.addColorStop(0, '#3f8f52'); g.addColorStop(1, '#2f7a44');
    ctx.fillStyle = g;
    roundRect(ctx, 0, 0, 640, 640, 14); ctx.fill();

    ctx.strokeStyle = 'rgba(20,60,35,.5)';
    ctx.lineWidth = 1.5;
    for (var i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, 640); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(640, i * CELL); ctx.stroke();
    }

    /* 둘 수 있는 자리 */
    legal.forEach(function (m) {
      var x = (m.i % N) * CELL + CELL / 2, y = ((m.i / N) | 0) * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(x, y, CELL * 0.12, 0, 6.283);
      ctx.fillStyle = 'rgba(255,255,255,.34)';
      ctx.fill();
    });

    /* 힌트 */
    if (hintMove >= 0) {
      var hx = (hintMove % N) * CELL + CELL / 2, hy = ((hintMove / N) | 0) * CELL + CELL / 2;
      ctx.beginPath();
      ctx.arc(hx, hy, CELL * 0.33, 0, 6.283);
      ctx.strokeStyle = 'rgba(255,214,90,.95)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    /* 미리보기 */
    if (hover >= 0 && legal.length) {
      var mv = legal.filter(function (m) { return m.i === hover; })[0];
      if (mv) {
        var hx2 = (hover % N) * CELL + CELL / 2, hy2 = ((hover / N) | 0) * CELL + CELL / 2;

        ctx.beginPath();
        ctx.arc(hx2, hy2, CELL * 0.33, 0, 6.283);
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (previewMode !== 'off') {
          mv.flips.forEach(function (j) {
            var fx = (j % N) * CELL + CELL / 2, fy = ((j / N) | 0) * CELL + CELL / 2;
            ctx.beginPath();
            ctx.arc(fx, fy, CELL * 0.40, 0, 6.283);
            ctx.strokeStyle = 'rgba(255,214,90,.85)';
            ctx.lineWidth = 3;
            ctx.stroke();
          });

          if (previewMode === 'result') {
            var mine = turn;
            var after = mv.flips.length;
            var txt = '+' + after;
            ctx.font = '900 20px "Pretendard","Malgun Gothic",sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'rgba(10,30,18,.55)';
            var w = ctx.measureText(txt).width + 18;
            roundRect(ctx, hx2 - w / 2, hy2 - CELL * 0.62, w, 26, 13);
            ctx.fill();
            ctx.fillStyle = '#ffe9a8';
            ctx.fillText(txt, hx2, hy2 - CELL * 0.49);
          }
        }
      }
    }

    /* 돌 */
    for (var k = 0; k < 64; k++) {
      var v = board[k];
      if (!v && !inAnim(k)) continue;

      var cx = (k % N) * CELL + CELL / 2;
      var cy = ((k / N) | 0) * CELL + CELL / 2;
      var R = CELL * 0.38;

      var scaleX = 1, color = v;
      if (anim) {
        var it = anim.items.filter(function (a) { return a.i === k; })[0];
        if (it) {
          var p = Math.min(1, (now - anim.start) / 420);
          scaleX = Math.abs(Math.cos(Math.PI * p));
          color = p < 0.5 ? it.from : it.to;
        }
      }

      ctx.beginPath();
      ctx.ellipse(cx + 1.5, cy + 3, R * 0.96 * 0.9, R * 0.86, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(0,0,0,.22)';
      ctx.fill();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(Math.max(0.06, scaleX), 1);

      var rg = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.12, 0, 0, R);
      if (color === BLACK) { rg.addColorStop(0, '#5f5f5f'); rg.addColorStop(0.55, '#1e1e1e'); rg.addColorStop(1, '#050505'); }
      else { rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.65, '#f0f0f0'); rg.addColorStop(1, '#c9c9c9'); }

      ctx.beginPath();
      ctx.arc(0, 0, R, 0, 6.283);
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.restore();

      if (k === lastMove && !anim) {
        ctx.beginPath();
        ctx.arc(cx, cy, R + 3, 0, 6.283);
        ctx.strokeStyle = 'rgba(255,215,90,.85)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    }
  }

  function inAnim(k) {
    if (!anim) return false;
    return anim.items.some(function (a) { return a.i === k; });
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
  function cellFromEvent(e) {
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) / (r.width / N);
    var y = (e.clientY - r.top) / (r.height / N);
    if (x < 0 || y < 0 || x >= N || y >= N) return -1;
    return idx(Math.floor(x), Math.floor(y));
  }

  cv.addEventListener('pointermove', function (e) {
    var i = cellFromEvent(e);
    if (i !== hover) { hover = i; dirty = true; }
  });

  cv.addEventListener('pointerleave', function () { hover = -1; dirty = true; });

  cv.addEventListener('click', function (e) {
    if (over || thinking || anim) return;
    if (vsAI && turn === WHITE) return;
    var i = cellFromEvent(e);
    var mv = legal.filter(function (m) { return m.i === i; })[0];
    if (mv) doMove(mv, turn);
  });

  document.getElementById('btnNew').addEventListener('click', init);

  document.getElementById('btnUndo').addEventListener('click', function () {
    if (!history.length || thinking) return;
    var steps = (vsAI && history.length >= 2) ? 2 : 1;
    for (var k = 0; k < steps && history.length; k++) {
      var h = history.pop();
      board = h.b; turn = h.t;
    }
    over = false; lastMove = -1; anim = null; hintMove = -1;
    legal = moves(board, turn);
    msg(''); dirty = true; update();
  });

  document.getElementById('btnHint').addEventListener('click', function () {
    if (over || thinking) return;
    var mv = bestMove(board, turn);
    if (!mv) { msg('둘 곳이 없습니다'); return; }
    hintMove = mv.i; dirty = true;
    msg('힌트: 노란 원 자리');
    setTimeout(function () { hintMove = -1; dirty = true; }, 2400);
  });

  el.mode.addEventListener('click', function (e) {
    vsAI = !vsAI;
    e.currentTarget.textContent = vsAI ? 'AI 대전 중' : '2인 대전 중';
    init();
    msg(vsAI ? 'AI와 대전합니다 (나는 흑)' : '한 기기에서 2인 대전');
  });

  el.level.addEventListener('change', function () { depth = +this.value; });
  el.preview.addEventListener('change', function () { previewMode = this.value; dirty = true; });

  function fit() {
    cv.width = Math.round(640 * DPR);
    cv.height = Math.round(640 * DPR);
    dirty = true;
    requestAnimationFrame(function () { draw(performance.now()); });
  }

  window.addEventListener('resize', fit);

  init();
  fit();

  /* ---------- 자체 검증 ---------- */
  if (/[?&]selftest=1/.test(location.search)) {
    try {
      var b = new Array(64).fill(0);
      b[27] = WHITE; b[36] = WHITE; b[28] = BLACK; b[35] = BLACK;
      var t = BLACK, ply = 0, errs = [], passes = 0;

      function independent(bb, i, p) {
        if (bb[i] !== 0) return null;
        var x = i % 8, y = (i / 8) | 0, out = [];
        var ds = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        ds.forEach(function (d) {
          var cx = x + d[0], cy = y + d[1], line = [];
          while (cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && bb[cy * 8 + cx] === (p === 1 ? 2 : 1)) {
            line.push(cy * 8 + cx); cx += d[0]; cy += d[1];
          }
          if (line.length && cx >= 0 && cx < 8 && cy >= 0 && cy < 8 && bb[cy * 8 + cx] === p) out = out.concat(line);
        });
        return out.length ? out.sort(function (a, c) { return a - c; }) : null;
      }

      while (ply < 200) {
        var mv = moves(b, t);
        if (!mv.length) {
          if (!moves(b, t === 1 ? 2 : 1).length) break;
          passes++; var nt0 = nextTurn(b, t);
          if (nt0.turn === t) errs.push('pass-not-switched@' + ply);
          t = nt0.turn; continue;
        }
        var pick = mv[Math.floor(Math.random() * mv.length)];
        var ind = independent(b, pick.i, t);
        var mine = pick.flips.slice().sort(function (a, c) { return a - c; });
        if (!ind || ind.join(',') !== mine.join(',')) errs.push('flip-mismatch@' + ply);

        b = place(b, pick, t);
        if (b.filter(function (v) { return v; }).length !== 5 + ply) errs.push('count@' + ply);
        t = t === 1 ? 2 : 1;
        ply++;
      }

      /* 패스 상황 강제 검증 */
      var passOk = 'na';
      for (var tries = 0; tries < 20000 && passOk === 'na'; tries++) {
        var rb = new Array(64).fill(0);
        for (var q = 0; q < 64; q++) rb[q] = Math.random() < 0.35 ? (Math.random() < 0.5 ? 1 : 2) : 0;
        if (!moves(rb, 1).length && moves(rb, 2).length) {
          var rr = nextTurn(rb, 1);
          passOk = (rr.turn === 2 && rr.pass) ? 'ok' : 'bad';
        }
      }

      document.body.setAttribute('data-selftest',
        'ST|plies=' + ply + '|passes=' + passes
        + '|black=' + b.filter(function (v) { return v === 1; }).length
        + '|white=' + b.filter(function (v) { return v === 2; }).length
        + '|errs=' + (errs.length ? errs.slice(0, 2).join(',') : 'none')
        + '|passTest=' + passOk);
    } catch (e) {
      document.body.setAttribute('data-selftest', 'STERR|' + e.name + ':' + e.message);
    }
  }

  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var mv = legal[0] || moves(board, turn)[0];
      if (mv) doMove(mv, turn);
      setTimeout(function () {
        document.body.setAttribute('data-auto',
          'A|black=' + cnt(board, BLACK) + '|white=' + cnt(board, WHITE)
          + '|turn=' + turn + '|legal=' + legal.length + '|last=' + lastMove);
      }, 1800);
    }, 500);
  }
})();
