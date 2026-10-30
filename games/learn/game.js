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
    hover: null,
    last: null,
    hintShown: false,
    view: 'books',
    skin: 'wood',
    showCoords: false,
    showNumbers: false,
    showAnswerHint: false
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

  function parseSgfMarks(str) {
    var marks = [];
    var re = /(?:;|^)([TCMSL]|TR|CR|SQ|MA|LB)\[([a-s]{2})(?::([^\]]*))?\]/gi, m;
    while ((m = re.exec(str || '')) !== null) {
      var tag = m[1].toUpperCase();
      var x = m[2].charCodeAt(0) - 97;
      var y = m[2].charCodeAt(1) - 97;
      var type = (tag === 'T' || tag === 'TR') ? 'triangle' :
                 (tag === 'C' || tag === 'CR') ? 'circle' :
                 (tag === 'L' || tag === 'LB') ? 'label' : 'square';
      marks.push({ x: x, y: y, type: type, label: m[3] || '' });
    }
    return marks;
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
      document.getElementById('btnAnswer').hidden = false;
      document.getElementById('btnRetry').hidden = false;
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
    var marks = parseSgfMarks(p.data);
    var ans = parseSgf(p.answer1)[0] || parseSgf(p.answer)[0] || null;

    /* 문제 영역만 잘라내기 (마크 위치 포함 및 빈 바둑판 방어) */
    var xs = stones.map(function (s) { return s.x; });
    var ys = stones.map(function (s) { return s.y; });
    marks.forEach(function (mk) { xs.push(mk.x); ys.push(mk.y); });
    if (ans) { xs.push(ans.x); ys.push(ans.y); }
    if (xs.length === 0) { xs.push(9); ys.push(9); }

    var minX = Math.max(0, Math.min.apply(null, xs) - 1);
    var minY = Math.max(0, Math.min.apply(null, ys) - 1);
    var maxX = Math.min(18, Math.max.apply(null, xs) + 1);
    var maxY = Math.min(18, Math.max.apply(null, ys) + 1);
    var w = maxX - minX + 1, h = maxY - minY + 1;
    var size = Math.max(w, h, 7);

    state.size = size;
    state.offset = { x: minX, y: minY };
    state.stones = stones.map(function (s) { return { x: s.x - minX, y: s.y - minY, color: s.color }; });
    state.marks = marks.map(function (mk) { return { x: mk.x - minX, y: mk.y - minY, type: mk.type, label: mk.label }; });
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

  /* 🌲 천연 비자목(Kaya) 실물 나뭇결 텍스처 프리로딩 */
  var woodGrainImg = new Image();
  woodGrainImg.src = 'images/board_wood_grain.png';
  woodGrainImg.onload = function () { draw(); };

  function draw() {
    var s = m.size;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    if (state.skin === 'green') {
      ctx.fillStyle = '#CBE7AE';
      ctx.fillRect(0, 0, s, s);
    } else if (state.skin === 'sky') {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(0, 0, s, s);
    } else {
      // 밝은 천연 비자목 (실물 나뭇결 텍스처)
      if (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0) {
        var pattern = ctx.createPattern(woodGrainImg, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, s, s);
      } else {
        ctx.fillStyle = '#f2cc84';
        ctx.fillRect(0, 0, s, s);
      }
    }

    ctx.strokeStyle = 'rgba(110, 74, 30, .85)';
    ctx.lineWidth = Math.max(1, s / 600);
    for (var i = 0; i < state.size; i++) {
      ctx.beginPath(); ctx.moveTo(pos(i), m.pad); ctx.lineTo(pos(i), s - m.pad); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(m.pad, pos(i)); ctx.lineTo(s - m.pad, pos(i)); ctx.stroke();
    }

    var r = m.cell * 0.45;
    state.stones.forEach(function (st) { drawStone(pos(st.x), pos(st.y), r, st.color); });

    // 🌟 마우스 호버 시 착수 임시 돌 모양 가이드 (Ghost Stone)
    if (state.hover && !state.solved) {
      var hoverColor = (state.answer && state.answer.color) ? state.answer.color : (state.turn || 1);
      ctx.save();
      ctx.globalAlpha = 0.52;
      drawStone(pos(state.hover.x), pos(state.hover.y), r, hoverColor);
      ctx.restore();
    }

    // 🌟 문제 마크 (세모 △, 동그라미 ○, 문자 라벨, 네모 □) 렌더링
    if (state.marks && state.marks.length > 0) {
      state.marks.forEach(function (mk) {
        var cx = pos(mk.x);
        var cy = pos(mk.y);
        var st = state.stones.find(function (s) { return s.x === mk.x && s.y === mk.y; });
        var stoneColor = st ? st.color : 0;
        drawProblemMark(cx, cy, m.cell, mk, stoneColor);
      });
    }

    if (state.showCoords) {
      var FILES = 'ABCDEFGHJKLMNOPQRST';
      ctx.fillStyle = 'rgba(90,60,20,.85)';
      ctx.font = 'bold ' + Math.max(9, Math.round(m.cell * 0.4)) + 'px "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (var c = 0; c < state.size; c++) {
        ctx.fillText(FILES[c], pos(c), m.pad * 0.45);
        ctx.fillText(FILES[c], pos(c), s - m.pad * 0.45);
      }
      for (var rr = 0; rr < state.size; rr++) {
        ctx.fillText(String(state.size - rr), m.pad * 0.45, pos(rr));
        ctx.fillText(String(state.size - rr), s - m.pad * 0.45, pos(rr));
      }
    }

    if (state.showNumbers) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = 'bold ' + Math.max(8, Math.round(m.cell * 0.38)) + 'px "Fredoka", "Malgun Gothic", sans-serif';
      state.stones.forEach(function (st, i) {
        var numStr = String(i + 1);
        var sx = pos(st.x);
        var sy = pos(st.y);
        ctx.save();
        if (st.color === WHITE) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = Math.max(2, Math.round(m.cell * 0.05));
          ctx.strokeText(numStr, sx, sy);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(numStr, sx, sy);
        } else {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = Math.max(2, Math.round(m.cell * 0.04));
          ctx.strokeText(numStr, sx, sy);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(numStr, sx, sy);
        }
        ctx.restore();
      });
    }

    if (state.showAnswerHint && state.answer) {
      ctx.beginPath();
      ctx.arc(pos(state.answer.x), pos(state.answer.y), m.cell * 0.42, 0, Math.PI * 2);
      ctx.strokeStyle = '#E23B3B'; ctx.lineWidth = Math.max(2, s / 200); ctx.stroke();
    }

    if (state.last) {
      ctx.beginPath();
      ctx.arc(pos(state.last.x), pos(state.last.y), r * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = '#E23B3B'; ctx.lineWidth = Math.max(2, s / 260); ctx.stroke();
    }
  }

  /* ---------- 🌟 문제 마크 렌더링 (세모 △, 동그라미 ○, 문자 라벨, 네모 □) ---------- */
  function drawProblemMark(cx, cy, cell, mk, stoneColor) {
    ctx.save();
    var strokeW = Math.max(1.8, Math.min(2.4, cell * 0.045));
    ctx.lineWidth = strokeW;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (mk.type === 'triangle') {
      // 🌟 세모(△): 정삼각형 (돌 크기 대비 아담하게 안착, 바깥으로 튀어나가지 않음)
      var R = cell * 0.16;
      var topY = cy - R * 1.05;
      var botY = cy + R * 0.55;
      var sideX = R * 0.90;
      ctx.beginPath();
      ctx.moveTo(cx, topY);
      ctx.lineTo(cx + sideX, botY);
      ctx.lineTo(cx - sideX, botY);
      ctx.closePath();

      if (stoneColor === 1) {
        // 흑돌 위 세모: 화이트 (투명)
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else if (stoneColor === 2) {
        // 백돌 위 세모: 다크 차콜 (투명)
        ctx.strokeStyle = '#18181b';
        ctx.stroke();
      } else {
        // 빈 교차점 위 세모: 레드 (투명)
        ctx.strokeStyle = '#dc2626';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;
        ctx.stroke();
      }
    } else if (mk.type === 'circle') {
      // 🌟 동그라미(○): 돌 중앙에 쏙 들어가는 단정한 원
      var circleR = cell * 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);

      if (stoneColor === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        ctx.strokeStyle = '#18181b';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.20)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.stroke();
      }
    } else if (mk.type === 'label') {
      // 🌟 문자 라벨: '가', '나', '1', 'A' 등
      var text = mk.label || '';
      var fontSize = Math.max(11, Math.round(cell * 0.28));
      ctx.font = '900 ' + fontSize + 'px -apple-system, BlinkMacSystemFont, "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (stoneColor === 1) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, cx, cy);
      } else if (stoneColor === 2) {
        ctx.fillStyle = '#18181b';
        ctx.fillText(text, cx, cy);
      } else {
        var badgeR = cell * 0.20;
        ctx.beginPath();
        ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, cx, cy);
      }
    } else if (mk.type === 'square') {
      // 🌟 네모(□): 돌 중앙에 쏙 들어가는 사각형
      var sqHalf = cell * 0.12;
      ctx.beginPath();
      ctx.rect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2);

      if (stoneColor === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        ctx.strokeStyle = '#18181b';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.20)';
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawStone(cx, cy, r, color) {
    var style = getStoneStyle();
    ctx.save();

    var spriteKey = style + '_' + color;
    var spriteImg = stoneSprites[spriteKey];

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = r * 0.38;
      ctx.shadowOffsetY = r * 0.14;
      ctx.drawImage(spriteImg, cx - r, cy - r, r * 2, r * 2);
    } else {
      var grad = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.08, cx, cy, r);
      if (style === 'gem') {
        if (color === BLACK) {
          grad.addColorStop(0, '#dbeafe');
          grad.addColorStop(0.2, '#60a5fa');
          grad.addColorStop(0.5, '#2563eb');
          grad.addColorStop(0.8, '#1e40af');
          grad.addColorStop(1, '#0f172a');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.2, '#fdf2f8');
          grad.addColorStop(0.48, '#fbcfe8');
          grad.addColorStop(0.8, '#f472b6');
          grad.addColorStop(1, '#be185d');
        }
      } else {
        if (color === BLACK) {
          grad.addColorStop(0, '#666666');
          grad.addColorStop(0.55, '#1e1e1e');
          grad.addColorStop(1, '#080808');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.6, '#f3f3f3');
          grad.addColorStop(1, '#d4d4d4');
        }
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = r * 0.4;
      ctx.shadowOffsetY = r * 0.15;
      ctx.fill();
    }
    ctx.restore();

    if (style === 'cute' && r >= 8) {
      ctx.save();
      var eyeY = cy - r * 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.30, eyeY, r * 0.18, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.30, eyeY, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(cx - r * 0.28, eyeY, r * 0.10, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.32, eyeY, r * 0.10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.33, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.27, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- 🌟 마우스 호버 임시 돌 모양 가이드 ---------- */
  canvas.addEventListener('mousemove', function (e) {
    if (!state.answer || state.solved) {
      if (state.hover) { state.hover = null; draw(); }
      return;
    }
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var x = Math.round((px - m.pad) / m.cell);
    var y = Math.round((py - m.pad) / m.cell);
    if (x >= 0 && y >= 0 && x < state.size && y < state.size) {
      var exactX = pos(x), exactY = pos(y);
      var dist = Math.hypot(px - exactX, py - exactY);
      var isOccupied = state.stones.some(function (s) { return s.x === x && s.y === y; });
      if (dist <= m.cell * 0.48 && !isOccupied) {
        if (!state.hover || state.hover.x !== x || state.hover.y !== y) {
          state.hover = { x: x, y: y };
          canvas.style.cursor = 'pointer';
          draw();
        }
        return;
      }
    }
    if (state.hover) {
      state.hover = null;
      canvas.style.cursor = 'default';
      draw();
    }
  });

  canvas.addEventListener('mouseleave', function () {
    if (state.hover) {
      state.hover = null;
      canvas.style.cursor = 'default';
      draw();
    }
  });

  /* ---------- 착수 판정 ---------- */
  canvas.addEventListener('click', function (e) {
    state.hover = null;
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
      state.stones.push({ x: x, y: y, color: (state.answer && state.answer.color) ? state.answer.color : BLACK });
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

  document.getElementById('btnAnswer').addEventListener('click', function () {
    state.showAnswerHint = true;
    toast('빨간 원이 정답 자리입니다', '');
    draw();
  });

  document.getElementById('btnRetry').addEventListener('click', function () {
    showProblem(state.probIdx);
  });

  document.getElementById('btnOpts').addEventListener('click', function () {
    var p = document.getElementById('optPanel');
    p.hidden = !p.hidden;
  });

  document.getElementById('skinSeg').addEventListener('click', function (e) {
    var b = e.target.closest('.seg-btn');
    if (!b) return;
    document.querySelectorAll('#skinSeg .seg-btn').forEach(function (x) { x.classList.remove('active'); });
    b.classList.add('active');
    state.skin = b.dataset.skin;
    draw();
  });
  document.getElementById('optCoords').addEventListener('change', function (e) { state.showCoords = e.target.checked; draw(); });
  document.getElementById('optNum').addEventListener('change', function (e) { state.showNumbers = e.target.checked; draw(); });

  window.addEventListener('resize', function () { layout(); draw(); });

  /* ---------- 시작 ---------- */
  buildBookList();
  clearBoard();
})();
