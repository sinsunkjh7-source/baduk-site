/* 윷놀이 — 바둑스쿨 Fun
   말 4개 · 던지기(도개걸윷모) · 잡기 · 윷/모 한 번 더 · AI 대전 */
(function () {
  'use strict';

  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  var W = 640, H = 640, PAD = 70, SIDE = W - PAD * 2;
  var NODES = 20, NODE_R = 12, PIECE_R = 18;

  var NAMES = { 1: '도', 2: '개', 3: '걸', 4: '윷', 5: '모' };

  var nodes = [];
  var players = [
    { id: 0, name: '나', pieces: [0, 0, 0, 0], color: '#2f6fb7', done: 0 },
    { id: 1, name: '상대', pieces: [0, 0, 0, 0], color: '#c0392b', done: 0 }
  ];
  var turn = 0;
  var phase = 'throw';          /* throw | move */
  var pending = 0;              /* 이번 이동 칸수 */
  var vsAI = true;
  var over = false;
  var selected = -1;

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

  /* ---------- 판 ---------- */
  function buildNodes() {
    nodes = [];
    for (var k = 0; k < NODES; k++) {
      var d = k * (4 * SIDE / NODES);
      var x, y;
      if (d < SIDE) { x = PAD + d; y = PAD; }
      else if (d < SIDE * 2) { x = PAD + SIDE; y = PAD + (d - SIDE); }
      else if (d < SIDE * 3) { x = PAD + SIDE - (d - SIDE * 2); y = PAD + SIDE; }
      else { x = PAD; y = PAD + SIDE - (d - SIDE * 3); }
      nodes.push({ x: x, y: y });
    }
  }

  function nodePos(i) { return nodes[i % NODES]; }

  function pieceScreen(p, idx, total, pid) {
    var n = nodePos(p);
    var ox = pid === 0 ? -PIECE_R * 1.15 : PIECE_R * 1.15;
    if (total <= 1) return { x: n.x + ox * 0.6, y: n.y };
    var ang = (idx / total) * Math.PI * 2 - Math.PI / 2;
    var r = PIECE_R * 1.05;
    return { x: n.x + ox * 0.6 + Math.cos(ang) * r, y: n.y + Math.sin(ang) * r };
  }

  /* ---------- 게임 ---------- */
  function newGame() {
    players.forEach(function (pl) {
      pl.pieces = [0, 0, 0, 0];
      pl.done = 0;
    });
    turn = 0; phase = 'throw'; pending = 0; over = false; selected = -1;
    el.sticks.innerHTML = '';
    for (var i = 0; i < 4; i++) {
      var s = document.createElement('span');
      s.className = 'y-stick';
      el.sticks.appendChild(s);
    }
    el.result.textContent = '—';
    msg('');
    update();
    draw();
  }

  function msg(t) { el.msg.hidden = !t; el.msg.textContent = t || ''; }

  function finishCount(pl) {
    return pl.pieces.filter(function (p) { return p >= NODES; }).length;
  }

  function update() {
    el.p1.textContent = finishCount(players[0]);
    el.p2.textContent = finishCount(players[1]);
    el.turn.textContent = over ? '게임 종료'
      : (vsAI && turn === 1 ? '상대(AI) 차례' : (turn === 0 ? '내 차례' : '상대 차례'));
    el.btn.disabled = over || phase !== 'throw' || (vsAI && turn === 1);
  }

  function rollSticks() {
    var backs = 0;
    var sticks = el.sticks.children;
    for (var i = 0; i < 4; i++) {
      var back = Math.random() < 0.5;
      if (back) backs++;
      sticks[i].classList.toggle('back', back);
    }
    var front = 4 - backs;
    var steps = front === 0 ? 5 : front;
    el.result.textContent = NAMES[steps] + ' (' + steps + ')';
    return steps;
  }

  function legalPieces(pl) {
    var out = [];
    pl.pieces.forEach(function (p, i) { if (p < NODES) out.push(i); });
    return out;
  }

  function throwYut() {
    if (over || phase !== 'throw') return;
    var steps = rollSticks();
    pending = steps;
    phase = 'move';
    selected = -1;
    update();
    msg(NAMES[steps] + '! 움직일 말을 고르세요');
    draw();

    if (vsAI && turn === 1) {
      setTimeout(aiPick, 520);
    }
  }

  function movePiece(pl, idx, steps) {
    var from = pl.pieces[idx];
    var to = from + steps;
    if (to >= NODES) {
      pl.pieces[idx] = NODES;       /* 완주 */
    } else {
      pl.pieces[idx] = to;
    }

    /* 잡기 */
    var captured = false;
    if (to < NODES) {
      var opp = players[1 - pl.id];
      opp.pieces = opp.pieces.map(function (p) {
        if (p === to && p < NODES) { captured = true; return 0; }
        return p;
      });
    }

    var extra = captured || steps === 4 || steps === 5;

    if (finishCount(pl) === 4) {
      over = true;
      msg(pl.id === 0 ? '내가 이겼습니다!' : '상대(AI) 승리');
      phase = 'throw';
      update(); draw();
      return;
    }

    if (extra) {
      phase = 'throw';
      msg(captured ? '잡았습니다! 한 번 더' : NAMES[steps] + '! 한 번 더');
      if (vsAI && pl.id === 1) setTimeout(throwYut, 550);
    } else {
      turn = 1 - turn;
      phase = 'throw';
      msg('');
      if (vsAI && turn === 1) setTimeout(throwYut, 550);
    }
    update(); draw();
  }

  function aiPick() {
    var pl = players[1];
    var opts = legalPieces(pl);
    if (!opts.length) { phase = 'throw'; turn = 0; update(); return; }

    var best = opts[0], bestScore = -1;
    opts.forEach(function (i) {
      var to = pl.pieces[i] + pending;
      var cap = false;
      if (to < NODES) {
        players[0].pieces.forEach(function (p) { if (p === to && p < NODES) cap = true; });
      }
      var sc = (cap ? 100 : 0) + (to >= NODES ? 60 : 0) + pl.pieces[i];
      if (sc > bestScore) { bestScore = sc; best = i; }
    });
    movePiece(pl, best, pending);
  }

  /* ---------- 그리기 ---------- */
  function draw() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);

    /* 판 바탕 */
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#f7edd9'); g.addColorStop(0.5, '#f0e0c2'); g.addColorStop(1, '#e6d0a8');
    ctx.fillStyle = g;
    roundRect(ctx, 6, 6, W - 12, H - 12, 22); ctx.fill();

    /* 외곽선 */
    ctx.strokeStyle = 'rgba(122,79,36,.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(PAD, PAD, SIDE, SIDE);

    /* 대각선 (짧은 길) */
    ctx.beginPath();
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD + SIDE, PAD + SIDE);
    ctx.moveTo(PAD + SIDE, PAD); ctx.lineTo(PAD, PAD + SIDE);
    ctx.strokeStyle = 'rgba(122,79,36,.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* 노드 */
    nodes.forEach(function (n, i) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_R * 0.42, 0, 6.283);
      ctx.fillStyle = 'rgba(122,79,36,.75)';
      ctx.fill();
    });

    /* 중앙 표시 */
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 8, 0, 6.283);
    ctx.fillStyle = 'rgba(122,79,36,.5)';
    ctx.fill();

    /* 말 */
    [0, 1].forEach(function (pid) {
      var pl = players[pid];
      var groups = {};
      pl.pieces.forEach(function (p, i) {
        if (p >= NODES) return;
        (groups[p] = groups[p] || []).push(i);
      });

      Object.keys(groups).forEach(function (key) {
        var pos = +key;
        var list = groups[key];
        list.forEach(function (idx, k) {
          var pt = pieceScreen(pos, k, list.length, pid);
          var isSel = (pid === turn && idx === selected);

          ctx.beginPath();
          ctx.ellipse(pt.x + 1.5, pt.y + 3, PIECE_R * 0.95, PIECE_R * 0.82, 0, 0, 6.283);
          ctx.fillStyle = 'rgba(60,40,20,.22)';
          ctx.fill();

          var rg = ctx.createRadialGradient(pt.x - PIECE_R * 0.35, pt.y - PIECE_R * 0.4, PIECE_R * 0.15, pt.x, pt.y, PIECE_R);
          if (pid === 0) { rg.addColorStop(0, '#8fc0ee'); rg.addColorStop(0.6, pl.color); rg.addColorStop(1, '#1d4a7d'); }
          else { rg.addColorStop(0, '#f0938a'); rg.addColorStop(0.6, pl.color); rg.addColorStop(1, '#8a2a1f'); }

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, PIECE_R, 0, 6.283);
          ctx.fillStyle = rg;
          ctx.fill();
          ctx.lineWidth = isSel ? 3 : 1.5;
          ctx.strokeStyle = isSel ? '#ffd257' : 'rgba(255,255,255,.55)';
          ctx.stroke();

          if (list.length > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = '700 13px "Pretendard","Malgun Gothic",sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(list.length), pt.x, pt.y + 0.5);
          }
        });
      });
    });
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
  function toWorld(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) };
  }

  cv.addEventListener('click', function (e) {
    if (over || phase !== 'move' || (vsAI && turn === 1)) return;
    var p = toWorld(e);
    var pl = players[turn];

    var best = -1, bd = 1e9;
    pl.pieces.forEach(function (pos, idx) {
      if (pos >= NODES) return;
      var pt = pieceScreen(pos, idx, pl.pieces.filter(function (q) { return q === pos; }).length, turn);
      var d = Math.hypot(p.x - pt.x, p.y - pt.y);
      if (d < bd) { bd = d; best = idx; }
    });

    if (best >= 0 && bd < PIECE_R * 2.4) {
      selected = best;
      draw();
      setTimeout(function () { movePiece(players[turn], best, pending); }, 120);
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

  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      var steps = rollSticks();
      pending = steps; phase = 'move';
      var opts = legalPieces(players[turn]);
      movePiece(players[turn], opts[0], steps);
      setTimeout(function () {
        document.title = 'T|steps=' + steps + '|turn=' + turn + '|phase=' + phase
          + '|p1=' + finishCount(players[0]) + '|p2=' + finishCount(players[1])
          + '|nodes=' + nodes.length;
      }, 300);
    }, 400);
  }
})();
