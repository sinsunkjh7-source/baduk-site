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
    solved: false,
    solvedMap: {},        // { 'bookCode_probIdx': true }
    autoNextTimer: null,

    // 🌟 원장님 핵심 수업 도구 상태 🌟
    trialMode: false,
    placementMode: 'alternate', // 'alternate' | 'blackOnly' | 'whiteOnly'
    nextTurn: 1,
    trialMoves: [],             // [{x, y, color, step}]
    historyStack: [],           // [boardCopy]
    historyIndex: -1,
    showAtari: true,            // 🚨 단수 링 (기본 ON)
    showSweat: true,            // 💦 3D 땀방울 (기본 ON)
    showCoords: false,          // 🔤 좌표 표시
    showStepNumbers: false      // 🔢 수순 번호
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
    problemProgress.textContent = total > 0 ? ((state.currentProblemIndex + 1) + ' / ' + total) : '0 / 0';
    var bookCode = state.currentBook ? (state.currentBook.bookCode || '') : '';

    state.currentProblems.forEach(function (p, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      var key = bookCode + '_' + idx;
      var isSolved = Boolean(state.solvedMap[key]);
      var isActive = (idx === state.currentProblemIndex);

      var cls = 'prob-btn';
      if (isActive) cls += ' active';
      if (isSolved) cls += ' solved';
      btn.className = cls;

      btn.textContent = (idx + 1) + (isSolved ? ' ✓' : '번');
      btn.title = (idx + 1) + '번 문제' + (isSolved ? ' (완료)' : '');
      btn.addEventListener('click', function () {
        loadProblem(idx);
      });
      problemGrid.appendChild(btn);
    });
  }


  /* ---------- 🌟 활로 & 단수 판별 엔진 🌟 ---------- */
  function getStoneGroups(board, cols, rows) {
    var visited = Array.from({ length: rows }, function () { return new Array(cols).fill(false); });
    var groups = [];

    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var color = board[y][x];
        if (color !== 0 && !visited[y][x]) {
          var stones = [];
          var libertiesSet = {};
          var queue = [{ x: x, y: y }];
          visited[y][x] = true;

          while (queue.length > 0) {
            var curr = queue.shift();
            stones.push(curr);

            var neighbors = [
              { x: curr.x + 1, y: curr.y },
              { x: curr.x - 1, y: curr.y },
              { x: curr.x, y: curr.y + 1 },
              { x: curr.x, y: curr.y - 1 }
            ];

            neighbors.forEach(function (nb) {
              if (nb.x >= 0 && nb.x < cols && nb.y >= 0 && nb.y < rows) {
                if (board[nb.y][nb.x] === 0) {
                  libertiesSet[nb.x + ',' + nb.y] = true;
                } else if (board[nb.y][nb.x] === color && !visited[nb.y][nb.x]) {
                  visited[nb.y][nb.x] = true;
                  queue.push(nb);
                }
              }
            });
          }

          groups.push({
            color: color,
            stones: stones,
            liberties: Object.keys(libertiesSet).length
          });
        }
      }
    }
    return groups;
  }

  /* ---------- 🌟 3D 입체 땀방울 렌더링 🌟 ---------- */
  function draw3DSweatDrop(cx, cy, r) {
    var dropX = cx + r * 0.48;
    var dropY = cy - r * 0.42;
    var s = r * 0.28;
    var angle = 0.22;

    ctx.save();
    ctx.translate(dropX, dropY);
    ctx.rotate(angle);

    // 1. 드롭 섀도우
    ctx.shadowColor = 'rgba(0, 0, 0, 0.38)';
    ctx.shadowBlur = Math.max(3, s * 0.3);
    ctx.shadowOffsetX = Math.max(1, s * 0.15);
    ctx.shadowOffsetY = Math.max(2, s * 0.25);

    // 물방울 본체 패스 (상단 뾰족, 하단 통통한 입체 티어드롭)
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(-s * 0.8, -s * 0.15, -s * 0.75, s * 0.75, 0, s * 0.75);
    ctx.bezierCurveTo(s * 0.75, s * 0.75, s * 0.8, -s * 0.15, 0, -s);
    ctx.closePath();

    // 2. 3D 투명 하늘빛 그라데이션
    var bodyGrad = ctx.createRadialGradient(-s * 0.25, -s * 0.2, s * 0.1, 0, 0, s);
    bodyGrad.addColorStop(0, '#e0f2fe');
    bodyGrad.addColorStop(0.35, '#7dd3fc');
    bodyGrad.addColorStop(0.75, '#0284c7');
    bodyGrad.addColorStop(1, '#0369a1');

    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 3. 물방울 림 라이트 외곽선
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = Math.max(0.8, s * 0.08);
    ctx.stroke();

    // 4. 물방울 좌상단 반사 하이라이트 광택
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.22, -s * 0.2, s * 0.25, s * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /* ---------- 단일 문제 로드 ---------- */
  function loadProblem(idx) {
    if (idx < 0 || idx >= state.currentProblems.length) return;
    state.currentProblemIndex = idx;
    state.showAnswer = false;
    state.solved = false;
    hintBox.hidden = true;

    if (state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }

    // 문제 그리드 버튼 상태(현재/푼 문제/안 푼 문제) 갱신
    renderProblemGrid();

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

    // 🌟 놓아보기 히스토리 초기화
    state.trialMoves = [];
    state.historyStack = [state.board.map(function(row){ return row.slice(); })];
    state.historyIndex = 0;
    state.nextTurn = (p.start && p.start.toUpperCase() === 'W') ? 2 : 1;
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
    // 🌟 [원장님 지침 6번] 바둑판 크기를 화면에 꽉 차도록 대폭 확대
    var availW = rect.width - 16;
    var availH = rect.height - 16;

    var cols = state.boardCols; // 세로선 10
    var rows = state.boardRows; // 가로선 9

    // 셀 크기 최적화: 여백을 최소화하여 화면 높이와 너비를 가득 채움 (최대 115px)
    var cell = Math.min((availW - 12) / (cols + 0.7), (availH - 12) / (rows + 0.7));
    cell = Math.max(32, Math.min(cell, 115));

    var dispW = Math.round((cols + 0.7) * cell);
    var dispH = Math.round((rows + 0.7) * cell);

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 0.75;
    metrics.startY = cell * 0.75;
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

    // 🌟 [원장님 지침 1번] 그라데이션 제거, 차분하고 밝은 단색 목재 바탕 (#f6ebd6)
    ctx.fillStyle = '#f6ebd6';
    ctx.fillRect(0, 0, dispW, dispH);

    // 🌟 [원장님 지침 2번] 바둑판에 아주 자연스러운 세로 결 렌더링
    ctx.save();
    // 1) 미세 촘촘한 세로 나뭇결
    for (var gx = 2; gx < dispW; gx += 3) {
      var grainAlpha = 0.015 + 0.02 * Math.sin(gx * 0.19 + (gx % 5));
      ctx.strokeStyle = 'rgba(120, 75, 25, ' + grainAlpha + ')';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, dispH);
      ctx.stroke();
    }
    // 2) 은은한 천연 비자목 나이테 결 (자연스러운 띠)
    var grainRibbons = [0.11, 0.24, 0.39, 0.54, 0.68, 0.83, 0.94];
    grainRibbons.forEach(function (r) {
      var rx = Math.round(dispW * r);
      ctx.strokeStyle = 'rgba(130, 80, 25, 0.04)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, dispH);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(rx + 1.5, 0);
      ctx.lineTo(rx + 1.5, dispH);
      ctx.stroke();
    });
    ctx.restore();

    var endX = startX + cell * (cols - 1);
    var endY = startY + cell * (rows - 1);
    var overhang = cell * 0.42; // 교재처럼 교차점 너머로 삐죽 나온 열린 선

    // 🌟 [원장님 지침 1번] 테두리 외의 격자선은 얇고 또렷하게 (1px)
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(45, 25, 10, 0.85)';

    if (!spec.isFull19) {
      // 🌟 [원장님 핵심 지침] 가로선 9개 x 세로선 10개, 선의 끝은 '열린 선(Overhang)'
      if (spec.quadrant === 'BR') {
        // 우하귀: 상변(위)과 좌변(왼쪽)은 열린 선, 우변(오른쪽)과 하변(아래쪽)은 1선 모서리

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

        // 3) 바둑판 1선 모서리만 굵게 (우변, 하변)
        ctx.strokeStyle = '#2b1405';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(endX, startY - overhang);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX - overhang, endY);
        ctx.stroke();

        // 🌟 [원장님 지침 3번] 화점 2개 표시:
        // ① 우하귀 4선 화점: (cols - 4, rows - 4) = (6, 5)
        // ② 세로선 10번줄(10선) 변 쪽 화점: (0, 5) -> 하변 4선 라인과 10선의 교차점!
        var starPoints = [
          { x: startX + cell * (cols - 4), y: startY + cell * (rows - 4) }, // 우하귀 4-4
          { x: startX + cell * 0,          y: startY + cell * (rows - 4) }  // 🌟 세로선 10번줄 변 쪽 화점!
        ];
        ctx.fillStyle = '#2b1405';
        starPoints.forEach(function (sp) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2.6, cell * 0.08), 0, Math.PI * 2);
          ctx.fill();
        });

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
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY - overhang);
        ctx.lineTo(startX, endY);
        ctx.lineTo(endX + overhang, endY);
        ctx.stroke();

        var starPointsBL = [
          { x: startX + cell * 3,          y: startY + cell * (rows - 4) },
          { x: startX + cell * (cols - 1), y: startY + cell * (rows - 4) } // 10선 변 쪽
        ];
        ctx.fillStyle = '#2b1405';
        starPointsBL.forEach(function (sp) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2.6, cell * 0.08), 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (spec.quadrant === 'TL') {
        // 좌상귀
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
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(endX + overhang, startY);
        ctx.lineTo(startX, startY);
        ctx.lineTo(startX, endY + overhang);
        ctx.stroke();

        var starPointsTL = [
          { x: startX + cell * 3,          y: startY + cell * 3 },
          { x: startX + cell * (cols - 1), y: startY + cell * 3 }
        ];
        ctx.fillStyle = '#2b1405';
        starPointsTL.forEach(function (sp) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2.6, cell * 0.08), 0, Math.PI * 2);
          ctx.fill();
        });

      } else if (spec.quadrant === 'TR') {
        // 우상귀
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
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(startX - overhang, startY);
        ctx.lineTo(endX, startY);
        ctx.lineTo(endX, endY + overhang);
        ctx.stroke();

        var starPointsTR = [
          { x: startX + cell * (cols - 4), y: startY + cell * 3 },
          { x: startX + cell * 0,          y: startY + cell * 3 }
        ];
        ctx.fillStyle = '#2b1405';
        starPointsTR.forEach(function (sp) {
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, Math.max(2.6, cell * 0.08), 0, Math.PI * 2);
          ctx.fill();
        });
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
      ctx.lineWidth = 2.8;
      ctx.strokeRect(startX, startY, cell * (cols - 1), cell * (rows - 1));

      // 19줄 9개 화점
      [3, 9, 15].forEach(function(hx){
        [3, 9, 15].forEach(function(hy){
          ctx.fillStyle = '#4a2c11';
          ctx.beginPath();
          ctx.arc(startX + cell * hx, startY + cell * hy, Math.max(2.6, cell * 0.08), 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }

    // 🌟 [원장님 지침] 바둑판 좌표 표시 (좌·상)
    if (state.showCoords) {
      ctx.fillStyle = '#6d4218';
      ctx.font = 'bold ' + Math.max(10, Math.round(cell * 0.30)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 상단 가로 좌표 (A, B, C, D...)
      var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      for (var cc = 0; cc < cols; cc++) {
        var lblX = startX + cell * cc;
        ctx.fillText(colLabels[cc] || (cc + 1), lblX, startY - overhang - 8);
      }

      // 좌측 세로 좌표 (1, 2, 3...)
      for (var rr = 0; rr < rows; rr++) {
        var lblY = startY + cell * rr;
        ctx.fillText(rows - rr, startX - overhang - 10, lblY);
      }
    }

    // 🌟 [원장님 지침] 활로 및 단수(Atari) 돌 분석
    var groups = getStoneGroups(state.board, cols, rows);
    var atariStonesMap = {};
    groups.forEach(function (g) {
      if (g.liberties === 1) {
        g.stones.forEach(function (s) {
          atariStonesMap[s.x + ',' + s.y] = true;
        });
      }
    });

    // 5. 돌 그리기 (돌 크기 cell * 0.44)
    var stoneRadius = cell * 0.44;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = state.board[y][x];
        if (v) {
          var stoneX = startX + cell * x;
          var stoneY = startY + cell * y;
          var isAtari = Boolean(atariStonesMap[x + ',' + y]);

          // 🌟 🚨 단수 링 렌더링 (빨간색 위험 경고 링)
          if (isAtari && state.showAtari) {
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = Math.max(2.5, cell * 0.08);
            ctx.shadowColor = 'rgba(239, 68, 68, 0.6)';
            ctx.shadowBlur = Math.max(4, cell * 0.15);
            ctx.beginPath();
            ctx.arc(stoneX, stoneY, stoneRadius + Math.max(2, cell * 0.06), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 돌 본체 렌더링
          drawStone(stoneX, stoneY, stoneRadius, v);

          // 🌟 💦 3D 땀방울 연출 (단수 시 돌 우상단에 맺히는 물방울)
          if (isAtari && state.showSweat && stoneRadius >= 10) {
            draw3DSweatDrop(stoneX, stoneY, stoneRadius);
          }
        }
      }
    }

    // 🌟 [원장님 지침] 수순 번호 표시 (놓아보기로 둔 돌 위에 1, 2, 3...)
    if (state.showStepNumbers && state.trialMoves.length > 0) {
      state.trialMoves.forEach(function (tm) {
        if (state.board[tm.y][tm.x] === tm.color) {
          var tX = startX + cell * tm.x;
          var tY = startY + cell * tm.y;
          ctx.fillStyle = (tm.color === 1) ? '#FFFFFF' : '#000000';
          ctx.font = 'bold ' + Math.round(cell * 0.46) + 'px "Fredoka", "Malgun Gothic", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tm.step, tX, tY);
        }
      });
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

    // 🌟 [원장님 지침] 놓아보기 모드: 자유 착수, 흑/백 연속 착수, 이미 있는 돌 클릭 시 즉시 제거!
    if (state.trialMode) {
      if (state.board[gy][gx] !== 0) {
        // 🌟 돌 두 번 클릭(이미 있는 돌 클릭) 시 제거!
        state.board[gy][gx] = 0;
        sfx('playStone');
        toast('돌을 제거했습니다.');
        pushTrialHistory();
        drawBoard();
        return;
      }

      var playColor = state.nextTurn;
      if (state.placementMode === 'blackOnly') playColor = 1;
      else if (state.placementMode === 'whiteOnly') playColor = 2;

      state.board[gy][gx] = playColor;

      // 상대방 활로 0인 사석 따내기 처리
      var oppColor = playColor === 1 ? 2 : 1;
      var testGroups = getStoneGroups(state.board, state.boardCols, state.boardRows);
      var capturedAny = false;
      testGroups.forEach(function (g) {
        if (g.color === oppColor && g.liberties === 0) {
          g.stones.forEach(function (s) {
            state.board[s.y][s.x] = 0;
          });
          capturedAny = true;
        }
      });

      if (capturedAny) sfx('playSuccess');
      else sfx('playStone');

      // 수순 번호 기록
      state.trialMoves.push({
        x: gx,
        y: gy,
        color: playColor,
        step: state.trialMoves.length + 1
      });

      if (state.placementMode === 'alternate') {
        state.nextTurn = playColor === 1 ? 2 : 1;
      }
      pushTrialHistory();
      drawBoard();
      return;
    }

    // 자유 시연 모드
    if (state.freeMode) {
      if (state.board[gy][gx] !== 0) {
        state.board[gy][gx] = 0; // 돌 제거
      } else {
        state.board[gy][gx] = state.freeColor;
        sfx('playStone');
        state.freeColor = state.freeColor === 1 ? 2 : 1;
      }
      drawBoard();
      return;
    }

    // 문제 풀이 모드: 이미 돌이 놓여진 자리는 무시
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
      var curKey = (state.currentBook ? (state.currentBook.bookCode || '') : '') + '_' + state.currentProblemIndex;
      state.solvedMap[curKey] = true;
      renderProblemGrid();
      sfx('playSuccess');
      toast('정답입니다! 👏');

      // 🌟 [원장님 지침 4번] 문제 정답 시 1.1초 후 자동으로 다음 문제로 전환
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = setTimeout(function () {
        if (state.currentProblemIndex < state.currentProblems.length - 1) {
          loadProblem(state.currentProblemIndex + 1);
        } else {
          toast('축하합니다! 이 단원의 모든 문제를 완료했습니다! 🎉');
        }
      }, 1100);
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
  
  /* ---------- 🌟 놓아보기 히스토리 스택 🌟 ---------- */
  function pushTrialHistory() {
    var copy = state.board.map(function (row) { return row.slice(); });
    state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    state.historyStack.push(copy);
    state.historyIndex = state.historyStack.length - 1;
  }

  function applyHistoryIndex(idx) {
    if (idx < 0 || idx >= state.historyStack.length) return;
    state.historyIndex = idx;
    state.board = state.historyStack[idx].map(function (row) { return row.slice(); });
    drawBoard();
  }

  /* ---------- 🌟 강사용 수업 특수 툴바 이벤트 바인딩 🌟 ---------- */
  function initTeachingToolbar() {
    // 1. 놓아보기 토글
    var btnTrial = document.getElementById('btnToggleTrial');
    if (btnTrial) {
      btnTrial.addEventListener('click', function () {
        state.trialMode = !state.trialMode;
        btnTrial.classList.toggle('active', state.trialMode);
        toast(state.trialMode ? '✍️ 놓아보기 모드 ON' : '문제 풀이 모드로 복귀');
        drawBoard();
      });
    }

    // 2. 착수 모드 (교차 / 흑만 / 백만)
    document.querySelectorAll('.placement-group .tool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.placement-group .tool-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.placementMode = btn.dataset.placeMode || 'alternate';
        if (state.placementMode === 'blackOnly') state.nextTurn = 1;
        else if (state.placementMode === 'whiteOnly') state.nextTurn = 2;
        toast(state.placementMode === 'blackOnly' ? '⚫ 흑돌만 놓기 모드' : (state.placementMode === 'whiteOnly' ? '⚪ 백돌만 놓기 모드' : '⚫⚪ 교차 착수 모드'));
      });
    });

    // 3. 수순 네비게이션
    var btnNavFirst = document.getElementById('btnNavFirst');
    if (btnNavFirst) {
      btnNavFirst.addEventListener('click', function () {
        applyHistoryIndex(0);
        toast('처음 상태로 되돌렸습니다.');
      });
    }

    var btnNavPrev = document.getElementById('btnNavPrev');
    if (btnNavPrev) {
      btnNavPrev.addEventListener('click', function () {
        if (state.historyIndex > 0) {
          applyHistoryIndex(state.historyIndex - 1);
          sfx('playStone');
        } else {
          toast('더 이상 물릴 수가 없습니다.');
        }
      });
    }

    var btnNavNext = document.getElementById('btnNavNext');
    if (btnNavNext) {
      btnNavNext.addEventListener('click', function () {
        if (state.historyIndex < state.historyStack.length - 1) {
          applyHistoryIndex(state.historyIndex + 1);
          sfx('playStone');
        }
      });
    }

    var btnNavLast = document.getElementById('btnNavLast');
    if (btnNavLast) {
      btnNavLast.addEventListener('click', function () {
        applyHistoryIndex(state.historyStack.length - 1);
      });
    }

    var btnClearBoard = document.getElementById('btnClearBoard');
    if (btnClearBoard) {
      btnClearBoard.addEventListener('click', function () {
        state.board = state.initialBoard.map(function (row) { return row.slice(); });
        state.trialMoves = [];
        state.historyStack = [state.board.map(function (row) { return row.slice(); })];
        state.historyIndex = 0;
        toast('판을 초기 상태로 비웠습니다.');
        drawBoard();
      });
    }

    // 4. 시각 보조 도구 (단수, 땀방울, 좌표, 수순)
    var btnToggleAtari = document.getElementById('btnToggleAtari');
    if (btnToggleAtari) {
      btnToggleAtari.classList.toggle('active', state.showAtari);
      btnToggleAtari.addEventListener('click', function () {
        state.showAtari = !state.showAtari;
        btnToggleAtari.classList.toggle('active', state.showAtari);
        drawBoard();
      });
    }

    var btnToggleSweat = document.getElementById('btnToggleSweat');
    if (btnToggleSweat) {
      btnToggleSweat.classList.toggle('active', state.showSweat);
      btnToggleSweat.addEventListener('click', function () {
        state.showSweat = !state.showSweat;
        btnToggleSweat.classList.toggle('active', state.showSweat);
        drawBoard();
      });
    }

    var btnToggleCoords = document.getElementById('btnToggleCoords');
    if (btnToggleCoords) {
      btnToggleCoords.classList.toggle('active', state.showCoords);
      btnToggleCoords.addEventListener('click', function () {
        state.showCoords = !state.showCoords;
        btnToggleCoords.classList.toggle('active', state.showCoords);
        drawBoard();
      });
    }

    var btnToggleNumbers = document.getElementById('btnToggleNumbers');
    if (btnToggleNumbers) {
      btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
      btnToggleNumbers.addEventListener('click', function () {
        state.showStepNumbers = !state.showStepNumbers;
        btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
        drawBoard();
      });
    }
  }

  initTeachingToolbar();
  checkAuth();
})();
