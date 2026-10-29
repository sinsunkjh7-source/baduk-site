/* 고누 (3×3 우물고누) — 바둑스쿨 Fun
   말 이동 1칸 / 상대 돌 뛰어넘어 잡기 / 상대 말이 없거나 움직일 수 없으면 승리 */
(function () {
  'use strict';

  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var SIZE = 3, N = SIZE * SIZE;
  var PAD = 78, SP = 0;

  var board = [];
  var turn = 'b';
  var selected = -1;
  var legal = [];
  var history = [];
  var over = false;
  var vsAI = true;
  var thinking = false;

  var el = {
    turnText: document.getElementById('turnText'),
    hint: document.getElementById('hintText'),
    cntB: document.getElementById('cntBlack'),
    cntW: document.getElementById('cntWhite'),
    msg: document.getElementById('msg'),
    bar: document.getElementById('turnBar')
  };

  /* ---------- 좌표 ---------- */
  function pos(i) {
    var r = Math.floor(i / SIZE), c = i % SIZE;
    return [PAD + c * SP, PAD + r * SP];
  }

  function resizeCanvas() {
    var css = cv.getBoundingClientRect().width || 560;
    cv.width = Math.round(css * DPR);
    cv.height = Math.round(css * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    SP = (css - PAD * 2) / (SIZE - 1);
    draw();
  }

  /* ---------- 규칙 ---------- */
  function neighbors(i) {
    var r = Math.floor(i / SIZE), c = i % SIZE, out = [];
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
      var nr = r + d[0], nc = c + d[1];
      if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push([nr * SIZE + nc, d]);
    });
    return out;
  }

  function movesFor(bd, i) {
    var me = bd[i], res = { steps: [], caps: [] };
    if (!me) return res;
    neighbors(i).forEach(function (nb) {
      var j = nb[0], d = nb[1];
      if (!bd[j]) { res.steps.push(j); return; }
      if (bd[j] !== me) {
        var r = Math.floor(i / SIZE) + d[0] * 2, c = (i % SIZE) + d[1] * 2;
        if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) {
          var k = r * SIZE + c;
          if (!bd[k]) res.caps.push({ to: k, over: j });
        }
      }
    });
    return res;
  }

  function allMoves(bd, who) {
    var out = [];
    for (var i = 0; i < N; i++) {
      if (bd[i] !== who) continue;
      var m = movesFor(bd, i);
      m.steps.forEach(function (t) { out.push({ from: i, to: t, cap: -1 }); });
      m.caps.forEach(function (c) { out.push({ from: i, to: c.to, cap: c.over }); });
    }
    return out;
  }

  function count(bd, who) {
    var n = 0;
    for (var i = 0; i < N; i++) if (bd[i] === who) n++;
    return n;
  }

  function apply(bd, mv) {
    var nb = bd.slice();
    nb[mv.to] = nb[mv.from];
    nb[mv.from] = null;
    if (mv.cap >= 0) nb[mv.cap] = null;
    return nb;
  }

  function winner(bd) {
    if (count(bd, 'w') === 0) return 'b';
    if (count(bd, 'b') === 0) return 'w';
    if (allMoves(bd, 'b').length === 0) return 'w';
    if (allMoves(bd, 'w').length === 0) return 'b';
    return null;
  }

  /* ---------- AI ---------- */
  function evalBoard(bd) {
    var mb = count(bd, 'b'), mw = count(bd, 'w');
    var mob = allMoves(bd, 'w').length - allMoves(bd, 'b').length;
    return (mb - mw) * 10 + mob * 0.4;
  }

  function search(bd, who, depth, alpha, beta) {
    var w = winner(bd);
    if (w === 'b') return 999 - (8 - depth);
    if (w === 'w') return -999 + (8 - depth);
    if (depth === 0) return evalBoard(bd);

    var moves = allMoves(bd, who);
    if (!moves.length) return who === 'b' ? -999 : 999;

    moves.sort(function (a, b) { return (b.cap >= 0) - (a.cap >= 0); });

    if (who === 'b') {
      var best = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var v = search(apply(bd, moves[i]), 'w', depth - 1, alpha, beta);
        if (v > best) best = v;
        alpha = Math.max(alpha, v);
        if (alpha >= beta) break;
      }
      return best;
    }
    var worst = Infinity;
    for (var j = 0; j < moves.length; j++) {
      var v2 = search(apply(bd, moves[j]), 'b', depth - 1, alpha, beta);
      if (v2 < worst) worst = v2;
      beta = Math.min(beta, v2);
      if (alpha >= beta) break;
    }
    return worst;
  }

  function aiMove() {
    var moves = allMoves(board, 'w');
    if (!moves.length) return null;
    var best = null, bestV = Infinity;
    for (var i = 0; i < moves.length; i++) {
      var v = search(apply(board, moves[i]), 'b', 4, -Infinity, Infinity);
      if (v < bestV) { bestV = v; best = moves[i]; }
    }
    return best;
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    var w = cv.width / DPR, h = cv.height / DPR;
    ctx.clearRect(0, 0, w, h);

    /* 판 바탕 */
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f0d3a4');
    g.addColorStop(0.5, '#e6c084');
    g.addColorStop(1, '#d9ab68');
    ctx.fillStyle = g;
    ctx.beginPath();
    roundRect(ctx, 6, 6, w - 12, h - 12, 18);
    ctx.fill();

    /* 선 */
    ctx.strokeStyle = 'rgba(122,79,36,.75)';
    ctx.lineWidth = Math.max(3, w * 0.006);
    ctx.lineCap = 'round';

    for (var r = 0; r < SIZE; r++) {
      var a = pos(r * SIZE), b = pos(r * SIZE + SIZE - 1);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    for (var c = 0; c < SIZE; c++) {
      var p1 = pos(c), p2 = pos((SIZE - 1) * SIZE + c);
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke();
    }

    /* 교차점 */
    for (var i = 0; i < N; i++) {
      var q = pos(i);
      ctx.beginPath();
      ctx.arc(q[0], q[1], Math.max(4, w * 0.008), 0, 6.283);
      ctx.fillStyle = 'rgba(122,79,36,.85)';
      ctx.fill();
    }

    /* 이동 가능 표시 */
    legal.forEach(function (t) {
      var q = pos(t.to);
      ctx.beginPath();
      ctx.arc(q[0], q[1], Math.max(9, w * 0.018), 0, 6.283);
      ctx.fillStyle = t.cap >= 0 ? 'rgba(214,60,50,.55)' : 'rgba(74,138,58,.45)';
      ctx.fill();
    });

    /* 돌 */
    var R = w * 0.072;
    for (var j = 0; j < N; j++) {
      var s = board[j];
      if (!s) continue;
      var p = pos(j);

      ctx.beginPath();
      ctx.ellipse(p[0], p[1] + R * 0.16, R * 0.98, R * 0.9, 0, 0, 6.283);
      ctx.fillStyle = 'rgba(60,40,20,.22)';
      ctx.fill();

      var rg = ctx.createRadialGradient(p[0] - R * 0.3, p[1] - R * 0.35, R * 0.1, p[0], p[1], R);
      if (s === 'b') {
        rg.addColorStop(0, '#5c5c5c'); rg.addColorStop(0.5, '#232323'); rg.addColorStop(1, '#0a0a0a');
      } else {
        rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.6, '#f2f2f2'); rg.addColorStop(1, '#cfcfcf');
      }
      ctx.beginPath();
      ctx.arc(p[0], p[1], R, 0, 6.283);
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.lineWidth = s === 'w' ? 1.5 : 0;
      ctx.strokeStyle = 'rgba(150,150,150,.7)';
      if (s === 'w') ctx.stroke();

      if (j === selected) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], R + Math.max(5, w * 0.012), 0, 6.283);
        ctx.lineWidth = Math.max(3, w * 0.006);
        ctx.strokeStyle = '#3f8f36';
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

  /* ---------- 상태 ---------- */
  function newGame() {
    board = ['b','b','b','w','w','w', null, null, null].map(function (v, i) {
      if (i === 6 || i === 7 || i === 8) return null;
      return v;
    });
    /* 흑: 왼쪽 열, 백: 오른쪽 열 */
    board = new Array(N).fill(null);
    board[0] = 'b'; board[3] = 'b'; board[6] = 'b';
    board[2] = 'w'; board[5] = 'w'; board[8] = 'w';

    turn = 'b'; selected = -1; legal = []; history = []; over = false; thinking = false;
    setMsg('');
    update();
    draw();
  }

  function update() {
    el.cntB.textContent = count(board, 'b');
    el.cntW.textContent = count(board, 'w');
    el.turnText.textContent = turn === 'b' ? '흑 차례' : '백 차례';
    el.bar.querySelector('.dot').className = 'dot ' + (turn === 'b' ? 'black' : 'white');
    el.hint.textContent = over ? '게임 종료' :
      (vsAI && turn === 'w' ? 'AI가 생각 중…' : '돌을 골라 움직이세요');
  }

  function setMsg(t) {
    el.msg.hidden = !t;
    el.msg.textContent = t || '';
  }

  function endCheck() {
    var w = winner(board);
    if (w) {
      over = true;
      setMsg(w === 'b' ? '흑 승리!' : '백 승리!');
      update();
      return true;
    }
    return false;
  }

  function doMove(mv) {
    history.push({ board: board.slice(), turn: turn });
    board = apply(board, mv);
    selected = -1; legal = [];
    turn = turn === 'b' ? 'w' : 'b';
    draw();
    if (endCheck()) return;
    update();
    if (vsAI && turn === 'w' && !over) {
      thinking = true; update();
      setTimeout(function () {
        var m = aiMove();
        thinking = false;
        if (m) doMove(m); else { over = true; setMsg('흑 승리! (백이 움직일 수 없음)'); update(); }
      }, 260);
    }
  }

  /* ---------- 입력 ---------- */
  cv.addEventListener('click', function (e) {
    if (over || thinking) return;
    if (vsAI && turn === 'w') return;

    var rect = cv.getBoundingClientRect();
    var x = (e.clientX - rect.left), y = (e.clientY - rect.top);
    var w = rect.width;
    var R = w * 0.072;
    var hit = -1;
    for (var i = 0; i < N; i++) {
      var p = pos(i);
      if (Math.hypot(x - p[0], y - p[1]) < R * 1.15) { hit = i; break; }
    }

    if (hit >= 0) {
      if (board[hit] === turn) {
        selected = hit;
        var m = movesFor(board, hit);
        legal = [];
        m.steps.forEach(function (t) { legal.push({ to: t, cap: -1 }); });
        m.caps.forEach(function (c) { legal.push({ to: c.to, cap: c.over }); });
        draw();
        return;
      }
      var target = legal.filter(function (t) { return t.to === hit; })[0];
      if (target) { doMove({ from: selected, to: hit, cap: target.cap }); return; }
    }

    selected = -1; legal = []; draw();
  });

  document.getElementById('btnNew').addEventListener('click', newGame);

  document.getElementById('btnUndo').addEventListener('click', function () {
    if (!history.length || thinking) return;
    var steps = (vsAI && history.length >= 2) ? 2 : 1;
    for (var i = 0; i < steps && history.length; i++) {
      var h = history.pop();
      board = h.board; turn = h.turn;
    }
    over = false; selected = -1; legal = []; setMsg('');
    draw(); update();
  });

  document.getElementById('btnMode').addEventListener('click', function (e) {
    vsAI = !vsAI;
    e.currentTarget.textContent = vsAI ? 'AI 대전 중' : '2인 대전 중';
    setMsg(vsAI ? 'AI와 대전합니다 (당신은 흑)' : '한 기기에서 2인 대전');
    newGame();
  });

  /* AUTO_TEST: ?auto=1 이면 흑이 자동으로 한 수 두고 결과를 title에 남긴다 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var mv = allMoves(board, turn)[0];
      if (mv) doMove(mv);
      setTimeout(function () {
        document.title = 'T|' + board.map(function (v) { return v || '.'; }).join('')
          + '|turn=' + turn + '|b=' + count(board, 'b') + '|w=' + count(board, 'w') + '|over=' + over;
      }, 1200);
    }, 300);
  }

  window.addEventListener('resize', resizeCanvas);
  newGame();
  resizeCanvas();
})();
