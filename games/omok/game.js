/* ============================================================
   바둑스쿨 오목 — 15줄, AI 대전 / 2인 대전
   엔진: ai.js (GomokuAI, 본체 사이트 엔진 그대로)
   ============================================================ */
(function () {
  var SIZE = 15;
  var BLACK = 1, WHITE = 2;

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var boardBox = document.getElementById('boardBox');

  var state = {
    board: emptyBoard(),
    turn: BLACK,
    history: [],          // {x, y, color}
    mode: 'ai',           // 'ai' | 'pvp'
    difficulty: 'normal',
    humanColor: BLACK,    // AI 대전에서 내 돌
    ban33: true,          // 흑 3·3 금수
    ban33White: false,    // 백 3·3 금수
    undoAllowed: true,
    aiColor: WHITE,
    over: false,
    aiThinking: false,
    last: null,
    winLine: null
  };

  var ai = (typeof GomokuAI !== 'undefined') ? new GomokuAI(SIZE) : null;

  /* ---------- 소리 (사이트 설정 공유) ---------- */
  function sfx(name) {
    var a = window.badukAudio;
    if (!a || typeof a[name] !== 'function') return;
    try { a[name](); } catch (e) {}
  }

  /* ---------- 토스트 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1800);
  }

  /* ---------- 유틸 ---------- */
  function emptyBoard() {
    return Array.from({ length: SIZE }, function () { return new Array(SIZE).fill(0); });
  }

  /* ---------- 그리기 ---------- */
  var metrics = { size: 0, pad: 0, cell: 0, dpr: 1 };

  function layout() {
    var box = boardBox.getBoundingClientRect();
    var avail = Math.min(box.width - 20, box.height - 20);
    avail = Math.max(340, Math.min(avail, 1020));  /* 30% 확대 및 대화면 최적화 */
    if (window.innerWidth < 360) avail = window.innerWidth - 16;

    var dpr = window.devicePixelRatio || 1;
    var pad = Math.round(avail * 0.045);
    var cell = (avail - pad * 2) / (SIZE - 1);

    metrics = { size: avail, pad: pad, cell: cell, dpr: dpr };

    canvas.width = Math.round(avail * dpr);
    canvas.height = Math.round(avail * dpr);
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pos(i) { return metrics.pad + i * metrics.cell; }

  function draw() {
    var s = metrics.size, pad = metrics.pad, cell = metrics.cell, dpr = metrics.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    // 나무 바탕
    var g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#F0C987');
    g.addColorStop(0.5, '#E8B96A');
    g.addColorStop(1, '#DFA954');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    // 격자
    ctx.strokeStyle = 'rgba(110, 74, 30, .85)';
    ctx.lineWidth = Math.max(1, s / 520);
    for (var i = 0; i < SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(pos(i), pad);
      ctx.lineTo(pos(i), s - pad);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pad, pos(i));
      ctx.lineTo(s - pad, pos(i));
      ctx.stroke();
    }

    // 화점
    [[3, 3], [3, 11], [11, 3], [11, 11], [7, 7]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(pos(p[0]), pos(p[1]), Math.max(2, s / 190), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(110, 74, 30, .9)';
      ctx.fill();
    });

    // 돌
    var r = cell * 0.44;
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        var v = state.board[y][x];
        if (!v) continue;
        drawStone(pos(x), pos(y), r, v);
      }
    }

    // 마지막 수 표시
    if (state.last) {
      ctx.beginPath();
      ctx.arc(pos(state.last.x), pos(state.last.y), r * 0.32, 0, Math.PI * 2);
      ctx.strokeStyle = '#E23B3B';
      ctx.lineWidth = Math.max(2, s / 240);
      ctx.stroke();
    }

    // 🏆 5목 승리 라인 및 마커 표시
    if (state.winLine) {
      drawWinningLine(state.winLine);
    }
  }

  function drawWinningLine(winLine) {
    if (!winLine || !winLine.start || !winLine.end) return;
    var p1x = pos(winLine.start.x);
    var p1y = pos(winLine.start.y);
    var p2x = pos(winLine.end.x);
    var p2y = pos(winLine.end.y);

    var angle = Math.atan2(p2y - p1y, p2x - p1x);
    var extend = metrics.cell * 0.42;
    var x1 = p1x - Math.cos(angle) * extend;
    var y1 = p1y - Math.sin(angle) * extend;
    var x2 = p2x + Math.cos(angle) * extend;
    var y2 = p2y + Math.sin(angle) * extend;

    var dpr = metrics.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save();
    ctx.lineCap = 'round';

    // 1. 외곽 부드러운 붉은 글로우 라인
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = Math.max(8, metrics.cell * 0.28);
    ctx.stroke();

    // 2. 메인 승리선
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = Math.max(4, metrics.cell * 0.13);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // 3. 5목 각 돌 중심에 빛나는 승리 링과 포인트 마커
    var stones = winLine.stones || [];
    var r = metrics.cell * 0.44;
    for (var i = 0; i < stones.length; i++) {
      var sx = pos(stones[i].x);
      var sy = pos(stones[i].y);

      // 화이트 링
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.52, 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2.5, metrics.cell * 0.08);
      ctx.stroke();

      // 레드 센터 점
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#EF4444';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawStone(cx, cy, r, color) {
    var grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    if (color === BLACK) {
      grad.addColorStop(0, '#6e6e6e');
      grad.addColorStop(0.55, '#1c1c1c');
      grad.addColorStop(1, '#080808');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#f4f4f4');
      grad.addColorStop(1, '#d6d6d6');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,.35)';
    ctx.shadowBlur = r * 0.45;
    ctx.shadowOffsetY = r * 0.12;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  /* ---------- 상태 표시 ---------- */
  function refreshUI() {
    var stone = document.getElementById('turnStone');
    var text = document.getElementById('turnText');
    var count = document.getElementById('moveCount');

    stone.classList.toggle('white', state.turn === WHITE);
    if (state.over) {
      text.textContent = '대국 종료';
    } else if (state.aiThinking) {
      text.textContent = 'AI가 생각 중…';
    } else {
      text.textContent = (state.turn === BLACK ? '흑' : '백') + ' 차례';
    }
    count.textContent = state.history.length + '수';
    draw();
  }

  function showResult(msg) {
    var box = document.getElementById('result');
    document.getElementById('resultTitle').textContent = msg;
    box.hidden = false;
  }
  function hideResult() {
    document.getElementById('result').hidden = true;
  }

  /* ---------- 착수 ---------- */
  function inRange(x, y) { return x >= 0 && y >= 0 && x < SIZE && y < SIZE; }

  function place(x, y, color) {
    if (!inRange(x, y) || state.board[y][x]) return false;
    state.board[y][x] = color;
    state.history.push({ x: x, y: y, color: color });
    state.last = { x: x, y: y };
    return true;
  }

  function getWinningLine(x, y, color) {
    var dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (var d = 0; d < dirs.length; d++) {
      var dx = dirs[d][0], dy = dirs[d][1];
      var stones = [{ x: x, y: y }];
      var k = 1;
      while (inRange(x + dx * k, y + dy * k) && state.board[y + dy * k][x + dx * k] === color) {
        stones.push({ x: x + dx * k, y: y + dy * k });
        k++;
      }
      k = 1;
      while (inRange(x - dx * k, y - dy * k) && state.board[y - dy * k][x - dx * k] === color) {
        stones.unshift({ x: x - dx * k, y: y - dy * k });
        k++;
      }
      if (stones.length >= 5) {
        return {
          start: stones[0],
          end: stones[stones.length - 1],
          stones: stones,
          dir: [dx, dy]
        };
      }
    }
    return null;
  }

  function checkWin(x, y, color) {
    return !!getWinningLine(x, y, color);
  }

  var resultTimer = null;
  function endGame(color, winLine) {
    sfx('playSuccess');
    state.over = true;
    state.aiThinking = false;
    state.winLine = winLine || getWinningLine(state.last ? state.last.x : 0, state.last ? state.last.y : 0, color);
    refreshUI();
    clearTimeout(resultTimer);
    resultTimer = setTimeout(function () {
      showResult((color === BLACK ? '흑' : '백') + ' 승리!');
    }, 550);
  }

  /* ---------- 전체 판 열린 3 (활삼) 정밀 판정 엔진 ---------- */
  function countOpenThrees(board, color) {
    var patterns = [
      { pat: '001110', stones: [2, 3, 4] },
      { pat: '011100', stones: [1, 2, 3] },
      { pat: '010110', stones: [1, 3, 4] },
      { pat: '011010', stones: [1, 2, 4] }
    ];

    function countLine(cells) {
      var s = '';
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        s += (c === color ? '1' : (c === 0 ? '0' : '2'));
      }
      var found = {};
      var count = 0;
      for (var i = 0; i <= s.length - 6; i++) {
        var sub = s.substr(i, 6);
        for (var p = 0; p < patterns.length; p++) {
          if (sub === patterns[p].pat) {
            var offsets = patterns[p].stones;
            var key = (i + offsets[0]) + ',' + (i + offsets[1]) + ',' + (i + offsets[2]);
            if (!found[key]) {
              found[key] = true;
              count++;
            }
          }
        }
      }
      return count;
    }

    var total = 0;
    // 1. 가로 (Rows)
    for (var y = 0; y < SIZE; y++) total += countLine(board[y]);
    // 2. 세로 (Columns)
    for (var x = 0; x < SIZE; x++) {
      var col = [];
      for (var y = 0; y < SIZE; y++) col.push(board[y][x]);
      total += countLine(col);
    }
    // 3. 대각선 (Top-Left to Bottom-Right \)
    for (var d = -(SIZE - 1); d < SIZE; d++) {
      var diag = [];
      for (var y = 0; y < SIZE; y++) {
        var x = y + d;
        if (x >= 0 && x < SIZE) diag.push(board[y][x]);
      }
      if (diag.length >= 6) total += countLine(diag);
    }
    // 4. 대각선 (Bottom-Left to Top-Right /)
    for (var sum = 0; sum < 2 * SIZE - 1; sum++) {
      var diag = [];
      for (var y = 0; y < SIZE; y++) {
        var x = sum - y;
        if (x >= 0 && x < SIZE) diag.push(board[y][x]);
      }
      if (diag.length >= 6) total += countLine(diag);
    }
    return total;
  }

  function syncOptions() {
    var banEl = document.getElementById('optBan33');
    if (banEl) state.ban33 = banEl.checked;
    var banWhiteEl = document.getElementById('optBan33White');
    if (banWhiteEl) state.ban33White = banWhiteEl.checked;
    var undoEl = document.getElementById('optUndo');
    if (undoEl) state.undoAllowed = undoEl.checked;
  }

  function isBannedMove(x, y, color) {
    syncOptions();
    var banned = (color === BLACK && state.ban33) || (color === WHITE && state.ban33White);
    if (!banned) return false;

    // 5목 완성(승리 수)은 금수 면제
    if (checkWin(x, y, color)) return false;

    var before = countOpenThrees(state.board, color);
    state.board[y][x] = color;
    var after = countOpenThrees(state.board, color);
    state.board[y][x] = 0;

    return after >= 2 && after > before;
  }

  function humanMove(x, y) {
    if (state.over || state.aiThinking) return;
    if (state.mode === 'ai' && state.turn !== state.humanColor) return;
    if (!inRange(x, y) || state.board[y][x]) return;

    var color = state.turn;

    /* 3·3 금수 검사 (흑/백 개별 규칙 적용) */
    if (isBannedMove(x, y, color)) {
      sfx('playDdang');
      var name = (color === BLACK ? '흑' : '백');
      toast('🚫 ' + name + '은 3·3 금수입니다');
      return;
    }

    if (!place(x, y, color)) return;
    sfx('playStone');
    var wLine = getWinningLine(x, y, color);
    if (wLine) { endGame(color, wLine); return; }

    state.turn = color === BLACK ? WHITE : BLACK;
    refreshUI();

    if (state.mode === 'ai' && state.turn === state.aiColor) aiTurn();
  }

  // Invalidate queued work whenever the board is replaced or rewound.
  var aiTimer = null;
  var aiGeneration = 0;
  function cancelAI() {
    clearTimeout(aiTimer);
    aiTimer = null;
    aiGeneration++;
    state.aiThinking = false;
  }

  function aiTurn() {
    if (!ai) return;
    cancelAI();
    var generation = aiGeneration;
    state.aiThinking = true;
    refreshUI();

    aiTimer = setTimeout(function () {
      if (generation !== aiGeneration || state.over || state.mode !== 'ai' || state.turn !== state.aiColor) return;
      aiTimer = null;
      var move = null;
      try {
        move = ai.findBestMove(state.board, state.aiColor, state.difficulty, {
          ban33: state.ban33,
          ban33White: state.ban33White
        });
      } catch (e) {
        move = null;
      }
      if (!move || !inRange(move.x, move.y) || state.board[move.y][move.x]) {
        move = pickEmpty();
      }
      if (!move) { state.aiThinking = false; refreshUI(); return; }

      place(move.x, move.y, state.aiColor);
      sfx('playStone');
      state.aiThinking = false;

      var wLine = getWinningLine(move.x, move.y, state.aiColor);
      if (wLine) { endGame(state.aiColor, wLine); return; }
      state.turn = state.humanColor;
      refreshUI();
    }, 220);
  }

  function pickEmpty() {
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        if (!state.board[y][x] && !isBannedMove(x, y, state.aiColor)) return { x: x, y: y };
      }
    }
    for (var y = 0; y < SIZE; y++) {
      for (var x = 0; x < SIZE; x++) {
        if (!state.board[y][x]) return { x: x, y: y };
      }
    }
    return null;
  }

  /* ---------- 입력 ---------- */
  canvas.addEventListener('click', function (e) {
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    var x = Math.round((px - metrics.pad) / metrics.cell);
    var y = Math.round((py - metrics.pad) / metrics.cell);
    humanMove(x, y);
  });

  /* ---------- 버튼 ---------- */
  function restart() {
    cancelAI();
    clearTimeout(resultTimer);
    state.winLine = null;
    state.board = emptyBoard();
    state.turn = BLACK;
    state.history = [];
    state.last = null;
    state.over = false;
    state.aiThinking = false;
    state.aiColor = (state.humanColor === BLACK) ? WHITE : BLACK;
    hideResult();
    refreshUI();

    /* 내가 백이면 AI(흑)가 먼저 둔다 */
    if (state.mode === 'ai' && state.aiColor === BLACK) aiTurn();
  }

  function undo() {
    if (!state.undoAllowed) { toast('무르기가 꺼져 있습니다'); return; }
    clearTimeout(resultTimer);
    state.winLine = null;
    if (state.over) { state.over = false; hideResult(); }
    if (!state.history.length) return;
    cancelAI();

    var steps = (state.mode === 'ai') ? 2 : 1;
    if (state.mode === 'ai' && state.history.length === 1) steps = 1;

    for (var i = 0; i < steps && state.history.length; i++) {
      var m = state.history.pop();
      state.board[m.y][m.x] = 0;
    }
    state.turn = (state.mode === 'ai') ? state.humanColor : (state.history.length % 2 === 0 ? BLACK : WHITE);
    state.last = state.history.length
      ? { x: state.history[state.history.length - 1].x, y: state.history[state.history.length - 1].y }
      : null;
    state.aiThinking = false;
    refreshUI();
  }

  document.getElementById('btnRestart').addEventListener('click', restart);
  document.getElementById('btnAgain').addEventListener('click', restart);
  document.getElementById('btnUndo').addEventListener('click', undo);

  document.getElementById('modeSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    document.querySelectorAll('#modeSeg .seg-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.mode = btn.dataset.mode;
    document.getElementById('diffCard').style.display = (state.mode === 'ai') ? '' : 'none';
    document.getElementById('colorCard').style.display = (state.mode === 'ai') ? '' : 'none';
    restart();
  });

  document.getElementById('colorSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    document.querySelectorAll('#colorSeg .seg-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.humanColor = parseInt(btn.dataset.color, 10);
    restart();
  });

  document.getElementById('optUndo').addEventListener('change', syncOptions);
  document.getElementById('optBan33').addEventListener('change', syncOptions);
  var optBan33WhiteEl = document.getElementById('optBan33White');
  if (optBan33WhiteEl) {
    optBan33WhiteEl.addEventListener('change', syncOptions);
  }

  document.getElementById('diffSeg').addEventListener('click', function (e) {
    var btn = e.target.closest('.seg-btn');
    if (!btn) return;
    document.querySelectorAll('#diffSeg .seg-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    state.difficulty = btn.dataset.diff;
  });

  /* ---------- 시작 ---------- */
  function boot() {
    syncOptions();
    layout();
    refreshUI();
  }

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'bk:audio' || !window.badukAudio) return;
    try {
      window.badukAudio.setVolume((d.volume || 100) / 100);
      window.badukAudio.enabled = !!d.enabled;
      if (d.soundType) window.badukAudio.setSoundType(d.soundType);
    } catch (err) {}
  });

  window.addEventListener('resize', function () { layout(); draw(); });
  boot();
})();
