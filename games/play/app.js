/* =========================================================
   JH 바둑스쿨 — AI 바둑 대국실 어플리케이션
   (놓아보기 프리미엄 바둑판 + 스마트 BadukAI 엔진 연동)
   ========================================================= */

(function () {
  'use strict';

  var BLACK = 1, WHITE = 2;

  /* ---------- 대국 및 환경 상태 ---------- */
  var urlParams = new URLSearchParams(window.location.search);
  var initialMode = urlParams.get('mode') || 'ai'; // 'ai' | 'pvp'

  var state = {
    mode: initialMode,
    boardSize: parseInt(localStorage.getItem('play_board_size') || '19', 10), // 19 | 13 | 9
    difficulty: localStorage.getItem('play_ai_difficulty') || 'dan', // 'beginner' | 'intermediate' | 'advanced' | 'dan' | 'master'
    humanColor: BLACK,
    currentTurn: BLACK,
    isThinking: false,
    isGameOver: false,
    showingTerritory: false,
    lastMove: null,

    // 시각 보조 도구 (놓아보기 연동)
    showAtari: localStorage.getItem('play_show_atari') !== 'false',
    showSweat: localStorage.getItem('play_show_sweat') !== 'false',
    showCoords: false,
    showStepNumbers: localStorage.getItem('play_show_numbers') === 'true',

    // 환경설정 (놓아보기 / 강사모드 연동)
    theme: localStorage.getItem('play_theme') || 'green',
    boardSkin: localStorage.getItem('baduk_board_skin') || localStorage.getItem('play_board_skin') || 'wood',
    stoneStyle: localStorage.getItem('play_stone_style') || 'classic',
    volume: parseFloat(localStorage.getItem('baduk_audio_volume') || '1.0'),
    soundType: localStorage.getItem('baduk_audio_type') || 'classic'
  };

  /* 동물 봇 메타 정보 */
  var BOTS = {
    beginner: { name: '삐약이', title: '🌱 입문 (18급)', avatar: '🐥', desc: '바둑의 첫걸음! 따내기와 단수를 배우는 귀여운 병아리 봇' },
    intermediate: { name: '바둑이', title: '🌿 초급 (12급)', avatar: '🐶', desc: '돌의 연결과 활로를 살피며 씩씩하게 두는 강아지 봇' },
    advanced: { name: '영리한 여우', title: '🌲 중급 (5급)', avatar: '🦊', desc: '호구와 집 모양의 급소를 노리는 지혜로운 여우 봇' },
    dan: { name: '지혜로운 판다', title: '👑 고급 (아마 1단)', avatar: '🐼', desc: '정석과 포석을 척척 구사하는 아마 유단자 판다 봇' },
    master: { name: '용맹한 호랑이', title: '🔥 최강 (아마 5단)', avatar: '🐯', desc: '빈틈없는 수읽기와 강력한 전투력을 지닌 맹호 봇' }
  };

  /* 엔진 & 오디오 */
  var engine = new window.BadukEngine(state.boardSize);
  var ai = new window.BadukAI(state.boardSize);
  var audio = new window.BadukAudio();

  /* 3D 바둑알 스프라이트 프리로딩 */
  var stoneSprites = {};
  var spriteUrls = {
    cat_1: '/images/stone_cat_b.png',
    cat_2: '/images/stone_cat_w.png',
    galaxy_1: '/images/stone_galaxy_b.png',
    galaxy_2: '/images/stone_galaxy_w.png',
    crystal_1: '/images/stone_crystal_b.png',
    crystal_2: '/images/stone_crystal_w.png'
  };
  Object.keys(spriteUrls).forEach(function (k) {
    var img = new Image();
    img.src = spriteUrls[k];
    img.onload = function () { drawBoard(); };
    stoneSprites[k] = img;
  });

  /* DOM 요소 */
  var boardCanvas = document.getElementById('boardCanvas');
  var ctx = boardCanvas.getContext('2d');
  var boardContainer = document.getElementById('boardContainer');
  var playStage = document.getElementById('playStage');
  var moveInfoBadge = document.getElementById('moveInfoBadge');
  var aiThinkingBadge = document.getElementById('aiThinkingBadge');
  var aiThinkingName = document.getElementById('aiThinkingName');
  var resultModal = document.getElementById('resultModal');
  var toastEl = document.getElementById('playToast');
  var toastTimer = null;

  /* 캔버스 좌표 메트릭스 */
  var metrics = {
    cellSize: 0,
    startX: 0,
    startY: 0,
    dpr: window.devicePixelRatio || 1
  };

  /* ---------- 토스트 알림 ---------- */
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 1800);
  }

  /* ---------- 화점(호시) 좌표 계산 ---------- */
  function getStarPoints(size) {
    if (size === 19) {
      return [
        [3, 3], [9, 3], [15, 3],
        [3, 9], [9, 9], [15, 9],
        [3, 15], [9, 15], [15, 15]
      ];
    } else if (size === 13) {
      return [
        [3, 3], [9, 3],
        [6, 6],
        [3, 9], [9, 9]
      ];
    } else if (size === 9) {
      return [
        [2, 2], [6, 2],
        [4, 4],
        [2, 6], [6, 6]
      ];
    }
    return [];
  }

  /* ---------- 바둑판 레이아웃 계산 (정중앙 최대화 & 좌표 제거 최적 비율) ---------- */
  function layoutBoard() {
    var rect = boardContainer.getBoundingClientRect();
    var availW = rect.width;
    var availH = rect.height;

    if (availW <= 0 || availH <= 0) {
      var sRect = playStage.getBoundingClientRect();
      availW = sRect.width - 20;
      availH = sRect.height - 20;
    }

    // 상하좌우 안전 여백 (그림자 및 테두리 숨통 공간: 12px)
    var safety = 12;
    var sideLen = Math.floor(Math.min(availW - safety, availH - safety));
    sideLen = Math.max(280, sideLen);

    var size = state.boardSize;
    // 좌표가 제거되어 외곽 여백을 약 0.7 셀로 정밀 분배 (비자목 바둑판 황금비율)
    // (size - 1 + 1.4) * cell = sideLen  ==>  cell = sideLen / (size + 0.4)
    var cell = sideLen / (size + 0.4);
    var pad = (sideLen - (size - 1) * cell) / 2;

    var dispW = sideLen;
    var dispH = sideLen;

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = pad;
    metrics.startY = pad;
    metrics.dispW = dispW;
    metrics.dispH = dispH;
    metrics.dpr = dpr;

    boardCanvas.width = Math.round(dispW * dpr);
    boardCanvas.height = Math.round(dispH * dpr);
    boardCanvas.style.width = dispW + 'px';
    boardCanvas.style.height = dispH + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBoard();
  }

  /* ---------- 바둑판 그리기 (비자목/원목/스카이 솔리드 텍스처) ---------- */
  function drawBoard() {
    var dpr = metrics.dpr;
    var w = boardCanvas.width / dpr;
    var h = boardCanvas.height / dpr;
    if (w <= 0 || h <= 0) return;

    ctx.clearRect(0, 0, w, h);

    // 1. 바둑판 바탕 재질
    if (state.boardSkin === 'darkwood') {
      ctx.fillStyle = '#b88344';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(74, 42, 10, 0.08)';
      ctx.lineWidth = 1;
      for (var gi = 0; gi < h; gi += 7) {
        ctx.beginPath();
        ctx.moveTo(0, gi);
        ctx.lineTo(w, gi + 1);
        ctx.stroke();
      }
    } else if (state.boardSkin === 'sky') {
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, w, h);
    } else {
      // 밝은 솔리드 비자목 (원장님 시그니처 #f2cc84)
      ctx.fillStyle = '#f2cc84';
      ctx.fillRect(0, 0, w, h);
    }

    // 외곽 테두리
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // 2. 바둑판 격자선
    var size = state.boardSize;
    var startX = metrics.startX;
    var startY = metrics.startY;
    var cs = metrics.cellSize;

    ctx.strokeStyle = 'rgba(40, 20, 0, 0.88)';
    ctx.lineWidth = 1.2;

    for (var i = 0; i < size; i++) {
      var x = startX + i * cs;
      var y = startY + i * cs;

      // 세로선
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + (size - 1) * cs);
      ctx.stroke();

      // 가로선
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + (size - 1) * cs, y);
      ctx.stroke();
    }

    // 3. 화점(호시) 그리기
    var stars = getStarPoints(size);
    var starRadius = Math.max(2.5, cs * 0.09);
    ctx.fillStyle = 'rgba(30, 15, 0, 0.95)';
    stars.forEach(function (pt) {
      var sx = startX + pt[0] * cs;
      var sy = startY + pt[1] * cs;
      ctx.beginPath();
      ctx.arc(sx, sy, starRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. 좌표 표시 (사용자 요청: 좌표 영구 제거)
    // if (state.showCoords) { drawCoordinates(); }

    // 5. 계가 영역 표시
    if (state.showingTerritory && engine.lastScore) {
      drawTerritory(engine.lastScore.territoryMap);
    }

    // 6. 바둑돌 그리기
    var radius = (cs * 0.47);
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var color = engine.board[r][c];
        if (color !== 0) {
          var stepNum = null;
          if (state.showStepNumbers) {
            stepNum = getStepNumAt(c, r);
          }
          drawStone(c, r, color, radius, stepNum);
        }
      }
    }

    // 7. 단수(Atari) 경고 링 및 땀방울
    if (state.showAtari && !state.showingTerritory) {
      var ataris = engine.getAtariGroups();
      ataris.forEach(function (at) {
        at.stones.forEach(function (s) {
          drawAtariRing(s.x, s.y, radius);
          if (state.showSweat) {
            drawSweatDrop(s.x, s.y, radius);
          }
        });
      });
    }

    // 8. 마지막 착수 수순 점/링 표시
    if (state.lastMove && !state.showingTerritory) {
      drawLastMoveMarker(state.lastMove.x, state.lastMove.y, radius);
    }
  }

  /* ---------- 특정 좌표의 수순 번호 찾기 ---------- */
  function getStepNumAt(x, y) {
    for (var i = engine.moves.length - 1; i >= 0; i--) {
      var m = engine.moves[i];
      if (m.x === x && m.y === y && !m.isPass) {
        return m.step;
      }
    }
    return null;
  }

  /* ---------- 좌표 라벨 그리기 ---------- */
  function drawCoordinates() {
    var size = state.boardSize;
    var startX = metrics.startX;
    var startY = metrics.startY;
    var cs = metrics.cellSize;

    var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'].slice(0, size);
    ctx.font = 'bold ' + Math.max(10, Math.round(cs * 0.32)) + 'px sans-serif';
    ctx.fillStyle = 'rgba(60, 35, 10, 0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < size; i++) {
      var cx = startX + i * cs;
      var cy = startY + i * cs;
      var rowLabel = String(size - i);

      // 상/하 열 라벨
      ctx.fillText(colLabels[i], cx, startY - cs * 0.58);
      ctx.fillText(colLabels[i], cx, startY + (size - 1) * cs + cs * 0.58);

      // 좌/우 행 라벨
      ctx.fillText(rowLabel, startX - cs * 0.58, cy);
      ctx.fillText(rowLabel, startX + (size - 1) * cs + cs * 0.58, cy);
    }
  }

  /* ---------- 바둑돌 렌더링 (3D 볼륨 & 스프라이트 완벽 지원) ---------- */
  function drawStone(c, r, color, radius, stepNum) {
    var cx = metrics.startX + c * metrics.cellSize;
    var cy = metrics.startY + r * metrics.cellSize;
    var style = state.stoneStyle;

    ctx.save();

    // 1. 바둑돌 그림자
    ctx.beginPath();
    ctx.arc(cx + radius * 0.12, cy + radius * 0.14, radius * 0.98, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 2. 스프라이트 스킨 (cat, galaxy, crystal)
    var spriteKey = style + '_' + color;
    if (stoneSprites[spriteKey] && stoneSprites[spriteKey].complete) {
      var d = radius * 2.1;
      ctx.drawImage(stoneSprites[spriteKey], cx - d / 2, cy - d / 2, d, d);
    } else {
      // 클래식 / 보석 / 귀여운 돌
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);

      if (color === BLACK) {
        var gradB = ctx.createRadialGradient(
          cx - radius * 0.3, cy - radius * 0.3, radius * 0.05,
          cx, cy, radius
        );
        gradB.addColorStop(0, '#555555');
        gradB.addColorStop(0.3, '#222222');
        gradB.addColorStop(1, '#080808');
        ctx.fillStyle = gradB;
        ctx.fill();

        ctx.strokeStyle = '#050505';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 윗면 은은한 빛 반사
        ctx.beginPath();
        ctx.ellipse(cx - radius * 0.25, cy - radius * 0.25, radius * 0.35, radius * 0.18, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
      } else {
        var gradW = ctx.createRadialGradient(
          cx - radius * 0.3, cy - radius * 0.3, radius * 0.08,
          cx, cy, radius
        );
        gradW.addColorStop(0, '#ffffff');
        gradW.addColorStop(0.6, '#f4f4f4');
        gradW.addColorStop(1, '#cfcfcf');
        ctx.fillStyle = gradW;
        ctx.fill();

        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 은은한 하이라이트
        ctx.beginPath();
        ctx.ellipse(cx - radius * 0.28, cy - radius * 0.28, radius * 0.38, radius * 0.2, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.fill();
      }
    }

    // 3. 수순 번호 표시
    if (stepNum !== null) {
      ctx.font = 'bold ' + Math.round(radius * 0.85) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = (color === BLACK) ? '#ffffff' : '#111111';
      ctx.fillText(stepNum, cx, cy);
    }

    ctx.restore();
  }

  /* ---------- 단수 붉은색 경고 링 ---------- */
  function drawAtariRing(c, r, radius) {
    var cx = metrics.startX + c * metrics.cellSize;
    var cy = metrics.startY + r * metrics.cellSize;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 1.2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.72)';
    ctx.lineWidth = Math.max(1.4, Math.min(2.0, radius * 0.07));
    ctx.shadowColor = 'rgba(239, 68, 68, 0.25)';
    ctx.shadowBlur = 2;
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 단수 3D 땀방울 연출 ---------- */
  function drawSweatDrop(c, r, radius) {
    var cx = metrics.startX + c * metrics.cellSize + radius * 0.55;
    var cy = metrics.startY + r * metrics.cellSize - radius * 0.65;
    var sw = radius * 0.45;

    ctx.save();
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.moveTo(cx, cy - sw * 0.9);
    ctx.quadraticCurveTo(cx + sw * 0.6, cy, cx, cy + sw * 0.6);
    ctx.quadraticCurveTo(cx - sw * 0.6, cy, cx, cy - sw * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 땀방울 반짝임
    ctx.beginPath();
    ctx.arc(cx - sw * 0.12, cy - sw * 0.1, sw * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }

  /* ---------- 마지막 수 표시 마커 ---------- */
  function drawLastMoveMarker(c, r, radius) {
    var cx = metrics.startX + c * metrics.cellSize;
    var cy = metrics.startY + r * metrics.cellSize;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  /* ---------- 계가(집) 오버레이 ---------- */
  function drawTerritory(territoryMap) {
    if (!territoryMap) return;
    var size = state.boardSize;
    var startX = metrics.startX;
    var startY = metrics.startY;
    var cs = metrics.cellSize;
    var half = cs * 0.28;

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var t = territoryMap[r][c];
        if (t === 1) { // 흑집
          var cx = startX + c * cs;
          var cy = startY + r * cs;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
        } else if (t === 2) { // 백집
          var cx2 = startX + c * cs;
          var cy2 = startY + r * cs;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.fillRect(cx2 - half, cy2 - half, half * 2, half * 2);
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx2 - half, cy2 - half, half * 2, half * 2);
        }
      }
    }
  }

  /* ---------- 대국 상태 갱신 ---------- */
  function updateStatus() {
    var moveCount = engine.moves.length;
    var bCap = engine.blackCaptures;
    var wCap = engine.whiteCaptures;

    var turnText = '';
    if (state.isGameOver) {
      turnText = '🏁 대국 종료';
    } else if (state.mode === 'ai') {
      if (state.currentTurn === state.humanColor) {
        turnText = (state.humanColor === BLACK ? '⚫ 내 차례 (흑)' : '⚪ 내 차례 (백)');
      } else {
        var botName = BOTS[state.difficulty].name;
        turnText = '⏳ ' + botName + ' 생각 중...';
      }
    } else {
      turnText = (state.currentTurn === BLACK ? '⚫ 흑 차례' : '⚪ 백 차례');
    }

    if (moveInfoBadge) {
      moveInfoBadge.textContent = turnText + ' | ' + moveCount + '수 | 따낸 돌 흑 ' + bCap + ' : 백 ' + wCap;
    }
  }

  /* ---------- 인간 착수 처리 ---------- */
  function handleHumanMove(c, r) {
    if (state.isGameOver || state.isThinking) return;

    if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
      toast('AI가 생각 중입니다. 잠시만 기다려 주세요.');
      return;
    }

    var res = engine.playMove(c, r, state.currentTurn);
    if (!res.success) {
      if (res.reason === 'SUICIDE') {
        toast('착수 금지점(자충수)에는 둘 수 없습니다!');
      } else if (res.reason === 'KO') {
        toast('패(Ko) 형태이므로 다른 곳에 먼저 두어야 합니다!');
      } else {
        toast('그 자리에는 둘 수 없습니다.');
      }
      return;
    }

    // 착수 성공
    audio.playPlaceSound(state.currentTurn);
    if (res.captures.length > 0) {
      audio.playCaptureSound();
      toast(res.captures.length + '개의 돌을 따냈습니다!');
    }

    state.lastMove = { x: c, y: r };
    state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;
    state.showingTerritory = false;

    drawBoard();
    updateStatus();

    // AI 모드이면 AI 착수 트리거
    if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
      triggerAiMove();
    }
  }

  /* ---------- AI 착수 트리거 ---------- */
  function triggerAiMove() {
    state.isThinking = true;
    var bot = BOTS[state.difficulty];
    if (aiThinkingName) aiThinkingName.textContent = bot.name + ' (' + bot.title + ')';
    if (aiThinkingBadge) aiThinkingBadge.hidden = false;
    updateStatus();

    // 자연스러운 대국을 위한 짧은 딜레이
    var delay = Math.floor(Math.random() * 200) + 350;

    setTimeout(function () {
      if (state.isGameOver) {
        state.isThinking = false;
        if (aiThinkingBadge) aiThinkingBadge.hidden = true;
        return;
      }

      var aiColor = state.currentTurn;
      var move = ai.findBestMove(engine, aiColor, state.difficulty);

      state.isThinking = false;
      if (aiThinkingBadge) aiThinkingBadge.hidden = true;

      if (!move) {
        // AI 패스
        handleAiPass(aiColor);
        return;
      }

      var res = engine.playMove(move.x, move.y, aiColor);
      if (!res.success) {
        // 혹시라도 실패하면 패스
        handleAiPass(aiColor);
        return;
      }

      audio.playPlaceSound(aiColor);
      if (res.captures.length > 0) {
        audio.playCaptureSound();
      }

      state.lastMove = { x: move.x, y: move.y };
      state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;

      drawBoard();
      updateStatus();
    }, delay);
  }

  /* ---------- AI 패스 처리 ---------- */
  function handleAiPass(aiColor) {
    var pRes = engine.pass(aiColor);
    var botName = BOTS[state.difficulty].name;
    toast(botName + '이(가) 한 수 쉬었습니다 (패스).');

    // 양쪽 연속 패스 검사
    var moves = engine.moves;
    if (moves.length >= 2 && moves[moves.length - 1].isPass && moves[moves.length - 2].isPass) {
      handleDoublePassGameOver();
      return;
    }

    state.currentTurn = (aiColor === BLACK) ? WHITE : BLACK;
    drawBoard();
    updateStatus();
  }

  /* ---------- 양쪽 연속 패스로 인한 대국 종료 및 계가 ---------- */
  function handleDoublePassGameOver() {
    state.isGameOver = true;
    toast('양 대국자가 연속으로 패스하여 대국이 종료되었습니다!');
    doCountTerritory(true);
  }

  /* ---------- 계가(집 계산) 실행 ---------- */
  function doCountTerritory(fromPass) {
    var score = engine.calculateScore(6.5);
    engine.lastScore = score;
    state.showingTerritory = true;
    drawBoard();

    var title = document.getElementById('resultTitle');
    var desc = document.getElementById('resultDesc');
    var statsTable = document.getElementById('resultStatsTable');

    var isUserWin = false;
    if (state.mode === 'ai') {
      var userColName = (state.humanColor === BLACK ? 'black' : 'white');
      isUserWin = (score.winner === userColName);
    }

    if (title) {
      if (state.mode === 'ai') {
        title.textContent = isUserWin ? '🎉 승리를 축하합니다!' : '아쉽지만 패배했습니다.';
      } else {
        title.textContent = '대국 결과: ' + score.winnerText + '!';
      }
    }

    if (desc) {
      var botName = state.mode === 'ai' ? BOTS[state.difficulty].name : '상대';
      desc.textContent = fromPass
        ? '양 대국자가 연속 패스하여 공식 집 계산(계가)을 마쳤습니다.'
        : '계가하기를 실행하여 현재 판의 집을 계산했습니다.';
    }

    if (statsTable) {
      statsTable.innerHTML = `
        <div class="result-stat-row"><span>⚫ 흑 집 (영역)</span><span>${score.blackTerritory}집</span></div>
        <div class="result-stat-row"><span>⚫ 흑이 따낸 돌</span><span>${score.blackCaptures}개</span></div>
        <div class="result-stat-row" style="border-top:1px dashed rgba(0,0,0,0.15);padding-top:4px;"><strong>⚫ 흑 총점</strong><strong>${score.blackTotal}집</strong></div>
        <div class="result-stat-row" style="margin-top:6px;"><span>⚪ 백 집 (영역)</span><span>${score.whiteTerritory}집</span></div>
        <div class="result-stat-row"><span>⚪ 백이 따낸 돌</span><span>${score.whiteCaptures}개</span></div>
        <div class="result-stat-row"><span>⚪ 백 덤 (반상 공제)</span><span>${score.komi}집</span></div>
        <div class="result-stat-row" style="border-top:1px dashed rgba(0,0,0,0.15);padding-top:4px;"><strong>⚪ 백 총점</strong><strong>${score.whiteTotal}집</strong></div>
        <div class="result-stat-row" style="margin-top:8px;font-size:16px;color:#047857;"><strong>🏆 최종 판정</strong><strong>${score.winnerText}</strong></div>
      `;
    }

    if (resultModal) { resultModal.removeAttribute('hidden'); resultModal.style.display = 'flex'; }

    updateStatus();
  }

  /* ---------- 한 수 쉬기 (Pass) ---------- */
  function onPassClick() {
    if (state.isGameOver || state.isThinking) return;

    var pRes = engine.pass(state.currentTurn);
    toast('한 수 쉬었습니다 (패스).');

    // 양쪽 연속 패스 검사
    var moves = engine.moves;
    if (moves.length >= 2 && moves[moves.length - 1].isPass && moves[moves.length - 2].isPass) {
      handleDoublePassGameOver();
      return;
    }

    state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;
    drawBoard();
    updateStatus();

    if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
      triggerAiMove();
    }
  }

  /* ---------- 무르기 (Undo) ---------- */
  function onUndoClick() {
    if (state.isGameOver || state.isThinking) return;

    var moves = engine.moves;
    if (moves.length === 0) {
      toast('무를 수 있는 착수가 없습니다.');
      return;
    }

    if (state.mode === 'ai') {
      // AI 모드: AI 수와 내 수를 모두 물러서 내 차례로 되돌림
      var targetStep = Math.max(0, moves.length - 2);
      // 만약 1수만 둔 상태라면 0으로
      if (moves.length === 1 && state.humanColor === BLACK) {
        targetStep = 0;
      }
      engine.goToStep(targetStep);
      state.currentTurn = state.humanColor;
    } else {
      // 2인 대전 모드: 1수 무르기
      engine.goToStep(moves.length - 1);
      state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;
    }

    state.lastMove = engine.moves.length > 0 ? engine.moves[engine.moves.length - 1] : null;
    state.showingTerritory = false;
    toast('한 수를 물렀습니다.');

    drawBoard();
    updateStatus();
  }

  /* ---------- 기권 (Resign) ---------- */
  function onResignClick() {
    if (state.isGameOver || state.isThinking) return;

    if (!confirm('정말 기권하시겠습니까?')) return;

    state.isGameOver = true;
    var botName = state.mode === 'ai' ? BOTS[state.difficulty].name : '상대';
    toast('기권하여 대국이 종료되었습니다.');

    var title = document.getElementById('resultTitle');
    var desc = document.getElementById('resultDesc');
    var statsTable = document.getElementById('resultStatsTable');

    if (title) title.textContent = '기권패 (불계승)';
    if (desc) desc.textContent = botName + ' 대국자가 불계승을 거두었습니다.';
    if (statsTable) {
      statsTable.innerHTML = `
        <div class="result-stat-row"><span>진행된 수순</span><span>${engine.moves.length}수</span></div>
        <div class="result-stat-row"><span>따낸 돌 (흑)</span><span>${engine.blackCaptures}개</span></div>
        <div class="result-stat-row"><span>따낸 돌 (백)</span><span>${engine.whiteCaptures}개</span></div>
      `;
    }

    if (resultModal) { resultModal.removeAttribute('hidden'); resultModal.style.display = 'flex'; }
    updateStatus();
  }

  /* ---------- 새 대국 시작 (초기화) ---------- */
  function startNewGame() {
    state.isGameOver = false;
    state.isThinking = false;
    state.showingTerritory = false;
    state.lastMove = null;
    state.currentTurn = BLACK;

    if (resultModal) { resultModal.setAttribute('hidden', ''); resultModal.style.display = 'none'; }
    if (aiThinkingBadge) aiThinkingBadge.hidden = true;

    engine = new window.BadukEngine(state.boardSize);
    ai = new window.BadukAI(state.boardSize);
    ai.setSize(state.boardSize);

    layoutBoard();
    updateStatus();
    toast('새 대국을 시작했습니다!');

    // 내가 백(후공)이면 AI가 흑으로 첫 수 착수
    if (state.mode === 'ai' && state.humanColor === WHITE) {
      triggerAiMove();
    }
  }

  /* ---------- 이벤트 바인딩 ---------- */
  function bindEvents() {
    // 1. 바둑판 캔버스 클릭
    boardCanvas.addEventListener('click', function (e) {
      audio.init(); // 사용자 인터랙션 시 오디오 활성화
      var rect = boardCanvas.getBoundingClientRect();
      var dpr = metrics.dpr;
      var clickX = e.clientX - rect.left;
      var clickY = e.clientY - rect.top;

      var startX = metrics.startX;
      var startY = metrics.startY;
      var cs = metrics.cellSize;

      var col = Math.round((clickX - startX) / cs);
      var row = Math.round((clickY - startY) / cs);

      var size = state.boardSize;
      if (col >= 0 && col < size && row >= 0 && row < size) {
        var exactX = startX + col * cs;
        var exactY = startY + row * cs;
        var dist = Math.hypot(clickX - exactX, clickY - exactY);
        // 허용 반경 내 클릭 판정
        if (dist <= cs * 0.48) {
          handleHumanMove(col, row);
        }
      }
    });

    // 2. 바둑판 크기 버튼 (19줄 / 13줄 / 9줄)
    var sizeBtns = document.querySelectorAll('.size-btn');
    sizeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var newSize = parseInt(btn.dataset.size, 10);
        if (newSize === state.boardSize) return;
        sizeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.boardSize = newSize;
        localStorage.setItem('play_board_size', String(newSize));
        startNewGame();
      });
    });

    // 3. AI 봇 난이도 셀렉트
    var botSelect = document.getElementById('botSelect');
    if (botSelect) {
      botSelect.value = state.difficulty;
      botSelect.addEventListener('change', function () {
        state.difficulty = botSelect.value;
        localStorage.setItem('play_ai_difficulty', state.difficulty);
        var bot = BOTS[state.difficulty];
        toast(bot.avatar + ' ' + bot.name + ' (' + bot.title + ')과(와) 대국합니다!');
        if (engine.moves.length <= 1) {
          startNewGame();
        }
      });
    }

    // 4. 내 돌 선택 (흑선 / 백후)
    var colorBtns = document.querySelectorAll('.color-btn');
    colorBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var col = parseInt(btn.dataset.color, 10);
        if (col === state.humanColor) return;
        colorBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.humanColor = col;
        startNewGame();
      });
    });

    // 5. 새 대국 버튼
    var btnNewGame = document.getElementById('btnNewGame');
    if (btnNewGame) {
      btnNewGame.addEventListener('click', function () {
        if (engine.moves.length > 0 && !state.isGameOver) {
          if (!confirm('진행 중인 대국을 중단하고 새 대국을 시작하시겠습니까?')) return;
        }
        startNewGame();
      });
    }

    // 6. 조작 툴바 액션들
    document.getElementById('btnUndo')?.addEventListener('click', onUndoClick);
    document.getElementById('btnPass')?.addEventListener('click', onPassClick);
    document.getElementById('btnResign')?.addEventListener('click', onResignClick);
    document.getElementById('btnCount')?.addEventListener('click', function () {
      doCountTerritory(false);
    });

    // 7. 시각 보조 도구 토글
    var toggleAtari = document.getElementById('btnToggleAtari');
    toggleAtari?.addEventListener('click', function () {
      state.showAtari = !state.showAtari;
      toggleAtari.classList.toggle('active', state.showAtari);
      localStorage.setItem('play_show_atari', String(state.showAtari));
      drawBoard();
    });

    var toggleSweat = document.getElementById('btnToggleSweat');
    toggleSweat?.addEventListener('click', function () {
      state.showSweat = !state.showSweat;
      toggleSweat.classList.toggle('active', state.showSweat);
      localStorage.setItem('play_show_sweat', String(state.showSweat));
      drawBoard();
    });

    var toggleCoords = document.getElementById('btnToggleCoords');
    toggleCoords?.addEventListener('click', function () {
      state.showCoords = !state.showCoords;
      toggleCoords.classList.toggle('active', state.showCoords);
      localStorage.setItem('play_show_coords', String(state.showCoords));
      layoutBoard();
    });

    var toggleNumbers = document.getElementById('btnToggleNumbers');
    toggleNumbers?.addEventListener('click', function () {
      state.showStepNumbers = !state.showStepNumbers;
      toggleNumbers.classList.toggle('active', state.showStepNumbers);
      localStorage.setItem('play_show_numbers', String(state.showStepNumbers));
      drawBoard();
    });

    // 8. 모달 액션
    document.getElementById('btnResultAgain')?.addEventListener('click', function () {
      resultModal.setAttribute('hidden', ''); resultModal.style.display = 'none';
      startNewGame();
    });
    document.getElementById('btnResultClose')?.addEventListener('click', function () {
      resultModal.setAttribute('hidden', ''); resultModal.style.display = 'none';
    });

    // 9. 리사이즈 대응
    window.addEventListener('resize', function () {
      layoutBoard();
    });

    // 10. 환경설정 옵션 바인딩
    bindSettingsEvents();
  }

  /* ---------- 환경설정 이벤트 바인딩 (통합 네비 연동) ---------- */
  function bindSettingsEvents() {
    // 테마
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = btn.dataset.theme;
        playStage.className = 'play-stage theme-' + theme;
        state.theme = theme;
        localStorage.setItem('play_theme', theme);
        document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });

    // 바둑판 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var skin = btn.dataset.skin;
        state.boardSkin = skin;
        localStorage.setItem('baduk_board_skin', skin);
        localStorage.setItem('play_board_skin', skin);
        document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        drawBoard();
      });
    });

    // 바둑알 디자인
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var st = btn.dataset.stone;
        state.stoneStyle = st;
        localStorage.setItem('play_stone_style', st);
        document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        drawBoard();
      });
    });
  }

  /* ---------- 초기화 및 실행 ---------- */
  function init() {
    // 초기 설정 반영
    if (playStage) {
      playStage.className = 'play-stage theme-' + state.theme;
    }

    // 크기 버튼 활성화 동기화
    document.querySelectorAll('.size-btn').forEach(function (btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === state.boardSize);
    });

    // 돌 색상 버튼 동기화
    document.querySelectorAll('.color-btn').forEach(function (btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.color, 10) === state.humanColor);
    });

    // 토글 버튼 동기화
    document.getElementById('btnToggleAtari')?.classList.toggle('active', state.showAtari);
    document.getElementById('btnToggleSweat')?.classList.toggle('active', state.showSweat);
    document.getElementById('btnToggleCoords')?.classList.toggle('active', state.showCoords);
    document.getElementById('btnToggleNumbers')?.classList.toggle('active', state.showStepNumbers);

    bindEvents();
    layoutBoard();
    updateStatus();

    // 백을 선택했을 경우 AI가 먼저 착수
    if (state.mode === 'ai' && state.humanColor === WHITE) {
      triggerAiMove();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
