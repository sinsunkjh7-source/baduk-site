/* 다른 그림 찾기 — 장면 자동 생성 */
(function () {
  'use strict';

  var cv, ctx, msgEl;
  var SC = 600;                 /* 장면 크기 (정사각) */
  var PANEL_W = 600, PANEL_H = 600, GAP = 40, PAD = 10;

  var base = [];                /* 원본 장면 아이템 */
  var mods = [];                /* 차이 정보 */
  var found = {};
  var diffCount = 6;
  var scores = [0, 0];
  var turn = 0;
  var over = false;
  var nameOf = {};

  function el(id) { return document.getElementById(id); }
  function msg(t) { if (msgEl) msgEl.textContent = t; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  /* ---------------- 장면 만들기 ---------------- */
  function makeScene() {
    var items = [];
    /* 나무 3그루 */
    var treeX = [90, 250, 470];
    treeX.forEach(function (x, i) {
      items.push({ id: 'tree' + i, type: 'tree', x: x, y: 430 + (i % 2) * 26, s: rnd(52, 66), color: '#3f8f52' });
    });
    /* 꽃 4송이 */
    [[60, 520], [180, 548], [320, 512], [520, 545]].forEach(function (p, i) {
      items.push({ id: 'flower' + i, type: 'flower', x: p[0], y: p[1], s: rnd(16, 21), color: pick(['#e4572e', '#f2b134', '#d96ba0', '#8e6fd8']) });
    });
    /* 바둑돌 3개 */
    [[350, 470, '#2b2b2b'], [430, 500, '#f7f7f2'], [150, 470, '#2b2b2b']].forEach(function (p, i) {
      items.push({ id: 'stone' + i, type: 'stone', x: p[0], y: p[1], s: 17, color: p[2] });
    });
    /* 구름 2개 */
    [[120, 110, 1], [430, 80, 0.85]].forEach(function (p, i) {
      items.push({ id: 'cloud' + i, type: 'cloud', x: p[0], y: p[1], s: 70 * p[2], color: '#ffffff' });
    });
    /* 해 */
    items.push({ id: 'sun', type: 'sun', x: 520, y: 120, s: 46, color: '#ffd24a' });
    /* 벤치 */
    items.push({ id: 'bench', type: 'bench', x: 250, y: 560, s: 76, color: '#a9743f' });
    return items;
  }

  function cloneScene(items) {
    return items.map(function (it) { return { id: it.id, type: it.type, x: it.x, y: it.y, s: it.s, color: it.color, hidden: false }; });
  }

  var ALT_COLORS = ['#d9544d', '#f2a541', '#6f8fe0', '#b06fd0', '#2f9e8f'];

  function makeDifferences(items, n) {
    var pool = shuffle(items.filter(function (i) { return i.type !== 'sun'; }).slice());
    var kinds = ['recolor', 'hide', 'size', 'move', 'add'];
    var diffs = [];
    var used = {};
    for (var i = 0; i < n && i < pool.length; i++) {
      var it = pool[i];
      if (used[it.id]) continue;
      used[it.id] = true;
      var kind = kinds[i % kinds.length];
      var r = Math.max(26, it.s * 0.75);
      diffs.push({ id: it.id, kind: kind, x: it.x, y: it.y, r: r, data: null });
    }
    return diffs;
  }

  function applyDifferences(items, diffs) {
    var out = cloneScene(items);
    diffs.forEach(function (d) {
      var it = out.filter(function (o) { return o.id === d.id; })[0];
      if (!it) return;
      if (d.kind === 'recolor') { it.color = pick(ALT_COLORS); d.data = it.color; }
      else if (d.kind === 'hide') { it.hidden = true; }
      else if (d.kind === 'size') { it.s = it.s * 1.4; d.r = Math.max(30, it.s * 0.8); }
      else if (d.kind === 'move') { it.x = it.x + 26; d.x = (it.x + d.x) / 2; d.r = Math.max(34, it.s * 0.9); }
      else if (d.kind === 'add') {
        it.hidden = true;
        out.push({ id: it.id + '_add', type: it.type, x: it.x + 34, y: it.y - 6, s: it.s * 0.9, color: it.color, hidden: false });
        d.x = it.x + 17; d.r = Math.max(30, it.s * 0.85);
      }
    });
    return out;
  }

  /* ---------------- 그리기 ---------------- */
  function drawTree(c, it) {
    c.fillStyle = '#8a5a34';
    c.fillRect(it.x - 4, it.y - 6, 8, 34);
    c.fillStyle = it.color;
    c.beginPath(); c.arc(it.x, it.y - 24, it.s * 0.55, 0, 6.283); c.fill();
    c.beginPath(); c.arc(it.x - it.s * 0.34, it.y - 6, it.s * 0.4, 0, 6.283); c.fill();
    c.beginPath(); c.arc(it.x + it.s * 0.34, it.y - 6, it.s * 0.4, 0, 6.283); c.fill();
  }
  function drawFlower(c, it) {
    c.strokeStyle = '#4b8b46'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(it.x, it.y); c.lineTo(it.x, it.y + it.s); c.stroke();
    c.fillStyle = it.color;
    for (var k = 0; k < 5; k++) {
      var a = -Math.PI / 2 + k * (Math.PI * 2 / 5);
      c.beginPath(); c.arc(it.x + Math.cos(a) * it.s * 0.55, it.y + Math.sin(a) * it.s * 0.55, it.s * 0.42, 0, 6.283); c.fill();
    }
    c.fillStyle = '#ffd24a';
    c.beginPath(); c.arc(it.x, it.y, it.s * 0.3, 0, 6.283); c.fill();
  }
  function drawStone(c, it) {
    var g = c.createRadialGradient(it.x - it.s * 0.3, it.y - it.s * 0.35, it.s * 0.2, it.x, it.y, it.s);
    g.addColorStop(0, it.color === '#2b2b2b' ? '#666' : '#ffffff');
    g.addColorStop(1, it.color);
    c.beginPath(); c.arc(it.x, it.y, it.s, 0, 6.283); c.fillStyle = g; c.fill();
  }
  function drawCloud(c, it) {
    c.fillStyle = 'rgba(255,255,255,.92)';
    c.beginPath();
    c.arc(it.x, it.y, it.s * 0.34, 0, 6.283);
    c.arc(it.x + it.s * 0.3, it.y - it.s * 0.12, it.s * 0.29, 0, 6.283);
    c.arc(it.x - it.s * 0.3, it.y - it.s * 0.06, it.s * 0.26, 0, 6.283);
    c.fill();
  }
  function drawSun(c, it) {
    c.fillStyle = '#ffd24a';
    c.beginPath(); c.arc(it.x, it.y, it.s, 0, 6.283); c.fill();
  }
  function drawBench(c, it) {
    c.fillStyle = it.color;
    c.fillRect(it.x - 36, it.y - 10, 72, 8);
    c.fillRect(it.x - 36, it.y + 2, 72, 8);
    c.fillRect(it.x - 30, it.y + 10, 6, 14);
    c.fillRect(it.x + 24, it.y + 10, 6, 14);
  }

  function drawScene(c, items, ox, oy, showRings, isLeft) {
    /* 배경 */
    var sky = c.createLinearGradient(0, oy, 0, oy + PANEL_H);
    sky.addColorStop(0, '#bfe3f2');
    sky.addColorStop(0.55, '#e6f4ee');
    sky.addColorStop(1, '#dceecb');
    c.fillStyle = sky;
    c.fillRect(ox, oy, PANEL_W, PANEL_H);

    /* 언덕 */
    c.fillStyle = '#cfe6b8';
    c.beginPath();
    c.ellipse(ox + 160, oy + 470, 260, 110, 0, 0, 6.283);
    c.ellipse(ox + 470, oy + 500, 240, 120, 0, 0, 6.283);
    c.fill();
    /* 잔디 */
    c.fillStyle = '#a8d48a';
    c.fillRect(ox, oy + 500, PANEL_W, PANEL_H - 500);

    items.forEach(function (it) {
      if (it.hidden) return;
      var x = it.x + ox, y = it.y + oy;
      var copy = { x: x, y: y, s: it.s, color: it.color, type: it.type };
      if (it.type === 'tree') drawTree(c, copy);
      else if (it.type === 'flower') drawFlower(c, copy);
      else if (it.type === 'stone') drawStone(c, copy);
      else if (it.type === 'cloud') drawCloud(c, copy);
      else if (it.type === 'sun') drawSun(c, copy);
      else if (it.type === 'bench') drawBench(c, copy);
    });

    /* 테두리 */
    c.strokeStyle = 'rgba(63,122,51,.35)';
    c.lineWidth = 3;
    c.strokeRect(ox + 1.5, oy + 1.5, PANEL_W - 3, PANEL_H - 3);

    if (showRings) {
      Object.keys(found).forEach(function (id) {
        var d = mods.filter(function (m) { return m.id === id; })[0];
        if (!d) return;
        c.beginPath();
        c.arc(d.x + ox, d.y + oy, d.r, 0, 6.283);
        c.strokeStyle = '#e2543a';
        c.lineWidth = 5;
        c.stroke();
        c.beginPath();
        c.arc(d.x + ox, d.y + oy, d.r + 5, 0, 6.283);
        c.strokeStyle = 'rgba(226,84,58,.35)';
        c.lineWidth = 3;
        c.stroke();
      });
    }
  }

  function draw() {
    var W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f3f8ee';
    ctx.fillRect(0, 0, W, H);

    var vertical = H > W;   /* 세로 배치 (모바일) */
    var ox1, oy1, ox2, oy2;
    if (vertical) {
      ox1 = (W - PANEL_W) / 2; oy1 = PAD;
      ox2 = ox1; oy2 = PAD + PANEL_H + GAP;
      drawScene(ctx, base, ox1, oy1, true, true);
      drawScene(ctx, modScene, ox2, oy2, true, false);
      ctx.fillStyle = '#4a8a3a';
      ctx.font = '700 20px "Malgun Gothic",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('원본', ox1 + PANEL_W / 2, oy1 + 26);
      ctx.fillText('다른 그림', ox2 + PANEL_W / 2, oy2 + 26);
    } else {
      ox1 = PAD; oy1 = (H - PANEL_H) / 2;
      ox2 = PAD + PANEL_W + GAP; oy2 = oy1;
      drawScene(ctx, base, ox1, oy1, true, true);
      drawScene(ctx, modScene, ox2, oy2, true, false);
      ctx.fillStyle = '#4a8a3a';
      ctx.font = '700 20px "Malgun Gothic",sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('원본', ox1 + PANEL_W / 2, oy1 + 26);
      ctx.fillText('다른 그림', ox2 + PANEL_W / 2, oy2 + 26);
    }
  }

  /* ---------------- 게임 ---------------- */
  var modScene = [];

  function newGame() {
    over = false; found = {}; scores = [0, 0]; turn = 0;
    base = makeScene();
    mods = makeDifferences(base, diffCount);
    modScene = applyDifferences(base, mods);
    el('resultPanel').hidden = true;
    layoutCanvas();
    renderScores();
    draw();
    msg('두 그림에서 다른 곳 ' + diffCount + '개를 찾아 누르세요.');
  }

  function renderScores() {
    el('s1').textContent = scores[0];
    el('s2').textContent = scores[1];
    el('left').textContent = Math.max(0, diffCount - Object.keys(found).length);
    Array.prototype.forEach.call(document.querySelectorAll('.d-score'), function (n) {
      n.classList.toggle('active-turn',
        (n.classList.contains('p1') && turn === 0 && !over) ||
        (n.classList.contains('p2') && turn === 1 && !over));
    });
  }

  function layoutCanvas() {
    var stage = document.querySelector('.d-stage');
    if (!stage) return;
    var mobile = window.innerWidth <= 760;
    if (mobile) {
      cv.width = PANEL_W + PAD * 2;
      cv.height = PANEL_H * 2 + GAP + PAD * 2;
    } else {
      cv.width = PANEL_W * 2 + GAP + PAD * 2;
      cv.height = PANEL_H + PAD * 2 + 10;
    }
    var sw = stage.clientWidth - 16, sh = stage.clientHeight - 12;
    var scale = Math.min(sw / cv.width, sh / cv.height);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    cv.style.width = Math.round(cv.width * scale) + 'px';
    cv.style.height = Math.round(cv.height * scale) + 'px';
  }

  function toScene(e) {
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) * cv.width / r.width;
    var y = (e.clientY - r.top) * cv.height / r.height;
    var vertical = cv.height > cv.width;
    var ox1, oy1, ox2, oy2;
    if (vertical) {
      ox1 = (cv.width - PANEL_W) / 2; oy1 = PAD;
      ox2 = ox1; oy2 = PAD + PANEL_H + GAP;
    } else {
      ox1 = PAD; oy1 = (cv.height - PANEL_H) / 2;
      ox2 = PAD + PANEL_W + GAP; oy2 = oy1;
    }
    var sx = null, sy = null;
    if (x >= ox1 && x <= ox1 + PANEL_W && y >= oy1 && y <= oy1 + PANEL_H) { sx = x - ox1; sy = y - oy1; }
    else if (x >= ox2 && x <= ox2 + PANEL_W && y >= oy2 && y <= oy2 + PANEL_H) { sx = x - ox2; sy = y - oy2; }
    if (sx === null) return null;
    return { x: sx, y: sy };
  }

  function click(e) {
    if (over) return;
    var p = toScene(e);
    if (!p) return;
    var hit = null;
    for (var i = 0; i < mods.length; i++) {
      var d = mods[i];
      if (found[d.id]) continue;
      if (Math.hypot(p.x - d.x, p.y - d.y) <= d.r * 1.25) { hit = d; break; }
    }
    if (hit) {
      found[hit.id] = true;
      scores[turn] += 1;
      msg('찾았습니다! (' + (hit.kind === 'recolor' ? '색' : hit.kind === 'hide' ? '사라짐' : hit.kind === 'size' ? '크기' : hit.kind === 'move' ? '위치' : '추가') + ') — 한 번 더');
      draw();
      renderScores();
      if (Object.keys(found).length >= diffCount) finish();
    } else {
      msg('여기는 다릅니다 — 틀렸습니다. 차례가 넘어갑니다.');
      turn = 1 - turn;
      renderScores();
    }
  }

  function finish() {
    over = true;
    var title = scores[0] === scores[1] ? '무승부' : (scores[0] > scores[1] ? '1P 승리!' : '2P 승리!');
    el('resultTitle').textContent = title;
    el('resultDesc').textContent = '1P ' + scores[0] + ' : ' + scores[1] + ' 2P · 차이 ' + diffCount + '개';
    el('resultPanel').hidden = false;
    renderScores();
  }

  /* ---------------- 자체 검증 ---------------- */
  function selftest() {
    if (!/[?&]selftest=1/.test(location.search)) return;
    var log = [], ok = true;
    if (mods.length !== diffCount) { ok = false; log.push('count:' + mods.length); }
    mods.forEach(function (d) {
      if (d.x < 0 || d.x > SC || d.y < 0 || d.y > SC) { ok = false; log.push('oob:' + d.id); }
      if (!d.r || d.r < 10) { ok = false; log.push('r:' + d.id); }
    });
    /* 모든 차이 클릭 → 전부 찾히는지 */
    var before = scores[0] + scores[1];
    mods.forEach(function (d) {
      var r = cv.getBoundingClientRect();
      var vertical = cv.height > cv.width;
      var ox = vertical ? (cv.width - PANEL_W) / 2 : PAD;
      var oy = vertical ? PAD : (cv.height - PANEL_H) / 2;
      var cx = r.left + (ox + d.x) * r.width / cv.width;
      var cy = r.top + (oy + d.y) * r.height / cv.height;
      click({ clientX: cx, clientY: cy });
    });
    if (Object.keys(found).length !== diffCount) { ok = false; log.push('click:' + Object.keys(found).length); }
    document.body.setAttribute('data-selftest',
      (ok ? 'PASS' : 'FAIL') + '|diffs=' + diffCount + '|found=' + Object.keys(found).length + '|' + log.join(','));
  }

  /* ---------------- 초기화 ---------------- */
  function init() {
    cv = el('board'); ctx = cv.getContext('2d'); msgEl = el('msg');

    cv.addEventListener('click', click);
    window.addEventListener('resize', function () { layoutCanvas(); draw(); });

    el('diffSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.d-segbtn');
      if (!b) return;
      diffCount = parseInt(b.dataset.n, 10) || 6;
      Array.prototype.forEach.call(document.querySelectorAll('.d-segbtn'), function (x) {
        x.classList.toggle('active', x === b);
      });
      newGame();
    });

    el('btnNew').addEventListener('click', newGame);
    el('btnAgain').addEventListener('click', newGame);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    newGame();
    selftest();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
