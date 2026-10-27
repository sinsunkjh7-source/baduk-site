/* ============================================================
   바둑스쿨 강사 모드 전용 수업 사령탑 엔진 (Teacher Command Center)
   - 12개 시리즈 / 166권 교재 데이터 로더 & 인터랙티브 수업 바둑판
   ============================================================ */

(function () {
  var TEACHER_PASS = '2580';
  var SESSION_KEY = 'bkTeacherOk';

  /* ---------- 상태 ---------- */
  var state = {
    authenticated: false,
    catalog: [],
    currentSeriesIndex: 0,
    currentBook: null,
    currentChapterIndex: 0,
    currentProblems: [],
    currentProblemIndex: 0,
    boardSize: 9,
    board: [],            // 0: 빈칸, 1: 흑, 2: 백
    initialBoard: [],
    shiftX: 0,
    shiftY: 0,
    answerMoves: [],      // [{x, y, color, step}]
    showAnswer: false,
    freeMode: false,
    freeColor: 1,         // 1: 흑, 2: 백
    solved: false
  };

  /* DOM 요소 */
  var pinGate = document.getElementById('pinGate');
  var pinInput = document.getElementById('pinInput');
  var pinError = document.getElementById('pinError');
  var teacherApp = document.getElementById('teacherApp');
  
  var seriesSelect = document.getElementById('seriesSelect');
  var bookSelect = document.getElementById('bookSelect');
  var chapterSelect = document.getElementById('chapterSelect');
  var problemGrid = document.getElementById('problemGrid');
  var problemProgress = document.getElementById('problemProgress');
  
  var canvas = document.getElementById('teachingBoard');
  var ctx = canvas.getContext('2d');
  var boardContainer = document.getElementById('boardContainer');

  var questionText = document.getElementById('questionText');
  var hintBox = document.getElementById('hintBox');
  var hintText = document.getElementById('hintText');
  var qNumBadge = document.getElementById('qNumBadge');
  var qTurnBadge = document.getElementById('qTurnBadge');
  var navIndicator = document.getElementById('navIndicator');
  var currentBookTitle = document.getElementById('currentBookTitle');
  var currentChapterTitle = document.getElementById('currentChapterTitle');
  var freeModeStatus = document.getElementById('freeModeStatus');

  /* ---------- 효과음 ---------- */
  function sfx(name) {
    if (window.badukAudio && typeof window.badukAudio[name] === 'function') {
      try { window.badukAudio[name](); } catch (e) {}
    }
  }

  /* ---------- 토스트 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('teacherToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1600);
  }

  /* ---------- 비밀번호 인증 ---------- */
  function checkAuth() {
    var ok = sessionStorage.getItem(SESSION_KEY) === '1' || localStorage.getItem(SESSION_KEY) === '1';
    if (ok) {
      state.authenticated = true;
      pinGate.hidden = true;
      teacherApp.hidden = false;
      initCatalog();
    } else {
      pinGate.hidden = false;
      teacherApp.hidden = true;
      setTimeout(function () { pinInput.focus(); }, 100);
    }
  }

  function submitPin() {
    if (pinInput.value.trim() === TEACHER_PASS) {
      sessionStorage.setItem(SESSION_KEY, '1');
      localStorage.setItem(SESSION_KEY, '1');
      state.authenticated = true;
      pinGate.hidden = true;
      teacherApp.hidden = false;
      initCatalog();
    } else {
      pinError.hidden = false;
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function lockOut() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    state.authenticated = false;
    pinGate.hidden = false;
    teacherApp.hidden = true;
    pinInput.value = '';
    pinError.hidden = true;
  }

  /* ---------- 카탈로그 및 교재 로드 ---------- */
  function initCatalog() {
    fetch('data/catalog.json')
      .then(function (res) { return res.json(); })
      .then(function (cat) {
        state.catalog = cat;
        populateSeries();
      })
      .catch(function (err) {
        console.error('Failed to load catalog.json:', err);
        toast('교재 목록을 불러오지 못했습니다.');
      });
  }

  function populateSeries() {
    seriesSelect.innerHTML = '';
    state.catalog.forEach(function (sec, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = (idx + 1) + '. ' + sec.title + ' (' + (sec.books ? sec.books.length : 0) + '권)';
      seriesSelect.appendChild(opt);
    });
    seriesSelect.value = 0;
    onSeriesChange();
  }

  function onSeriesChange() {
    var secIdx = parseInt(seriesSelect.value, 10);
    state.currentSeriesIndex = secIdx;
    var sec = state.catalog[secIdx];
    bookSelect.innerHTML = '';
    if (!sec || !sec.books) return;

    sec.books.forEach(function (b, bIdx) {
      var opt = document.createElement('option');
      opt.value = b.code;
      opt.textContent = b.title + ' (' + (b.totalProblems || 0) + '제)';
      bookSelect.appendChild(opt);
    });

    if (sec.books.length > 0) {
      bookSelect.value = sec.books[0].code;
      loadBook(sec.books[0].code);
    }
  }

  function loadBook(code) {
    fetch('data/books/book_' + code + '.json')
      .then(function (res) { return res.json(); })
      .then(function (bookData) {
        state.currentBook = bookData;
        currentBookTitle.textContent = bookData.book || bookData.title || ('교재 ' + code);
        populateChapters(bookData);
      })
      .catch(function (err) {
        console.error('Failed to load book_' + code + '.json:', err);
        toast('교재 파일을 불러오지 못했습니다: book_' + code);
      });
  }

  function populateChapters(bookData) {
    chapterSelect.innerHTML = '';
    var chapters = bookData.chapters || [];
    chapters.forEach(function (ch, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = ch.chapter || ch.title || ('제 ' + (idx + 1) + '단원');
      chapterSelect.appendChild(opt);
    });
    chapterSelect.value = 0;
    onChapterChange();
  }

  function onChapterChange() {
    var chIdx = parseInt(chapterSelect.value, 10);
    state.currentChapterIndex = chIdx;
    var chapters = state.currentBook ? state.currentBook.chapters : [];
    var ch = chapters[chIdx];
    if (!ch) return;

    currentChapterTitle.textContent = '— ' + (ch.chapter || ch.title || '');
    state.currentProblems = ch.problems || [];
    state.currentProblemIndex = 0;

    renderProblemGrid();
    loadProblem(0);
  }

  function renderProblemGrid() {
    problemGrid.innerHTML = '';
    var total = state.currentProblems.length;
    problemProgress.textContent = total > 0 ? ('1 / ' + total) : '0 / 0';

    state.currentProblems.forEach(function (p, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'prob-btn' + (idx === state.currentProblemIndex ? ' active' : '');
      btn.textContent = (idx + 1) + '번';
      btn.addEventListener('click', function () {
        loadProblem(idx);
      });
      problemGrid.appendChild(btn);
    });
  }

  /* ---------- 단일 문제 로드 ---------- */
  function loadProblem(idx) {
    if (idx < 0 || idx >= state.currentProblems.length) return;
    state.currentProblemIndex = idx;
    state.showAnswer = false;
    state.solved = false;
    hintBox.hidden = true;

    // 문제 그리드 활성 버튼 업데이트
    var btns = problemGrid.querySelectorAll('.prob-btn');
    btns.forEach(function (b, i) {
      b.classList.toggle('active', i === idx);
    });

    var p = state.currentProblems[idx];
    qNumBadge.textContent = '문제 ' + (idx + 1);
    var turnColor = (p.start && p.start.toUpperCase() === 'W') ? '⚪ 백선' : '⚫ 흑선';
    qTurnBadge.textContent = turnColor;
    questionText.textContent = (p.question || '알맞은 곳에 돌을 놓아 보세요.').replace(/\r\n/g, '\n');
    hintText.textContent = p.hint || '힌트가 없는 문제입니다.';
    navIndicator.textContent = (idx + 1) + ' / ' + state.currentProblems.length;
    problemProgress.textContent = (idx + 1) + ' / ' + state.currentProblems.length;

    // 바둑판 크기 자동 판별
    state.boardSize = detectBoardSize(p);
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSize);
    layoutBoard();
    drawBoard();
  }

  /* ---------- 바둑판 크기 자동 판별 ---------- */
  function detectBoardSize(p) {
    if (!p) return 9;
    if (p.size) {
      var s = parseInt(p.size, 10);
      if (s === 19 || s === 13 || s === 9) return s;
      if (s === 1 || s === 2) return 19;
    }
    var points = [];
    var reg = /;([BW])\[([a-s]{2})\]/gi;
    var allSgf = (p.data || '') + (p.answer1 || '');
    var m;
    while ((m = reg.exec(allSgf)) !== null) {
      points.push({
        x: m[2].charCodeAt(0) - 97,
        y: m[2].charCodeAt(1) - 97
      });
    }
    if (points.length === 0) return 9;
    var minX = Math.min.apply(null, points.map(function(pt){return pt.x;}));
    var minY = Math.min.apply(null, points.map(function(pt){return pt.y;}));
    var maxX = Math.max.apply(null, points.map(function(pt){return pt.x;}));
    var maxY = Math.max.apply(null, points.map(function(pt){return pt.y;}));

    if (maxX - minX >= 13 || maxY - minY >= 13) return 19;
    if (minX <= 5 && maxX >= 14) return 19;
    if (minY <= 5 && maxY >= 14) return 19;

    var neededX = (maxX >= 10) ? (19 - minX) : (maxX + 1);
    var neededY = (maxY >= 10) ? (19 - minY) : (maxY + 1);
    var needed = Math.max(neededX, neededY);

    if (needed <= 9) return 9;
    if (needed <= 13) return 13;
    return 19;
  }

  /* ---------- SGF -> 보드 좌표 변환 (Corner Shift 지원) ---------- */
  function parseProblemSgf(p, targetSize) {
    state.board = Array.from({ length: targetSize }, function () { return new Array(targetSize).fill(0); });
    state.answerMoves = [];
    state.shiftX = 0;
    state.shiftY = 0;

    var sgfData = p.data || '';
    var rawPoints = [];
    var testRegex = /;([BW])\[([a-s]{2})\]/gi;
    var tm;
    while ((tm = testRegex.exec(sgfData)) !== null) {
      rawPoints.push({
        x: tm[2].charCodeAt(0) - 97,
        y: tm[2].charCodeAt(1) - 97
      });
    }

    if (targetSize < 19 && rawPoints.length > 0) {
      var maxX = Math.max.apply(null, rawPoints.map(function(pt){return pt.x;}));
      var maxY = Math.max.apply(null, rawPoints.map(function(pt){return pt.y;}));
      if (maxX >= 10 && maxY >= 10) {
        state.shiftX = 19 - targetSize;
        state.shiftY = 19 - targetSize;
      } else if (maxX <= 8 && maxY >= 10) {
        state.shiftX = 0;
        state.shiftY = 19 - targetSize;
      } else if (maxX >= 10 && maxY <= 8) {
        state.shiftX = 19 - targetSize;
        state.shiftY = 0;
      }
    }

    // 초기 돌 배치
    var regex = /;([BW])\[([a-s]{2})\]/gi;
    var m;
    while ((m = regex.exec(sgfData)) !== null) {
      var color = m[1].toUpperCase() === 'B' ? 1 : 2;
      var x = m[2].charCodeAt(0) - 97 - state.shiftX;
      var y = m[2].charCodeAt(1) - 97 - state.shiftY;
      if (x >= 0 && x < targetSize && y >= 0 && y < targetSize) {
        state.board[y][x] = color;
      }
    }

    // 정답 수순 파싱 (answer1, answer2 등)
    var ansSgf = p.answer1 || p.answer || '';
    if (ansSgf) {
      var aRegex = /;([BW])\[([a-s]{2})\]/gi;
      var am;
      var step = 1;
      while ((am = aRegex.exec(ansSgf)) !== null) {
        var acolor = am[1].toUpperCase() === 'B' ? 1 : 2;
        var ax = am[2].charCodeAt(0) - 97 - state.shiftX;
        var ay = am[2].charCodeAt(1) - 97 - state.shiftY;
        if (ax >= 0 && ax < targetSize && ay >= 0 && ay < targetSize) {
          state.answerMoves.push({ x: ax, y: ay, color: acolor, step: step++ });
        }
      }
    }

    // 원본 상태 복사본
    state.initialBoard = state.board.map(function (row) { return row.slice(); });
  }

  /* ---------- 바둑판 렌더링 ---------- */
  var metrics = { displaySize: 0, cellSize: 0, dpr: 1 };

  function layoutBoard() {
    var rect = boardContainer.getBoundingClientRect();
    var avail = Math.min(rect.width - 24, rect.height - 24);
    avail = Math.max(300, Math.min(avail, 960));

    var dpr = window.devicePixelRatio || 1;
    metrics.displaySize = avail;
    metrics.cellSize = avail / (state.boardSize + 1);
    metrics.dpr = dpr;

    canvas.width = Math.round(avail * dpr);
    canvas.height = Math.round(avail * dpr);
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
  }

  function drawBoard() {
    var s = metrics.displaySize;
    var cell = metrics.cellSize;
    var bSize = state.boardSize;
    var dpr = metrics.dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, s, s);

    // 1. 따뜻한 목재 바탕
    var g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, '#F5DEB3');
    g.addColorStop(0.5, '#E8C589');
    g.addColorStop(1, '#D9B372');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);

    // 2. 외곽 테두리
    ctx.strokeStyle = '#3d2510';
    ctx.lineWidth = Math.max(2, s / 320);
    ctx.strokeRect(cell, cell, cell * (bSize - 1), cell * (bSize - 1));

    // 3. 격자선
    ctx.strokeStyle = 'rgba(60, 35, 15, 0.85)';
    ctx.lineWidth = Math.max(1, s / 500);
    for (var i = 0; i < bSize; i++) {
      var coord = cell * (i + 1);
      ctx.beginPath();
      ctx.moveTo(cell, coord);
      ctx.lineTo(cell * bSize, coord);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(coord, cell);
      ctx.lineTo(coord, cell * bSize);
      ctx.stroke();
    }

    // 4. 화점
    var starRadius = Math.max(2.5, cell * 0.1);
    var starPoints = [];
    if (bSize === 9) {
      starPoints = [{ x: 4, y: 4 }];
    } else if (bSize === 13) {
      starPoints = [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 6, y: 6 }, { x: 3, y: 9 }, { x: 9, y: 9 }];
    } else if (bSize === 19) {
      [3, 9, 15].forEach(function(x){
        [3, 9, 15].forEach(function(y){ starPoints.push({ x: x, y: y }); });
      });
    }
    ctx.fillStyle = '#4a2c11';
    starPoints.forEach(function (sp) {
      ctx.beginPath();
      ctx.arc(cell * (sp.x + 1), cell * (sp.y + 1), starRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. 돌 그리기
    var r = cell * 0.44;
    for (var y = 0; y < bSize; y++) {
      for (var x = 0; x < bSize; x++) {
        var v = state.board[y][x];
        if (v) drawStone(cell * (x + 1), cell * (y + 1), r, v);
      }
    }

    // 6. 정답 보기 활성화 시 번호 마커 표시
    if (state.showAnswer && state.answerMoves.length > 0) {
      state.answerMoves.forEach(function (m) {
        var cx = cell * (m.x + 1);
        var cy = cell * (m.y + 1);
        // 답안 위치에 반투명 돌
        drawStone(cx, cy, r, m.color, 0.95);

        // 정답 수순 번호 마킹
        ctx.fillStyle = (m.color === 1) ? '#FFFFFF' : '#000000';
        ctx.font = 'bold ' + Math.round(cell * 0.48) + 'px "Fredoka", "Malgun Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.step, cx, cy);
      });
    }
  }

  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    var grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    if (color === 1) {
      grad.addColorStop(0, '#666666');
      grad.addColorStop(0.55, '#1e1e1e');
      grad.addColorStop(1, '#080808');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#f3f3f3');
      grad.addColorStop(1, '#d4d4d4');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = r * 0.4;
    ctx.shadowOffsetY = r * 0.15;
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 착수 인터랙션 ---------- */
  canvas.addEventListener('click', function (e) {
    if (!state.currentBook) return;
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    var cell = metrics.cellSize;

    var gx = Math.round(px / cell) - 1;
    var gy = Math.round(py / cell) - 1;

    if (gx < 0 || gx >= state.boardSize || gy < 0 || gy >= state.boardSize) return;

    // 자유 모드: 강사가 원하는 색 돌 자유롭게 놓기
    if (state.freeMode) {
      if (state.board[gy][gx] === state.freeColor) {
        state.board[gy][gx] = 0; // 같은 색 클릭 시 돌 빼기
      } else {
        state.board[gy][gx] = state.freeColor;
        sfx('playStone');
        state.freeColor = state.freeColor === 1 ? 2 : 1;
      }
      drawBoard();
      return;
    }

    // 이미 돌이 놓여진 자리는 무시
    if (state.board[gy][gx] !== 0) return;

    var p = state.currentProblems[state.currentProblemIndex];
    var myColor = (p.start && p.start.toUpperCase() === 'W') ? 2 : 1;

    // 정답 체크 (첫 번째 정답 수순과 일치하는지)
    var isCorrect = false;
    if (state.answerMoves.length > 0) {
      var firstAns = state.answerMoves[0];
      if (firstAns.x === gx && firstAns.y === gy) {
        isCorrect = true;
      }
    }

    state.board[gy][gx] = myColor;
    sfx('playStone');
    drawBoard();

    if (isCorrect) {
      state.solved = true;
      sfx('playSuccess');
      toast('정답입니다! 👏');
    } else {
      sfx('playDdang');
      toast('오답입니다. 다시 도전해 보세요! 🤔');
    }
  });

  /* ---------- 버튼 이벤트 바인딩 ---------- */
  document.getElementById('btnPinSubmit').addEventListener('click', submitPin);
  pinInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitPin();
  });

  seriesSelect.addEventListener('change', onSeriesChange);
  bookSelect.addEventListener('change', function () {
    loadBook(bookSelect.value);
  });
  chapterSelect.addEventListener('change', onChapterChange);

  document.getElementById('btnPrevProblem').addEventListener('click', function () {
    if (state.currentProblemIndex > 0) loadProblem(state.currentProblemIndex - 1);
  });
  document.getElementById('btnNextProblem').addEventListener('click', function () {
    if (state.currentProblemIndex < state.currentProblems.length - 1) {
      loadProblem(state.currentProblemIndex + 1);
    }
  });

  document.getElementById('btnHint').addEventListener('click', function () {
    hintBox.hidden = !hintBox.hidden;
  });

  document.getElementById('btnAnswer').addEventListener('click', function () {
    state.showAnswer = !state.showAnswer;
    this.textContent = state.showAnswer ? '🙈 정답 숨기기' : '👁️ 정답 보기';
    drawBoard();
  });

  document.getElementById('btnReset').addEventListener('click', function () {
    state.board = state.initialBoard.map(function (row) { return row.slice(); });
    state.showAnswer = false;
    document.getElementById('btnAnswer').textContent = '👁️ 정답 보기';
    drawBoard();
  });

  document.getElementById('btnToggleFree').addEventListener('click', function () {
    state.freeMode = !state.freeMode;
    freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
    this.classList.toggle('active', state.freeMode);
    toast(state.freeMode ? '✏️ 자유 시연 모드 켜짐 (돌을 마음대로 놓아보세요)' : '수업 문제 모드로 복귀');
  });

  document.getElementById('btnFullscreen').addEventListener('click', function () {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(function(){});
    } else {
      document.exitFullscreen().catch(function(){});
    }
  });

  document.getElementById('btnLockOut').addEventListener('click', lockOut);

  // 키보드 단축키 (좌우 화살표: 문제 이동, A: 정답, R: 초기화)
  window.addEventListener('keydown', function (e) {
    if (!state.authenticated) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowLeft') {
      if (state.currentProblemIndex > 0) loadProblem(state.currentProblemIndex - 1);
    } else if (e.key === 'ArrowRight') {
      if (state.currentProblemIndex < state.currentProblems.length - 1) {
        loadProblem(state.currentProblemIndex + 1);
      }
    } else if (e.key === 'a' || e.key === 'A') {
      document.getElementById('btnAnswer').click();
    } else if (e.key === 'r' || e.key === 'R') {
      document.getElementById('btnReset').click();
    }
  });

  window.addEventListener('resize', function () {
    if (state.authenticated) {
      layoutBoard();
      drawBoard();
    }
  });

  /* ---------- 시작 ---------- */
  checkAuth();
})();
