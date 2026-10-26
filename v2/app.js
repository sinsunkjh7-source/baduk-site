/* ============================================================
   바둑스쿨 v2 — 화면 전환 + 학습(문제 풀이)
   ============================================================ */
(function () {
  var BLACK = 1, WHITE = 2;
  var state = {
    view: 'home',
    books: [],
    book: null,
    chapterIdx: 0,
    problems: [],
    probIdx: 0,
    size: 9,
    stones: [],
    answer: null,
    solved: false
  };

  /* ---------- 화면 전환 ---------- */
  function show(name) {
    state.view = name;
    document.querySelectorAll('.view').forEach(function (v) {
      v.hidden = v.id !== 'view-' + name;
    });
    document.querySelectorAll('.menu button').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.go === name);
    });
    window.scrollTo(0, 0);
    if (name === 'home') document.querySelector('.brand').blur();
  }

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-go]');
    if (!el) return;
    e.preventDefault();
    show(el.dataset.go);
  });

  /* ---------- SGF 파싱 ---------- */
  function parseSgf(str) {
    var out = [], re = /([BW])\[([a-s])([a-s])\]/g, m;
    while ((m = re.exec(str || '')) !== null) {
      out.push({
        color: m[1] === 'B' ? BLACK : WHITE,
        x: m[2].charCodeAt(0) - 97,
        y: m[3].charCodeAt(0) - 97
      });
    }
    return out;
  }

  /* ---------- 교재 목록 ---------- */
  function loadBooks() {
    if (window.CATALOG_DATA) return Promise.resolve(window.CATALOG_DATA);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = '../app/catalog_data.js';
      s.onload = function () { res(window.CATALOG_DATA); };
      s.onerror = rej;
      document.body.appendChild(s);
    });
  }

  function renderBooks(groups) {
    var box = document.getElementById('bookList');
    box.innerHTML = '';
    (groups || []).forEach(function (g) {
      (g.books || []).forEach(function (b) {
        var btn = document.createElement('button');
        btn.className = 'book-item';
        btn.innerHTML = '<span>' + b.title + '</span><small>' +
          b.chapterCount + '단원 · ' + b.totalProblems + '문제</small>';
        btn.addEventListener('click', function () { openBook(b, btn); });
        box.appendChild(btn);
      });
    });
  }

  function openBook(book, btn) {
    state.book = book;
    document.querySelectorAll('.book-item').forEach(function (b) { b.classList.remove('is-on'); });
    if (btn) btn.classList.add('is-on');
    document.getElementById('probTitle').textContent = book.title + ' — 단원 선택';
    loadChapter(book, 0);
  }

  function loadChapter(book, idx) {
    document.getElementById('probTitle').textContent = '불러오는 중…';
    fetch('../app/data/books/book_' + book.code + '.json?v=1')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var ch = (data.chapters || [])[idx];
        if (!ch || !ch.problems || !ch.problems.length) {
          document.getElementById('probTitle').textContent = '문제가 없습니다';
          return;
        }
        state.problems = ch.problems;
        state.chapterTitle = ch.title || ch.chapter || '단원';
        showProblem(0);
      })
      .catch(function () {
        document.getElementById('probTitle').textContent = '교재를 불러오지 못했습니다';
      });
  }

  /* ---------- 문제 표시 ---------- */
  function showProblem(i) {
    state.probIdx = i;
    state.solved = false;
    var p = state.problems[i];
    if (!p) return;

    var stones = parseSgf(p.data);
    var ans = parseSgf(p.answer1)[0] || parseSgf(p.answer)[0] || null;

    var xs = stones.map(function (s) { return s.x; });
    var ys = stones.map(function (s) { return s.y; });
    if (ans) { xs.push(ans.x); ys.push(ans.y); }
    var minX = Math.min.apply(null, xs) - 1, minY = Math.min.apply(null, ys) - 1;
    var maxX = Math.max.apply(null, xs) + 1, maxY = Math.max.apply(null, ys) + 1;
    var size = Math.max(maxX - minX + 1, maxY - minY + 1, 7);

    state.size = size;
    state.stones = stones.map(function (s) { return { x: s.x - minX, y: s.y - minY, color: s.color }; });
    state.answer = ans ? { x: ans.x - minX, y: ans.y - minY } : null;

    document.getElementById('probTitle').textContent =
      state.chapterTitle + ' · ' + (i + 1) + ' / ' + state.problems.length;
    document.getElementById('probDesc').textContent =
      (p.question || '문제').replace(/\s+/g, ' ').trim();

    layout();
    draw();
  }

  /* ---------- 그리기 ---------- */
  var cv = document.getElementById('board');
  var ctx = cv.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var m = { size: 0, pad: 0, cell: 0 };

  function layout() {
    var wrap = document.querySelector('.board-wrap');
    var box = wrap.getBoundingClientRect();
    var avail = Math.max(260, Math.min(box.width - 32, box.height - 32, 760));
    var pad = Math.round(avail * 0.06);
    m = { size: avail, pad: pad, cell: (avail - pad * 2) / (state.size - 1) };
    cv.width = Math.round(avail * dpr);
    cv.height = Math.round(avail * dpr);
    cv.style.width = avail + 'px';
    cv.style.height = avail + 'px';
  }

  function pos(i) { return m.pad + i * m.cell; }

  function draw() {
    var s = m.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    var g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#F2CE93'); g.addColorStop(.5, '#E8B96A'); g.addColorStop(1, '#DDA751');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);

    ctx.strokeStyle = 'rgba(110,74,30,.85)';
    ctx.lineWidth = Math.max(1, s / 700);
    for (var i = 0; i < state.size; i++) {
      ctx.beginPath(); ctx.moveTo(pos(i), m.pad); ctx.lineTo(pos(i), s - m.pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.pad, pos(i)); ctx.lineTo(s - m.pad, pos(i)); ctx.stroke();
    }

    var r = m.cell * .45;
    state.stones.forEach(function (st) { stone(pos(st.x), pos(st.y), r, st.color); });
  }

  function stone(cx, cy, r, color) {
    var gr = ctx.createRadialGradient(cx - r * .34, cy - r * .38, r * .1, cx, cy, r);
    if (color === BLACK) { gr.addColorStop(0, '#6e6e6e'); gr.addColorStop(.55, '#1c1c1c'); gr.addColorStop(1, '#080808'); }
    else { gr.addColorStop(0, '#fff'); gr.addColorStop(.6, '#f4f4f4'); gr.addColorStop(1, '#d2d2d2'); }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = gr;
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = r * .45; ctx.shadowOffsetY = r * .12;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  /* ---------- 착수 ---------- */
  cv.addEventListener('click', function (e) {
    if (!state.answer || state.solved) return;
    var rect = cv.getBoundingClientRect();
    var x = Math.round((e.clientX - rect.left - m.pad) / m.cell);
    var y = Math.round((e.clientY - rect.top - m.pad) / m.cell);
    if (x < 0 || y < 0 || x >= state.size || y >= state.size) return;
    if (state.stones.some(function (s) { return s.x === x && s.y === y; })) return;

    if (x === state.answer.x && y === state.answer.y) {
      state.solved = true;
      state.stones.push({ x: x, y: y, color: state.answer.color || BLACK });
      draw();
      document.getElementById('probDesc').textContent = '정답입니다! 👏';
      setTimeout(function () {
        if (state.probIdx < state.problems.length - 1) showProblem(state.probIdx + 1);
      }, 800);
    } else {
      state.stones.push({ x: x, y: y, color: BLACK });
      draw();
      document.getElementById('probDesc').textContent = '다시 생각해 보세요';
      setTimeout(function () {
        state.stones.pop(); draw();
      }, 400);
    }
  });

  document.getElementById('btnPrev').addEventListener('click', function () {
    if (state.probIdx > 0) showProblem(state.probIdx - 1);
  });
  document.getElementById('btnNext').addEventListener('click', function () {
    if (state.problems.length && state.probIdx < state.problems.length - 1) showProblem(state.probIdx + 1);
  });

  window.addEventListener('resize', function () {
    if (state.view === 'learn' && state.problems.length) { layout(); draw(); }
  });

  /* ---------- 시작 ---------- */
  loadBooks().then(function (data) {
    state.books = data || [];
    renderBooks(state.books);
    if (/[?&]demo=1/.test(location.search)) {
      setTimeout(function () {
        var first = document.querySelector('.book-item');
        if (first) first.click();
      }, 300);
    }
  }).catch(function () {});

  var h = (location.hash || '').replace('#', '');
  show(['learn', 'play', 'omok', 'alkkagi'].indexOf(h) >= 0 ? h : 'home');
})();
