/* 2048 바둑돌 — 바둑스쿨 Fun */
(function () {
  'use strict';

  var N = 4;
  var grid = [];
  var score = 0;
  var best = +(localStorage.getItem('bk2048best') || 0);
  var history = [];
  var over = false;
  var won = false;

  var elGrid = document.getElementById('grid');
  var elScore = document.getElementById('score');
  var elBest = document.getElementById('best');
  var elMsg = document.getElementById('msg');

  var cells = [];

  function buildDom() {
    elGrid.innerHTML = '';
    cells = [];
    for (var i = 0; i < N * N; i++) {
      var d = document.createElement('div');
      d.className = 'cell';
      elGrid.appendChild(d);
      cells.push(d);
    }
  }

  function empty() {
    var out = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) if (!grid[r][c]) out.push([r, c]);
    return out;
  }

  function addTile() {
    var e = empty();
    if (!e.length) return null;
    var p = e[Math.floor(Math.random() * e.length)];
    grid[p[0]][p[1]] = Math.random() < 0.9 ? 2 : 4;
    return p;
  }

  function reset() {
    grid = [];
    for (var r = 0; r < N; r++) { grid.push([]); for (var c = 0; c < N; c++) grid[r].push(0); }
    score = 0; over = false; won = false; history = [];
    addTile(); addTile();
    setMsg('');
    render();
  }

  function setMsg(t) { elMsg.hidden = !t; elMsg.textContent = t || ''; }

  function render(popAt) {
    var flat = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) flat.push(grid[r][c]);

    for (var i = 0; i < flat.length; i++) {
      var v = flat[i];
      var d = cells[i];
      d.className = 'cell' + (v ? ' t' + v : '');
      d.textContent = v ? v : '';
      if (popAt && popAt[0] === Math.floor(i / N) && popAt[1] === i % N) {
        d.classList.add('pop');
        setTimeout((function (x) { return function () { x.classList.remove('pop'); }; })(d), 200);
      }
    }

    elScore.textContent = score;
    if (score > best) { best = score; localStorage.setItem('bk2048best', String(best)); }
    elBest.textContent = best;
  }

  function slideRow(row) {
    var out = row.filter(function (v) { return v; });
    var gained = 0;
    for (var i = 0; i < out.length - 1; i++) {
      if (out[i] === out[i + 1]) {
        out[i] *= 2; gained += out[i];
        out.splice(i + 1, 1);
      }
    }
    while (out.length < N) out.push(0);
    return { row: out, gained: gained };
  }

  function rotate(g) {
    var out = [];
    for (var c = 0; c < N; c++) {
      var col = [];
      for (var r = N - 1; r >= 0; r--) col.push(g[r][c]);
      out.push(col);
    }
    return out;
  }

  function move(dir) {
    if (over) return;
    var snapshot = { g: JSON.parse(JSON.stringify(grid)), s: score };
    var g = grid;
    var gained = 0;

    for (var k = 0; k < dir; k++) g = rotate(g);

    var changed = false;
    for (var r = 0; r < N; r++) {
      var res = slideRow(g[r]);
      gained += res.gained;
      if (res.row.join() !== g[r].join()) changed = true;
      g[r] = res.row;
    }

    var back = 4 - (dir % 4);
    for (var k2 = 0; k2 < back % 4; k2++) g = rotate(g);

    if (!changed) return;

    history.push(snapshot);
    if (history.length > 30) history.shift();

    grid = g;
    score += gained;
    var p = addTile();
    render(p);

    if (!won && score && maxTile() >= 2048) {
      won = true;
      setMsg('2048 달성! 계속 진행할 수 있습니다.');
    }
    if (!canMove()) {
      over = true;
      setMsg('더 이상 움직일 수 없습니다. 점수 ' + score);
    }
  }

  function maxTile() {
    var m = 0;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) m = Math.max(m, grid[r][c]);
    return m;
  }

  function canMove() {
    if (empty().length) return true;
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var v = grid[r][c];
      if (c < N - 1 && grid[r][c + 1] === v) return true;
      if (r < N - 1 && grid[r + 1][c] === v) return true;
    }
    return false;
  }

  /* 입력 */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft') { e.preventDefault(); move(0); }
    else if (k === 'ArrowUp') { e.preventDefault(); move(1); }
    else if (k === 'ArrowRight') { e.preventDefault(); move(2); }
    else if (k === 'ArrowDown') { e.preventDefault(); move(3); }
  });

  var sx = 0, sy = 0, tracking = false;
  elGrid.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; tracking = true; });
  elGrid.addEventListener('pointerup', function (e) {
    if (!tracking) return;
    tracking = false;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 2 : 0);
    else move(dy > 0 ? 3 : 1);
  });

  document.getElementById('btnNew').addEventListener('click', reset);
  document.getElementById('btnUndo').addEventListener('click', function () {
    if (!history.length) return;
    var h = history.pop();
    grid = h.g; score = h.s; over = false;
    setMsg(''); render();
  });

  buildDom();
  reset();

  /* AUTO_TEST: ?auto=1 이면 두 번 움직이고 상태를 title에 남긴다 */
  if (/[?&]auto=1/.test(location.search)) {
    setTimeout(function () {
      move(0); move(1);
      setTimeout(function () {
        document.title = 'T|score=' + score + '|max=' + maxTile() + '|filled=' + (N * N - empty().length);
      }, 400);
    }, 300);
  }
})();
