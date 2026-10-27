/* ============================================================
   바둑스쿨 강사 모드 전용 수업 사령탑 엔진 (Teacher Command Center)
   - 12개 시리즈 / 166권 교재 데이터 로더 & 인터랙티브 수업 바둑판
   ============================================================ */

(function () {
  var TEACHER_PASS = '5840';
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
    boardCols: 10,        // 🌟 원장님 지침: 세로선 10개
    boardRows: 9,         // 🌟 원장님 지침: 가로선 9개
    boardSpec: null,
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

    // 🌟 원 교재 규격 자동 판별: 가로선 9, 세로선 10 (열린 선 다이어그램)
    state.boardSpec = detectBoardSpec(p);
    state.boardCols = state.boardSpec.cols;
    state.boardRows = state.boardSpec.rows;
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSpec);
    layoutBoard();
    drawBoard();
  }

  /* ---------- 🌟 원 교재 규격 판별 (가로선 9, 세로선 10 / 열린 선) ---------- */
  function detectBoardSpec(p) {
    if (!p) return { cols: 10, rows: 9, isFull19: false, quadrant: 'BR' };
    
    var rawSize = p.size ? String(p.size).trim() : '';
    if (rawSize === '1' || rawSize === '2') {
      return { cols: 19, rows: 19, isFull19: true, quadrant: 'FULL19' };
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

    if (points.length === 0) {
      return { cols: 10, rows: 9, isFull19: false, quadrant: 'BR' };
    }

    var minX = Math.min.apply(null, points.map(function(pt){return pt.x;}));
    var minY = Math.min.apply(null, points.map(function(pt){return pt.y;}));
    var maxX = Math.max.apply(null, points.map(function(pt){return pt.x;}));
    var maxY = Math.max.apply(null, points.map(function(pt){return pt.y;}));

    // 전판 사활/포석/축 등 범위가 넓은 경우 (19줄 전판)
    if (maxX - minX >= 12 || maxY - minY >= 12 || (minX <= 4 && maxX >= 14) || (minY <= 4 && maxY >= 14)) {
      return { cols: 19, rows: 19, isFull19: true, quadrant: 'FULL19' };
    }

    // 사분면 판별 (우하귀, 좌하귀, 좌상귀, 우상귀)
    var quadrant = 'BR';
    if (rawSize === '7' || (minX <= 8 && minY >= 10 && maxX <= 9)) {
      quadrant = 'BL';
    } else if (rawSize === '6' || (maxX <= 8 && maxY <= 8)) {
      quadrant = 'TL';
    } else if (rawSize === '5' || (minX >= 10 && maxY <= 8)) {
      quadrant = 'TR';
    } else {
      quadrant = 'BR'; // 표준 교재 우하귀
    }

    // 🌟 원장님 핵심 지침: 원 교재 문제 표준은 세로선 10, 가로선 9 (열린 선 다이어그램)
    return {
      cols: 10,
      rows: 9,
      isFull19: false,
      quadrant: quadrant
    };
  }

  /* ---------- SGF -> 보드 좌표 변환 (가로선 9 x 세로선 10) ---------- */
  function parseProblemSgf(p, spec) {
    var cols = spec.cols;
    var rows = spec.rows;

    state.board = Array.from({ length: rows }, function () { return new Array(cols).fill(0); });
    state.answerMoves = [];
    state.shiftX = 0;
    state.shiftY = 0;

    if (!spec.isFull19) {
      if (spec.quadrant === 'BR') {
        // 우하귀: 우변 1선(18) -> cols-1 (9), 하변 1선(18) -> rows-1 (8)
        state.shiftX = 19 - cols; // 19 - 10 = 9
        state.shiftY = 19 - rows; // 19 - 9 = 10
      } else if (spec.quadrant === 'BL') {
        // 좌하귀: 좌변 1선(0) -> 0, 하변 1선(18) -> rows-1 (8)
        state.shiftX = 0;
        state.shiftY = 19 - rows; // 10
      } else if (spec.quadrant === 'TL') {
        // 좌상귀: 좌변 1선(0) -> 0, 상변 1선(0) -> 0
        state.shiftX = 0;
        state.shiftY = 0;
      } else if (spec.quadrant === 'TR') {
        // 우상귀: 우변 1선(18) -> cols-1 (9), 상변 1선(0) -> 0
        state.shiftX = 19 - cols; // 9
        state.shiftY = 0;
      }
    }

    // 초기 돌 배치
    var sgfData = p.data || '';
    var regex = /;([BW])\[([a-s]{2})\]/gi;
    var m;
    while ((m = regex.exec(sgfData)) !== null) {
      var color = m[1].toUpperCase() === 'B' ? 1 : 2;
      var x = m[2].charCodeAt(0) - 97 - state.shiftX;
      var y = m[2].charCodeAt(1) - 97 - state.shiftY;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
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
        if (ax >= 0 && ax < cols && ay >= 0 && ay < rows) {
          state.answerMoves.push({ x: ax, y: ay, color: acolor, step: step++ });
        }
      }
    }

    // 원본 상태 복사본
    state.initialBoard = state.board.map(function (row) { return row.slice(); });
  }

  /* ---------- 바둑판 렌더링 (가로선 9 x 세로선 10, 열린 선 다이어그램) ---------- */
  var metrics = { displayW: 0, displayH: 0, cellSize: 0, startX: 0, startY: 0, dpr: 1 };

  function layoutBoard() {
    var rect = boardContainer.getBoundingClientRect();
    var availW = rect.width - 24;
    var availH = rect.height - 24;

    var cols = state.boardCols; // 세로선 10
    var rows = state.boardRows; // 가로선 9

    // 셀 크기는 바둑판 영역 내에서 균등 비율로 산정
    var cell = Math.min((availW - 32) / (cols + 1.2), (availH - 32) / (rows + 1.2));
    cell = Math.max(26, Math.min(cell, 72));

    var dispW = Math.round((cols + 1.2) * cell);
    var dispH = Math.round((rows + 1.2) * cell);

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 1.0;
    metrics.startY = cell * 1.0;
    metrics.displayW = dispW;
    metrics.displayH = dispH;
    metrics.dpr = dpr;

    canvas.width = Math.round(dispW * dpr);
    canvas.height = Math.round(dispH * dpr);
    canvas.style.width = dispW + 'px';
    canvas.style.height = dispH + 'px';
  }

  function drawBoard() {
    var cell = metrics.cellSize;
    var cols = state.boardCols; // 세로선 10개
    var rows = state.boardRows; // 가로선 9개
    var startX = metrics.startX;
    var startY = metrics.startY;
    var dispW = metrics.displayW;
    var dispH = metrics.displayH;
    var dpr = metrics.dpr;
    var spec = state.boardSpec || { isFull19: false, quadrant: 'BR' };

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, dispW, dispH);

    // 1. 따뜻한 교재용 목재 다이어그램 바탕
    var g = ctx.createLinearGradient(0, 0, dispW, dispH);
    g.addColorStop(0, '#f9ecd4');
    g.addColorStop(0.5, '#f4dcaf');
    g.addColorStop(1, '#ecc990');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, dispW, dispH);

    // 부드러운 외곽 테두리
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, dispW - 2, dispH - 2);

    var endX = startX + cell * (cols - 1);
    var endY = startY + cell * (rows - 1);
    var overhang = cell * 0.45; // 교재처럼 교차점 너머로 삐죽 나온 열린 선 길이

    ctx.lineWidth = Math.max(1.2, cell / 24);
    ctx.strokeStyle = 'rgba(55, 30, 10, 0.88)';

    if (!spec.isFull19) {
      // 🌟 [원장님 핵심 지침] 선의 끝은 닫힌 게 아니고 '열린 선(Overhang)'으로 처리!
      // 가로선 9개, 세로선 10개
      if (spec.quadrant === 'BR') {
        // 우하귀: 상변(위)과 좌변(왼쪽)은 중앙으로 뻗어나와 툭 끊긴 열린 선!
        // 우변(오른쪽)과 하변(아래쪽)은 바둑판 1선 모서리

        // 1) 세로선 10개 그리기 (위쪽으로 overhang만큼 삐죽 뻗음)
        for (var c = 0; c < cols; c++) {
          var cx = startX + cell * c;
          ctx.beginPath();
          ctx.moveTo(cx, startY - overhang);
          ctx.lineTo(cx, endY);
          ctx.stroke();
        }

        // 2) 가로선 9개 그리기 (왼쪽으로 overhang만큼 삐죽 뻗음)
        for (var r = 0; r < rows; r++) {
          var ry = startY + cell * r;
          ctx.beginPath();
          ctx.moveTo(startX - overhang, ry);
          ctx.lineTo(endX, ry);
          ctx.stroke();
        }

        // 3) 1선 바둑판 모서리 (오른쪽 1선, 아래쪽 1선만 굵고 단단하게 닫음)
        ctx.strokeStyle = '#2b1405';
        ctx.lineWidth = Math.max(2.5, cell / 13);
        ctx.beginPath();
        ctx.moveTo(endX, startY - overhang);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX - overhang, endY);
        ctx.stroke();

        // 4) 화점: 우하귀 4선 자리 (우변에서 4번째, 하변에서 4번째 줄)
        // cols=10 -> 우변에서 4번째 = cols - 4 = 6 (인덱스 6)
        // rows=9  -> 하변에서 4번째 = rows - 4 = 5 (인덱스 5)
        var spX = startX + cell * (cols - 4);
        var spY = startY + cell * (rows - 4);
        ctx.fillStyle = '#2b1405';
        ctx.beginPath();
        ctx.arc(spX, spY, Math.max(2.8, cell * 0.09), 0, Math.PI * 2);
        ctx.fill();

      } else if (spec.quadrant === 'BL') {
        // 좌하귀: 상변과 우변이 열린 선
        for (var c = 0; c < cols; c++) {
          var cx = startX + cell * c;
          ctx.beginPath();
          ctx.moveTo(cx, startY - overhang);
          ctx.lineTo(cx, endY);
          ctx.stroke();
        }
        for (var r = 0; r < rows; r++) {
          var ry = startY + cell * r;
          ctx.beginPath();
          ctx.moveTo(startX, ry);
          ctx.lineTo(endX + overhang, ry);
          ctx.stroke();
        }
        ctx.strokeStyle = '#2b1405';
        ctx.lineWidth = Math.max(2.5, cell / 13);
        ctx.beginPath();
        ctx.moveTo(startX, startY - overhang);
        ctx.lineTo(startX, endY);
        ctx.lineTo(endX + overhang, endY);
        ctx.stroke();

        var spX = startX + cell * 3;
        var spY = startY + cell * (rows - 4);
        ctx.fillStyle = '#2b1405';
        ctx.beginPath();
        ctx.arc(spX, spY, Math.max(2.8, cell * 0.09), 0, Math.PI * 2);
        ctx.fill();

      } else if (spec.quadrant === 'TL') {
        // 좌상귀: 하변과 우변이 열린 선
        for (var c = 0; c < cols; c++) {
          var cx = startX + cell * c;
          ctx.beginPath();
          ctx.moveTo(cx, startY);
          ctx.lineTo(cx, endY + overhang);
          ctx.stroke();
        }
        for (var r = 0; r < rows; r++) {
          var ry = startY + cell * r;
          ctx.beginPath();
          ctx.moveTo(startX, ry);
          ctx.lineTo(endX + overhang, ry);
          ctx.stroke();
        }
        ctx.strokeStyle = '#2b1405';
        ctx.lineWidth = Math.max(2.5, cell / 13);
        ctx.beginPath();
        ctx.moveTo(endX + overhang, startY);
        ctx.lineTo(startX, startY);
        ctx.lineTo(startX, endY + overhang);
        ctx.stroke();

        var spX = startX + cell * 3;
        var spY = startY + cell * 3;
        ctx.fillStyle = '#2b1405';
        ctx.beginPath();
        ctx.arc(spX, spY, Math.max(2.8, cell * 0.09), 0, Math.PI * 2);
        ctx.fill();

      } else if (spec.quadrant === 'TR') {
        // 우상귀: 하변과 좌변이 열린 선
        for (var c = 0; c < cols; c++) {
          var cx = startX + cell * c;
          ctx.beginPath();
          ctx.moveTo(cx, startY);
          ctx.lineTo(cx, endY + overhang);
          ctx.stroke();
        }
        for (var r = 0; r < rows; r++) {
          var ry = startY + cell * r;
          ctx.beginPath();
          ctx.moveTo(startX - overhang, ry);
          ctx.lineTo(endX, ry);
          ctx.stroke();
        }
        ctx.strokeStyle = '#2b1405';
        ctx.lineWidth = Math.max(2.5, cell / 13);
        ctx.beginPath();
        ctx.moveTo(startX - overhang, startY);
        ctx.lineTo(endX, startY);
        ctx.lineTo(endX, endY + overhang);
        ctx.stroke();

        var spX = startX + cell * (cols - 4);
        var spY = startY + cell * 3;
        ctx.fillStyle = '#2b1405';
        ctx.beginPath();
        ctx.arc(spX, spY, Math.max(2.8, cell * 0.09), 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // 19줄 전판 문제
      for (var i = 0; i < cols; i++) {
        var coordX = startX + cell * i;
        ctx.beginPath();
        ctx.moveTo(coordX, startY);
        ctx.lineTo(coordX, endY);
        ctx.stroke();

        var coordY = startY + cell * i;
        ctx.beginPath();
        ctx.moveTo(startX, coordY);
        ctx.lineTo(endX, coordY);
        ctx.stroke();
      }
      ctx.strokeStyle = '#3d2510';
      ctx.lineWidth = Math.max(2, cell / 15);
      ctx.strokeRect(startX, startY, cell * (cols - 1), cell * (rows - 1));

      // 19줄 9개 화점
      [3, 9, 15].forEach(function(hx){
        [3, 9, 15].forEach(function(hy){
          ctx.fillStyle = '#4a2c11';
          ctx.beginPath();
          ctx.arc(startX + cell * hx, startY + cell * hy, Math.max(2.5, cell * 0.09), 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }

    // 5. 돌 그리기 (돌 크기 cell * 0.44)
    var stoneRadius = cell * 0.44;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = state.board[y][x];
        if (v) {
          drawStone(startX + cell * x, startY + cell * y, stoneRadius, v);
        }
      }
    }

    // 6. 정답 보기 활성화 시 번호 마커 표시
    if (state.showAnswer && state.answerMoves.length > 0) {
      state.answerMoves.forEach(function (m) {
        var cx = startX + cell * m.x;
        var cy = startY + cell * m.y;
        drawStone(cx, cy, stoneRadius, m.color, 0.95);

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

    var startX = metrics.startX || cell;
    var startY = metrics.startY || cell;
    var gx = Math.round((px - startX) / cell);
    var gy = Math.round((py - startY) / cell);

    if (gx < 0 || gx >= state.boardCols || gy < 0 || gy >= state.boardRows) return;

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
