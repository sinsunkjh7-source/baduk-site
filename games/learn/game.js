/* ============================================================
   바둑 학습 — 카탈로그(11권/21~단원) + 문제 데이터(166권) 그대로 사용
   ============================================================ */
(function () {
  var BLACK = 1, WHITE = 2;

  var canvas = document.getElementById('board');
  var ctx = canvas.getContext('2d');
  var boardBox = document.getElementById('boardBox');
  var dpr = window.devicePixelRatio || 1;

  var state = {
    bookCode: null,
    bookData: null,
    chapterIdx: 0,
    probIdx: 0,
    size: 19,
    stones: [],
    answer: null,
    solved: false,
    last: null,
    hintShown: false,
    view: 'books'
  };

  /* ---------- 유틸 ---------- */
  var toastTimer = null;
  function toast(msg, cls) {
    var el = document.getElementById('answerToast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'answer-toast ' + (cls || '');
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1400);
  }
  function sfx(n) {
    var a = window.badukAudio;
    if (!a || typeof a[n] !== 'function') return;
    try { a[n](); } catch (e) {}
  }

  /* ---------- SGF 파싱 ---------- */
  function parseSgf(str) {
    var out = [];
    var re = /([BW])\[([a-s])([a-s])\]/g, m;
    while ((m = re.exec(str || '')) !== null) {
      out.push({ color: m[1] === 'B' ? BLACK : WHITE, x: m[2].charCodeAt(0) - 97, y: m[3].charCodeAt(0) - 97 });
    }
    return out;
  }

  /* ---------- 목록 ---------- */
  function buildBookList() {
    var wrap = document.getElementById('bookList');
    wrap.innerHTML = '';
    var groups = (window.CATALOG_DATA || []);
    groups.forEach(function (g) {
      (g.books || []).forEach(function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'book-item';
        btn.innerHTML = '<span>' + b.title + '</span><small>' + b.chapterCount + '단원 · ' + b.totalProblems + '문제</small>';
        btn.addEventListener('click', function () { openBook(b); });
        wrap.appendChild(btn);
      });
    });
    wrap.hidden = false;
    document.getElementById('chapterList').hidden = true;
  }

  function openBook(book) {
    state.bookCode = book.code;
    state.book = book;
    document.getElementById('bookList').hidden = true;
    var list = document.getElementById('chapterList');
    list.hidden = false;
    list.innerHTML = '';

    var back = document.createElement('button');
    back.type = 'button';
    back.className = 'book-item';
    back.innerHTML = '<span>← 목록으로</span>';
    back.addEventListener('click', function () {
      list.hidden = true;
      document.getElementById('bookList').hidden = false;
      document.getElementById('probNav').hidden = true;
      document.getElementById('btnHint').hidden = true;
      document.getElementById('probTitle').textContent = '단원을 선택하세요';
      document.getElementById('probDesc').textContent = '';
      clearBoard();
    });
    list.appendChild(back);

    (book.chapters || []).forEach(function (ch, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chap-item';
      btn.innerHTML = '<span>' + (ch.title || ch.chapter) + '</span><small>' + (ch.problemCount || ch.problemsCount || 0) + '문제</small>';
      btn.addEventListener('click', function () { openChapter(i); });
      list.appendChild(btn);
    });
  }

  function loadBookScript(code) {
    if (window['BOOK_DATA_' + code]) return Promise.resolve(window['BOOK_DATA_' + code]);
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'books/book_' + code + '.js?v=1';
      s.onload = function () { resolve(window['BOOK_DATA_' + code]); };
      s.onerror = function () { reject(new Error('book load fail: ' + code)); };
      document.body.appendChild(s);
    });
  }

  function openChapter(idx) {
    state.chapterIdx = idx;
    var code = state.bookCode;

    document.getElementById('probTitle').textContent = '불러오는 중…';

    loadBookScript(code).then(function (data) {
      state.bookData = data;
      var ch = (data.chapters || [])[idx];
      if (!ch || !ch.problems || !ch.problems.length) {
        document.getElementById('probTitle').textContent = '문제 데이터가 없습니다';
        return;
      }
      state.problems = ch.problems;
      state.chapterTitle = ch.title || ch.chapter || '단원';
      document.getElementById('probNav').hidden = false;
      document.getElementById('btnHint').hidden = false;
      showProblem(0);
    }).catch(function () {
      document.getElementById('probTitle').textContent = '문제를 불러오지 못했습니다';
    });
  }

  /* ---------- 문제 표시 ---------- */
  function showProblem(i) {
    state.probIdx = i;
    state.solved = false;
    state.hintShown = false;
    var p = state.problems[i];
    if (!p) return;

    var stones = parseSgf(p.data);
    var ans = parseSgf(p.answer1)[0] || parseSgf(p.answer)[0] || null;

    /* 문제 영역만 잘라내기 */
    var xs = stones.map(function (s) { return s.x; });
    var ys = stones.map(function (s) { return s.y; });
    if (ans) { xs.push(ans.x); ys.push(ans.y); }
    var minX = Math.min.apply(null, xs) - 1, minY = Math.min.apply(null, ys) - 1;
    var maxX = Math.max.apply(null, xs) + 1, maxY = Math.max.apply(null, ys) + 1;
    var w = maxX - minX + 1, h = maxY - minY + 1;
    var size = Math.max(w, h, 7);

    state.size = size;
    state.offset = { x: minX, y: minY };
    state.stones = stones.map(function (s) { return { x: s.x - minX, y: s.y - minY, color: s.color }; });
    state.answer = ans ? { x: ans.x - minX, y: ans.y - minY } : null;
    state.last = null;

    var q = (p.question || '').replace(/\s+\r?\n\s*/g, ' ').trim();
    document.getElementById('probTitle').textContent =
      state.chapterTitle + ' · ' + (i + 1) + ' / ' + state.problems.length;
    document.getElementById('probDesc').innerHTML = '<b>' + (q || '문제') + '</b>' +
      (state.hintShown && p.hint ? '<br><span style="color:#6b7a63">힌트: ' + p.hint + '</span>' : '');

    layout();
    draw();
  }

  /* ---------- 그리기 ---------- */
  var m = { size: 0, pad: 0, cell: 0 };

  function layout() {
    var box = boardBox.getBoundingClientRect();
    var avail = Math.min(box.width - 28, box.height - 28);
    avail = Math.max(240, Math.min(avail, 820));
    var pad = Math.round(avail * 0.06);
    var cell = (avail - pad * 2) / (state.size - 1);
    m = { size: avail, pad: pad, cell: cell };

    canvas.width = Math.round(avail * dpr);
    canvas.height = Math.round(avail * dpr);
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function pos(i) { return m.pad + i * m.cell; }

  function clearBoard() {
    state.size = 9; state.stones = []; state.answer = null;
    layout(); draw();
  }

  function draw() {
    var s = m.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    var g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#F2CE93'); g.addColorStop(0.5, '#E8B96A'); g.addColorStop(1, '#DDA751');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);

    ctx.strokeStyle = 'rgba(110, 74, 30, .85)';
    ctx.lineWidth = Math.max(1, s / 600);
    for (var i = 0; i < state.size; i++) {
      ctx.beginPath(); ctx.moveTo(pos(i), m.pad); ctx.lineTo(pos(i), s - m.pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.pad, pos(i)); ctx.lineTo(s - m.pad, pos(i)); ctx.stroke();
    }

    var r = m.cell * 0.45;
    state.stones.forEach(function (st) { drawStone(pos(st.x), pos(st.y), r, st.color); });

    if (state.last) {
      ctx.beginPath();
      ctx.arc(pos(state.last.x), pos(state.last.y), r * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#E23B3B'; ctx.lineWidth = Math.max(2, s / 260); ctx.stroke();
    }
  }

  function drawStone(cx, cy, r, color) {
    var grad = ctx.createRadialGradient(cx - r * 0.34, cy - r * 0.38, r * 0.1, cx, cy, r);
    if (color === BLACK) { grad.addColorStop(0, '#6e6e6e'); grad.addColorStop(0.55, '#1c1c1c'); grad.addColorStop(1, '#080808'); }
    else { grad.addColorStop(0, '#fff'); grad.addColorStop(0.6, '#f4f4f4'); grad.addColorStop(1, '#d2d2d2'); }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,.38)'; ctx.shadowBlur = r * 0.45; ctx.shadowOffsetY = r * 0.12;
    ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  }

  /* ---------- 착수 판정 ---------- */
  canvas.addEventListener('click', function (e) {
    if (!state.answer || state.solved) return;
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var x = Math.round((px - m.pad) / m.cell);
    var y = Math.round((py - m.pad) / m.cell);
    if (x < 0 || y < 0 || x >= state.size || y >= state.size) return;
    if (state.stones.some(function (s) { return s.x === x && s.y === y; })) return;

    state.last = { x: x, y: y };
    if (x === state.answer.x && y === state.answer.y) {
      state.solved = true;
      state.stones.push({ x: x, y: y, color: state.answer.color || BLACK });
      sfx('playSuccess');
      toast('정답입니다!', 'ok');
      draw();
      setTimeout(function () {
        if (state.probIdx < state.problems.length - 1) showProblem(state.probIdx + 1);
      }, 900);
    } else {
      sfx('playDdang');
      toast('다시 생각해보세요', 'no');
      state.stones.push({ x: x, y: y, color: BLACK });
      draw();
      setTimeout(function () {
        state.stones.pop();
        state.last = null;
        draw();
      }, 420);
    }
  });

  /* ---------- 버튼 ---------- */
  document.getElementById('btnPrev').addEventListener('click', function () {
    if (state.probIdx > 0) showProblem(state.probIdx - 1);
  });
  document.getElementById('btnNext').addEventListener('click', function () {
    if (state.problems && state.probIdx < state.problems.length - 1) showProblem(state.probIdx + 1);
  });
  document.getElementById('btnHint').addEventListener('click', function () {
    state.hintShown = true;
    var p = state.problems[state.probIdx];
    if (p && p.hint) toast('힌트: ' + p.hint.replace(/\s+/g, ' ').slice(0, 60), '');
  });

  window.addEventListener('resize', function () { layout(); draw(); });

  /* ---------- 시작 ---------- */
  buildBookList();
  clearBoard();
})();
