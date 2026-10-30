/* =========================================================
   JH 바둑스쿨 — 자유 놓아보기 및 판서 연구실 애플리케이션 (19·13·9줄)
   ========================================================= */

(function () {
  'use strict';

  /* ---------- 전역 상태 ---------- */
  var state = {
    boardSize: parseInt(localStorage.getItem('sandbox_board_size') || '19', 10), // 19 | 13 | 9
    board: [], // 2D array [size][size] (0: empty, 1: black, 2: white)
    history: [], // [{ x, y, color, captured: [], boardBefore }]
    historyIndex: -1,
    capturedBlack: 0, // 백이 따낸 흑돌 수
    capturedWhite: 0, // 흑이 따낸 백돌 수
    currentTurn: 1, // 1: 흑, 2: 백
    placementMode: 'alternate', // 'alternate' | 'blackOnly' | 'whiteOnly'
    hoverPos: null,

    // 시각 보조 도구
    showAtari: localStorage.getItem('sandbox_show_atari') !== 'false',
    showSweat: localStorage.getItem('sandbox_show_sweat') !== 'false',
    showStepNumbers: localStorage.getItem('sandbox_show_numbers') === 'true',
    coordMode: localStorage.getItem('sandbox_coord_mode') || 'right-bottom', // 'right-bottom' | 'left-top' | 'all-four' | 'none'

    // 환경설정
    theme: localStorage.getItem('sandbox_theme') || 'green',
    boardSkin: localStorage.getItem('baduk_board_skin') || localStorage.getItem('sandbox_board_skin') || 'wood',
    stoneStyle: localStorage.getItem('baduk_stone_style') || localStorage.getItem('sandbox_stone_style') || 'classic',
    volume: parseFloat(localStorage.getItem('sandbox_audio_volume') || '1.0'),
    soundType: localStorage.getItem('sandbox_audio_type') || 'classic',

    // 판서/드로잉 도구
    drawingEnabled: false,
    currentTool: 'pen', // 'pen' | 'arrow' | 'line' | 'circle' | 'eraser'
    currentColor: '#ef4444',
    currentWidth: 5,
    drawHistory: [], // [{ type, points, start, end, color, width, ... }]
    redoStack: []
  };

  /* ---------- DOM 참조 ---------- */
  var boardCanvas = document.getElementById('boardCanvas');
  var bCtx = boardCanvas.getContext('2d');
  var drawingCanvas = document.getElementById('drawingCanvas');
  var dCtx = drawingCanvas.getContext('2d');
  var canvasStack = document.getElementById('canvasStack');
  var boardContainer = document.getElementById('boardContainer');
  var sandboxStage = document.getElementById('sandboxStage');
  var drawToolbar = document.getElementById('drawToolbar');
  var btnToggleDrawing = document.getElementById('btnToggleDrawing');
  var moveInfoBadge = document.getElementById('moveInfoBadge');
  var settingsPanel = document.getElementById('settingsPanel');
  var toastEl = document.getElementById('sandboxToast');
  var toastTimer = null;

  /* 캔버스 메트릭스 */
  var metrics = {
    cellSize: 0,
    startX: 0,
    startY: 0,
    dispW: 0,
    dispH: 0,
    dpr: 1
  };

  /* 🌲 천연 비자목(Kaya) 실물 나뭇결 텍스처 프리로딩 */
  var woodGrainImg = new Image();
  woodGrainImg.src = 'images/board_wood_grain.png';

  function revealSandboxBoard() {
    if (metrics.cellSize > 0 && metrics.dispW > 0) {
      if (boardCanvas) {
        boardCanvas.classList.add('is-ready');
        boardCanvas.style.removeProperty('opacity');
        boardCanvas.style.removeProperty('visibility');
      }
      if (drawingCanvas) {
        drawingCanvas.classList.add('is-ready');
        drawingCanvas.style.removeProperty('opacity');
        drawingCanvas.style.removeProperty('visibility');
      }
      var cStack = document.getElementById('canvasStack') || document.querySelector('.canvas-stack');
      if (cStack) {
        cStack.classList.add('is-ready');
        cStack.style.removeProperty('opacity');
        cStack.style.removeProperty('visibility');
      }
    }
  }

  woodGrainImg.onload = function () {
    if (metrics.cellSize > 0) {
      drawBoard();
      revealSandboxBoard();
    }
  };

  /* 3D 돌 스프라이트 이미지 */
  var stoneSprites = {};
  var spriteUrls = {
    'cat_1': '../images/stone_cat_b.png',
    'cat_2': '../images/stone_cat_w.png',
    'galaxy_1': '../images/stone_galaxy_b.png',
    'galaxy_2': '../images/stone_galaxy_w.png',
    'crystal_1': '../images/stone_crystal_b.png',
    'crystal_2': '../images/stone_crystal_w.png'
  };

  Object.keys(spriteUrls).forEach(function (key) {
    var img = new Image();
    img.src = spriteUrls[key];
    img.onload = function () { drawBoard(); };
    stoneSprites[key] = img;
  });

  /* ---------- 보드 배열 초기화 ---------- */
  function initBoardArray(size) {
    var b = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) {
        row.push(0);
      }
      b.push(row);
    }
    return b;
  }

  state.board = initBoardArray(state.boardSize);

  /* ---------- 토스트 알림 ---------- */
  function toast(msg) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 1600);
  }

  /* ---------- 화점 좌표 구하기 ---------- */
  window.getStarPoints = getStarPoints;
  function getStarPoints(size) {
    if (size === 19) {
      return [
        [3, 3], [3, 9], [3, 15],
        [9, 3], [9, 9], [9, 15],
        [15, 3], [15, 9], [15, 15]
      ];
    } else if (size === 13) {
      return [
        [3, 3], [3, 9],
        [6, 6],
        [9, 3], [9, 9]
      ];
    } else if (size === 9) {
      // 🌟 9줄 바둑판은 정중앙 천원 1개만 표시
      return [
        [4, 4]
      ];
    }
    return [];
  }

  /* ---------- 좌표 라벨 구하기 ---------- */
  var COL_LABELS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];

  /* ---------- 메트릭스 & 크기 계산 ---------- */
  function layoutBoard() {
    var rect = boardContainer.getBoundingClientRect();
    var availW = rect.width - 16;
    var availH = rect.height - 16;

    var size = state.boardSize;
    // 정사각형 보드이므로 가로/세로 동일
    var cell = Math.min((availW - 12) / (size + 0.85), (availH - 12) / (size + 0.85));
    cell = Math.max(22, Math.min(cell, 95));

    var dispW = Math.round((size + 0.85) * cell);
    var dispH = dispW; // 정방형 바둑판

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 0.92;
    metrics.startY = cell * 0.92;
    metrics.dispW = dispW;
    metrics.dispH = dispH;
    metrics.dpr = dpr;

    // 바둑판 캔버스 크기
    boardCanvas.width = Math.round(dispW * dpr);
    boardCanvas.height = Math.round(dispH * dpr);
    boardCanvas.style.width = dispW + 'px';
    boardCanvas.style.height = dispH + 'px';

    // 판서 캔버스 크기 (정확히 동일한 크기로 오버레이)
    drawingCanvas.width = Math.round(dispW * dpr);
    drawingCanvas.height = Math.round(dispH * dpr);
    drawingCanvas.style.width = dispW + 'px';
    drawingCanvas.style.height = dispH + 'px';

    canvasStack.style.width = dispW + 'px';
    canvasStack.style.height = dispH + 'px';
  }

  /* ---------- 바둑판 그리기 ---------- */
  function drawBoard() {
    var cell = metrics.cellSize;
    var size = state.boardSize;
    var startX = metrics.startX;
    var startY = metrics.startY;
    var dispW = metrics.dispW;
    var dispH = metrics.dispH;
    var dpr = metrics.dpr;

    bCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bCtx.clearRect(0, 0, dispW, dispH);

    // 1. 바둑판 스킨 배경
    var boardBorderColor = '#5c300c';
    if (state.boardSkin === 'darkwood') {
      // 진한 원목
      if (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0) {
        var pattern = bCtx.createPattern(woodGrainImg, 'repeat');
        bCtx.fillStyle = pattern;
        bCtx.fillRect(0, 0, dispW, dispH);
        bCtx.fillStyle = 'rgba(100, 50, 10, 0.22)';
        bCtx.fillRect(0, 0, dispW, dispH);
      } else {
        bCtx.fillStyle = '#deb06c';
        bCtx.fillRect(0, 0, dispW, dispH);
      }
      boardBorderColor = '#5c300c';
    } else if (state.boardSkin === 'sky') {
      bCtx.fillStyle = '#dbeafe';
      bCtx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#2563eb';
    } else {
      // 밝은 비자목 (wood) - 천연 실물 나뭇결 텍스처
      if (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0) {
        var pattern = bCtx.createPattern(woodGrainImg, 'repeat');
        bCtx.fillStyle = pattern;
        bCtx.fillRect(0, 0, dispW, dispH);
      } else {
        bCtx.fillStyle = '#f2cc84';
        bCtx.fillRect(0, 0, dispW, dispH);
      }
      boardBorderColor = '#8c5828';
    }

    // 외곽 테두리선
    bCtx.strokeStyle = boardBorderColor;
    bCtx.lineWidth = 2.0;
    bCtx.strokeRect(startX, startY, (size - 1) * cell, (size - 1) * cell);

    // 격자선
    bCtx.strokeStyle = (state.boardSkin === 'sky') ? 'rgba(30, 58, 138, 0.75)' : '#4a2810';
    bCtx.lineWidth = 1.0;
    bCtx.beginPath();
    for (var i = 0; i < size; i++) {
      // 가로선
      var y = startY + i * cell;
      bCtx.moveTo(startX, y);
      bCtx.lineTo(startX + (size - 1) * cell, y);

      // 세로선
      var x = startX + i * cell;
      bCtx.moveTo(x, startY);
      bCtx.lineTo(x, startY + (size - 1) * cell);
    }
    bCtx.stroke();

    // 화점 (별점)
    var stars = getStarPoints(size);
    var starR = Math.max(2.5, cell * 0.08);
    bCtx.fillStyle = (state.boardSkin === 'sky') ? '#1e3a8a' : '#3a1e0a';
    stars.forEach(function (pt) {
      var sx = startX + pt[0] * cell;
      var sy = startY + pt[1] * cell;
      bCtx.beginPath();
      bCtx.arc(sx, sy, starR, 0, Math.PI * 2);
      bCtx.fill();
    });

    // 2. 바둑판 좌표 표시
    if (state.coordMode !== 'none') {
      drawCoordinates(cell, size, startX, startY);
    }

    // 3. 단수 판별 & 돌 그룹 활로 계산
    var atariMap = {};
    if (state.showAtari || state.showSweat) {
      atariMap = computeAtariMap(state.board, size);
    }

    // 4. 바둑돌 그리기
    var stoneR = cell * 0.46;
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var color = state.board[r][c];
        if (color !== 0) {
          var cx = startX + c * cell;
          var cy = startY + r * cell;
          drawStone(cx, cy, stoneR, color);

          // 단수 표시 (빨간 링)
          var key = r + '_' + c;
          if (state.showAtari && atariMap[key]) {
            drawAtariRing(cx, cy, stoneR);
          }
          // 땀방울 효과
          if (state.showSweat && atariMap[key]) {
            drawSweatDrop(cx, cy, stoneR);
          }
        }
      }
    }

    // 4.5. 마우스 호버 시 착수 임시 돌 가이드 (Ghost Stone Preview)
    if (state.hoverPos && !state.drawingEnabled) {
      var hoverColor = (state.placementMode === 'blackOnly') ? 1 :
                       ((state.placementMode === 'whiteOnly') ? 2 : state.currentTurn);
      var hx = startX + state.hoverPos.x * cell;
      var hy = startY + state.hoverPos.y * cell;
      bCtx.save();
      bCtx.globalAlpha = 0.52;
      drawStone(hx, hy, stoneR, hoverColor);
      bCtx.restore();
    }

    // 5. 착수 수순 번호 표시
    if (state.showStepNumbers && state.history.length > 0) {
      drawStepNumbers(cell, startX, startY);
    }

    // 6. 마지막 착수 위치 표시 마커 (원)
    if (state.history.length > 0 && state.historyIndex >= 0) {
      var lastMove = state.history[state.historyIndex];
      if (lastMove && state.board[lastMove.y][lastMove.x] !== 0) {
        var lx = startX + lastMove.x * cell;
        var ly = startY + lastMove.y * cell;
        bCtx.save();
        bCtx.strokeStyle = (lastMove.color === 1) ? '#ef4444' : '#dc2626';
        bCtx.lineWidth = 2.5;
        bCtx.beginPath();
        bCtx.arc(lx, ly, stoneR * 0.4, 0, Math.PI * 2);
        bCtx.stroke();
        bCtx.restore();
      }
    }

    // 🌟 무늬목 텍스처 렌더링 완료 및 레이아웃 완료 시 노출
    if (state.boardSkin === 'sky' || (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0)) {
      revealSandboxBoard();
    }
  }

  /* ---------- 좌표 라벨 렌더링 ---------- */
  function drawCoordinates(cell, size, startX, startY) {
    bCtx.save();
    bCtx.fillStyle = (state.boardSkin === 'sky') ? '#1e3a8a' : 'rgba(74, 40, 16, 0.85)';
    bCtx.font = 'bold ' + Math.max(9, Math.round(cell * 0.30)) + 'px sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';

    var showBottom = (state.coordMode === 'right-bottom' || state.coordMode === 'all-four');
    var showTop = (state.coordMode === 'left-top' || state.coordMode === 'all-four');
    var showRight = (state.coordMode === 'right-bottom' || state.coordMode === 'all-four');
    var showLeft = (state.coordMode === 'left-top' || state.coordMode === 'all-four');

    for (var i = 0; i < size; i++) {
      var x = startX + i * cell;
      var y = startY + i * cell;
      var colLetter = COL_LABELS[i] || (i + 1);
      var rowNum = size - i; // 아래가 1, 위가 size

      if (showBottom) bCtx.fillText(colLetter, x, startY + (size - 1) * cell + cell * 0.52);
      if (showTop) bCtx.fillText(colLetter, x, startY - cell * 0.52);
      if (showLeft) bCtx.fillText(rowNum.toString(), startX - cell * 0.52, y);
      if (showRight) bCtx.fillText(rowNum.toString(), startX + (size - 1) * cell + cell * 0.52, y);
    }
    bCtx.restore();
  }

  /* ---------- 바둑알 그리기 ---------- */
  function drawStone(cx, cy, r, color) {
    bCtx.save();

    var spriteKey = state.stoneStyle + '_' + color;
    var spriteImg = stoneSprites[spriteKey];

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      bCtx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      bCtx.shadowBlur = r * 0.38;
      bCtx.shadowOffsetY = r * 0.14;
      bCtx.drawImage(spriteImg, cx - r, cy - r, r * 2, r * 2);
    } else {
      var grad = bCtx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.08, cx, cy, r);

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
        // 정통 클래식 (Classic) 및 눈 두개 돌
        if (color === 1) {
          grad.addColorStop(0, '#666666');
          grad.addColorStop(0.55, '#1e1e1e');
          grad.addColorStop(1, '#080808');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.65, '#f0f0f0');
          grad.addColorStop(0.92, '#d4d4d8');
          grad.addColorStop(1, '#a1a1aa');
        }
      }

      bCtx.shadowColor = 'rgba(0, 0, 0, 0.40)';
      bCtx.shadowBlur = r * 0.35;
      bCtx.shadowOffsetY = r * 0.15;

      bCtx.fillStyle = grad;
      bCtx.beginPath();
      bCtx.arc(cx, cy, r, 0, Math.PI * 2);
      bCtx.fill();

      // 귀여운 눈 두개 돌 연출 (cute)
      if (state.stoneStyle === 'cute') {
        bCtx.shadowColor = 'transparent';
        var eyeR = r * 0.18;
        var eyeY = cy - r * 0.08;
        var eyeOffsetX = r * 0.28;

        // 눈 흰자위
        bCtx.fillStyle = '#ffffff';
        bCtx.beginPath();
        bCtx.arc(cx - eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
        bCtx.arc(cx + eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
        bCtx.fill();

        // 눈동자 (동공)
        bCtx.fillStyle = (color === 1) ? '#111827' : '#1e3a8a';
        bCtx.beginPath();
        bCtx.arc(cx - eyeOffsetX, eyeY + eyeR * 0.15, eyeR * 0.65, 0, Math.PI * 2);
        bCtx.arc(cx + eyeOffsetX, eyeY + eyeR * 0.15, eyeR * 0.65, 0, Math.PI * 2);
        bCtx.fill();

        // 윙크/초롱초롱 빛 반사
        bCtx.fillStyle = '#ffffff';
        bCtx.beginPath();
        bCtx.arc(cx - eyeOffsetX + eyeR * 0.2, eyeY - eyeR * 0.15, eyeR * 0.3, 0, Math.PI * 2);
        bCtx.arc(cx + eyeOffsetX + eyeR * 0.2, eyeY - eyeR * 0.15, eyeR * 0.3, 0, Math.PI * 2);
        bCtx.fill();
      }
    }
    bCtx.restore();
  }

  /* ---------- 단수 빨간 링 표시 ---------- */
  function drawAtariRing(cx, cy, r) {
    bCtx.save();
    bCtx.strokeStyle = 'rgba(239, 68, 68, 0.72)';
    bCtx.lineWidth = Math.max(1.4, Math.min(2.0, r * 0.07));
    bCtx.shadowColor = 'rgba(239, 68, 68, 0.25)';
    bCtx.shadowBlur = 2;
    bCtx.beginPath();
    bCtx.arc(cx, cy, r + 1.2, 0, Math.PI * 2);
    bCtx.stroke();
    bCtx.restore();
  }

  /* ---------- 단수 땀방울 연출 ---------- */
  function drawSweatDrop(cx, cy, r) {
    bCtx.save();
    var sx = cx + r * 0.72;
    var sy = cy - r * 0.75;
    var sw = r * 0.40;

    bCtx.fillStyle = '#38bdf8';
    bCtx.shadowColor = 'rgba(56, 189, 248, 0.7)';
    bCtx.shadowBlur = 4;
    bCtx.beginPath();
    bCtx.moveTo(sx, sy - sw);
    bCtx.quadraticCurveTo(sx + sw, sy + sw * 0.6, sx, sy + sw);
    bCtx.quadraticCurveTo(sx - sw, sy + sw * 0.6, sx, sy - sw);
    bCtx.fill();

    bCtx.fillStyle = '#ffffff';
    bCtx.beginPath();
    bCtx.arc(sx + sw * 0.2, sy, sw * 0.25, 0, Math.PI * 2);
    bCtx.fill();
    bCtx.restore();
  }

  /* ---------- 수순 번호 표시 ---------- */
  function drawStepNumbers(cell, startX, startY) {
    bCtx.save();
    bCtx.font = 'bold ' + Math.max(10, Math.round(cell * 0.44)) + 'px "Fredoka", "Malgun Gothic", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.textBaseline = 'middle';

    state.history.forEach(function (h, idx) {
      if (idx > state.historyIndex) return;
      if (state.board[h.y][h.x] !== 0) {
        var x = startX + h.x * cell;
        var y = startY + h.y * cell;
        var numStr = (idx + 1).toString();
        if (h.color === 2) {
          // 백돌 위 숫자: 짙은 텍스트 + 흰색 외곽선으로 선명하게 강조
          bCtx.strokeStyle = '#ffffff';
          bCtx.lineWidth = Math.max(2, Math.round(cell * 0.06));
          bCtx.strokeText(numStr, x, y);
          bCtx.fillStyle = '#0f172a';
          bCtx.fillText(numStr, x, y);
        } else {
          // 흑돌 위 숫자: 순백색 텍스트 + 검은색 외곽선
          bCtx.strokeStyle = '#000000';
          bCtx.lineWidth = Math.max(2, Math.round(cell * 0.05));
          bCtx.strokeText(numStr, x, y);
          bCtx.fillStyle = '#ffffff';
          bCtx.fillText(numStr, x, y);
        }
      }
    });
    bCtx.restore();
  }

  /* ---------- 단수(활로 1개) 판별 알고리즘 ---------- */
  function computeAtariMap(board, size) {
    var atariMap = {};
    var visited = [];
    for (var r = 0; r < size; r++) {
      var row = [];
      for (var c = 0; c < size; c++) row.push(false);
      visited.push(row);
    }

    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        if (!visited[r][c] && board[r][c] !== 0) {
          var color = board[r][c];
          var groupStones = [];
          var liberties = {};

          var queue = [[r, c]];
          visited[r][c] = true;

          while (queue.length > 0) {
            var curr = queue.shift();
            var cr = curr[0];
            var cc = curr[1];
            groupStones.push([cr, cc]);

            var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (var d = 0; d < 4; d++) {
              var nr = cr + dirs[d][0];
              var nc = cc + dirs[d][1];
              if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                if (board[nr][nc] === 0) {
                  liberties[nr + '_' + nc] = true;
                } else if (board[nr][nc] === color && !visited[nr][nc]) {
                  visited[nr][nc] = true;
                  queue.push([nr, nc]);
                }
              }
            }
          }

          var libCount = Object.keys(liberties).length;
          if (libCount === 1) {
            groupStones.forEach(function (pt) {
              atariMap[pt[0] + '_' + pt[1]] = true;
            });
          }
        }
      }
    }
    return atariMap;
  }

  /* ---------- 그룹 활로 계산 및 돌 따내기 엔진 ---------- */
  function getGroupLiberties(board, size, startR, startC) {
    var color = board[startR][startC];
    if (color === 0) return { stones: [], liberties: 0 };

    var visited = {};
    var stones = [];
    var liberties = {};
    var queue = [[startR, startC]];
    visited[startR + '_' + startC] = true;

    while (queue.length > 0) {
      var curr = queue.shift();
      var cr = curr[0];
      var cc = curr[1];
      stones.push([cr, cc]);

      var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (var d = 0; d < 4; d++) {
        var nr = cr + dirs[d][0];
        var nc = cc + dirs[d][1];
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          if (board[nr][nc] === 0) {
            liberties[nr + '_' + nc] = true;
          } else if (board[nr][nc] === color && !visited[nr + '_' + nc]) {
            visited[nr + '_' + nc] = true;
            queue.push([nr, nc]);
          }
        }
      }
    }
    return { stones: stones, liberties: Object.keys(liberties).length };
  }

  /* ---------- 돌 놓기 / 착수 로직 ---------- */
  function playMove(c, r) {
    var size = state.boardSize;
    if (c < 0 || c >= size || r < 0 || r >= size) return;

    // 이미 돌이 있는 자리를 클릭했을 때: 자유 제거
    if (state.board[r][c] !== 0) {
      var oldColor = state.board[r][c];
      state.board[r][c] = 0;

      // 히스토리 동기화 (방금 둔 돌이거나 이전 돌 제거 시 히스토리 정리)
      if (state.historyIndex >= 0 && state.historyIndex < state.history.length) {
        var lastH = state.history[state.historyIndex];
        if (lastH.x === c && lastH.y === r) {
          state.history.splice(state.historyIndex, 1);
          state.historyIndex--;
        } else {
          for (var hi = state.history.length - 1; hi >= 0; hi--) {
            if (state.history[hi].x === c && state.history[hi].y === r) {
              state.history.splice(hi, 1);
              if (state.historyIndex >= hi) state.historyIndex--;
              break;
            }
          }
        }
      }

      // 교대 모드에서 돌을 지웠을 때는 지운 돌의 색상으로 차례를 복원
      if (state.placementMode === 'alternate') {
        state.currentTurn = oldColor;
      }

      updatePlacementUI();
      updateMoveInfo();
      toast('돌을 제거했습니다. (' + (oldColor === 1 ? '⚫ 흑' : '⚪ 백') + ' 차례 복원)');
      if (window.badukAudio) window.badukAudio.playPlaceSound(oldColor);
      drawBoard();
      return;
    }

    // 착수할 돌 색상 결정
    var playColor = state.currentTurn;
    if (state.placementMode === 'blackOnly') playColor = 1;
    else if (state.placementMode === 'whiteOnly') playColor = 2;

    var opponentColor = (playColor === 1) ? 2 : 1;

    // 가상 착수
    state.board[r][c] = playColor;

    // 인접한 상대 그룹 따내기 검사
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    var capturedStones = [];

    for (var d = 0; d < 4; d++) {
      var nr = r + dirs[d][0];
      var nc = c + dirs[d][1];
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && state.board[nr][nc] === opponentColor) {
        var grp = getGroupLiberties(state.board, size, nr, nc);
        if (grp.liberties === 0) {
          grp.stones.forEach(function (pt) {
            if (state.board[pt[0]][pt[1]] !== 0) {
              state.board[pt[0]][pt[1]] = 0;
              capturedStones.push({ r: pt[0], c: pt[1], color: opponentColor });
            }
          });
        }
      }
    }

    // 자충수 검사 (자신의 활로가 0개이고 상대를 따내지도 못한 경우)
    var ownGrp = getGroupLiberties(state.board, size, r, c);
    if (ownGrp.liberties === 0 && capturedStones.length === 0) {
      state.board[r][c] = 0; // 착수 취소
      toast('자충수(활로 없음) 자리입니다!');
      return;
    }

    // 착수 성공: 히스토리 기록
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }

    state.history.push({
      x: c,
      y: r,
      color: playColor,
      captured: capturedStones
    });
    state.historyIndex++;

    // 따낸 돌 누적 카운트
    if (playColor === 1) state.capturedWhite += capturedStones.length;
    else state.capturedBlack += capturedStones.length;

    // 사운드 재생
    if (capturedStones.length > 0 && window.badukAudio) {
      window.badukAudio.playCaptureSound();
    } else if (window.badukAudio) {
      window.badukAudio.playPlaceSound(playColor);
    }

    // 턴 교대 (단색 모드에서도 다음 착수를 위해 상대 색상으로 미리 대기)
    state.currentTurn = (playColor === 1) ? 2 : 1;

    updatePlacementUI();
    updateMoveInfo();
    drawBoard();
  }

  /* ---------- 착수 모드 UI 및 차례 표시 업데이트 ---------- */
  function updatePlacementUI() {
    var altBtn = document.querySelector('.placement-group .tool-btn[data-place-mode="alternate"]');
    var blackBtn = document.querySelector('.placement-group .tool-btn[data-place-mode="blackOnly"]');
    var whiteBtn = document.querySelector('.placement-group .tool-btn[data-place-mode="whiteOnly"]');

    if (altBtn) {
      altBtn.classList.toggle('active', state.placementMode === 'alternate');
      if (state.placementMode === 'alternate') {
        var turnName = (state.currentTurn === 1) ? '흑' : '백';
        altBtn.innerHTML = '⚫⚪ <span style="font-size:11px;font-weight:900;opacity:0.95;background:rgba(0,0,0,0.22);padding:1px 5px;border-radius:4px;margin-left:2px;">' + turnName + '</span>';
        altBtn.title = '흑·백 교대 착수 (현재: ' + turnName + ' 차례 · 클릭 시 흑/백 전환)';
      } else {
        altBtn.innerHTML = '⚫⚪';
        altBtn.title = '흑·백 교차 착수';
      }
    }
    if (blackBtn) {
      blackBtn.classList.toggle('active', state.placementMode === 'blackOnly');
    }
    if (whiteBtn) {
      whiteBtn.classList.toggle('active', state.placementMode === 'whiteOnly');
    }
  }

  /* ---------- 수순 정보 배지 업데이트 ---------- */
  function updateMoveInfo() {
    var moveNum = state.historyIndex + 1;
    var turnTxt = (state.currentTurn === 1) ? '⚫ 흑 차례' : '⚪ 백 차례';
    if (state.placementMode === 'blackOnly') turnTxt = '⚫ 흑만';
    else if (state.placementMode === 'whiteOnly') turnTxt = '⚪ 백만';

    moveInfoBadge.textContent = moveNum + '수 (' + turnTxt + ') | 따낸돌 흑 ' + state.capturedWhite + ' : 백 ' + state.capturedBlack;
  }

  /* ---------- 수순 조작 (처음, 뒤로, 앞으로, 끝) ---------- */
  function rebuildBoardToIndex(targetIdx) {
    var size = state.boardSize;
    state.board = initBoardArray(size);
    state.capturedBlack = 0;
    state.capturedWhite = 0;

    for (var i = 0; i <= targetIdx; i++) {
      var h = state.history[i];
      state.board[h.y][h.x] = h.color;
      if (h.captured && h.captured.length > 0) {
        h.captured.forEach(function (cap) {
          state.board[cap.r][cap.c] = 0;
          if (h.color === 1) state.capturedWhite++;
          else state.capturedBlack++;
        });
      }
    }

    state.historyIndex = targetIdx;
    if (targetIdx >= 0) {
      var lastH = state.history[targetIdx];
      state.currentTurn = (lastH.color === 1) ? 2 : 1;
    } else {
      state.currentTurn = 1;
    }

    updatePlacementUI();
    updateMoveInfo();
    drawBoard();
  }

  /* ---------- 판서 / 드로잉 캔버스 엔진 ---------- */
  var isDrawing = false;
  var drawStartPt = null;
  var currentPoints = [];

  function redrawDrawings() {
    var dpr = metrics.dpr;
    var dispW = metrics.dispW;
    var dispH = metrics.dispH;

    dCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dCtx.clearRect(0, 0, dispW, dispH);

    state.drawHistory.forEach(function (item) {
      renderDrawItem(dCtx, item);
    });
  }

  function renderDrawItem(ctx, item) {
    ctx.save();
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (item.type === 'pen' && item.points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(item.points[0].x, item.points[0].y);
      for (var i = 1; i < item.points.length; i++) {
        ctx.lineTo(item.points[i].x, item.points[i].y);
      }
      ctx.stroke();
    } else if (item.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(item.start.x, item.start.y);
      ctx.lineTo(item.end.x, item.end.y);
      ctx.stroke();
    } else if (item.type === 'arrow') {
      drawArrow(ctx, item.start.x, item.start.y, item.end.x, item.end.y, item.width);
    } else if (item.type === 'circle') {
      var rx = Math.abs(item.end.x - item.start.x) / 2;
      var ry = Math.abs(item.end.y - item.start.y) / 2;
      var cx = Math.min(item.start.x, item.end.x) + rx;
      var cy = Math.min(item.start.y, item.end.y) + ry;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(4, rx), Math.max(4, ry), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawArrow(ctx, x1, y1, x2, y2, width) {
    var headLen = Math.max(12, width * 2.8);
    var angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 화살표 머리(삼각형)
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  /* 캔버스 터치/마우스 이벤트 리스너 */
  function getCanvasPos(e) {
    var rect = drawingCanvas.getBoundingClientRect();
    var clientX = e.clientX;
    var clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function onPointerDown(e) {
    var pos = getCanvasPos(e);

    // 판서 모드 OFF일 때는 바둑돌 착수
    if (!state.drawingEnabled) {
      var cell = metrics.cellSize;
      var c = Math.round((pos.x - metrics.startX) / cell);
      var r = Math.round((pos.y - metrics.startY) / cell);
      playMove(c, r);
      return;
    }

    // 판서 모드 ON일 때
    isDrawing = true;
    drawStartPt = pos;
    currentPoints = [pos];

    if (state.currentTool === 'eraser') {
      eraseAt(pos.x, pos.y);
    }
  }

  function onPointerMove(e) {
    if (!isDrawing || !state.drawingEnabled) return;
    e.preventDefault();
    var pos = getCanvasPos(e);

    if (state.currentTool === 'pen') {
      currentPoints.push(pos);
      redrawDrawings();
      // 라이브 펜 스트로크
      renderDrawItem(dCtx, {
        type: 'pen',
        points: currentPoints,
        color: state.currentColor,
        width: state.currentWidth
      });
    } else if (state.currentTool === 'arrow' || state.currentTool === 'line' || state.currentTool === 'circle') {
      redrawDrawings();
      renderDrawItem(dCtx, {
        type: state.currentTool,
        start: drawStartPt,
        end: pos,
        color: state.currentColor,
        width: state.currentWidth
      });
    } else if (state.currentTool === 'eraser') {
      eraseAt(pos.x, pos.y);
    }
  }

  function onPointerUp(e) {
    if (!isDrawing || !state.drawingEnabled) return;
    isDrawing = false;
    var pos = getCanvasPos(e);

    if (state.currentTool === 'pen' && currentPoints.length > 1) {
      state.drawHistory.push({
        type: 'pen',
        points: currentPoints.slice(),
        color: state.currentColor,
        width: state.currentWidth
      });
      state.redoStack = [];
    } else if (state.currentTool === 'arrow' || state.currentTool === 'line' || state.currentTool === 'circle') {
      var dist = Math.hypot(pos.x - drawStartPt.x, pos.y - drawStartPt.y);
      if (dist > 5) {
        state.drawHistory.push({
          type: state.currentTool,
          start: drawStartPt,
          end: pos,
          color: state.currentColor,
          width: state.currentWidth
        });
        state.redoStack = [];
      }
    }

    redrawDrawings();
  }

  function eraseAt(x, y) {
    var eraserRadius = state.currentWidth * 3.5;
    // 클릭/드래그한 지점 반경 내 스트로크 필터링
    var initialLen = state.drawHistory.length;
    state.drawHistory = state.drawHistory.filter(function (item) {
      if (item.type === 'pen') {
        return !item.points.some(function (p) {
          return Math.hypot(p.x - x, p.y - y) <= eraserRadius;
        });
      } else if (item.start && item.end) {
        var midX = (item.start.x + item.end.x) / 2;
        var midY = (item.start.y + item.end.y) / 2;
        return Math.hypot(midX - x, midY - y) > eraserRadius &&
               Math.hypot(item.start.x - x, item.start.y - y) > eraserRadius &&
               Math.hypot(item.end.x - x, item.end.y - y) > eraserRadius;
      }
      return true;
    });

    if (state.drawHistory.length !== initialLen) {
      redrawDrawings();
    }
  }

  /* 마우스/터치 리스너 연결 */
  // 마우스 이동 시 호버 임시 돌 좌표 추적
  drawingCanvas.addEventListener('mousemove', function (e) {
    if (state.drawingEnabled) {
      if (state.hoverPos) { state.hoverPos = null; drawBoard(); }
      return;
    }
    var pos = getCanvasPos(e);
    var cell = metrics.cellSize;
    var c = Math.round((pos.x - metrics.startX) / cell);
    var r = Math.round((pos.y - metrics.startY) / cell);
    if (c >= 0 && c < state.boardSize && r >= 0 && r < state.boardSize && state.board[r][c] === 0) {
      if (!state.hoverPos || state.hoverPos.x !== c || state.hoverPos.y !== r) {
        state.hoverPos = { x: c, y: r };
        drawBoard();
      }
    } else {
      if (state.hoverPos) {
        state.hoverPos = null;
        drawBoard();
      }
    }
  });

  drawingCanvas.addEventListener('mouseleave', function () {
    if (state.hoverPos) {
      state.hoverPos = null;
      drawBoard();
    }
  });

  drawingCanvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  drawingCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
  window.addEventListener('touchmove', onPointerMove, { passive: false });
  window.addEventListener('touchend', onPointerUp);

  /* ---------- UI 바인딩 및 이벤트 처리 ---------- */
  function bindEvents() {
    // 1. 바둑판 줄 수 (19줄 / 13줄 / 9줄) 변경
    document.querySelectorAll('#sizeSelector .size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var newSize = parseInt(btn.dataset.size, 10);
        if (state.boardSize === newSize) return;

        document.querySelectorAll('#sizeSelector .size-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        state.boardSize = newSize;
        localStorage.setItem('sandbox_board_size', newSize.toString());

        // 보드 재초기화
        state.board = initBoardArray(newSize);
        state.history = [];
        state.historyIndex = -1;
        state.capturedBlack = 0;
        state.capturedWhite = 0;
        state.currentTurn = 1;

        layoutBoard();
        drawBoard();
        redrawDrawings();
        updateMoveInfo();
        toast(newSize + '줄 바둑판으로 변경되었습니다.');
      });
    });

    // 2. 판서 도구 토글 버튼
    btnToggleDrawing.addEventListener('click', function () {
      state.drawingEnabled = !state.drawingEnabled;
      btnToggleDrawing.classList.toggle('active', state.drawingEnabled);
      drawToolbar.hidden = !state.drawingEnabled;

      if (state.drawingEnabled) {
        drawingCanvas.classList.add('mode-draw');
        toast('✍️ 판서/글쓰기 모드 켜짐 (마우스로 자유 필기)');
      } else {
        drawingCanvas.classList.remove('mode-draw', 'mode-eraser');
        toast('⚫ 바둑 두기(착수) 모드로 복귀');
      }
    });

    // 3. 판서 도구 종류 선택 (펜 / 화살표 / 직선 / 원 / 지우개)
    document.querySelectorAll('.draw-group.tool-types .tool-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.draw-group.tool-types .tool-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        state.currentTool = btn.dataset.tool;
        drawingCanvas.classList.toggle('mode-eraser', state.currentTool === 'eraser');
        drawingCanvas.classList.toggle('mode-draw', state.currentTool !== 'eraser');
      });
    });

    // 4. 색상 팔레트 선택
    document.querySelectorAll('#colorPalette .color-dot').forEach(function (dot) {
      dot.addEventListener('click', function () {
        document.querySelectorAll('#colorPalette .color-dot').forEach(function (d) { d.classList.remove('active'); });
        dot.classList.add('active');
        state.currentColor = dot.dataset.color;
      });
    });

    // 5. 선 두께 선택
    document.querySelectorAll('#lineWidths .tool-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#lineWidths .tool-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.currentWidth = parseInt(btn.dataset.width, 10);
      });
    });

    // 6. 판서 실행 취소 (Undo) & 전체 지우기
    document.getElementById('btnDrawUndo').addEventListener('click', function () {
      if (state.drawHistory.length > 0) {
        var popped = state.drawHistory.pop();
        state.redoStack.push(popped);
        redrawDrawings();
        toast('마지막 그린 획을 취소했습니다.');
      }
    });

    document.getElementById('btnDrawClear').addEventListener('click', function () {
      state.drawHistory = [];
      state.redoStack = [];
      redrawDrawings();
      toast('판서한 글씨를 모두 지웠습니다.');
    });

    // 7. 착수 모드 선택 (교차, 흑만, 백만)
    document.querySelectorAll('.placement-group .tool-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var prevMode = state.placementMode;
        var newMode = btn.dataset.placeMode || 'alternate';

        if (newMode === 'alternate') {
          if (prevMode === 'alternate') {
            // 이미 교대 모드에서 교대 버튼을 다시 클릭하면: 흑/백 차례 직접 토글!
            state.currentTurn = (state.currentTurn === 1) ? 2 : 1;
            toast(state.currentTurn === 1 ? '⚫ 흑 차례로 전환되었습니다.' : '⚪ 백 차례로 전환되었습니다.');
          } else {
            // 단색 모드에서 교대 모드로 복귀할 때:
            // 마지막 착수 돌의 반대 차례로 확실하게 설정 (기록 없으면 흑 차례)
            if (state.history.length > 0 && state.historyIndex >= 0) {
              var lastH = state.history[state.historyIndex];
              state.currentTurn = (lastH.color === 1) ? 2 : 1;
            } else {
              state.currentTurn = 1;
            }
            state.placementMode = 'alternate';
            toast('⚫⚪ 교대 착수 (' + (state.currentTurn === 1 ? '⚫ 흑' : '⚪ 백') + ' 차례)');
          }
        } else if (newMode === 'blackOnly') {
          state.placementMode = 'blackOnly';
          state.currentTurn = 1;
          toast('⚫ 흑돌만 놓기 모드');
        } else if (newMode === 'whiteOnly') {
          state.placementMode = 'whiteOnly';
          state.currentTurn = 2;
          toast('⚪ 백돌만 놓기 모드');
        }

        updatePlacementUI();
        updateMoveInfo();
      });
    });

    // 8. 수순 내비게이션 (처음, 뒤로, 앞으로, 끝, 비우기)
    document.getElementById('btnNavFirst').addEventListener('click', function () {
      if (state.history.length === 0) return;
      rebuildBoardToIndex(-1);
      toast('처음 상태로 되돌렸습니다.');
    });

    document.getElementById('btnNavPrev').addEventListener('click', function () {
      if (state.historyIndex >= 0) {
        rebuildBoardToIndex(state.historyIndex - 1);
      } else {
        toast('더 이상 물릴 수가 없습니다.');
      }
    });

    document.getElementById('btnNavNext').addEventListener('click', function () {
      if (state.historyIndex < state.history.length - 1) {
        rebuildBoardToIndex(state.historyIndex + 1);
      } else {
        toast('마지막 수입니다.');
      }
    });

    document.getElementById('btnNavLast').addEventListener('click', function () {
      if (state.history.length > 0) {
        rebuildBoardToIndex(state.history.length - 1);
        toast('마지막 수까지 진행했습니다.');
      }
    });

    document.getElementById('btnClearBoard').addEventListener('click', function () {
      state.board = initBoardArray(state.boardSize);
      state.history = [];
      state.historyIndex = -1;
      state.capturedBlack = 0;
      state.capturedWhite = 0;
      state.currentTurn = 1;
      state.placementMode = 'alternate';
      updatePlacementUI();
      updateMoveInfo();
      drawBoard();
      toast('바둑판을 깨끗이 비웠습니다.');
    });

    // 9. 보조 시각 도구 (단수링, 땀방울, 좌표, 수순)
    var btnToggleAtari = document.getElementById('btnToggleAtari');
    btnToggleAtari.classList.toggle('active', state.showAtari);
    btnToggleAtari.addEventListener('click', function () {
      state.showAtari = !state.showAtari;
      localStorage.setItem('sandbox_show_atari', state.showAtari ? 'true' : 'false');
      btnToggleAtari.classList.toggle('active', state.showAtari);
      toast(state.showAtari ? '단수 표시 켜짐' : '단수 표시 꺼짐');
      drawBoard();
    });

    var btnToggleSweat = document.getElementById('btnToggleSweat');
    btnToggleSweat.classList.toggle('active', state.showSweat);
    btnToggleSweat.addEventListener('click', function () {
      state.showSweat = !state.showSweat;
      localStorage.setItem('sandbox_show_sweat', state.showSweat ? 'true' : 'false');
      btnToggleSweat.classList.toggle('active', state.showSweat);
      toast(state.showSweat ? '땀방울 효과 켜짐' : '땀방울 효과 꺼짐');
      drawBoard();
    });

    var btnToggleCoords = document.getElementById('btnToggleCoords');
    var coordModes = ['right-bottom', 'left-top', 'all-four', 'none'];
    var coordModeNames = {
      'right-bottom': '우·하 좌표 표시',
      'left-top': '좌·상 좌표 표시',
      'all-four': '전체 좌표 표시',
      'none': '좌표 끄기'
    };
    btnToggleCoords.innerHTML = '🔤 좌표';
    btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
    btnToggleCoords.addEventListener('click', function () {
      var cIdx = coordModes.indexOf(state.coordMode);
      state.coordMode = coordModes[(cIdx + 1) % coordModes.length];
      localStorage.setItem('sandbox_coord_mode', state.coordMode);
      btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
      toast('좌표 모드: ' + (coordModeNames[state.coordMode] || state.coordMode));
      drawBoard();
    });

    var btnToggleNumbers = document.getElementById('btnToggleNumbers');
    btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
    btnToggleNumbers.addEventListener('click', function () {
      state.showStepNumbers = !state.showStepNumbers;
      localStorage.setItem('sandbox_show_numbers', state.showStepNumbers ? 'true' : 'false');
      btnToggleNumbers.classList.toggle('active', state.showStepNumbers);
      toast(state.showStepNumbers ? '착수 수순 번호 표시' : '수순 번호 숨김');
      drawBoard();
    });

    // 10. 환경설정 패널 토글
    document.getElementById('btnOpenSettings').addEventListener('click', function () {
      settingsPanel.hidden = !settingsPanel.hidden;
    });
    document.getElementById('btnCloseSettings').addEventListener('click', function () {
      settingsPanel.hidden = true;
    });

    // 바탕화면 테마
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.theme = btn.dataset.theme;
        localStorage.setItem('sandbox_theme', state.theme);
        sandboxStage.className = 'sandbox-stage theme-' + state.theme;
      });
    });

    // 바둑판 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.boardSkin = btn.dataset.skin;
        localStorage.setItem('sandbox_board_skin', state.boardSkin);
        localStorage.setItem('baduk_board_skin', state.boardSkin);
        drawBoard();
      });
    });

    // 바둑알 스킨 (6종)
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.stoneStyle = btn.dataset.stone;
        localStorage.setItem('sandbox_stone_style', state.stoneStyle);
        localStorage.setItem('baduk_stone_style', state.stoneStyle);
        drawBoard();
      });
    });

    // 사운드 종류 & 음량
    document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        state.soundType = btn.dataset.sound;
        if (window.badukAudio) {
          window.badukAudio.setSoundType(state.soundType);
          window.badukAudio.playPlaceSound(1);
        }
      });
    });

    var volumeSlider = document.getElementById('volumeSlider');
    var volumeVal = document.getElementById('volumeVal');
    volumeSlider.value = Math.round(state.volume * 100);
    volumeVal.textContent = Math.round(state.volume * 100) + '%';
    volumeSlider.addEventListener('input', function () {
      var val = parseInt(volumeSlider.value, 10);
      volumeVal.textContent = val + '%';
      state.volume = val / 100;
      if (window.badukAudio) window.badukAudio.setVolume(state.volume);
    });

    // 윈도우 리사이즈
    window.addEventListener('resize', function () {
      layoutBoard();
      drawBoard();
      redrawDrawings();
    });

    // 키보드 단축키
    window.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        document.getElementById('btnNavPrev').click();
      } else if (e.key === 'ArrowRight') {
        document.getElementById('btnNavNext').click();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        document.getElementById('btnDrawUndo').click();
      }
    });
  }

  /* ---------- 초기 설정 복원 ---------- */
  function restoreSettings() {
    // 테마
    sandboxStage.className = 'sandbox-stage theme-' + state.theme;
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.theme === state.theme);
    });

    // 바둑판 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.skin === state.boardSkin);
    });

    // 바둑알 디자인
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.stone === state.stoneStyle);
    });

    // 줄 수 버튼
    document.querySelectorAll('#sizeSelector .size-btn').forEach(function (b) {
      b.classList.toggle('active', parseInt(b.dataset.size, 10) === state.boardSize);
    });

    // 사운드
    document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.sound === state.soundType);
    });
    if (window.badukAudio) {
      window.badukAudio.setSoundType(state.soundType);
      window.badukAudio.setVolume(state.volume);
    }
  }

  /* ---------- 진입점 실행 ---------- */
  function init() {
    restoreSettings();
    layoutBoard();
    drawBoard();
    updatePlacementUI();
    updateMoveInfo();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
