/* 국기 지도 퍼즐 — 전체 국가 + 단계 구조 */
(function () {
  'use strict';

  var DATA = window.FLAGMAP_DATA || {};
  var STAGE_SIZE = 8;

  var continent = 'asia';
  var stage = 0;            /* 0..n-1 : 8개국 단계, -1 : 대륙 전체 */
  var svg, mapWrap, tray, msgEl;
  var pending = [];
  var placed = {};
  var scores = [0, 0];
  var turn = 0;
  var over = false;
  var selected = null;
  var svgReady = false;
  var nameOf = {};

  function el(id) { return document.getElementById(id); }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function msg(t) { if (msgEl) msgEl.textContent = t; }

  function list() { return (DATA[continent] || { list: [] }).list; }
  function stageCount() { return Math.ceil(list().length / STAGE_SIZE); }

  function stageCountries() {
    var all = list();
    if (stage < 0) return all.slice();
    return all.slice(stage * STAGE_SIZE, stage * STAGE_SIZE + STAGE_SIZE);
  }

  function buildNameMap() {
    Object.keys(DATA).forEach(function (k) {
      DATA[k].list.forEach(function (c) { nameOf[c[0]] = c[1]; });
    });
  }

  /* ---------------- 지도 ---------------- */
  function loadMap() {
    return fetch('world.svg', { cache: 'force-cache' })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        mapWrap.querySelector('#map').outerHTML = txt.replace('<svg', '<svg id="map"');
        svg = document.getElementById('map');
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svgReady = true;
        var l = el('loading'); if (l) l.hidden = true;
        return true;
      });
  }

  function fitStage() {
    if (!svgReady) return;
    var ls = stageCountries();
    var bb = null;
    for (var i = 0; i < ls.length; i++) {
      var p = svg.querySelector('path[id="' + ls[i][0] + '"]');
      if (!p) continue;
      var b = p.getBBox();
      if (!bb) bb = { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height };
      else {
        bb.x = Math.min(bb.x, b.x); bb.y = Math.min(bb.y, b.y);
        bb.x2 = Math.max(bb.x2, b.x + b.width); bb.y2 = Math.max(bb.y2, b.y + b.height);
      }
    }
    if (!bb) return;
    var w = bb.x2 - bb.x, h = bb.y2 - bb.y;
    var cx = (bb.x + bb.x2) / 2, cy = (bb.y + bb.y2) / 2;
    if (w / h > 2.4) w = h * 2.4;
    var padX = w * 0.16, padY = h * 0.18;
    svg.setAttribute('viewBox', (cx - w / 2 - padX) + ' ' + (cy - h / 2 - padY) + ' ' +
      (w + padX * 2) + ' ' + (h + padY * 2));
  }

  /* ---------------- 진행 ---------------- */
  function newGame() {
    over = false; selected = null;
    scores = [0, 0]; turn = 0;
    placed = {};
    pending = shuffle(stageCountries().map(function (c) { return c[0]; }));
    el('resultPanel').hidden = true;
    renderScores(); renderTray(); paintMap(); fitStage();
    var s = stage < 0 ? '대륙 전체' : (stage + 1) + '단계';
    msg(DATA[continent].name + ' ' + s + ' · ' + pending.length + '개국 — 국기를 골라 나라 위에 놓아 보세요.');
  }

  function renderScores() {
    el('s1').textContent = scores[0];
    el('s2').textContent = scores[1];
    el('left').textContent = pending.length;
    Array.prototype.forEach.call(document.querySelectorAll('.f-score'), function (n) {
      n.classList.toggle('active-turn',
        (n.classList.contains('p1') && turn === 0 && !over) ||
        (n.classList.contains('p2') && turn === 1 && !over));
    });
  }

  function renderTray() {
    tray.innerHTML = '';
    pending.forEach(function (iso) {
      var chip = document.createElement('div');
      chip.className = 'f-chip' + (selected === iso ? ' sel' : '');
      chip.dataset.iso = iso;
      chip.innerHTML = '<img src="flags/' + iso + '.svg" alt="' + (nameOf[iso] || iso) + '">';
      tray.appendChild(chip);
    });
  }

  function paintMap() {
    if (!svgReady) return;
    var ids = stageCountries().map(function (c) { return c[0]; });
    Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) {
      p.classList.remove('playable', 'placed', 'wrong');
      if (ids.indexOf(p.id) === -1) { p.style.fill = ''; p.style.stroke = ''; return; }
      if (placed[p.id]) p.classList.add('placed'); else p.classList.add('playable');
    });
    Array.prototype.forEach.call(svg.querySelectorAll('image.f-flagpin'), function (n) { n.remove(); });
    Object.keys(placed).forEach(function (iso) {
      var p = svg.querySelector('path[id="' + iso + '"]');
      if (!p) return;
      var b = p.getBBox();
      var w = Math.min(Math.max(b.width * 0.9, 11), 42);
      var h = w / 1.5;
      var img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', 'flags/' + iso + '.svg');
      img.setAttribute('href', 'flags/' + iso + '.svg');
      img.setAttribute('x', b.x + b.width / 2 - w / 2);
      img.setAttribute('y', b.y + b.height / 2 - h / 2);
      img.setAttribute('width', w);
      img.setAttribute('height', h);
      img.setAttribute('class', 'f-flagpin');
      svg.appendChild(img);
    });
  }

  function attempt(iso, countryId) {
    if (over) return;
    if (placed[countryId]) { msg('이미 놓인 나라입니다.'); return; }
    if (pending.indexOf(iso) === -1) return;
    var inStage = stageCountries().some(function (c) { return c[0] === countryId; });
    var correct = (iso === countryId) && inStage;

    if (correct) {
      scores[turn] += 1;
      placed[countryId] = true;
      pending = pending.filter(function (x) { return x !== iso; });
      selected = null;
      msg('정답! ' + (nameOf[iso] || iso) + ' +1');
    } else {
      var p = svg.querySelector('path[id="' + countryId + '"]');
      if (p && inStage) { p.classList.add('wrong'); setTimeout(function () { p.classList.remove('wrong'); }, 420); }
      msg('틀렸습니다 — ' + (nameOf[iso] || iso) + ' 국기가 아닙니다. 차례가 넘어갑니다.');
    }

    turn = 1 - turn;
    renderScores(); renderTray(); paintMap();
    if (pending.length === 0) finish();
  }

  function finish() {
    over = true;
    var title = scores[0] === scores[1] ? '무승부' : (scores[0] > scores[1] ? '1P 승리!' : '2P 승리!');
    el('resultTitle').textContent = title;
    el('resultDesc').textContent = '1P ' + scores[0] + ' : ' + scores[1] + ' 2P · ' +
      DATA[continent].name + ' ' + (stage < 0 ? '전체' : (stage + 1) + '단계');
    el('resultPanel').hidden = false;
    renderScores();
  }

  /* ---------------- 입력 ---------------- */
  var dragEl = null, dragIso = null, startX = 0, startY = 0, moved = false;

  function startDrag(e) {
    var chip = e.target.closest ? e.target.closest('.f-chip') : null;
    if (!chip) return;
    dragIso = chip.dataset.iso;
    startX = e.clientX; startY = e.clientY; moved = false;
    dragEl = chip;
  }

  function moveDrag(e) {
    if (!dragIso) return;
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
      moved = true;
      var ghost = document.createElement('div');
      ghost.className = 'f-drag'; ghost.id = 'dragGhost';
      ghost.innerHTML = '<img src="flags/' + dragIso + '.svg" alt="">';
      document.body.appendChild(ghost);
      dragEl.classList.add('dragging');
    }
    if (moved) {
      var g = document.getElementById('dragGhost');
      g.style.left = e.clientX + 'px';
      g.style.top = e.clientY + 'px';
    }
  }

  function endDrag(e) {
    if (!dragIso) return;
    var iso = dragIso, wasMoved = moved;
    var g = document.getElementById('dragGhost');
    if (g) g.remove();
    if (dragEl) dragEl.classList.remove('dragging');
    dragIso = null; dragEl = null; moved = false;

    if (!wasMoved) {
      selected = (selected === iso) ? null : iso;
      renderTray();
      msg(selected ? '놓을 나라를 지도에서 눌러 주세요.' : '국기를 골라 나라 위에 놓아 보세요.');
      return;
    }
    var target = document.elementFromPoint(e.clientX, e.clientY);
    var path = target && target.closest ? target.closest('path[id]') : null;
    if (!path) { msg('나라 위에 놓아 주세요.'); return; }
    attempt(iso, path.id);
  }

  function mapClick(e) {
    if (!selected) return;
    var path = e.target.closest ? e.target.closest('path[id]') : null;
    if (!path) return;
    attempt(selected, path.id);
  }

  /* ---------------- 단계 UI ---------------- */
  function renderStages() {
    var box = el('stageSeg');
    if (!box) return;
    box.innerHTML = '';
    var n = stageCount();
    for (var i = 0; i < n; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'f-stagebtn' + (stage === i ? ' active' : '');
      b.dataset.stage = String(i);
      b.textContent = (i + 1);
      box.appendChild(b);
    }
    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'f-stagebtn all' + (stage === -1 ? ' active' : '');
    all.dataset.stage = '-1';
    all.textContent = '전체';
    box.appendChild(all);
  }

  /* ---------------- 초기화 ---------------- */
  function init() {
    mapWrap = el('mapWrap'); tray = el('tray'); msgEl = el('msg');
    buildNameMap();

    tray.addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    el('contSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.f-segbtn');
      if (!b) return;
      continent = b.dataset.cont;
      stage = 0;
      Array.prototype.forEach.call(document.querySelectorAll('.f-segbtn'), function (x) {
        x.classList.toggle('active', x === b);
      });
      renderStages(); newGame();
    });

    var stageSeg = el('stageSeg');
    if (stageSeg) {
      stageSeg.addEventListener('click', function (e) {
        var b = e.target.closest('.f-stagebtn');
        if (!b) return;
        stage = parseInt(b.dataset.stage, 10);
        renderStages(); newGame();
      });
    }

    el('btnNew').addEventListener('click', newGame);
    el('btnAgain').addEventListener('click', newGame);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    renderStages();
    loadMap().then(function () {
      svg.addEventListener('click', mapClick);
      newGame();
      selftest();
    });
  }

  /* ---------------- 자체 검증 (?selftest=1) ---------------- */
  function selftest() {
    if (!/[?&]selftest=1/.test(location.search)) return;
    var log = [], ok = true, total = 0, noMap = 0, stageSum = 0;

    Object.keys(DATA).forEach(function (k) {
      DATA[k].list.forEach(function (c) {
        total++;
        if (!svg.querySelector('path[id="' + c[0] + '"]')) { noMap++; log.push('no-map:' + c[0]); ok = false; }
      });
    });

    var saveC = continent, saveS = stage;
    Object.keys(DATA).forEach(function (k) {
      continent = k;
      var all = list().length, sum = 0, n = stageCount();
      for (var i = 0; i < n; i++) { stage = i; sum += stageCountries().length; }
      if (sum !== all) { ok = false; log.push('stage-sum:' + k + ':' + sum + '/' + all); }
      stageSum += sum;
    });
    continent = saveC; stage = saveS;

    var imgs = 0, loaded = 0, done = false;
    Object.keys(DATA).forEach(function (k) {
      DATA[k].list.forEach(function (c) {
        imgs++;
        var im = new Image();
        im.onload = function () { loaded++; check(); };
        im.onerror = function () { log.push('no-flag:' + c[0]); ok = false; check(); };
        im.src = 'flags/' + c[0] + '.svg';
      });
    });

    stage = 0; newGame();
    var first = pending[0];
    attempt(first, first);
    if (scores[0] + scores[1] !== 1) { ok = false; log.push('judge'); }

    function check() {
      if (done || loaded < imgs) return;
      done = true;
      document.body.setAttribute('data-selftest',
        (ok ? 'PASS' : 'FAIL') + '|countries=' + total + '|noMap=' + noMap +
        '|stageSum=' + stageSum + '|flags=' + loaded + '|' + log.join(','));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
