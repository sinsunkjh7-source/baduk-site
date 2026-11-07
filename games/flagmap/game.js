/* 국기 지도 퍼즐 — 게임 로직 */
(function () {
  'use strict';

  /* ---------------- 데이터 ---------------- */
  var CONTINENTS = {
    asia: { name: '아시아', list: [
      ['kr', '대한민국'], ['jp', '일본'], ['cn', '중국'], ['vn', '베트남'],
      ['th', '태국'], ['in', '인도'], ['mn', '몽골'], ['id', '인도네시아']
    ] },
    europe: { name: '유럽', list: [
      ['gb', '영국'], ['fr', '프랑스'], ['de', '독일'], ['it', '이탈리아'],
      ['es', '스페인'], ['ru', '러시아'], ['gr', '그리스'], ['se', '스웨덴']
    ] },
    america: { name: '아메리카', list: [
      ['us', '미국'], ['ca', '캐나다'], ['mx', '멕시코'], ['br', '브라질'],
      ['ar', '아르헨티나'], ['cl', '칠레'], ['pe', '페루'], ['cu', '쿠바']
    ] },
    africa: { name: '아프리카', list: [
      ['eg', '이집트'], ['ke', '케냐'], ['za', '남아프리카공화국'], ['ma', '모로코'],
      ['ng', '나이지리아'], ['et', '에티오피아'], ['tz', '탄자니아'], ['gh', '가나']
    ] },
    oceania: { name: '오세아니아', list: [
      ['au', '호주'], ['nz', '뉴질랜드'], ['pg', '파푸아뉴기니'], ['fj', '피지'],
      ['ws', '사모아'], ['to', '통가'], ['vu', '바누아투'], ['sb', '솔로몬제도']
    ] }
  };

  /* ---------------- 상태 ---------------- */
  var continent = 'asia';
  var svg, mapWrap, tray, msgEl;
  var pending = [];          /* 남은 국기 iso */
  var placed = {};           /* iso -> true */
  var scores = [0, 0];
  var turn = 0;
  var over = false;
  var selected = null;       /* 모바일: 선택된 chip iso */
  var svgReady = false;

  /* ---------------- 유틸 ---------------- */
  function el(id) { return document.getElementById(id); }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function msg(t) { if (msgEl) msgEl.textContent = t; }

  /* ---------------- 지도 로드 ---------------- */
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
        el('loading').hidden = true;
        return true;
      })
      .catch(function (e) {
        el('loading').textContent = '지도를 불러오지 못했습니다';
        throw e;
      });
  }

  /* 대륙 영역으로 확대 */
  function fitContinent() {
    if (!svgReady) return;
    var list = CONTINENTS[continent].list;
    var bb = null;
    for (var i = 0; i < list.length; i++) {
      var p = svg.querySelector('path[id="' + list[i][0] + '"]');
      if (!p) continue;
      var b = p.getBBox();
      if (!bb) bb = { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height };
      else {
        bb.x = Math.min(bb.x, b.x); bb.y = Math.min(bb.y, b.y);
        bb.x2 = Math.max(bb.x2, b.x + b.width); bb.y2 = Math.max(bb.y2, b.y + b.height);
      }
    }
    if (!bb) return;
    var padX = (bb.x2 - bb.x) * 0.10, padY = (bb.y2 - bb.y) * 0.14;
    /* 섬나라가 섞여 영역이 과하게 넓어지는 것 방지 */
    var w = bb.x2 - bb.x, h = bb.y2 - bb.y;
    if (w / h > 2.6) { var cx = (bb.x + bb.x2) / 2; w = h * 2.6; bb.x = cx - w / 2; }
    svg.setAttribute('viewBox',
      (bb.x - padX) + ' ' + (bb.y - padY) + ' ' +
      (w + padX * 2) + ' ' + (h + padY * 2));
  }

  /* ---------------- 게임 진행 ---------------- */
  function newGame() {
    over = false; selected = null;
    scores = [0, 0]; turn = 0;
    placed = {};
    pending = CONTINENTS[continent].list.map(function (c) { return c[0]; });
    shuffle(pending);
    el('resultPanel').hidden = true;
    renderScores();
    renderTray();
    paintMap();
    fitContinent();
    msg('국기를 골라 나라 위에 놓아 보세요.');
  }

  function renderScores() {
    el('s1').textContent = scores[0];
    el('s2').textContent = scores[1];
    el('left').textContent = pending.length;
    document.querySelectorAll('.f-score').forEach(function (n) {
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
      chip.innerHTML = '<img src="flags/' + iso + '.svg" alt="">';
      tray.appendChild(chip);
    });
  }

  function paintMap() {
    if (!svgReady) return;
    var list = CONTINENTS[continent].list.map(function (c) { return c[0]; });
    Array.prototype.forEach.call(svg.querySelectorAll('path'), function (p) {
      p.classList.remove('playable', 'placed', 'wrong');
      var id = p.id;
      if (list.indexOf(id) === -1) { p.style.fill = ''; p.style.stroke = ''; return; }
      if (placed[id]) p.classList.add('placed');
      else p.classList.add('playable');
    });
    /* 놓인 국기 표시 */
    Array.prototype.forEach.call(svg.querySelectorAll('image.f-flagpin'), function (n) { n.remove(); });
    Object.keys(placed).forEach(function (iso) {
      var p = svg.querySelector('path[id="' + iso + '"]');
      if (!p) return;
      var b = p.getBBox();
      var w = Math.min(b.width * 0.9, b.height * 1.4) || 10;
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

    var correct = (iso === countryId);
    if (correct) {
      scores[turn] += 1;
      placed[countryId] = true;
      pending = pending.filter(function (x) { return x !== iso; });
      selected = null;
      msg('정답! ' + CONTINENTS[continent].list.filter(function (c) { return c[0] === iso; })[0][1] + ' +1');
    } else {
      var p = svg.querySelector('path[id="' + countryId + '"]');
      if (p) { p.classList.add('wrong'); setTimeout(function () { p.classList.remove('wrong'); }, 420); }
      var name = CONTINENTS[continent].list.filter(function (c) { return c[0] === iso; })[0][1];
      msg('틀렸습니다 — ' + name + ' 국기가 아닙니다. 차례가 넘어갑니다.');
    }

    turn = 1 - turn;     /* 정답·오답 모두 차례 교대 */
    renderScores();
    renderTray();
    paintMap();

    if (pending.length === 0) finish();
  }

  function finish() {
    over = true;
    var title = scores[0] === scores[1] ? '무승부'
      : (scores[0] > scores[1] ? '1P 승리!' : '2P 승리!');
    el('resultTitle').textContent = title;
    el('resultDesc').textContent = '1P ' + scores[0] + ' : ' + scores[1] + ' 2P · ' +
      CONTINENTS[continent].name + ' 8개국';
    el('resultPanel').hidden = false;
    renderScores();
  }

  /* ---------------- 입력: 드래그 & 탭 ---------------- */
  var dragEl = null, dragIso = null, startX = 0, startY = 0, moved = false;

  function chipFromEvent(e) {
    var t = e.target.closest ? e.target.closest('.f-chip') : null;
    return t;
  }

  function startDrag(e) {
    var chip = chipFromEvent(e);
    if (!chip) return;
    dragIso = chip.dataset.iso;
    startX = e.clientX; startY = e.clientY; moved = false;
    chip.setPointerCapture && chip.setPointerCapture(e.pointerId);
    dragEl = chip;
  }

  function moveDrag(e) {
    if (!dragIso) return;
    if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) > 6) {
      moved = true;
      var ghost = document.createElement('div');
      ghost.className = 'f-drag';
      ghost.id = 'dragGhost';
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
    var iso = dragIso;
    var wasMoved = moved;
    var g = document.getElementById('dragGhost');
    if (g) g.remove();
    if (dragEl) dragEl.classList.remove('dragging');
    dragIso = null; dragEl = null; moved = false;

    if (!wasMoved) {
      /* 탭 → 선택 토글 */
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

  /* 지도 클릭(탭 선택 후) */
  function mapClick(e) {
    if (!selected) return;
    var path = e.target.closest ? e.target.closest('path[id]') : null;
    if (!path) return;
    attempt(selected, path.id);
  }

  /* ---------------- 초기화 ---------------- */
  function init() {
    mapWrap = el('mapWrap');
    tray = el('tray');
    msgEl = el('msg');

    tray.addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    document.getElementById('contSeg').addEventListener('click', function (e) {
      var b = e.target.closest('.f-segbtn');
      if (!b) return;
      continent = b.dataset.cont;
      Array.prototype.forEach.call(document.querySelectorAll('.f-segbtn'), function (x) {
        x.classList.toggle('active', x === b);
      });
      newGame();
    });

    el('btnNew').addEventListener('click', newGame);
    el('btnAgain').addEventListener('click', newGame);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    loadMap().then(function () {
      svg.addEventListener('click', mapClick);
      newGame();
      selftest();
    });
  }

  /* ---------------- 자체 검증 (?selftest=1) ---------------- */
  function selftest() {
    if (!/[?&]selftest=1/.test(location.search)) return;
    var log = [], ok = true;
    var total = 0;
    Object.keys(CONTINENTS).forEach(function (k) {
      var list = CONTINENTS[k].list;
      if (list.length !== 8) { ok = false; log.push(k + ':count' + list.length); }
      list.forEach(function (c) {
        total++;
        if (!svg.querySelector('path[id="' + c[0] + '"]')) { ok = false; log.push('no-map:' + c[0]); }
      });
    });
    /* 국기 로드 */
    var imgs = 0, loaded = 0;
    Object.keys(CONTINENTS).forEach(function (k) {
      CONTINENTS[k].list.forEach(function (c) {
        imgs++;
        var im = new Image();
        im.onload = function () { loaded++; check(); };
        im.onerror = function () { log.push('no-flag:' + c[0]); ok = false; check(); };
        im.src = 'flags/' + c[0] + '.svg';
      });
    });
    function check() {
      if (loaded >= imgs) {
        document.body.setAttribute('data-selftest',
          (ok ? 'PASS' : 'FAIL') + '|countries=' + total + '|flags=' + loaded + '|' + log.join(','));
      }
    }
    /* 판정 로직 단위 확인 */
    var savedScores = scores.slice(), savedTurn = turn, savedPending = pending.slice(), savedPlaced = {};
    Object.keys(placed).forEach(function (k) { savedPlaced[k] = true; });
    newGame();
    attempt('kr', 'kr');
    var t1 = scores[0] === 1 && turn === 1;
    attempt('jp', 'vn');
    var t2 = scores[0] === 1 && scores[1] === 0 && turn === 0;
    scores = savedScores; turn = savedTurn; pending = savedPending; placed = savedPlaced;
    if (!t1 || !t2) { ok = false; log.push('judge'); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
