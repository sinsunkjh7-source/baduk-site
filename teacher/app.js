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
    showAtari: localStorage.getItem('teacher_show_atari') !== null ? (localStorage.getItem('teacher_show_atari') === 'true') : true,
    showSweat: localStorage.getItem('teacher_show_sweat') !== null ? (localStorage.getItem('teacher_show_sweat') === 'true') : true,
    coordMode: localStorage.getItem('teacher_coord_mode') || 'right-bottom',
    showStepNumbers: localStorage.getItem('teacher_show_step_numbers') === 'true',

    // 🌟 원장님 4대 환경설정 (바탕화면, 바둑판, 바둑알, 음량) 🌟
    theme: localStorage.getItem('teacher_theme') || 'theme-green',
    boardSkin: (function() {
      var saved = localStorage.getItem('baduk_board_skin') || localStorage.getItem('teacher_board_skin');
      if (saved === 'green') return 'darkwood';
      return saved || 'wood';
    })(),
    stoneStyle: localStorage.getItem('teacher_stone_style') || 'classic',
    soundType: localStorage.getItem('baduk_audio_type') || 'classic',
    volume: parseFloat(localStorage.getItem('baduk_audio_volume') || '1.0'),

    // 🌟 다중 수순 및 순서 무관 활로 정답 판정 엔진 🌟
    answerBranches: [],         // 모든 정답 수순 분기 [[move1, move2], ...]
    activeBranches: [],         // 현재 유효한 분기들
    playedMoves: [],            // 현재 문제 풀이에서 둔 착수 목록
    isOpponentResponding: false // 상대방(컴퓨터) 응수 대기 플래그
  };
  window.teacherState = state;

  /* DOM 요소 */
    /* 🎨 바둑알 고화질 3D 스프라이트 프리로딩 (고양이, 우주, 흑백 다이아몬드) */
  var stoneSprites = {};
  var spriteUrls = {
    cat_1: 'images/stone_cat_b.png',
    cat_2: 'images/stone_cat_w.png',
    galaxy_1: 'images/stone_galaxy_b.png',
    galaxy_2: 'images/stone_galaxy_w.png',
    crystal_1: 'images/stone_crystal_b.png',
    crystal_2: 'images/stone_crystal_w.png'
  };
  Object.keys(spriteUrls).forEach(function (key) {
    var img = new Image();
    img.src = spriteUrls[key];
    img.onload = function () {
      if (document.getElementById('teachingBoard')) {
        drawBoard();
      }
    };
    stoneSprites[key] = img;
  });

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
    if (!msg) return;
    // 🌟 [원장님 지침] 정답, 오답 외의 모든 안내 팝업 문구 원천 차단
    if (msg.indexOf('정답') === -1 && msg.indexOf('오답') === -1) {
      return;
    }
    var el = document.getElementById('teacherToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1600);
  }

  /* ---------- 🌟 바둑판 옆 차분한 피드백 카드 (정답 / 오답) 🌟 ---------- */
  var sideFeedbackTimer = null;
  function showSideFeedback(type) {
    var card = document.getElementById('sideFeedbackCard');
    var emblem = document.getElementById('feedbackEmblem');
    var text = document.getElementById('feedbackText');
    if (!card || !emblem || !text) return;

    clearTimeout(sideFeedbackTimer);
    card.classList.remove('correct', 'wrong', 'show');

    // 🌟 바둑판 오른쪽 여백의 '정중앙'에 위치 계산 🌟
    if (canvas && boardContainer) {
      var cRect = canvas.getBoundingClientRect();
      var bRect = boardContainer.getBoundingClientRect();
      var emptySpace = bRect.right - cRect.right;
      var cardWidth = 140;

      if (emptySpace >= cardWidth + 16) {
        var targetRight = Math.max(16, Math.floor((emptySpace - cardWidth) / 2));
        card.style.right = targetRight + 'px';
        card.style.left = 'auto';
        card.style.top = '50%';
        card.style.transform = 'translateY(-50%)';
      } else {
        card.style.right = '16px';
        card.style.left = 'auto';
        card.style.top = '50%';
        card.style.transform = 'translateY(-50%)';
      }
    }

    if (type === 'correct') {
      card.classList.add('correct');
      emblem.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      text.textContent = '정답입니다';
    } else {
      card.classList.add('wrong');
      emblem.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      text.textContent = '오답입니다';
    }

    card.hidden = false;
    void card.offsetWidth;
    card.classList.add('show');

    var duration = type === 'correct' ? 1400 : 1200;
    sideFeedbackTimer = setTimeout(function () {
      card.classList.remove('show');
      setTimeout(function () {
        if (!card.classList.contains('show')) card.hidden = true;
      }, 350);
    }, duration);
  }
  window.showSideFeedback = showSideFeedback;


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
    fetch('data/catalog.json?v=teacher-catalog-v16')
      .then(function (res) { return res.json(); })
      .then(function (cat) {
        state.catalog = cat;
        populateSeries();
      })
      .catch(function (err) {
        console.error('Failed to load catalog.json:', err);
        // toast 제거됨
      });
  }

  // 🌟 마지막 선택한 교육 시리즈/교재/단원/문제 영구 보존 및 복원 🌟
  function populateSeries() {
    seriesSelect.innerHTML = '';
    state.catalog.forEach(function (sec, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = (idx + 1) + '. ' + sec.title + ' (' + (sec.books ? sec.books.length : 0) + '권)';
      seriesSelect.appendChild(opt);
    });

    var savedSeries = localStorage.getItem('teacher_last_series');
    var seriesIdx = 0;
    if (savedSeries !== null) {
      var parsed = parseInt(savedSeries, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < state.catalog.length) {
        seriesIdx = parsed;
      }
    }
    seriesSelect.value = seriesIdx;
    onSeriesChange(true);
  }

  function onSeriesChange(isRestoring) {
    var secIdx = parseInt(seriesSelect.value, 10);
    state.currentSeriesIndex = secIdx;
    localStorage.setItem('teacher_last_series', secIdx.toString());

    var sec = state.catalog[secIdx];
    bookSelect.innerHTML = '';
    if (!sec || !sec.books) return;

    sec.books.forEach(function (b) {
      var opt = document.createElement('option');
      opt.value = b.code;
      opt.textContent = b.title + ' (' + (b.totalProblems || 0) + '제)';
      bookSelect.appendChild(opt);
    });

    var targetBookCode = sec.books[0] ? sec.books[0].code : null;
    if (isRestoring) {
      var savedBook = localStorage.getItem('teacher_last_book');
      if (savedBook && sec.books.some(function (b) { return b.code === savedBook; })) {
        targetBookCode = savedBook;
      }
    }

    if (targetBookCode) {
      bookSelect.value = targetBookCode;
      loadBook(targetBookCode, isRestoring);
    }
  }

  function loadBook(code, isRestoring) {
    localStorage.setItem('teacher_last_book', code);
    fetch('data/books/book_' + code + '.json')
      .then(function (res) { return res.json(); })
      .then(function (bookData) {
        state.currentBook = bookData;
        currentBookTitle.textContent = bookData.book || bookData.title || ('교재 ' + code);
        populateChapters(bookData, isRestoring);
      })
      .catch(function (err) {
        console.error('Failed to load book_' + code + '.json:', err);
        // toast 제거됨
      });
  }

  function populateChapters(bookData, isRestoring) {
    chapterSelect.innerHTML = '';
    var chapters = bookData.chapters || [];
    chapters.forEach(function (ch, idx) {
      var opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = ch.chapter || ch.title || ('제 ' + (idx + 1) + '단원');
      chapterSelect.appendChild(opt);
    });

    var targetChIdx = 0;
    if (isRestoring) {
      var savedCh = localStorage.getItem('teacher_last_chapter');
      if (savedCh !== null) {
        var parsedCh = parseInt(savedCh, 10);
        if (!isNaN(parsedCh) && parsedCh >= 0 && parsedCh < chapters.length) {
          targetChIdx = parsedCh;
        }
      }
    }
    chapterSelect.value = targetChIdx;
    onChapterChange(isRestoring);
  }

  function onChapterChange(isRestoring) {
    var chIdx = parseInt(chapterSelect.value, 10);
    state.currentChapterIndex = chIdx;
    localStorage.setItem('teacher_last_chapter', chIdx.toString());

    var chapters = state.currentBook ? state.currentBook.chapters : [];
    var ch = chapters[chIdx];
    if (!ch) return;

    currentChapterTitle.textContent = '— ' + (ch.chapter || ch.title || '');
    state.currentProblems = ch.problems || [];

    var targetProblemIdx = 0;
    if (isRestoring) {
      var savedProb = localStorage.getItem('teacher_last_problem');
      if (savedProb !== null) {
        var parsedProb = parseInt(savedProb, 10);
        if (!isNaN(parsedProb) && parsedProb >= 0 && parsedProb < state.currentProblems.length) {
          targetProblemIdx = parsedProb;
        }
      }
    }

    state.currentProblemIndex = targetProblemIdx;
    renderProblemGrid();
    loadProblem(targetProblemIdx);
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

    // 20번 이상 등 현재 활성 문제가 5줄 뷰포트 밖일 경우 자동 스크롤
    setTimeout(scrollActiveProblemIntoView, 50);
  }

  function scrollActiveProblemIntoView() {
    if (!problemGrid) return;
    var activeBtn = problemGrid.querySelector('.prob-btn.active');
    if (!activeBtn) return;
    var gridRect = problemGrid.getBoundingClientRect();
    var btnRect = activeBtn.getBoundingClientRect();

    if (btnRect.bottom > gridRect.bottom) {
      problemGrid.scrollBy({
        top: btnRect.bottom - gridRect.bottom + 6,
        behavior: 'smooth'
      });
    } else if (btnRect.top < gridRect.top) {
      problemGrid.scrollBy({
        top: btnRect.top - gridRect.top - 4,
        behavior: 'smooth'
      });
    }
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
  /* ---------- 🌟 문제 시작 색상 판별 (정답 수순 최우선 & WA/WH 메타데이터 연동) 🌟 ---------- */
  function getProblemStartingColor(p) {
    if (!p) return 1;
    // 1. 실제 정답 수순(answerBranches)의 1수 색상이 가장 확실한 정답 기준!
    if (state.answerBranches && state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
      return state.answerBranches[0][0].color;
    }
    // 2. answer1 직접 SGF 파싱
    var ans = p.answer1 || p.answer || '';
    if (typeof ans === 'string') {
      var match = /;([BW])\[/i.exec(ans);
      if (match) {
        return match[1].toUpperCase() === 'W' ? 2 : 1;
      }
    }
    // 3. 메타데이터 start 필드 (WA, WH, W 등 백선 접두사 판별)
    if (p.start && typeof p.start === 'string') {
      var st = p.start.trim().toUpperCase();
      if (st.startsWith('W')) return 2;
      if (st.startsWith('B')) return 1;
    }
    // 4. 문제 지문에 '백선' 또는 '백 차례'가 명시된 경우
    if (p.question && (p.question.indexOf('백선') !== -1 || p.question.indexOf('백 차례') !== -1 || p.question.indexOf('백차례') !== -1)) {
      return 2;
    }
    return 1; // 기본값 흑선
  }

  function loadProblem(idx) {
      // 바둑판 옆 피드백 카드 초기화
      var sCard = document.getElementById('sideFeedbackCard');
      if (sCard) { sCard.classList.remove('show'); sCard.hidden = true; }

    if (idx < 0 || idx >= state.currentProblems.length) return;
    state.currentProblemIndex = idx;
    localStorage.setItem('teacher_last_problem', idx.toString());
    state.showAnswer = false;
    state.solved = false;

    if (state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }

    // 문제 그리드 버튼 상태(현재/푼 문제/안 푼 문제) 갱신
    renderProblemGrid();

    var p = state.currentProblems[idx];
    qNumBadge.textContent = '문제 ' + (idx + 1);
    questionText.textContent = (p.question || '알맞은 곳에 돌을 놓아 보세요.').replace(/\r\n/g, '\n');

    // 힌트가 있는 문제는 [💡 힌트] 버튼 활성화, 없으면 버튼 및 박스 모두 숨김(빈 공간)
    var hasHint = !!(p.hint && p.hint.trim() && p.hint.trim() !== '힌트가 없는 문제입니다.');
    var btnHintEl = document.getElementById('btnHint');
    if (btnHintEl) {
      btnHintEl.hidden = !hasHint;
      btnHintEl.classList.remove('active');
    }
    hintBox.hidden = true;
    hintText.textContent = hasHint ? p.hint.trim() : '';

    var btnAnsEl = document.getElementById('btnAnswer');
    if (btnAnsEl) btnAnsEl.textContent = '👁️ 정답';
    navIndicator.textContent = (idx + 1) + ' / ' + state.currentProblems.length;
    problemProgress.textContent = (idx + 1) + ' / ' + state.currentProblems.length;

    // 🌟 원 교재 규격 자동 판별: 가로선 9, 세로선 10 (열린 선 다이어그램)
    state.boardSpec = detectBoardSpec(p);
    state.boardCols = state.boardSpec.cols;
    state.boardRows = state.boardSpec.rows;
    
    // SGF 파싱 및 보드 초기화 (정답 분기 파싱 포함)
    parseProblemSgf(p, state.boardSpec);

    // 🌟 문제 시작 색상 정확하게 판정 (정답 1수 기준 & WA/WH 메타데이터 동기화)
    var defColor = getProblemStartingColor(p);
    state.nextTurn = defColor;

    // 🌟 새 문제 로드 시 기본 착수 모드(교차)로 초기화하여 이전 문제의 흑만/백만 잔존 방지
    state.placementMode = 'alternate';

    // 🌟 상단 턴 배지 텍스트를 시작 색상과 100% 일치시킴!
    qTurnBadge.textContent = (defColor === 2) ? '⚪ 백선' : '⚫ 흑선';

    // 🌟 다른 번호/문제로 넘어갈 때 놓아보기 모드 자동 해제 및 문제 풀이 모드로 복귀
    state.trialMode = false;
    var btnTrialEl = document.getElementById('btnToggleTrial');
    if (btnTrialEl) btnTrialEl.classList.remove('active');

    // 놓아보기 히스토리 및 문제 풀이 수순 초기화
    state.trialMoves = [];
    state.playedMoves = [];
    state.isOpponentResponding = false;

    state.historyStack = [{
      board: state.board.map(function(row){ return row.slice(); }),
      nextTurn: state.nextTurn,
      moves: []
    }];
    state.historyIndex = 0;
    layoutBoard();
    if (typeof updatePlacementUI === 'function') updatePlacementUI();
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
    // 🌟 돌(B, W)뿐만 아니라 마크(T, C, L, M, S) 및 모든 정답 분기의 점들을 수집하여 규격 및 사분면 결정
    var reg = /(?:;|^)([BWTCMSL]|TR|CR|SQ|MA|LB)\[([a-s]{2})(?::[^\]]*)?\]/gi;
    var allSgf = (p.data || '') + (p.answer1 || '');
    for (var bi = 2; bi <= 5; bi++) {
      var rawAns = p['answer' + bi];
      if (rawAns && typeof rawAns === 'string') allSgf += rawAns;
    }
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

    // 🌟 원장님 핵심 지침: 기본 세로선 10, 가로선 9 (열린 선 다이어그램)를 유지하되,
    // 정답 착점이 바둑판 밖으로 잘려 풀지 못하는 문제가 없도록 안전 적응형 확장!
    var cols = 10;
    var rows = 9;
    if (quadrant === 'BR') {
      cols = Math.max(10, 19 - minX);
      rows = Math.max(9, 19 - minY);
    } else if (quadrant === 'BL') {
      cols = Math.max(10, maxX + 1);
      rows = Math.max(9, 19 - minY);
    } else if (quadrant === 'TL') {
      cols = Math.max(10, maxX + 1);
      rows = Math.max(9, maxY + 1);
    } else if (quadrant === 'TR') {
      cols = Math.max(10, 19 - minX);
      rows = Math.max(9, maxY + 1);
    }

    if (cols >= 14 || rows >= 14) {
      return { cols: 19, rows: 19, isFull19: true, quadrant: 'FULL19' };
    }

    return {
      cols: cols,
      rows: rows,
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

    state.marks = []; // 🌟 세모(△), 동그라미(○), 문자 라벨(가/1/A), 네모(□) 마크 저장

    // 초기 돌 배치 및 마크 파싱
    var sgfData = p.data || '';
    var regex = /(?:;|^)([BWTCMSL]|TR|CR|SQ|MA|LB)\[([a-s]{2})(?::([^\]]*))?\]/gi;
    var m;
    while ((m = regex.exec(sgfData)) !== null) {
      var tag = m[1].toUpperCase();
      var x = m[2].charCodeAt(0) - 97 - state.shiftX;
      var y = m[2].charCodeAt(1) - 97 - state.shiftY;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        if (tag === 'B') {
          state.board[y][x] = 1; // 흑돌
        } else if (tag === 'W') {
          state.board[y][x] = 2; // 백돌
        } else if (tag === 'T' || tag === 'TR') {
          state.marks.push({ x: x, y: y, type: 'triangle' });
        } else if (tag === 'C' || tag === 'CR') {
          state.marks.push({ x: x, y: y, type: 'circle' });
        } else if (tag === 'L' || tag === 'LB') {
          state.marks.push({ x: x, y: y, type: 'label', label: m[3] || '' });
        } else if (tag === 'M' || tag === 'MA' || tag === 'S' || tag === 'SQ') {
          state.marks.push({ x: x, y: y, type: 'square' });
        }
      }
    }

    // 🌟 [원장님 지침] 모든 정답 수순 분기 파싱 (answer1 ~ answer5) 🌟
    state.answerBranches = [];
    for (var bi = 1; bi <= 5; bi++) {
      var rawAns = p['answer' + bi] || (bi === 1 ? p.answer : '');
      if (rawAns && typeof rawAns === 'string' && rawAns.trim()) {
        var aRegex = /;([BW])\[([a-s]{2})\]/gi;
        var am;
        var bMoves = [];
        while ((am = aRegex.exec(rawAns)) !== null) {
          var acolor = am[1].toUpperCase() === 'B' ? 1 : 2;
          var ax = am[2].charCodeAt(0) - 97 - state.shiftX;
          var ay = am[2].charCodeAt(1) - 97 - state.shiftY;
          if (ax >= 0 && ax < cols && ay >= 0 && ay < rows) {
            bMoves.push({ x: ax, y: ay, color: acolor, step: bMoves.length + 1 });
          }
        }
        if (bMoves.length > 0) {
          state.answerBranches.push(bMoves);
        }
      }
    }
    state.activeBranches = state.answerBranches.slice();
    state.answerMoves = state.answerBranches.length > 0 ? state.answerBranches[0] : [];
    state.playedMoves = [];
    state.isOpponentResponding = false;

    // 원본 상태 복사본
    state.initialBoard = state.board.map(function (row) { return row.slice(); });
  }

  /* ---------- 바둑판 렌더링 (가로선 9 x 세로선 10, 열린 선 다이어그램) ---------- */
  var metrics = { displayW: 0, displayH: 0, cellSize: 0, startX: 0, startY: 0, dpr: 1 };
  window.teacherMetrics = metrics;

  function layoutBoard() {
    var rect = boardContainer.getBoundingClientRect();
    // 🌟 [원장님 지침 6번] 바둑판 크기를 화면에 꽉 차도록 대폭 확대
    var availW = rect.width - 8;
    var availH = rect.height - 8;

    var cols = state.boardCols; // 세로선 10
    var rows = state.boardRows; // 가로선 9

    // 셀 크기 최적화: 여백을 최소화하여 화면 높이와 너비를 가득 채움 (대폭 확장)
    var cell = Math.min((availW - 6) / (cols + 0.85), (availH - 6) / (rows + 0.85));
    cell = Math.max(32, Math.min(cell, 150));

    var dispW = Math.round((cols + 0.85) * cell);
    var dispH = Math.round((rows + 0.85) * cell);

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 0.80;
    metrics.startY = cell * 0.80;
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

    // 🌟 바둑판 스킨 렌더링 (wood: 밝은 비자목, darkwood: 진한 원목 [선명한 세로 나뭇결], sky: 시원한 스카이) 🌟
    var boardBorderColor = '#7c481e';
    if (state.boardSkin === 'darkwood') {
      // 🌟 [원장님 지침] 1번보다 진한 바둑판 & 어색한 굵은 띠 없이 자연스러운 고운 세로 정목(柾目) 결
      ctx.fillStyle = '#deb06c';
      ctx.fillRect(0, 0, dispW, dispH);

      ctx.save();
      // 자연스럽고 고운 균일 세로 정목 결 (굵은 띠/인위적인 경계선 완전히 제거)
      for (var gx = 1; gx < dispW; gx += 2) {
        var wave = Math.sin(gx * 0.18 + (gx % 5));
        var grainAlpha = 0.035 + 0.04 * (wave * 0.5 + 0.5);
        ctx.strokeStyle = 'rgba(95, 48, 14, ' + grainAlpha + ')';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, dispH);
        ctx.stroke();
      }
      ctx.restore();
      boardBorderColor = '#5c300c';
    } else if (state.boardSkin === 'sky') {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#2563eb';
    } else {
      // wood: 밝은 비자목 - 그라데이션 없는 깔끔한 단색 솔리드 비자목
      ctx.fillStyle = '#f2cc84';
      ctx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#7c481e';
    }
    canvas.style.borderColor = boardBorderColor;

    var endX = startX + cell * (cols - 1);
    var endY = startY + cell * (rows - 1);
    var overhang = cell * 0.42; // 교재처럼 교차점 너머로 삐죽 나온 열린 선

    // 🌟 [원장님 지침 1번] 테두리 외의 격자선은 얇고 또렷하게 (1px)
    ctx.lineWidth = 1.0;
    var gridLineColor = (state.boardSkin === 'darkwood') ? 'rgba(35, 18, 5, 0.92)' : ((state.boardSkin === 'sky') ? '#1e3a8a' : 'rgba(45, 25, 10, 0.85)');
    ctx.strokeStyle = gridLineColor;

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

    // 🌟 [원장님 지침] 바둑판 좌표 회전 표시 (우측하변 -> 좌상 -> 전체 -> 숨김)
    if (state.coordMode !== 'none') {
      var coordTextColor = (state.boardSkin === 'darkwood') ? '#4a2608' : ((state.boardSkin === 'sky') ? '#1e3a8a' : '#6d4218');
      ctx.fillStyle = coordTextColor;
      ctx.font = 'bold ' + Math.max(10, Math.round(cell * 0.28)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];

      // 1) 상단 가로 좌표 (좌·상 또는 전체 모드)
      if (state.coordMode === 'left-top' || state.coordMode === 'all-four') {
        var topCoordY = Math.max(10, Math.round((startY - overhang) * 0.52));
        for (var cc = 0; cc < cols; cc++) {
          ctx.fillText(colLabels[cc] || (cc + 1), startX + cell * cc, topCoordY);
        }
      }

      // 2) 하단 가로 좌표 (우·하 또는 전체 모드)
      if (state.coordMode === 'right-bottom' || state.coordMode === 'all-four') {
        var bottomCoordY = startY + cell * (rows - 1) + Math.round(cell * 0.42);
        for (var cc = 0; cc < cols; cc++) {
          ctx.fillText(colLabels[cc] || (cc + 1), startX + cell * cc, bottomCoordY);
        }
      }

      // 3) 좌측 세로 좌표 (좌·상 또는 전체 모드)
      if (state.coordMode === 'left-top' || state.coordMode === 'all-four') {
        var leftCoordX = Math.max(10, Math.round((startX - overhang) * 0.52));
        for (var rr = 0; rr < rows; rr++) {
          ctx.fillText(rows - rr, leftCoordX, startY + cell * rr);
        }
      }

      // 4) 우측 세로 좌표 (우·하 또는 전체 모드)
      if (state.coordMode === 'right-bottom' || state.coordMode === 'all-four') {
        var rightCoordX = startX + cell * (cols - 1) + Math.round(cell * 0.42);
        for (var rr = 0; rr < rows; rr++) {
          ctx.fillText(rows - rr, rightCoordX, startY + cell * rr);
        }
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

    // 🌟 5-2. 세모(△), 동그라미(○), 문자 라벨(가/1/A), 네모(□) 마크 렌더링 🌟
    if (state.marks && state.marks.length > 0) {
      state.marks.forEach(function (mk) {
        var mx = startX + cell * mk.x;
        var my = startY + cell * mk.y;
        var stoneColor = state.board[mk.y][mk.x]; // 0: 빈칸, 1: 흑돌, 2: 백돌
        drawProblemMark(mx, my, cell, mk, stoneColor);
      });
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

  /* ---------- 🌟 문제 마크 렌더링 (세모 △, 동그라미 ○, 문자 라벨, 네모 □) ---------- */
  function drawProblemMark(cx, cy, cell, mk, stoneColor) {
    ctx.save();

    if (mk.type === 'triangle') {
      // 🌟 세모(△): 정삼각형
      var triH = cell * 0.28;
      var triW = cell * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx, cy - triH * 0.95);
      ctx.lineTo(cx + triW, cy + triH * 0.75);
      ctx.lineTo(cx - triW, cy + triH * 0.75);
      ctx.closePath();

      if (stoneColor === 1) {
        // 흑돌 위 세모: 선명한 화이트
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        // 백돌 위 세모: 짙은 블랙/차콜
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        // 빈 교차점 위 세모: 선명한 레드
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.6, cell * 0.09);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.stroke();
      }
    } else if (mk.type === 'circle') {
      // 🌟 동그라미(○)
      var circleR = cell * 0.24;
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);

      if (stoneColor === 1) {
        // 흑돌 위 동그라미
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        // 백돌 위 동그라미
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        // 빈 교차점 위 동그라미 (O표시)
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.8, cell * 0.095);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.stroke();
      }
    } else if (mk.type === 'label') {
      // 🌟 문자 라벨 (L): '가', '나', '1', 'A' 등
      var text = mk.label || '';
      var fontSize = Math.max(12, Math.round(cell * 0.44));
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
        var badgeR = cell * 0.32;
        ctx.beginPath();
        ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, cx, cy);
      }
    } else if (mk.type === 'square') {
      // 🌟 네모(□)
      var sqHalf = cell * 0.22;
      ctx.beginPath();
      ctx.rect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2);

      if (stoneColor === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.6, cell * 0.09);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ---------- 🌟 문제 마크 렌더링 (세모 △, 동그라미 ○, 문자 라벨, 네모 □) ---------- */
  function drawProblemMark(cx, cy, cell, mk, stoneColor) {
    ctx.save();

    if (mk.type === 'triangle') {
      // 🌟 세모(△): 정삼각형
      var triH = cell * 0.28;
      var triW = cell * 0.32;
      ctx.beginPath();
      ctx.moveTo(cx, cy - triH * 0.95);
      ctx.lineTo(cx + triW, cy + triH * 0.75);
      ctx.lineTo(cx - triW, cy + triH * 0.75);
      ctx.closePath();

      if (stoneColor === 1) {
        // 흑돌 위 세모: 선명한 화이트
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        // 백돌 위 세모: 짙은 블랙/차콜
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        // 빈 교차점 위 세모: 선명한 레드
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.6, cell * 0.09);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.stroke();
      }
    } else if (mk.type === 'circle') {
      // 🌟 동그라미(○)
      var circleR = cell * 0.24;
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);

      if (stoneColor === 1) {
        // 흑돌 위 동그라미
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        // 백돌 위 동그라미
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        // 빈 교차점 위 동그라미 (O표시)
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.8, cell * 0.095);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.stroke();
      }
    } else if (mk.type === 'label') {
      // 🌟 문자 라벨 (L): '가', '나', '1', 'A' 등
      var text = mk.label || '';
      var fontSize = Math.max(12, Math.round(cell * 0.44));
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
        var badgeR = cell * 0.32;
        ctx.beginPath();
        ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        ctx.shadowBlur = 4;
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.fillText(text, cx, cy);
      }
    } else if (mk.type === 'square') {
      // 🌟 네모(□)
      var sqHalf = cell * 0.22;
      ctx.beginPath();
      ctx.rect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2);

      if (stoneColor === 1) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
        ctx.fill();
        ctx.stroke();
      } else if (stoneColor === 2) {
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = Math.max(2.4, cell * 0.08);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = Math.max(2.6, cell * 0.09);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // 1. 고양이, 우주, 흑백 다이아몬드 (3D 고화질 스프라이트)
    var spriteKey = state.stoneStyle + '_' + color;
    var spriteImg = stoneSprites[spriteKey];

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = r * 0.38;
      ctx.shadowOffsetY = r * 0.14;
      ctx.drawImage(spriteImg, cx - r, cy - r, r * 2, r * 2);
    } else {
      var grad = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.08, cx, cy, r);

      if (state.stoneStyle === 'gem') {
        // 💎 영롱한 보석돌: 로열 블루 사파이어(흑) & 로즈 핑크(백)
        if (color === 1) {
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
        // 정통 명품 바둑돌 (Classic) 및 눈 두개 돌 바탕
        if (color === 1) {
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

    // 2. 앙증맞은 '눈 두개 돌' (cute): 반짝이는 초롱초롱 눈망울 렌더링
    if (state.stoneStyle === 'cute' && r >= 10) {
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

    // 🌟 [원장님 지침] 놓아보기 모드: 자유 착수, 흑/백 교차/연속 착수, 사석 완벽 따내기 & 착수금지 방지!
    if (state.trialMode) {
      if (state.board[gy][gx] !== 0) {
        // 🌟 돌 두 번 클릭(이미 있는 돌 클릭) 시 제거!
        var removedColor = state.board[gy][gx];
        state.board[gy][gx] = 0;

        // 수순 목록에서 제거 및 번호 재정렬
        state.trialMoves = state.trialMoves.filter(function (m) {
          return !(m.x === gx && m.y === gy);
        });
        state.trialMoves.forEach(function (m, idx) {
          m.step = idx + 1;
        });

        // 교차 모드인 경우: 지운 돌의 색상으로 턴 복귀
        if (state.placementMode === 'alternate') {
          state.nextTurn = removedColor;
        }

        sfx('playStone');
        // toast 제거됨
        pushTrialHistory();
        updatePlacementUI();
        drawBoard();
        return;
      }

      var playColor = state.nextTurn;
      if (state.placementMode === 'blackOnly') playColor = 1;
      else if (state.placementMode === 'whiteOnly') playColor = 2;

      // 1. 가상 착수
      state.board[gy][gx] = playColor;

      // 2. 상대방 사석(활로 0) 따내기 처리
      var oppColor = playColor === 1 ? 2 : 1;
      var testGroups = getStoneGroups(state.board, state.boardCols, state.boardRows);
      var capturedCount = 0;
      testGroups.forEach(function (g) {
        if (g.color === oppColor && g.liberties === 0) {
          g.stones.forEach(function (s) {
            state.board[s.y][s.x] = 0;
            capturedCount++;
          });
        }
      });

      // 3. 자충수(착수금지점) 검사: 상대를 따내지 못했는데 자신의 활로가 0인 경우
      var ownGroups = getStoneGroups(state.board, state.boardCols, state.boardRows);
      var selfSuicide = false;
      ownGroups.forEach(function (g) {
        if (g.color === playColor && g.liberties === 0) {
          var hasPlaced = g.stones.some(function (s) { return s.x === gx && s.y === gy; });
          if (hasPlaced) {
            selfSuicide = true;
          }
        }
      });

      if (selfSuicide && capturedCount === 0) {
        state.board[gy][gx] = 0; // 착수 취소
        sfx('playDdang');
        // toast 제거됨
        return;
      }

      // 사석 따내기 효과음 (화면 팝업 메시지는 제거하고 깔끔한 사운드만 재생)
      if (capturedCount > 0) {
        sfx('playCapture');
      } else {
        sfx('playStone');
      }

      // 수순 번호 기록
      state.trialMoves.push({
        x: gx,
        y: gy,
        color: playColor,
        step: state.trialMoves.length + 1
      });

      // 교차 모드 턴 교대
      if (state.placementMode === 'alternate') {
        state.nextTurn = playColor === 1 ? 2 : 1;
      }

      pushTrialHistory();
      updatePlacementUI();
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

    // 문제 풀이 모드: 이미 돌이 놓여진 자리는 무시, 상대방 응수 중 클릭 방지
    if (state.board[gy][gx] !== 0 || state.isOpponentResponding) return;

    var p = state.currentProblems[state.currentProblemIndex];
    var myColor = getProblemStartingColor(p);
    var oppColor = myColor === 1 ? 2 : 1;

    // 🌟 [원장님 원칙] 활로 막기 등 정답 착점 다중 수순 및 순서 무관(Order-Independent) 판정! 🌟
    var matchingBranches = [];
    var userStep = state.playedMoves.length;

    state.activeBranches.forEach(function (branch) {
      var isAllMyColor = branch.every(function (m) { return m.color === myColor; });
      if (isAllMyColor) {
        // 상대방 응수 없는 다중 활로 착점: 남은 활로 중 어느 것을 먼저 두어도 정답 인정!
        var playedCoords = state.playedMoves.map(function (m) { return m.x + ',' + m.y; });
        var unplayedMoves = branch.filter(function (m) { return playedCoords.indexOf(m.x + ',' + m.y) === -1; });
        var matchedIndex = -1;
        for (var mi = 0; mi < unplayedMoves.length; mi++) {
          if (unplayedMoves[mi].x === gx && unplayedMoves[mi].y === gy && unplayedMoves[mi].color === myColor) {
            matchedIndex = mi;
            break;
          }
        }
        if (matchedIndex !== -1) {
          var matchedMove = unplayedMoves[matchedIndex];
          var remaining = unplayedMoves.filter(function (_, idx) { return idx !== matchedIndex; });
          var reordered = branch.filter(function (m) { return playedCoords.indexOf(m.x + ',' + m.y) !== -1; })
            .concat([matchedMove])
            .concat(remaining);
          matchingBranches.push(reordered);
        }
      } else {
        // 정통 수순 문제 (상대방 자동 응수 포함)
        var expectedMove = branch[userStep];
        if (expectedMove && expectedMove.x === gx && expectedMove.y === gy && expectedMove.color === myColor) {
          matchingBranches.push(branch);
        }
      }
    });

    if (matchingBranches.length === 0) {
      // ❌ 오답: 수순이나 활로에 맞지 않는 곳에 둔 경우
      state.board[gy][gx] = myColor;
      sfx('playDdang');
      showSideFeedback('wrong');
      drawBoard();
      setTimeout(function () {
        state.board[gy][gx] = 0;
        drawBoard();
      }, 750);
      return;
    }

    // ⭕ 유효한 정답 착수!
    state.activeBranches = matchingBranches;
    var currentBranch = matchingBranches[0];

    state.board[gy][gx] = myColor;
    state.playedMoves.push({ x: gx, y: gy, color: myColor, step: state.playedMoves.length + 1 });

    // 사석 따내기 처리 (상대방 활로 0인 돌 제거)
    var groups = getStoneGroups(state.board, state.boardCols, state.boardRows);
    var capturedAny = false;
    groups.forEach(function (g) {
      if (g.color === oppColor && g.liberties === 0) {
        g.stones.forEach(function (s) {
          state.board[s.y][s.x] = 0;
        });
        capturedAny = true;
      }
    });

    if (capturedAny) sfx('playSuccess');
    else sfx('playStone');

    drawBoard();

    // 문제 성공 여부 확인
    var isFinished = state.playedMoves.length >= currentBranch.length;
    if (isFinished) {
      state.solved = true;
      var curKey = (state.currentBook ? (state.currentBook.bookCode || '') : '') + '_' + state.currentProblemIndex;
      state.solvedMap[curKey] = true;
      renderProblemGrid();
      sfx('playSuccess');
      showSideFeedback('correct');

      // 🌟 문제 정답 시 1.1초 후 자동으로 다음 문제로 전환
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = setTimeout(function () {
        if (state.currentProblemIndex < state.currentProblems.length - 1) {
          loadProblem(state.currentProblemIndex + 1);
        } else {
          // toast 제거됨
        }
      }, 1100);
    } else {
      // 다음 수가 상대방(컴퓨터) 응수인지 확인
      var nextStep = state.playedMoves.length;
      var nextOppMove = currentBranch[nextStep];
      if (nextOppMove && nextOppMove.color === oppColor) {
        state.isOpponentResponding = true;
        // toast 제거됨
        setTimeout(function () {
          state.board[nextOppMove.y][nextOppMove.x] = oppColor;
          state.playedMoves.push(nextOppMove);
          state.isOpponentResponding = false;

          // 🌟 상대방 착수로 인해 활로가 0이 된 내(흑/백) 돌 사석 따내기 완벽 처리!
          var oppCheckGroups = getStoneGroups(state.board, state.boardCols, state.boardRows);
          var oppCapturedCount = 0;
          oppCheckGroups.forEach(function (g) {
            if (g.color === myColor && g.liberties === 0) {
              g.stones.forEach(function (s) {
                state.board[s.y][s.x] = 0;
                oppCapturedCount++;
              });
            }
          });

          if (oppCapturedCount > 0) {
            sfx('playCapture');
          } else {
            sfx('playStone');
          }

          // 턴을 다시 내 차례(myColor)로 복귀
          state.nextTurn = myColor;
          updatePlacementUI();
          drawBoard();

          // 상대방 응수 후 문제 완료 여부 확인
          if (state.playedMoves.length >= currentBranch.length) {
            state.solved = true;
            var cKey = (state.currentBook ? (state.currentBook.bookCode || '') : '') + '_' + state.currentProblemIndex;
            state.solvedMap[cKey] = true;
            renderProblemGrid();
            sfx('playSuccess');
            showSideFeedback('correct');
            clearTimeout(state.autoNextTimer);
            state.autoNextTimer = setTimeout(function () {
              if (state.currentProblemIndex < state.currentProblems.length - 1) {
                loadProblem(state.currentProblemIndex + 1);
              }
            }, 1100);
          } else {
            // toast 제거됨
          }
        }, 500);
      } else {
        // 남은 활로를 연속으로 막아야 하는 다중 착수 문제
        // toast 제거됨
      }
    }
  });

  /* ---------- 버튼 이벤트 바인딩 ---------- */
  document.getElementById('btnPinSubmit').addEventListener('click', submitPin);
  pinInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitPin();
  });

  seriesSelect.addEventListener('change', function () { onSeriesChange(false); });
  bookSelect.addEventListener('change', function () { loadBook(bookSelect.value, false); });
  chapterSelect.addEventListener('change', function () { onChapterChange(false); });

  document.getElementById('btnPrevProblem').addEventListener('click', function () {
    if (state.currentProblemIndex > 0) loadProblem(state.currentProblemIndex - 1);
  });
  document.getElementById('btnNextProblem').addEventListener('click', function () {
    if (state.currentProblemIndex < state.currentProblems.length - 1) {
      loadProblem(state.currentProblemIndex + 1);
    }
  });

  function resetCurrentProblem() {
    if (state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
    state.trialMode = false;
    var btnTrialEl = document.getElementById('btnToggleTrial');
    if (btnTrialEl) btnTrialEl.classList.remove('active');
    state.board = state.initialBoard.map(function (row) { return row.slice(); });
    state.showAnswer = false;
    state.playedMoves = [];
    state.trialMoves = [];
    state.activeBranches = state.answerBranches.slice();
    state.isOpponentResponding = false;
    state.placementMode = 'alternate';

    var p = state.currentProblems[state.currentProblemIndex];
    var defColor = getProblemStartingColor(p);
    state.nextTurn = defColor;

    state.historyStack = [{
      board: state.board.map(function (row) { return row.slice(); }),
      nextTurn: state.nextTurn,
      moves: []
    }];
    state.historyIndex = 0;
    updatePlacementUI();
    var btnAnsReset = document.getElementById('btnAnswer');
    if (btnAnsReset) btnAnsReset.textContent = '👁️ 정답';

    hintBox.hidden = true;
    var btnHintEl = document.getElementById('btnHint');
    if (btnHintEl) btnHintEl.classList.remove('active');

    drawBoard();
  }

  var btnHintEl = document.getElementById('btnHint');
  if (btnHintEl) {
    btnHintEl.addEventListener('click', function () {
      hintBox.hidden = !hintBox.hidden;
      btnHintEl.classList.toggle('active', !hintBox.hidden);
    });
  }

  document.getElementById('btnAnswer').addEventListener('click', function () {
    if (state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }
    state.showAnswer = !state.showAnswer;
    this.textContent = state.showAnswer ? '🙈 숨김' : '👁️ 정답';

    // 정답을 볼 때는 놓아보기 모드를 자동으로 해제하여 잔존 돌과 충돌 방지
    if (state.showAnswer && state.trialMode) {
      state.trialMode = false;
      var btnTrialEl = document.getElementById('btnToggleTrial');
      if (btnTrialEl) btnTrialEl.classList.remove('active');
      restoreProblemBoardState();
      updatePlacementUI();
    }
    drawBoard();
  });

  var btnResetEl = document.getElementById('btnReset');
  if (btnResetEl) {
    btnResetEl.addEventListener('click', resetCurrentProblem);
  }

  var btnToggleFree = document.getElementById('btnToggleFree');
  if (btnToggleFree) {
    btnToggleFree.addEventListener('click', function () {
      state.freeMode = !state.freeMode;
      if (freeModeStatus) freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
      this.classList.toggle('active', state.freeMode);
      // toast 제거됨
    });
  }

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
      resetCurrentProblem();
    }
  });

  window.addEventListener('resize', function () {
    if (state.authenticated) {
      layoutBoard();
      drawBoard();
    }
  });

  /* ---------- 시작 ---------- */
  
  /* ---------- 🌟 놓아보기 히스토리 스택 & 턴 보존 🌟 ---------- */
  function pushTrialHistory() {
    var copy = state.board.map(function (row) { return row.slice(); });
    state.historyStack = state.historyStack.slice(0, state.historyIndex + 1);
    state.historyStack.push({
      board: copy,
      nextTurn: state.nextTurn,
      moves: state.trialMoves.slice()
    });
    state.historyIndex = state.historyStack.length - 1;
  }

  function applyHistoryIndex(idx) {
    if (idx < 0 || idx >= state.historyStack.length) return;
    state.historyIndex = idx;
    var snap = state.historyStack[idx];
    if (snap && snap.board) {
      state.board = snap.board.map(function (row) { return row.slice(); });
      state.nextTurn = snap.nextTurn;
      state.trialMoves = (snap.moves || []).slice();
    } else if (Array.isArray(snap)) {
      state.board = snap.map(function (row) { return row.slice(); });
    }
    updatePlacementUI();
    drawBoard();
  }

  function restoreProblemBoardState() {
    state.board = state.initialBoard.map(function (row) { return row.slice(); });
    state.playedMoves.forEach(function (m) {
      state.board[m.y][m.x] = m.color;
      var oc = m.color === 1 ? 2 : 1;
      var groups = getStoneGroups(state.board, state.boardCols, state.boardRows);
      groups.forEach(function (g) {
        if (g.color === oc && g.liberties === 0) {
          g.stones.forEach(function (s) {
            state.board[s.y][s.x] = 0;
          });
        }
      });
    });
    var defColor = 1;
    if (state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
      defColor = state.answerBranches[0][0].color;
    } else if (state.currentProblems[state.currentProblemIndex] && state.currentProblems[state.currentProblemIndex].start && state.currentProblems[state.currentProblemIndex].start.toUpperCase() === 'W') {
      defColor = 2;
    }
    state.nextTurn = defColor;
  }

  function updatePlacementUI() {
    var btns = document.querySelectorAll('.placement-group .tool-btn');
    btns.forEach(function (btn) {
      var mode = btn.dataset.placeMode;
      btn.classList.toggle('active', mode === state.placementMode);
      if (mode === 'alternate') {
        var nextStoneText = state.nextTurn === 1 ? '⚫ 흑' : '⚪ 백';
        btn.title = '흑·백 교차 착수 (다음 착수: ' + nextStoneText + ')';
      }
    });

    if (state.trialMode && qTurnBadge) {
      var turnLabel = (state.placementMode === 'blackOnly') ? '⚫ 흑만' :
                      (state.placementMode === 'whiteOnly') ? '⚪ 백만' :
                      (state.nextTurn === 1 ? '🔄⚫ 흑선' : '🔄⚪ 백선');
      qTurnBadge.textContent = '✍️ ' + turnLabel;
    } else if (!state.trialMode && qTurnBadge && state.currentProblems[state.currentProblemIndex]) {
      var p = state.currentProblems[state.currentProblemIndex];
      var defCol = getProblemStartingColor(p);
      qTurnBadge.textContent = (defCol === 2) ? '⚪ 백선' : '⚫ 흑선';
    }
  }

  /* ---------- 🌟 강사용 수업 특수 툴바 이벤트 바인딩 🌟 ---------- */
  function initTeachingToolbar() {
    // 1. 놓아보기 토글
    var btnTrial = document.getElementById('btnToggleTrial');
    if (btnTrial) {
      btnTrial.addEventListener('click', function () {
        if (state.autoNextTimer) {
          clearTimeout(state.autoNextTimer);
          state.autoNextTimer = null;
        }
        state.trialMode = !state.trialMode;
        btnTrial.classList.toggle('active', state.trialMode);

        if (state.trialMode) {
          // 놓아보기를 켤 때 정답 보기가 켜져 있으면 자동으로 숨김
          if (state.showAnswer) {
            state.showAnswer = false;
            var btnAns = document.getElementById('btnAnswer');
            if (btnAns) btnAns.textContent = '👁️ 정답 보기';
          }
          state.trialMoves = [];
          var startTurn = 1;
          if (state.playedMoves.length > 0) {
            var lastM = state.playedMoves[state.playedMoves.length - 1];
            startTurn = lastM.color === 1 ? 2 : 1;
          } else if (state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
            startTurn = state.answerBranches[0][0].color;
          } else if (state.currentProblems[state.currentProblemIndex] && state.currentProblems[state.currentProblemIndex].start && state.currentProblems[state.currentProblemIndex].start.toUpperCase() === 'W') {
            startTurn = 2;
          }

          if (state.placementMode === 'blackOnly') state.nextTurn = 1;
          else if (state.placementMode === 'whiteOnly') state.nextTurn = 2;
          else state.nextTurn = startTurn;

          state.historyStack = [{
            board: state.board.map(function (row) { return row.slice(); }),
            nextTurn: state.nextTurn,
            moves: []
          }];
          state.historyIndex = 0;
          // toast 제거됨
        } else {
          restoreProblemBoardState();
          // toast 제거됨
        }

        updatePlacementUI();
        drawBoard();
      });
    }

    // 2. 착수 모드 (교차 / 흑만 / 백만)
    document.querySelectorAll('.placement-group .tool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.dataset.placeMode || 'alternate';
        state.placementMode = mode;
        if (mode === 'blackOnly') {
          state.nextTurn = 1;
        } else if (mode === 'whiteOnly') {
          state.nextTurn = 2;
        } else if (mode === 'alternate') {
          if (state.trialMoves && state.trialMoves.length > 0) {
            var lastM = state.trialMoves[state.trialMoves.length - 1];
            state.nextTurn = lastM.color === 1 ? 2 : 1;
          } else {
            var defColor = 1;
            if (state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
              defColor = state.answerBranches[0][0].color;
            } else if (state.currentProblems[state.currentProblemIndex] && state.currentProblems[state.currentProblemIndex].start && state.currentProblems[state.currentProblemIndex].start.toUpperCase() === 'W') {
              defColor = 2;
            }
            state.nextTurn = defColor;
          }
        }
        updatePlacementUI();
        // toast 제거됨
      });
    });

    // 3. 수순 네비게이션
    var btnNavFirst = document.getElementById('btnNavFirst');
    if (btnNavFirst) {
      btnNavFirst.addEventListener('click', function () {
        applyHistoryIndex(0);
        // toast 제거됨
      });
    }

    var btnNavPrev = document.getElementById('btnNavPrev');
    if (btnNavPrev) {
      btnNavPrev.addEventListener('click', function () {
        if (state.historyIndex > 0) {
          applyHistoryIndex(state.historyIndex - 1);
          sfx('playStone');
        } else {
          // toast 제거됨
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
      btnClearBoard.addEventListener('click', resetCurrentProblem);
    }

    // 4. 시각 보조 도구 (단수, 땀방울, 좌표, 수순 영구 보존)
    var btnToggleAtari = document.getElementById('btnToggleAtari');
    if (btnToggleAtari) {
      btnToggleAtari.classList.toggle('active', state.showAtari);
      btnToggleAtari.addEventListener('click', function () {
        state.showAtari = !state.showAtari;
        localStorage.setItem('teacher_show_atari', state.showAtari.toString());
        btnToggleAtari.classList.toggle('active', state.showAtari);
        drawBoard();
      });
    }

    var btnToggleSweat = document.getElementById('btnToggleSweat');
    if (btnToggleSweat) {
      btnToggleSweat.classList.toggle('active', state.showSweat);
      btnToggleSweat.addEventListener('click', function () {
        state.showSweat = !state.showSweat;
        localStorage.setItem('teacher_show_sweat', state.showSweat.toString());
        btnToggleSweat.classList.toggle('active', state.showSweat);
        drawBoard();
      });
    }

    var coordModes = ['right-bottom', 'left-top', 'all-four', 'none'];
    var coordModeNames = {
      'right-bottom': '우·하 좌표 표시',
      'left-top': '좌·상 좌표 표시',
      'all-four': '전체 좌표 표시',
      'none': '좌표 끄기'
    };
    var btnToggleCoords = document.getElementById('btnToggleCoords');
    if (btnToggleCoords) {
      btnToggleCoords.innerHTML = '🔤 좌표';
      btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
      btnToggleCoords.addEventListener('click', function () {
        var cIdx = coordModes.indexOf(state.coordMode);
        state.coordMode = coordModes[(cIdx + 1) % coordModes.length];
        localStorage.setItem('teacher_coord_mode', state.coordMode);
        btnToggleCoords.innerHTML = '🔤 좌표';
        btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
        // toast 제거됨
        drawBoard();
      });
    }

    var btnToggleNumbers = document.getElementById('btnToggleNumbers');
    if (btnToggleNumbers) {
      btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
      btnToggleNumbers.addEventListener('click', function () {
        state.showStepNumbers = !state.showStepNumbers;
        localStorage.setItem('teacher_show_step_numbers', state.showStepNumbers.toString());
        btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
        drawBoard();
      });
    }
  }

  
  /* ---------- 🌟 환경설정 모달 제어 (바탕화면, 바둑판, 바둑알, 음량) 🌟 ---------- */
  function applyTheme(themeName) {
    state.theme = themeName || 'theme-green';
    var stage = document.querySelector('.teacher-stage');
    if (stage) {
      stage.classList.remove('theme-green', 'theme-forest', 'theme-cream', 'theme-slate');
      stage.classList.add(state.theme);
    }
    localStorage.setItem('teacher_theme', state.theme);
  }

  function initSettingsModal() {
    var modal = document.getElementById('settingsModal');
    var btnOpen = document.getElementById('btnOpenSettings');
    var btnClose = document.getElementById('btnCloseSettings');
    var btnSave = document.getElementById('btnSaveSettings');
    var volRange = document.getElementById('volRange');
    var volLabel = document.getElementById('volValLabel');

    applyTheme(state.theme);

    // 열기 및 닫기 토글 제어
    function openModal() {
      syncModalUI();
      modal.hidden = false;
      if (btnOpen) btnOpen.classList.add('active');
    }
    function closeModal() {
      modal.hidden = true;
      if (btnOpen) btnOpen.classList.remove('active');
    }

    if (btnOpen) {
      btnOpen.addEventListener('click', function (e) {
        e.stopPropagation();
        if (modal.hidden) {
          openModal();
        } else {
          closeModal();
        }
      });
    }

    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnSave) btnSave.addEventListener('click', closeModal);

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    // 바깥 클릭 시 닫기 (메인 화면 및 바둑판 조작 방해 없이 패널 외부 클릭 시 자연스럽게 닫힘)
    document.addEventListener('pointerdown', function (e) {
      if (!modal.hidden) {
        var dialog = modal.querySelector('.settings-dialog');
        if (dialog && !dialog.contains(e.target) && !btnOpen.contains(e.target)) {
          closeModal();
        }
      }
    });

    // 바탕화면 / 바둑판 / 바둑알 옵션 카드 클릭
    document.querySelectorAll('.settings-options .opt-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var group = card.parentElement;
        var settingType = group.dataset.setting;
        var val = card.dataset.val;

        group.querySelectorAll('.opt-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');

        if (settingType === 'theme') {
          applyTheme(val);
        } else if (settingType === 'boardSkin') {
          state.boardSkin = val;
          localStorage.setItem('teacher_board_skin', val);
          localStorage.setItem('baduk_board_skin', val);
          drawBoard();
        } else if (settingType === 'stoneStyle') {
          state.stoneStyle = val;
          localStorage.setItem('teacher_stone_style', val);
          drawBoard();
        } else if (settingType === 'soundType') {
          state.soundType = val;
          localStorage.setItem('baduk_audio_type', val);
          if (window.badukAudio) {
            window.badukAudio.setSoundType(val);
            window.badukAudio.playStone(); // 미리듣기
          }
        }
      });
    });

    // 음량 슬라이더
    if (volRange) {
      var currentVol = Math.round((window.badukAudio ? window.badukAudio.volume : state.volume) * 100);
      volRange.value = currentVol;
      if (volLabel) volLabel.textContent = currentVol + '%';

      volRange.addEventListener('input', function () {
        var pct = parseInt(volRange.value, 10);
        if (volLabel) volLabel.textContent = pct + '%';
        var val = pct / 100;
        state.volume = val;
        localStorage.setItem('baduk_audio_volume', val.toString());
        if (window.badukAudio) window.badukAudio.setVolume(val);
      });

      volRange.addEventListener('change', function () {
        if (window.badukAudio) window.badukAudio.playStone();
      });
    }

    function syncModalUI() {
      document.querySelectorAll('[data-setting="theme"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.theme);
      });
      document.querySelectorAll('[data-setting="boardSkin"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.boardSkin);
      });
      document.querySelectorAll('[data-setting="stoneStyle"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.stoneStyle);
      });
      document.querySelectorAll('[data-setting="soundType"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.soundType);
      });
      if (volRange) {
        var v = Math.round((window.badukAudio ? window.badukAudio.volume : state.volume) * 100);
        volRange.value = v;
        if (volLabel) volLabel.textContent = v + '%';
      }
    }
  }

  initSettingsModal();
  initTeachingToolbar();
  checkAuth();
})();
