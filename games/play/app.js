/* =========================================================
   JH 바둑스쿨 — AI 바둑 대국실 어플리케이션
   (놓아보기 프리미엄 바둑판 + 스마트 BadukAI 엔진 연동)
   ========================================================= */

(function () {
  'use strict';

  var BLACK = 1, WHITE = 2;

  /* ---------- 대국 및 환경 상태 ---------- */
  var urlParams = new URLSearchParams(window.location.search);
  var isLiveParam = urlParams.get('mode') === 'live' || Boolean(urlParams.get('room'));
  var modeFromUrl = urlParams.get('mode');
  var initialMode = isLiveParam ? 'live' : (modeFromUrl || localStorage.getItem('play_mode') || 'ai');

  var state = {
    mode: isLiveParam ? 'live' : (modeFromUrl || localStorage.getItem('play_mode') || 'ai'),
    boardSize: parseInt(urlParams.get('boardSize') || localStorage.getItem('play_board_size') || '19', 10), // 19 | 13 | 9
    difficulty: localStorage.getItem('play_ai_difficulty') || 'dan', // 'beginner' | 'intermediate' | 'advanced' | 'dan' | 'master'
    humanColor: parseInt(localStorage.getItem('play_human_color') || '1', 10), // 1: BLACK, 2: WHITE
    colorChoice: localStorage.getItem('play_color_choice') || 'random', // '1' | '2' | 'random'
    handicap: parseInt(urlParams.get('handicap') || localStorage.getItem('play_handicap') || '0', 10), // 0: 호선, 1: 정선, 2~9: 접바둑
    timeLimit: urlParams.get('timeLimit') || urlParams.get('time') || localStorage.getItem('play_time_limit') || 'none',
    freeStones: [],
    isFreePlacementActive: false,
    hoverPos: null,
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
    stoneStyle: localStorage.getItem('baduk_stone_style') || localStorage.getItem('play_stone_style') || 'classic',
    volume: parseFloat(localStorage.getItem('baduk_audio_volume') || '1.0'),
    soundType: localStorage.getItem('baduk_audio_type') || 'classic'
  };

  /* 동물 봇 메타 정보 */
  /* 🌲 천연 비자목(Kaya) 실물 나뭇결 텍스처 프리로딩 */
  var woodGrainImg = new Image();
  woodGrainImg.src = 'images/board_wood_grain.png';

  function revealBoard() {
    if (metrics.cellSize > 0 && metrics.dispW > 0) {
      if (boardCanvas) {
        boardCanvas.classList.add('is-ready');
        boardCanvas.style.removeProperty('opacity');
        boardCanvas.style.removeProperty('visibility');
      }
      var cStack = document.getElementById('canvasStack');
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
      revealBoard();
    }
  };

  var BOTS = {
    beginner: { name: 'AI 삐약이', title: '🌱 입문 (18급)', avatar: '🐥', img: '../../images/characters/char_chick_beginner.png', desc: '바둑의 첫걸음! 따내기와 단수를 배우는 귀여운 병아리 봇' },
    intermediate: { name: 'AI 바둑이', title: '🌿 초급 (12급)', avatar: '🐶', img: '../../images/characters/char_pup_think.png', desc: '돌의 연결과 활로를 살피며 씩씩하게 두는 강아지 봇' },
    advanced: { name: 'AI 영리한 여우', title: '🌲 중급 (5급)', avatar: '🦊', img: '../../images/characters/char_fox_victory.jpg', desc: '호구와 집 모양의 급소를 노리는 지혜로운 여우 봇' },
    dan: { name: 'AI 지혜로운 판다', title: '⭐ 상급 (1~2급)', avatar: '🐼', img: '../../images/characters/char_panda_victory.jpg', desc: '두터운 정석과 대국적 안목을 지닌 상급자 판다 봇' },
    master: { name: 'AI 용맹한 호랑이', title: '🔥 유단자 (기원 1단 / 타이젬 2~3단)', avatar: '🐯', img: '../../images/characters/char_tiger_cheer.png', desc: '강력한 전투력과 정확한 사활 수읽기를 펼치는 맹호 유단자 봇' }
  };

  /* 엔진 & 오디오 */
  var engine = new window.BadukEngine(state.boardSize);
  var ai = new window.BadukAI(state.boardSize);
  var audio = new window.BadukAudio();

  /* 3D 바둑알 스프라이트 프리로딩 */
  var stoneSprites = {};
  var spriteUrls = {
    cat_1: 'images/stone_cat_b.png',
    cat_2: 'images/stone_cat_w.png',
    galaxy_1: 'images/stone_galaxy_b.png',
    galaxy_2: 'images/stone_galaxy_w.png',
    crystal_1: 'images/stone_crystal_b.png',
    crystal_2: 'images/stone_crystal_w.png'
  };
  Object.keys(spriteUrls).forEach(function (k) {
    var img = new Image();
    img.src = spriteUrls[k];
    img.onload = function () { if (metrics.cellSize > 0) drawBoard(); };
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
  /* ---------- 접바둑 화점 좌표 계산 ---------- */
  function getHandicapPoints(size, count) {
    if (count < 2) return [];
    if (size === 19) {
      var corners = [[3, 3], [15, 3], [3, 15], [15, 15]];
      var sides = [[3, 9], [15, 9], [9, 3], [9, 15]];
      var tengen = [9, 9];
      var innerCorners = [[6, 6], [12, 6], [6, 12], [12, 12]];
      var innerCross = [[9, 6], [9, 12], [6, 9], [12, 9]];
      var outerKnights = [
        [3, 6], [15, 6], [3, 12], [15, 12],
        [6, 3], [12, 3], [6, 15], [12, 15]
      ];
      if (count === 2) return [[15, 3], [3, 15]];
      if (count === 3) return [[15, 3], [3, 15], [15, 15]];
      if (count === 4) return corners;
      if (count === 5) return corners.concat([tengen]);
      if (count === 6) return corners.concat([[3, 9], [15, 9]]);
      if (count === 7) return corners.concat([[3, 9], [15, 9], tengen]);
      if (count === 8) return corners.concat(sides);
      if (count === 9) return corners.concat(sides, [tengen]);
      if (count === 10) return corners.concat(sides, [tengen, [9, 6]]);
      if (count === 12) return corners.concat(sides, innerCorners);
      if (count === 13) return corners.concat(sides, innerCorners, [tengen]);
      if (count === 16) return corners.concat(sides, innerCorners, innerCross);
      if (count === 17) return corners.concat(sides, innerCorners, innerCross, [tengen]);
      if (count === 25) return corners.concat(sides, innerCorners, innerCross, outerKnights, [tengen]);
      var allOrdered = corners.concat(sides, [tengen], innerCorners, innerCross, outerKnights);
      return allOrdered.slice(0, count);
    } else if (size === 13) {
      if (count === 2) return [[9, 3], [3, 9]];
      if (count === 3) return [[9, 3], [3, 9], [9, 9]];
      if (count === 4) return [[3, 3], [9, 3], [3, 9], [9, 9]];
      if (count >= 5) return [[3, 3], [9, 3], [3, 9], [9, 9], [6, 6]];
    } else if (size === 9) {
      if (count === 2) return [[6, 2], [2, 6]];
      if (count === 3) return [[6, 2], [2, 6], [6, 6]];
      if (count === 4) return [[2, 2], [6, 2], [2, 6], [6, 6]];
      if (count >= 5) return [[2, 2], [6, 2], [2, 6], [6, 6], [4, 4]];
    }
    return [];
  }

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

    if (availW <= 0 || availH <= 0 || (window.innerWidth <= 860 && availH < availW * 0.75)) {
      var sRect = playStage.getBoundingClientRect();
      availW = (sRect && sRect.width > 0) ? (sRect.width - 16) : (window.innerWidth - 24);
      availH = availW;
    }

    // 상하좌우 안전 여백 (그림자 및 테두리 숨통 공간: 12px)
    var safety = 12;
    var sideLen = Math.floor(Math.min(availW - safety, availH - safety));
    sideLen = Math.max(240, Math.min(sideLen, window.innerWidth - 20));

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
      if (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0) {
        var pattern = ctx.createPattern(woodGrainImg, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(100, 50, 10, 0.22)';
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#b88344';
        ctx.fillRect(0, 0, w, h);
      }
    } else if (state.boardSkin === 'sky') {
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(0, 0, w, h);
    } else {
      // 밝은 천연 비자목 (실물 나뭇결 텍스처)
      if (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0) {
        var pattern = ctx.createPattern(woodGrainImg, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w, h);
      } else {
        ctx.fillStyle = '#f2cc84';
        ctx.fillRect(0, 0, w, h);
      }
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

    // 🌟 6.5. 마우스 호버 시 착수 임시 돌 가이드 (Ghost Stone Preview)
    if (state.hoverPos && !state.showingTerritory) {
      var hoverColor = state.isFreePlacementActive ? BLACK :
                       (state.mode === 'ai' ? state.humanColor : state.currentTurn);
      ctx.save();
      ctx.globalAlpha = 0.52; // 반투명 임시 돌 모양
      drawStone(state.hoverPos.x, state.hoverPos.y, hoverColor, radius, null);
      ctx.restore();
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

    // 🌟 무늬목 텍스처 준비 완료 시 바둑판 노출 (무늬목 전 색상 깜빡임 원천 차단)
    if (state.boardSkin === 'sky' || (woodGrainImg && woodGrainImg.complete && woodGrainImg.naturalWidth > 0)) {
      revealBoard();
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

    // 1. 3D 고화질 스프라이트 알 (cat, galaxy, crystal)
    var spriteKey = style + '_' + color;
    var spriteImg = stoneSprites[spriteKey];

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = radius * 0.38;
      ctx.shadowOffsetY = radius * 0.14;
      ctx.drawImage(spriteImg, cx - radius, cy - radius, radius * 2, radius * 2);
    } else {
      var grad = ctx.createRadialGradient(cx - radius * 0.32, cy - radius * 0.35, radius * 0.08, cx, cy, radius);

      if (style === 'gem') {
        // 영롱한 보석알: 로열 블루 사파이어(흑) & 로즈 핑크(백)
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
        // 전통 명품 바둑알 (Classic): 칠흑 오석 & 백옥 조개
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
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = radius * 0.4;
      ctx.shadowOffsetY = radius * 0.15;
      ctx.fill();
    }
    ctx.restore();

    // 2. 앙증맞은 '초롱초롱 눈' (cute)
    if (style === 'cute' && radius >= 8) {
      ctx.save();
      var eyeY = cy - radius * 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.30, eyeY, radius * 0.18, 0, Math.PI * 2);
      ctx.arc(cx + radius * 0.30, eyeY, radius * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.28, eyeY, radius * 0.10, 0, Math.PI * 2);
      ctx.arc(cx + radius * 0.32, eyeY, radius * 0.10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - radius * 0.33, eyeY - radius * 0.04, radius * 0.04, 0, Math.PI * 2);
      ctx.arc(cx + radius * 0.27, eyeY - radius * 0.04, radius * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 수순 번호 표시 (흑돌/백돌 모두 선명한 외곽선 처리)
    if (stepNum !== null && stepNum !== undefined) {
      ctx.save();
      ctx.font = 'bold ' + Math.round(radius * 0.85) + 'px "Fredoka", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var numStr = stepNum.toString();
      if (color === WHITE) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(2, Math.round(radius * 0.12));
        ctx.strokeText(numStr, cx, cy);
        ctx.fillStyle = '#0f172a';
        ctx.fillText(numStr, cx, cy);
      } else {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(2, Math.round(radius * 0.10));
        ctx.strokeText(numStr, cx, cy);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(numStr, cx, cy);
      }
      ctx.restore();
    }
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

    var ruleText = '';
    if (state.handicap >= 2) ruleText = state.handicap + '점 접바둑';
    else if (state.handicap === 1) ruleText = '정선';
    else ruleText = '호선';

    var myStoneText = (state.mode === 'ai') ? (state.humanColor === BLACK ? '내 돌: 흑⚫' : '내 돌: 백⚪') : '';
    var oppText = state.mode === 'ai' ? (BOTS[state.difficulty].avatar + ' ' + BOTS[state.difficulty].name) : '👥 2인';

    if (moveInfoBadge) {
      var extra = ' [' + oppText + (myStoneText ? ' · ' + myStoneText : '') + ' · ' + state.boardSize + '줄 ' + ruleText + ']';
      moveInfoBadge.textContent = turnText + ' | ' + moveCount + '수 | 따낸돌 흑 ' + bCap + ' : 백 ' + wCap + extra;
    }

    // 🌟 아레나 좌우 대국 정보 패널 실시간 동기화 🌟
    // 우측 카드: 항상 '나' (또는 2인 대국 시 1P 흑)
    // 좌측 카드: 항상 '상대 / AI' (또는 2인 대국 시 2P 백)

    var myColor = (state.mode === 'ai') ? state.humanColor : BLACK;
    var oppColor = (myColor === BLACK) ? WHITE : BLACK;

    var myCap = (myColor === BLACK) ? bCap : wCap;
    var oppCap = (oppColor === BLACK) ? bCap : wCap;

    var userCapEl = document.getElementById('arenaBlackCaptures');
    if (userCapEl) userCapEl.textContent = myCap + '개';

    var oppCapEl = document.getElementById('arenaWhiteCaptures');
    if (oppCapEl) oppCapEl.textContent = oppCap + '개';

    var moveCountEl = document.getElementById('arenaMoveCount');
    if (moveCountEl) moveCountEl.textContent = moveCount + '수';
    var whiteMoveCountEl = document.getElementById('arenaWhiteMoveCount');
    if (whiteMoveCountEl) whiteMoveCountEl.textContent = moveCount + '수';

    var fullRuleText = state.boardSize + '줄 ' + (state.handicap >= 2 ? (state.handicap + '점 접바둑') : (state.handicap === 1 ? '정선 (덤 0.5집)' : '호선 (덤 6.5집)'));
    var ruleBadge = document.getElementById('arenaRuleBadge');
    if (ruleBadge) ruleBadge.textContent = fullRuleText;
    var whiteRuleBadge = document.getElementById('arenaWhiteRuleBadge');
    if (whiteRuleBadge) whiteRuleBadge.textContent = fullRuleText;

    // 돌 아이콘 & 닉네임 동기화
    var userStoneEl = document.getElementById('arenaBlackStone');
    if (userStoneEl) userStoneEl.textContent = (myColor === BLACK ? '⚫' : '⚪');

    var oppStoneEl = document.getElementById('arenaWhiteStone');
    if (oppStoneEl) oppStoneEl.textContent = (oppColor === BLACK ? '⚫' : '⚪');

    var userNameEl = document.getElementById('timerBlackName');
    if (userNameEl) {
      if (state.mode === 'ai') {
        userNameEl.textContent = (myColor === BLACK ? '나 (흑)' : '나 (백)');
      } else {
        userNameEl.textContent = '1P (흑)';
      }
    }

    var oppNameEl = document.getElementById('timerWhiteName');
    if (oppNameEl) {
      if (state.mode === 'ai' && BOTS[state.difficulty]) {
        oppNameEl.textContent = BOTS[state.difficulty].name;
      } else {
        oppNameEl.textContent = '2P (백)';
      }
    }

    var oppRankBadge = document.getElementById('arenaWhiteRankBadge');
    if (oppRankBadge) {
      if (state.mode === 'ai' && BOTS[state.difficulty]) {
        oppRankBadge.textContent = BOTS[state.difficulty].title;
        oppRankBadge.style.display = 'inline-block';
      } else {
        oppRankBadge.textContent = '일반 대국';
        oppRankBadge.style.display = 'inline-block';
      }
    }

    var engineCard = document.getElementById('arenaEngineCard');
    if (engineCard) {
      engineCard.style.display = (state.mode === 'ai') ? 'flex' : 'none';
    }

    // 캐릭터 이미지 동기화
    var oppImgEl = document.getElementById('arenaWhiteImg');
    if (oppImgEl) {
      if (state.mode === 'ai' && BOTS[state.difficulty] && BOTS[state.difficulty].img) {
        oppImgEl.src = BOTS[state.difficulty].img;
      } else {
        oppImgEl.src = '../alkkagi/bullterrier/01-idle.png';
      }
    }

    var userImgEl = document.getElementById('arenaBlackImg');
    if (userImgEl && ARENA_AVATARS[currentAvatarIdx]) {
      userImgEl.src = ARENA_AVATARS[currentAvatarIdx].src;
    }

    // 턴 하이라이트 및 상태 문구
    var userCard = document.getElementById('arenaBlackCard');
    var oppCard = document.getElementById('arenaWhiteCard');
    var isMyTurn = (state.currentTurn === myColor);

    if (userCard) userCard.classList.toggle('active-turn', isMyTurn);
    if (oppCard) oppCard.classList.toggle('active-turn', !isMyTurn);

    var userStatus = document.getElementById('arenaBlackStatus');
    var oppStatus = document.getElementById('arenaWhiteStatus');

    if (state.isGameOver) {
      if (userStatus) { userStatus.textContent = '대국 종료'; userStatus.className = 'arena-turn-status'; }
      if (oppStatus) { oppStatus.textContent = '대국 종료'; oppStatus.className = 'arena-turn-status'; }
    } else {
      if (userStatus) {
        if (isMyTurn) {
          userStatus.textContent = (myColor === BLACK ? '⚫ 내 차례' : '⚪ 내 차례');
          userStatus.className = 'arena-turn-status my-turn';
        } else {
          userStatus.textContent = '상대 차례';
          userStatus.className = 'arena-turn-status';
        }
      }
      if (oppStatus) {
        if (!isMyTurn) {
          if (state.mode === 'ai') {
            if (state.isThinking) {
              oppStatus.textContent = '⏳ 수읽기 생각 중...';
              oppStatus.className = 'arena-turn-status thinking';
            } else {
              oppStatus.textContent = (oppColor === BLACK ? '⚫ AI 착수 차례' : '⚪ AI 착수 차례');
              oppStatus.className = 'arena-turn-status my-turn';
            }
          } else {
            oppStatus.textContent = '⚪ 2P 차례';
            oppStatus.className = 'arena-turn-status my-turn';
          }
        } else {
          oppStatus.textContent = '차례 대기 중';
          oppStatus.className = 'arena-turn-status';
        }
      }
    }
  }


  /* ---------- ⏱️ 제한 시간 & 초읽기 시계 엔진 ---------- */
  var TIMER_CONFIGS = {
    'none': null,
    '1m': { mainSeconds: 60, byoSeconds: 10, byoPeriods: 3, label: '1분 + 10초 3회' },
    '5m': { mainSeconds: 300, byoSeconds: 20, byoPeriods: 3, label: '5분 + 20초 3회' },
    '10m': { mainSeconds: 600, byoSeconds: 30, byoPeriods: 3, label: '10분 + 30초 3회' },
    '15m': { mainSeconds: 900, byoSeconds: 40, byoPeriods: 3, label: '15분 + 40초 3회' },
    '10m30s': { mainSeconds: 600, byoSeconds: 30, byoPeriods: 3, label: '10분 + 30초 3회' },
    '10m_30s': { mainSeconds: 600, byoSeconds: 30, byoPeriods: 3, label: '10분 + 30초 3회' },
    '20m30s': { mainSeconds: 1200, byoSeconds: 30, byoPeriods: 3, label: '20분 + 30초 3회' },
    '20m_30s': { mainSeconds: 1200, byoSeconds: 30, byoPeriods: 3, label: '20분 + 30초 3회' },
    '30m40s': { mainSeconds: 1800, byoSeconds: 40, byoPeriods: 3, label: '30분 + 40초 3회' },
    '30m_40s': { mainSeconds: 1800, byoSeconds: 40, byoPeriods: 3, label: '30분 + 40초 3회' },
    '5m20s': { mainSeconds: 300, byoSeconds: 20, byoPeriods: 3, label: '5분 + 20초 3회' },
    '5m_20s': { mainSeconds: 300, byoSeconds: 20, byoPeriods: 3, label: '5분 + 20초 3회' },
    '1m10s': { mainSeconds: 60, byoSeconds: 10, byoPeriods: 3, label: '1분 + 10초 3회' },
    '1m_10s': { mainSeconds: 60, byoSeconds: 10, byoPeriods: 3, label: '1분 + 10초 3회' }
  };

  var timerData = {
    active: false,
    intervalId: null,
    config: null,
    black: { main: 0, byo: 0, periods: 0, inByo: false },
    white: { main: 0, byo: 0, periods: 0, inByo: false }
  };

  function formatTimerDigits(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function updateTimerUI() {
    var userCard = document.getElementById('blackTimerCard');
    var oppCard = document.getElementById('whiteTimerCard');
    var userDigits = document.getElementById('timerBlackTime');
    var oppDigits = document.getElementById('timerWhiteTime');
    var userByo = document.getElementById('timerBlackByo');
    var oppByo = document.getElementById('timerWhiteByo');

    var myColor = (state.mode === 'ai') ? state.humanColor : BLACK;
    var oppColor = (myColor === BLACK) ? WHITE : BLACK;

    var myTimer = (myColor === BLACK) ? timerData.black : timerData.white;
    var oppTimer = (oppColor === BLACK) ? timerData.black : timerData.white;

    var isMyTurn = (state.currentTurn === myColor);

    if (!timerData.active || !timerData.config) {
      if (userDigits) userDigits.textContent = '무제한';
      if (oppDigits) oppDigits.textContent = '무제한';
      if (userByo) userByo.textContent = '시간 제한 없음';
      if (oppByo) oppByo.textContent = '시간 제한 없음';
      if (userCard) {
        userCard.classList.toggle('active-turn', isMyTurn);
        userCard.classList.remove('in-byo', 'urgent');
      }
      if (oppCard) {
        oppCard.classList.toggle('active-turn', !isMyTurn);
        oppCard.classList.remove('in-byo', 'urgent');
      }
      return;
    }

    // 내 타이머 (우측)
    if (myTimer.inByo) {
      if (userDigits) userDigits.textContent = formatTimerDigits(myTimer.byo);
      if (userByo) userByo.textContent = '초읽기 ' + myTimer.byo + '초 (' + myTimer.periods + '회)';
      if (userCard) {
        userCard.classList.add('in-byo');
        userCard.classList.toggle('urgent', myTimer.byo <= 5 && isMyTurn);
      }
    } else {
      if (userDigits) userDigits.textContent = formatTimerDigits(myTimer.main);
      if (userByo) userByo.textContent = '초읽기 ' + timerData.config.byoSeconds + '초 (' + timerData.config.byoPeriods + '회)';
      if (userCard) userCard.classList.remove('in-byo', 'urgent');
    }

    // 상대 타이머 (좌측)
    if (oppTimer.inByo) {
      if (oppDigits) oppDigits.textContent = formatTimerDigits(oppTimer.byo);
      if (oppByo) oppByo.textContent = '초읽기 ' + oppTimer.byo + '초 (' + oppTimer.periods + '회)';
      if (oppCard) {
        oppCard.classList.add('in-byo');
        oppCard.classList.toggle('urgent', oppTimer.byo <= 5 && !isMyTurn);
      }
    } else {
      if (oppDigits) oppDigits.textContent = formatTimerDigits(oppTimer.main);
      if (oppByo) oppByo.textContent = '초읽기 ' + timerData.config.byoSeconds + '초 (' + timerData.config.byoPeriods + '회)';
      if (oppCard) oppCard.classList.remove('in-byo', 'urgent');
    }

    if (userCard) userCard.classList.toggle('active-turn', isMyTurn);
    if (oppCard) oppCard.classList.toggle('active-turn', !isMyTurn);

    var turnText = document.getElementById('timerTurnText');
    if (turnText) {
      var botName = (state.mode === 'ai') ? BOTS[state.difficulty].name : '상대';
      turnText.textContent = isMyTurn
        ? (myColor === BLACK ? '⚫ 내 시간' : '⚪ 내 시간')
        : ((oppColor === BLACK ? '⚫ ' : '⚪ ') + botName + '의 시간');
    }
  }

  function startTimerInterval() {
    clearInterval(timerData.intervalId);
    if (!timerData.active || state.isGameOver || state.isFreePlacementActive) return;
    timerData.intervalId = setInterval(onTimerTick, 1000);
  }

  function pauseTimerInterval() {
    clearInterval(timerData.intervalId);
    timerData.intervalId = null;
  }

  function onTimerTick() {
    if (!timerData.active || state.isGameOver || state.isFreePlacementActive) return;

    var cur = (state.currentTurn === BLACK) ? timerData.black : timerData.white;
    if (cur.main > 0) {
      cur.main--;
      if (cur.main === 0) {
        cur.inByo = true;
        cur.byo = timerData.config.byoSeconds;
        toast((state.currentTurn === BLACK ? '흑' : '백') + ' 기본 시간 종료! 초읽기 시작.');
      }
    } else if (cur.inByo) {
      cur.byo--;
      if (cur.byo <= 5 && cur.byo > 0) {
        audio.playCountdownBeep(false);
      }
      if (cur.byo <= 0) {
        cur.periods--;
        if (cur.periods > 0) {
          audio.playCountdownBeep(true);
          toast((state.currentTurn === BLACK ? '흑' : '백') + ' 초읽기 1회 소진! (남은 초읽기: ' + cur.periods + '회)');
          cur.byo = timerData.config.byoSeconds;
        } else {
          audio.playCountdownBeep(true);
          handleTimeoutGameOver(state.currentTurn);
          return;
        }
      }
    }
    updateTimerUI();
  }

  function onPlayerMovedTimer(color) {
    if (!timerData.active || !timerData.config) return;
    var moved = (color === BLACK) ? timerData.black : timerData.white;
    if (moved.inByo) {
      moved.byo = timerData.config.byoSeconds;
    }
    updateTimerUI();
  }

  function handleTimeoutGameOver(loserColor) {
    pauseTimerInterval();
    state.isGameOver = true;
    var winnerColor = (loserColor === BLACK) ? WHITE : BLACK;
    var loserName = (loserColor === BLACK) ? '흑' : '백';
    var winnerName = (winnerColor === BLACK) ? '흑' : '백';
    var isUserWin = (state.mode === 'ai') ? (state.humanColor === winnerColor) : true;

    var title = document.getElementById('resultTitle');
    var desc = document.getElementById('resultDesc');
    var statsTable = document.getElementById('resultStatsTable');

    if (title) {
      if (state.mode === 'ai') {
        title.textContent = isUserWin ? '🎉 승리! (AI 시간패)' : '⏰ 시간패 (제한 시간 초과)';
      } else {
        title.textContent = '⏰ ' + winnerName + ' 시간승 (' + loserName + ' 시간초과)!';
      }
    }
    if (desc) {
      desc.textContent = loserName + '의 제한 시간 및 초읽기가 모두 소진되어 ' + winnerName + '의 시간승으로 대국이 종료되었습니다.';
    }
    if (statsTable) {
      statsTable.innerHTML = `
        <div class="result-stat-row"><span>진행된 총 수수</span><span>${engine.moves.length}수</span></div>
        <div class="result-stat-row"><span>따낸 돌 (흑)</span><span>${engine.blackCaptures}개</span></div>
        <div class="result-stat-row"><span>따낸 돌 (백)</span><span>${engine.whiteCaptures}개</span></div>
        <div class="result-stat-row"><span>승패 결과</span><span>${winnerName} 시간승</span></div>
      `;
    }

    if (resultModal) {
      resultModal.removeAttribute('hidden');
      resultModal.style.display = 'flex';
    }
    toast('⏰ ' + loserName + ' 시간초과! ' + winnerName + ' 시간승!');
    updateStatus();
    updateTimerUI();
  }

  function initMatchTimer(timeKey) {
    pauseTimerInterval();
    if (!timeKey || timeKey === 'none' || !TIMER_CONFIGS[timeKey]) {
      timerData.active = false;
      timerData.config = null;
      updateTimerUI();
      return;
    }

    var cfg = TIMER_CONFIGS[timeKey];
    timerData.active = true;
    timerData.config = cfg;
    timerData.black = { main: cfg.mainSeconds, byo: cfg.byoSeconds, periods: cfg.byoPeriods, inByo: false };
    timerData.white = { main: cfg.mainSeconds, byo: cfg.byoSeconds, periods: cfg.byoPeriods, inByo: false };

    updateStatus();

    updateTimerUI();
    layoutBoard();
    if (!state.isFreePlacementActive && !state.isGameOver) {
      startTimerInterval();
    }
  }

  /* ---------- 인간 착수 처리 ---------- */
  function handleHumanMove(c, r) {
    if (state.isGameOver || state.isThinking) return;

    // 🎨 프리 접바둑 자유 배치 모드일 때
    if (state.isFreePlacementActive) {
      if (engine.board[r][c] === BLACK) {
        engine.board[r][c] = 0;
        state.freeStones = state.freeStones.filter(function (pt) { return !(pt.x === c && pt.y === r); });
      } else {
        engine.board[r][c] = BLACK;
        state.freeStones.push({ x: c, y: r });
      }
      audio.playPlaceSound(BLACK);
      var cntEl = document.getElementById('freePlacedCount');
      if (cntEl) cntEl.textContent = state.freeStones.length;
      drawBoard();
      return;
    }

    if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
      toast('AI가 생각 중입니다. 잠시만 기다려 주세요.');
      return;
    }

    if (state.mode === 'live' && window.LiveP2P) {
      if (!window.LiveP2P.canMove(state.currentTurn)) {
        toast('상대방이 둘 차례입니다. 잠시만 기다려 주세요.');
        return;
      }
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
    var movedPlayer = state.currentTurn;
    state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;
    state.showingTerritory = false;
    onPlayerMovedTimer(movedPlayer);

    if (state.mode === 'live' && window.LiveP2P) {
      window.LiveP2P.broadcastMove(c, r, movedPlayer);
    }

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
    if (timerData.active) {
      if (aiThinkingBadge) aiThinkingBadge.hidden = true;
      var turnText = document.getElementById('timerTurnText');
      if (turnText) turnText.textContent = '⏳ ' + bot.name + ' 수읽기 중...';
    } else {
      if (aiThinkingName) aiThinkingName.textContent = bot.name + ' (' + bot.title + ')';
      if (aiThinkingBadge) {
        aiThinkingBadge.hidden = false;
        layoutBoard();
      }
    }
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
      onPlayerMovedTimer(aiColor);

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
    onPlayerMovedTimer(aiColor);
    drawBoard();
    updateStatus();
  }

  /* ---------- 양쪽 연속 패스로 인한 대국 종료 및 계가 ---------- */
  function handleDoublePassGameOver() {
    pauseTimerInterval();
    state.isGameOver = true;
    toast('양 대국자가 연속으로 패스하여 대국이 종료되었습니다!');
    doCountTerritory(true);
  }

  /* ---------- 계가(집 계산) 실행 ---------- */
  function doCountTerritory(fromPass) {
    pauseTimerInterval();
    var score = engine.calculateScore(engine.komi !== undefined ? engine.komi : 6.5);
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

    var passCol = state.currentTurn;
    if (state.mode === 'live' && window.LiveP2P) {
      window.LiveP2P.broadcastPass(passCol);
    }
    state.currentTurn = (state.currentTurn === BLACK) ? WHITE : BLACK;
    onPlayerMovedTimer(passCol);
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

    pauseTimerInterval();
    state.isGameOver = true;
    if (state.mode === 'live' && window.LiveP2P) {
      window.LiveP2P.broadcastResign(state.currentTurn);
    }
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

  /* ---------- 🎲 돌가리기 (랜덤) 결과 모달 제어 ---------- */
  var nigiriCountdownTimer = null;

  function showNigiriModal(onCloseCallback) {
    var modal = document.getElementById('nigiriModal');
    if (!modal) {
      if (onCloseCallback) onCloseCallback();
      return;
    }

    var isUserBlack = (state.humanColor === BLACK);
    var bot = (state.mode === 'ai' && BOTS[state.difficulty]) ? BOTS[state.difficulty] : null;
    var oppName = bot ? bot.name : '2P (상대)';
    var oppImgSrc = bot ? bot.img : '../alkkagi/bullterrier/01-idle.png';
    var userImgSrc = ARENA_AVATARS[currentAvatarIdx] ? ARENA_AVATARS[currentAvatarIdx].src : '../alkkagi/bullterrier/01-idle.png';

    // 1. 내 카드 정보
    var userImg = document.getElementById('nigiriUserImg');
    if (userImg) userImg.src = userImgSrc;
    var userName = document.getElementById('nigiriUserName');
    if (userName) userName.textContent = isUserBlack ? '나 (흑)' : '나 (백)';
    var userStone = document.getElementById('nigiriUserStoneBadge');
    if (userStone) {
      userStone.textContent = isUserBlack ? '⚫ 흑돌' : '⚪ 백돌';
      userStone.className = 'nigiri-stone-badge' + (isUserBlack ? '' : ' white');
    }
    var userRole = document.getElementById('nigiriUserRole');
    if (userRole) userRole.textContent = isUserBlack ? '선공 (먼저 착수)' : '후공 (덤 6.5집)';

    var userBox = document.getElementById('nigiriUserBox');
    if (userBox) userBox.classList.toggle('is-first', isUserBlack);

    // 2. 상대 카드 정보
    var oppImg = document.getElementById('nigiriOppImg');
    if (oppImg) oppImg.src = oppImgSrc;
    var oppNameEl = document.getElementById('nigiriOppName');
    if (oppNameEl) oppNameEl.textContent = oppName;
    var oppStone = document.getElementById('nigiriOppStoneBadge');
    if (oppStone) {
      oppStone.textContent = !isUserBlack ? '⚫ 흑돌' : '⚪ 백돌';
      oppStone.className = 'nigiri-stone-badge' + (!isUserBlack ? '' : ' white');
    }
    var oppRole = document.getElementById('nigiriOppRole');
    if (oppRole) oppRole.textContent = !isUserBlack ? '선공 (먼저 착수)' : '후공 (덤 6.5집)';

    var oppBox = document.getElementById('nigiriOppBox');
    if (oppBox) oppBox.classList.toggle('is-first', !isUserBlack);

    // 3. 안내 배너 문구
    var alertEl = document.getElementById('nigiriResultAlert');
    if (alertEl) {
      if (isUserBlack) {
        alertEl.innerHTML = '🎉 내가 <strong>흑돌(선공)</strong>을 잡았습니다! 먼저 바둑판에 돌을 놓으세요.';
        alertEl.className = 'nigiri-result-alert';
      } else {
        alertEl.innerHTML = '⚪ 내가 <strong>백돌(후공)</strong>을 잡았습니다. 상대(' + oppName + ')의 선공으로 시작합니다!';
        alertEl.className = 'nigiri-result-alert white-alert';
      }
    }

    // 모달 표시
    modal.removeAttribute('hidden');
    modal.style.display = 'flex';

    // 4. 5초 카운트다운
    var remainingSeconds = 5;
    var countText = document.getElementById('nigiriCountdownText');
    if (countText) countText.textContent = '(' + remainingSeconds + '초)';

    clearInterval(nigiriCountdownTimer);

    function closeNigiri() {
      clearInterval(nigiriCountdownTimer);
      nigiriCountdownTimer = null;
      modal.setAttribute('hidden', '');
      modal.style.display = 'none';
      if (onCloseCallback) {
        var cb = onCloseCallback;
        onCloseCallback = null;
        cb();
      }
    }

    nigiriCountdownTimer = setInterval(function () {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        closeNigiri();
      } else {
        if (countText) countText.textContent = '(' + remainingSeconds + '초)';
      }
    }, 1000);

    var btnConfirm = document.getElementById('btnNigiriConfirm');
    if (btnConfirm) {
      btnConfirm.onclick = function () {
        closeNigiri();
      };
    }
  }

  /* ---------- 새 대국 시작 (초기화) ---------- */
  function startNewGame(customOpts) {
    var freePlacementMode = false;
    var wasRandomNigiri = false;

    if (customOpts) {
      if (customOpts.mode) { state.mode = customOpts.mode; localStorage.setItem('play_mode', customOpts.mode); }
      if (customOpts.difficulty) { state.difficulty = customOpts.difficulty; localStorage.setItem('play_ai_difficulty', customOpts.difficulty); }
      if (customOpts.boardSize) { state.boardSize = parseInt(customOpts.boardSize, 10); localStorage.setItem('play_board_size', state.boardSize); }
      if (customOpts.colorChoice) {
        state.colorChoice = customOpts.colorChoice;
        localStorage.setItem('play_color_choice', customOpts.colorChoice);
        if (customOpts.colorChoice === 'random') {
          state.humanColor = Math.random() < 0.5 ? BLACK : WHITE;
          wasRandomNigiri = true;
        } else {
          state.humanColor = parseInt(customOpts.colorChoice, 10);
        }
        localStorage.setItem('play_human_color', state.humanColor);
      } else if (state.colorChoice === 'random') {
        state.humanColor = Math.random() < 0.5 ? BLACK : WHITE;
        wasRandomNigiri = true;
      }
      if (customOpts.timeLimit !== undefined) {
        state.timeLimit = customOpts.timeLimit;
        localStorage.setItem('play_time_limit', customOpts.timeLimit);
      }
      if (customOpts.handicap !== undefined) {
        if (customOpts.handicap === 'free') {
          if (customOpts.freeMode === 'custom') {
            freePlacementMode = true;
            state.handicap = 'free';
          } else {
            state.handicap = customOpts.freeCount || 10;
          }
        } else {
          state.handicap = parseInt(customOpts.handicap, 10);
        }
        localStorage.setItem('play_handicap', String(state.handicap));
      }
    } else if (state.colorChoice === 'random') {
      state.humanColor = Math.random() < 0.5 ? BLACK : WHITE;
      wasRandomNigiri = true;
    }

    state.isGameOver = false;
    state.isThinking = false;
    state.showingTerritory = false;
    state.lastMove = null;
    state.freeStones = [];
    state.isFreePlacementActive = freePlacementMode;

    if (resultModal) { resultModal.setAttribute('hidden', ''); resultModal.style.display = 'none'; }
    if (aiThinkingBadge) aiThinkingBadge.hidden = true;

    engine = new window.BadukEngine(state.boardSize);
    ai = new window.BadukAI(state.boardSize);
    ai.setSize(state.boardSize);

    var freeBanner = document.getElementById('freePlacementBanner');

    if (freePlacementMode) {
      // 🎨 직접 판에 놓기 모드 활성화
      if (freeBanner) freeBanner.hidden = false;
      var cntEl = document.getElementById('freePlacedCount');
      if (cntEl) cntEl.textContent = '0';

      state.currentTurn = BLACK;
      engine.currentTurn = BLACK;
      engine.komi = 0.5;

      layoutBoard();
      updateStatus();
      initMatchTimer('none'); // 배치 중에는 시계 정지
      toast('🎨 바둑판을 클릭해 흑돌을 자유롭게 배치한 후 [배치 완료]를 누르세요.');
      return;
    }

    if (freeBanner) freeBanner.hidden = true;

    // 접바둑 화점 바둑돌 초기 배치
    var hCount = (typeof state.handicap === 'number') ? state.handicap : 0;
    var hPoints = getHandicapPoints(state.boardSize, hCount);
    if (hPoints.length > 0) {
      hPoints.forEach(function (pt) {
        engine.board[pt[1]][pt[0]] = BLACK;
      });
      engine.initialStones = hPoints.map(function (pt) {
        return { x: pt[0], y: pt[1], color: BLACK };
      });
      // 접바둑의 경우 백이 첫 착수
      state.currentTurn = WHITE;
      engine.currentTurn = WHITE;
      engine.komi = 0.5;
    } else if (state.handicap === 1) {
      // 정선 (덤 0.5집)
      state.currentTurn = BLACK;
      engine.currentTurn = BLACK;
      engine.komi = 0.5;
    } else {
      // 호선 (덤 6.5집)
      state.currentTurn = BLACK;
      engine.currentTurn = BLACK;
      engine.komi = 6.5;
    }

    layoutBoard();
    updateStatus();
    initArenaAvatar();

    var ruleName = hCount >= 2 ? (hCount + '점 접바둑') : (state.handicap === 1 ? '정선(덤 0.5집)' : '호선(덤 6.5집)');
    var oppName = state.mode === 'ai' ? (BOTS[state.difficulty].avatar + ' ' + BOTS[state.difficulty].name) : '👥 2인 대국';
    var myColText = (state.humanColor === BLACK ? '내 돌: 흑⚫' : '내 돌: 백⚪');

    if (wasRandomNigiri) {
      // 🎲 돌가리기 결과 모달을 5초 동안 넉넉하고 크게 표시
      showNigiriModal(function () {
        initMatchTimer(state.timeLimit);
        toast('대국 시작! (' + oppName + ' · ' + myColText + ' · ' + state.boardSize + '줄 ' + ruleName + ')');
        if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
          triggerAiMove();
        }
      });
    } else {
      initMatchTimer(state.timeLimit);
      toast('새 대국 시작! (' + oppName + ' · ' + myColText + ' · ' + state.boardSize + '줄 ' + ruleName + ')');
      if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
        triggerAiMove();
      }
    }
  }

  /* ---------- 새 대국 설정 모달 제어 ---------- */
  var pendingMatchOpts = {
    mode: state.mode,
    difficulty: state.difficulty,
    boardSize: state.boardSize,
    colorChoice: state.colorChoice,
    handicap: state.handicap,
    freeMode: 'preset',
    freeCount: 10,
    timeLimit: state.timeLimit
  };

  function syncMatchModalUI() {
    pendingMatchOpts.mode = state.mode;
    pendingMatchOpts.difficulty = state.difficulty;
    pendingMatchOpts.boardSize = state.boardSize;
    pendingMatchOpts.colorChoice = state.colorChoice;
    pendingMatchOpts.handicap = state.handicap;
    pendingMatchOpts.timeLimit = state.timeLimit;

    // 모드: AI 대국은 AI만, 일반 대국(PVP)은 일반 대국만 표시
    var chipAi = document.querySelector('#matchModeChips [data-mode="ai"]');
    var chipPvp = document.querySelector('#matchModeChips [data-mode="pvp"]');
    if (pendingMatchOpts.mode === 'pvp') {
      if (chipAi) { chipAi.style.display = 'none'; chipAi.classList.remove('active'); }
      if (chipPvp) { chipPvp.style.display = 'inline-flex'; chipPvp.classList.add('active'); }
    } else {
      if (chipAi) { chipAi.style.display = 'inline-flex'; chipAi.classList.add('active'); }
      if (chipPvp) { chipPvp.style.display = 'none'; chipPvp.classList.remove('active'); }
    }
    var aiDiffSec = document.getElementById('matchAiDifficultySection');
    if (aiDiffSec) aiDiffSec.style.display = (pendingMatchOpts.mode === 'ai') ? 'flex' : 'none';

    // 내 돌 선택 DOM 순서 보장 (돌가리기 랜덤이 항상 맨 앞)
    var colorChipsContainer = document.getElementById('matchColorChips');
    if (colorChipsContainer) {
      var randomChip = colorChipsContainer.querySelector('[data-color="random"]');
      if (randomChip && colorChipsContainer.firstElementChild !== randomChip) {
        colorChipsContainer.insertBefore(randomChip, colorChipsContainer.firstElementChild);
      }
    }

    // AI 난이도
    document.querySelectorAll('#matchBotGrid .match-bot-card').forEach(function (card) {
      card.classList.toggle('active', card.dataset.bot === pendingMatchOpts.difficulty);
    });

    // 판 크기
    document.querySelectorAll('#matchSizeChips .match-chip').forEach(function (btn) {
      btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === pendingMatchOpts.boardSize);
    });

    // 내 돌 선택
    document.querySelectorAll('#matchColorChips .match-chip').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.color === String(pendingMatchOpts.colorChoice));
    });

    // 치수 / 접바둑
    var isFreeActive = (pendingMatchOpts.handicap === 'free' || (typeof pendingMatchOpts.handicap === 'number' && pendingMatchOpts.handicap > 9));
    document.querySelectorAll('#matchHandicapChips .match-chip').forEach(function (btn) {
      if (btn.dataset.handicap === 'free') {
        btn.classList.toggle('active', isFreeActive);
      } else {
        btn.classList.toggle('active', !isFreeActive && parseInt(btn.dataset.handicap, 10) === pendingMatchOpts.handicap);
      }
    });

    // 프리 접바둑 세부 패널
    var freeSub = document.getElementById('freeHandicapSub');
    if (freeSub) {
      freeSub.style.display = isFreeActive ? 'block' : 'none';
    }

    // 제한 시간 칩
    document.querySelectorAll('#matchTimeChips .match-chip').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.time === pendingMatchOpts.timeLimit);
    });
  }

  function openMatchModal() {
    var modal = document.getElementById('matchModal');
    if (modal) {
      syncMatchModalUI();
      modal.removeAttribute('hidden');
      modal.style.display = 'flex';
    }
  }

  function closeMatchModal() {
    var modal = document.getElementById('matchModal');
    if (modal) {
      modal.setAttribute('hidden', '');
      modal.style.display = 'none';
    }
  }

  function bindMatchModalEvents() {
    // 툴바의 새 대국 (옵션) 버튼
    var btnOpen = document.getElementById('btnOpenMatchModal');
    if (btnOpen) {
      btnOpen.addEventListener('click', openMatchModal);
    }

    // 모달 닫기 버튼들
    var btnClose = document.getElementById('btnCloseMatchModal');
    if (btnClose) btnClose.addEventListener('click', closeMatchModal);
    var btnCancel = document.getElementById('btnCancelMatch');
    if (btnCancel) btnCancel.addEventListener('click', closeMatchModal);

    // 모드 칩
    document.querySelectorAll('#matchModeChips .match-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#matchModeChips .match-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        pendingMatchOpts.mode = btn.dataset.mode;
        var aiDiffSec = document.getElementById('matchAiDifficultySection');
        if (aiDiffSec) aiDiffSec.style.display = (pendingMatchOpts.mode === 'ai') ? 'flex' : 'none';
      });
    });

    // AI 봇 카드
    document.querySelectorAll('#matchBotGrid .match-bot-card').forEach(function (card) {
      card.addEventListener('click', function () {
        document.querySelectorAll('#matchBotGrid .match-bot-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        pendingMatchOpts.difficulty = card.dataset.bot;
      });
    });

    // 판 크기
    document.querySelectorAll('#matchSizeChips .match-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#matchSizeChips .match-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        pendingMatchOpts.boardSize = parseInt(btn.dataset.size, 10);
      });
    });

    // 내 돌 선택
    document.querySelectorAll('#matchColorChips .match-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#matchColorChips .match-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        pendingMatchOpts.colorChoice = btn.dataset.color;
      });
    });

    // 치수 및 접바둑
    document.querySelectorAll('#matchHandicapChips .match-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#matchHandicapChips .match-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var freeSub = document.getElementById('freeHandicapSub');
        if (btn.dataset.handicap === 'free') {
          pendingMatchOpts.handicap = 'free';
          if (freeSub) freeSub.style.display = 'block';
        } else {
          pendingMatchOpts.handicap = parseInt(btn.dataset.handicap, 10);
          if (freeSub) freeSub.style.display = 'none';
        }
      });
    });

    // 프리 접바둑 프리셋 선택
    document.querySelectorAll('#freePresetChips .free-preset-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#freePresetChips .free-preset-chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var preset = chip.dataset.freePreset || chip.dataset.count;
        if (preset === 'custom') {
          pendingMatchOpts.freeMode = 'custom';
        } else {
          pendingMatchOpts.freeMode = 'preset';
          var count = parseInt(preset, 10);
          pendingMatchOpts.freeCount = count;
          var inp = document.getElementById('inputFreeCount');
          if (inp) inp.value = count;
        }
      });
    });

    // 프리 접바둑 수량 증감 버튼
    var btnDec = document.getElementById('btnDecFreeCount');
    var btnInc = document.getElementById('btnIncFreeCount');
    var inputFree = document.getElementById('inputFreeCount');

    if (btnDec && inputFree) {
      btnDec.addEventListener('click', function () {
        var val = Math.max(2, (parseInt(inputFree.value, 10) || 10) - 1);
        inputFree.value = val;
        pendingMatchOpts.freeMode = 'preset';
        pendingMatchOpts.freeCount = val;
        document.querySelectorAll('#freePresetChips .free-preset-chip').forEach(function (c) {
          c.classList.toggle('active', (c.dataset.freePreset === String(val) || c.dataset.count === String(val)));
        });
      });
    }

    if (btnInc && inputFree) {
      btnInc.addEventListener('click', function () {
        var val = Math.min(25, (parseInt(inputFree.value, 10) || 10) + 1);
        inputFree.value = val;
        pendingMatchOpts.freeMode = 'preset';
        pendingMatchOpts.freeCount = val;
        document.querySelectorAll('#freePresetChips .free-preset-chip').forEach(function (c) {
          c.classList.toggle('active', (c.dataset.freePreset === String(val) || c.dataset.count === String(val)));
        });
      });
    }

    if (inputFree) {
      inputFree.addEventListener('change', function () {
        var val = Math.max(2, Math.min(25, parseInt(inputFree.value, 10) || 10));
        inputFree.value = val;
        pendingMatchOpts.freeMode = 'preset';
        pendingMatchOpts.freeCount = val;
      });
    }

    // 제한 시간 선택
    document.querySelectorAll('#matchTimeChips .match-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#matchTimeChips .match-chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        pendingMatchOpts.timeLimit = btn.dataset.time;
      });
    });

    // 프리 접바둑 판 위 배치 완료 버튼
    var btnFreeDone = document.getElementById('btnFreePlacementDone');
    if (btnFreeDone) {
      btnFreeDone.addEventListener('click', function () {
        if (!state.isFreePlacementActive) return;
        if (state.freeStones.length === 0) {
          toast('돌을 1개 이상 바둑판에 놓아주세요.');
          return;
        }

        state.isFreePlacementActive = false;
        var banner = document.getElementById('freePlacementBanner');
        if (banner) banner.hidden = true;

        engine.initialStones = state.freeStones.map(function (pt) {
          return { x: pt.x, y: pt.y, color: BLACK };
        });
        state.handicap = state.freeStones.length;
        state.currentTurn = WHITE;
        engine.currentTurn = WHITE;
        engine.komi = 0.5;

        toast('프리 접바둑 (' + state.freeStones.length + '점) 배치가 완료되었습니다! 대국을 시작합니다.');
        updateStatus();
        drawBoard();

        initMatchTimer(state.timeLimit);

        if (state.mode === 'ai' && state.currentTurn !== state.humanColor) {
          triggerAiMove();
        }
      });
    }

    // 프리 접바둑 판 위 배치 전체 지우기 버튼
    var btnFreeReset = document.getElementById('btnFreePlacementReset');
    if (btnFreeReset) {
      btnFreeReset.addEventListener('click', function () {
        if (!state.isFreePlacementActive) return;
        state.freeStones.forEach(function (pt) {
          engine.board[pt.y][pt.x] = 0;
        });
        state.freeStones = [];
        var cntEl = document.getElementById('freePlacedCount');
        if (cntEl) cntEl.textContent = '0';
        drawBoard();
        toast('배치한 바둑돌을 모두 지웠습니다.');
      });
    }

    // 대국 시작 버튼
    var btnStart = document.getElementById('btnStartCustomMatch');
    if (btnStart) {
      btnStart.addEventListener('click', function () {
        closeMatchModal();
        startNewGame(pendingMatchOpts);
      });
    }

    // 결과 모달의 '한 판 더 두기' 버튼
    var btnAgain = document.getElementById('btnResultAgain');
    if (btnAgain) {
      btnAgain.addEventListener('click', function () {
        if (resultModal) { resultModal.setAttribute('hidden', ''); resultModal.style.display = 'none'; }
        openMatchModal();
      });
    }
  }

  function bindEvents() {
    // 1. 바둑판 캔버스 클릭
    boardCanvas.addEventListener('click', function (e) {
      state.hoverPos = null;
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

    // 🌟 1-2. 바둑판 마우스 이동 시 임시 돌 모양 가이드 (Hover Ghost Stone)
    boardCanvas.addEventListener('mousemove', function (e) {
      var rect = boardCanvas.getBoundingClientRect();
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

        if (dist <= cs * 0.48 && engine.board[row][col] === 0) {
          var canHover = true;
          if (state.isGameOver || state.showingTerritory) {
            canHover = false;
          } else if (state.isFreePlacementActive) {
            canHover = true;
          } else if (state.mode === 'ai') {
            var isMyTurn = (state.currentTurn === state.humanColor);
            if (!isMyTurn || state.isThinking) canHover = false;
          } else if (state.mode === 'live') {
            if (window.LiveP2P && !window.LiveP2P.canMove(state.currentTurn)) canHover = false;
          }

          if (canHover) {
            if (!state.hoverPos || state.hoverPos.x !== col || state.hoverPos.y !== row) {
              state.hoverPos = { x: col, y: row };
              boardCanvas.style.cursor = 'pointer';
              drawBoard();
            }
            return;
          }
        }
      }

      if (state.hoverPos !== null) {
        state.hoverPos = null;
        boardCanvas.style.cursor = 'default';
        drawBoard();
      }
    });

    boardCanvas.addEventListener('mouseleave', function () {
      if (state.hoverPos !== null) {
        state.hoverPos = null;
        boardCanvas.style.cursor = 'default';
        drawBoard();
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
  function updateSettingsUI() {
    // 테마
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.theme === state.theme);
    });
    // 바둑판 재질 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.skin === state.boardSkin);
    });
    // 바둑알 디자인
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.stone === state.stoneStyle);
    });
    // 착수음 종류
    document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.sound === state.soundType);
    });
    // 음량 조절
    var volRange = document.getElementById('volumeSlider') || document.getElementById('volRange');
    var volVal = document.getElementById('volumeVal');
    if (volRange) {
      var v = Math.round(state.volume * 100);
      volRange.value = v;
      if (volVal) volVal.textContent = v + '%';
    }
  }

  function bindSettingsEvents() {
    // 테마
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var theme = btn.dataset.theme;
        playStage.className = 'play-stage theme-' + theme;
        state.theme = theme;
        localStorage.setItem('play_theme', theme);
        updateSettingsUI();
      });
    });

    // 바둑판 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var skin = btn.dataset.skin;
        state.boardSkin = skin;
        localStorage.setItem('baduk_board_skin', skin);
        localStorage.setItem('play_board_skin', skin);
        updateSettingsUI();
        drawBoard();
      });
    });

    // 바둑알 스킨
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var st = btn.dataset.stone;
        state.stoneStyle = st;
        localStorage.setItem('baduk_stone_style', st);
        localStorage.setItem('play_stone_style', st);
        updateSettingsUI();
        drawBoard();
      });
    });

    // 착수음 사운드 종류
    document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var sound = btn.dataset.sound;
        state.soundType = sound;
        localStorage.setItem('baduk_audio_type', sound);
        if (audio && audio.setSoundType) {
          audio.setSoundType(sound);
          audio.playPlaceSound(BLACK);
        }
        updateSettingsUI();
      });
    });

    // 음량 슬라이더
    var volRange = document.getElementById('volumeSlider') || document.getElementById('volRange');
    if (volRange) {
      volRange.addEventListener('input', function () {
        var v = parseFloat(volRange.value) / 100;
        state.volume = v;
        localStorage.setItem('baduk_audio_volume', v);
        if (audio && audio.setVolume) audio.setVolume(v);
        var volVal = document.getElementById('volumeVal');
        if (volVal) volVal.textContent = Math.round(v * 100) + '%';
      });
    }

    // 설정 닫기 버튼
    var btnClose = document.getElementById('btnCloseSettings');
    if (btnClose) {
      btnClose.addEventListener('click', function () {
        var panel = document.getElementById('settingsPanel');
        if (panel) panel.hidden = true;
        if (window.BKSUnifiedNav && window.BKSUnifiedNav.closeSettings) {
          window.BKSUnifiedNav.closeSettings();
        }
      });
    }

    // 다른 탭이나 페이지에서 설정 변경 시 실시간 반영
    window.addEventListener('storage', function (e) {
      if (e.key === 'baduk_stone_style' && e.newValue) {
        state.stoneStyle = e.newValue;
        updateSettingsUI();
        drawBoard();
      } else if (e.key === 'baduk_board_skin' && e.newValue) {
        state.boardSkin = e.newValue;
        updateSettingsUI();
        drawBoard();
      } else if (e.key === 'baduk_audio_volume' && e.newValue) {
        var v = parseFloat(e.newValue);
        state.volume = v;
        if (audio && audio.setVolume) audio.setVolume(v);
        updateSettingsUI();
      } else if (e.key === 'baduk_audio_type' && e.newValue) {
        state.soundType = e.newValue;
        if (audio && audio.setSoundType) audio.setSoundType(e.newValue);
        updateSettingsUI();
      }
    });
  }

  /* ---------- 초기화 및 실행 ---------- */

  /* ---------- 🎭 아레나 캐릭터 교체 시스템 ---------- */
  var ARENA_AVATARS = [
    { name: '불테리어', src: '../alkkagi/bullterrier/01-idle.png' },
    { name: '카피바라', src: '../alkkagi/capybara/01-idle.png' },
    { name: '바둑로봇', src: '../alkkagi/robot/01-idle.png' },
    { name: '햄스터', src: '../alkkagi/hamster/01-idle.png' },
    { name: '페르시안 고양이', src: '../alkkagi/exotic/01-idle.png' },
    { name: '호랑이', src: '../../images/characters/char_tiger_cheer.png' },
    { name: '바둑이', src: '../../images/characters/char_pup_think.png' }
  ];
  var currentAvatarIdx = parseInt(localStorage.getItem('play_arena_avatar_idx') || '0', 10);
  if (isNaN(currentAvatarIdx) || currentAvatarIdx < 0 || currentAvatarIdx >= ARENA_AVATARS.length) {
    currentAvatarIdx = 0;
  }

  function initArenaAvatar() {
    var blackImg = document.getElementById('arenaBlackImg');
    if (blackImg && ARENA_AVATARS[currentAvatarIdx]) {
      blackImg.src = ARENA_AVATARS[currentAvatarIdx].src;
    }
    var btnChange = document.getElementById('btnChangeChar');
    if (btnChange && !btnChange._bound) {
      btnChange._bound = true;
      btnChange.addEventListener('click', function () {
        currentAvatarIdx = (currentAvatarIdx + 1) % ARENA_AVATARS.length;
        var chosen = ARENA_AVATARS[currentAvatarIdx];
        if (blackImg) blackImg.src = chosen.src;
        localStorage.setItem('play_arena_avatar_idx', currentAvatarIdx);
        toast('내 캐릭터가 ' + chosen.name + '(으)로 변경되었습니다!');
      });
    }
  }

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
    bindMatchModalEvents();
    updateSettingsUI();
    layoutBoard();
    updateStatus();
    initMatchTimer(state.timeLimit);
    initArenaAvatar();

    // 🌟 [원장님 지침] AI 대국 및 일반 대국 진입 시 옵션 설정 모달 자동 표시!
    if (!isLiveParam) {
      openMatchModal();
    } else {
      // 실시간 P2P 대국인 경우에만 초기 치수 배치 실행
      if (state.handicap && state.handicap > 0) {
        startNewGame({ handicap: state.handicap, boardSize: state.boardSize, mode: state.mode });
      }
      if (state.mode === 'ai' && state.humanColor === WHITE) {
        triggerAiMove();
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 🌟 실시간 P2P 원격 착수 수신 브릿지 🌟
  window.LiveBridge = {
    applyRemoteMove: function (c, r, color) {
      var res = engine.playMove(c, r, color);
      if (res.success) {
        audio.playPlaceSound(color);
        if (res.captures.length > 0) {
          audio.playCaptureSound();
          toast(res.captures.length + '개의 돌을 따냈습니다!');
        }
        state.lastMove = { x: c, y: r };
        var movedPlayer = color;
        state.currentTurn = (color === BLACK) ? WHITE : BLACK;
        state.showingTerritory = false;
        onPlayerMovedTimer(movedPlayer);
        drawBoard();
        updateStatus();
      }
    },
    applyRemotePass: function (color) {
      var pRes = engine.pass(color);
      toast('상대방이 한 수를 쉬었습니다 (패스).');
      var moves = engine.moves;
      if (moves.length >= 2 && moves[moves.length - 1].isPass && moves[moves.length - 2].isPass) {
        handleDoublePassGameOver();
        return;
      }
      state.currentTurn = (color === BLACK) ? WHITE : BLACK;
      onPlayerMovedTimer(color);
      drawBoard();
      updateStatus();
    },
    applyRemoteResign: function (color) {
      pauseTimerInterval();
      state.isGameOver = true;
      toast('상대방이 기권하여 대국이 종료되었습니다.');
      var title = document.getElementById('resultTitle');
      var desc = document.getElementById('resultDesc');
      if (title) title.textContent = '🎉 승리! (상대 기권)';
      if (desc) desc.textContent = '상대방이 기권하여 불계승을 거두었습니다!';
      var modal = document.getElementById('resultModal');
      if (modal) modal.hidden = false;
    }
  };

  window.PlayApp = {
    state: state,
    get engine() { return engine; },
    handleHumanMove: handleHumanMove
  };

})();
