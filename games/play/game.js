/* ============================================================
   바둑스쿨 대국 — 엔진(baduk_engine.js) + AI(baduk_ai.js) 재사용
   ============================================================ */
(function () {
  var BLACK = 1, WHITE = 2;

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var boardBox = document.getElementById('boardBox');
  var dpr = window.devicePixelRatio || 1;

  var state = {
    size: 19,
    mode: 'ai',
    difficulty: 'dan',
    humanColor: BLACK,
    turn: BLACK,
    over: false,
    thinking: false,
    last: null,
    passCount: 0
  };

  var engine = new BadukEngine(19);
  var ai = new BadukAI(19);

  /* ---------- 유틸 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  function sfx(name) {
    var a = window.badukAudio;
    if (!a || typeof a[name] !== 'function') return;
    try { a[name](); } catch (e) {}
  }

  /* ---------- 그리기 ---------- */
  var m = { size: 0, pad: 0, cell: 0 };

  function layout() {
    var box = boardBox.getBoundingClientRect();
    var avail = Math.min(box.width - 20, box.height - 20);
    avail = Math.max(280, Math.min(avail, 900));

    var pad = Math.round(avail * 0.045);
    var cell = (avail - pad * 2) / (state.size - 1);

    m = { size: avail, pad: pad, cell: cell };

    canvas.width = Math.round(avail * dpr);
    canvas.height = Math.round(avail * dpr);
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pos(i) { return m.pad + i * m.cell; }

  function draw() {
    var s = m.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    var g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#F2CE93');
    g.addColorStop(0.5, '#E8B96A');
    g.addColorStop(1, '#DDA751');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    ctx.strokeStyle = 'rgba(110, 74, 30, .85)';
    ctx.lineWidth = Math.max(1, s / 620);
    for (var i = 0; i < state.size; i++) {
      ctx.beginPath(); ctx.moveTo(pos(i), m.pad); ctx.lineTo(pos(i), s - m.pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.pad, pos(i)); ctx.lineTo(s - m.pad, pos(i)); ctx.stroke();
    }

    /* 화점 */
    var stars = state.size === 19 ? [[3,3],[3,9],[3,15],[9,3],[9,9],[9,15],[15,3],[15,9],[15,15]]
              : state.size === 13 ? [[3,3],[3,9],[9,3],[9,9],[6,6]]
              : [[2,2],[2,6],[6,2],[6,6],[4,4]];
    stars.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(pos(p[0]), pos(p[1]), Math.max(2, s / 220), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(110, 74, 30, .9)';
      ctx.fill();
    });

    /* 돌 */
    var r = m.cell * 0.46;
    for (var y = 0; y < state.size; y++) {
      for (var x = 0; x < state.size; x++) {
        var v = engine.board[y][x];
        if (v) drawStone(pos(x), pos(y), r, v);
      }
    }

    /* 마지막 수 */
    if (state.last) {
      ctx.beginPath();
      ctx.arc(pos(state.last.x), pos(state.last.y), r * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#E23B3B';
      ctx.lineWidth = Math.max(2, s / 260);
      ctx.stroke();
    }
  }

  function drawStone(cx, cy, r, color) {
    var grad = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.38, r * 0.1, cx, cy, r);
    if (color === BLACK) {
      grad.addColorStop(0, '#6e6e6e'); grad.addColorStop(0.55, '#1c1c1c'); grad.addColorStop(1, '#080808');
    } else {
      grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.6, '#f4f4f4'); grad.addColorStop(1, '#d2d2d2');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,.38)';
    ctx.shadowBlur = r * 0.45;
    ctx.shadowOffsetY = r * 0.12;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  /* ---------- 상태 표시 ---------- */
  function refreshUI() {
    var stone = document.getElementById('turnStone');
    var text = document.getElementById('turnText');
    document.getElementById('capInfo').textContent =
      '따낸 돌 ' + (engine.blackCaptures || 0) + ' : ' + (engine.whiteCaptures || 0);
    document.getElementById('moveCount').textContent = (engine.moves.length || 0) + '수';

    stone.classList.toggle('white', state.turn === WHITE);
    if (state.over) text.textContent = '대국 종료';
    else if (state.thinking) text.textContent = 'AI 생각 중…';
    else text.textContent = (state.turn === BLACK ? '흑' : '백') + ' 차례';

    draw();
  }

  function endGame(msg, sub) {
    state.over = true;
    state.thinking = false;
    refreshUI();
    document.getElementById('resultTitle').textContent = msg;
    document.getElementById('resultSub').textContent = sub || '';
    document.getElementById('result').hidden = false;
    sfx('playSuccess');
  }

  /* ---------- 입력 ---------- */
  function humanMove(x, y) {
    if (state.over || state.thinking) return;
    if (state.mode === 'ai' && state.turn !== state.humanColor) return;
    if (x < 0 || y < 0 || x >= state.size || y >= state.size) return;

    var res = engine.playMove(x, y, state.turn);
    if (!res || res.success === false) {
      sfx('playDdang');
      toast(res && res.reason === 'KO' ? '패 자리에는 둘 수 없습니다' : '둘 수 없는 자리입니다');
      return;
    }

    sfx('playStone');
    state.last = { x: x, y: y };
    state.passCount = 0;
    state.turn = state.turn === BLACK ? WHITE : BLACK;

    if (ai && typeof ai.checkGameOver === 'function') { /* noop */ }
    refreshUI();

    if (state.mode === 'ai' && state.turn !== state.humanColor) aiTurn();
  }

  function aiTurn() {
    state.thinking = true;
    refreshUI();

    setTimeout(function () {
      var mv = null;
      try { mv = ai.findBestMove(engine, state.turn, state.difficulty); } catch (e) { mv = null; }

      if (!mv) {
        state.thinking = false;
        engine.pass(state.turn);
        state.turn = state.turn === BLACK ? WHITE : BLACK;
        refreshUI();
        return;
      }

      var res = engine.playMove(mv.x, mv.y, state.turn);
      state.thinking = false;
      if (res && res.success !== false) {
        sfx('playStone');
        state.last = { x: mv.x, y: mv.y };
        state.turn = state.turn === BLACK ? WHITE : BLACK;
      }
      refreshUI();
    }, 260);
  }

  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var x = Math.round((px - m.pad) / m.cell);
    var y = Math.round((py - m.pad) / m.cell);
    humanMove(x, y);
  });

  /* ---------- 버튼 ---------- */
  function restart() {
    engine = new BadukEngine(state.size);
    ai = new BadukAI(state.size);
    state.turn = BLACK;
    state.over = false;
    state.thinking = false;
    state.last = null;
    state.passCount = 0;
    document.getElementById('result').hidden = true;
    refreshUI();
    if (state.mode === 'ai' && state.humanColor === WHITE) { state.turn = BLACK; aiTurn(); }
  }

  function undo() {
    if (state.over) { state.over = false; document.getElementById('result').hidden = true; }
    if (!engine.moves.length) return;
    var steps = (state.mode === 'ai') ? 2 : 1;
    if (engine.moves.length < steps) steps = engine.moves.length;
    engine.goToStep(engine.moves.length - steps);
    engine.moves.length = engine.currentStep;   /* 이후 착수가 이어지도록 수순 자름 */
    state.turn = (state.mode === 'ai') ? state.humanColor : ((engine.moves.length % 2 === 0) ? BLACK : WHITE);
    state.last = engine.moves.length ? { x: engine.moves[engine.moves.length - 1].x, y: engine.moves[engine.moves.length - 1].y } : null;
    state.thinking = false;
    refreshUI();
  }

  function pass() {
    if (state.over) return;
    engine.pass(state.turn);
    state.turn = state.turn === BLACK ? WHITE : BLACK;
    state.passCount++;
    if (state.passCount >= 2) { endGame('대국 종료', '양쪽 모두 패스했습니다'); return; }
    refreshUI();
    if (state.mode === 'ai' && state.turn !== state.humanColor) aiTurn();
  }

  function resign() {
    if (state.over) return;
    var loser = (state.mode === 'ai') ? state.humanColor : state.turn;
    endGame(loser === BLACK ? '백 승리' : '흑 승리', '기권');
  }

  document.getElementById('btnRestart').addEventListener('click', restart);
  document.getElementById('btnAgain').addEventListener('click', restart);
  document.getElementById('btnUndo').addEventListener('click', undo);
  document.getElementById('btnPass').addEventListener('click', pass);
  document.getElementById('btnResign').addEventListener('click', resign);

  function seg(sel, key, cb) {
    document.getElementById(sel).addEventListener('click', function (e) {
      var b = e.target.closest('.seg-btn');
      if (!b) return;
      document.querySelectorAll('#' + sel + ' .seg-btn').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      cb(b);
    });
  }

  seg('modeSeg', 'mode', function (b) {
    state.mode = b.dataset.mode;
    document.getElementById('diffCard').style.display = (state.mode === 'ai') ? '' : 'none';
    document.getElementById('colorCard').style.display = (state.mode === 'ai') ? '' : 'none';
    restart();
  });
  seg('diffSeg', 'difficulty', function (b) { state.difficulty = b.dataset.diff; });
  seg('colorSeg', 'color', function (b) { state.humanColor = parseInt(b.dataset.color, 10); restart(); });
  seg('sizeSeg', 'size', function (b) {
    state.size = parseInt(b.dataset.size, 10);
    layout();
    restart();
  });

  /* ---------- 시작 ---------- */
  layout();
  refreshUI();
  window.addEventListener('resize', function () { layout(); draw(); });

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'bk:audio' || !window.badukAudio) return;
    try {
      window.badukAudio.setVolume((d.volume || 100) / 100);
      window.badukAudio.enabled = !!d.enabled;
      if (d.soundType) window.badukAudio.setSoundType(d.soundType);
    } catch (err) {}
  });
})();
