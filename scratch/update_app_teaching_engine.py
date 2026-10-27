# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update state
old_state = '''    freeMode: false,
    freeColor: 1,         // 1: 흑, 2: 백
    solved: false,
    solvedMap: {},        // { 'bookCode_probIdx': true }
    autoNextTimer: null
  };'''

new_state = '''    freeMode: false,
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
  };'''

assert old_state in js, "old_state not found"
js = js.replace(old_state, new_state)

# 2. Add group & liberty calculation and 3D sweat drop helper functions
tools_helpers = '''
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
'''

# Insert tools_helpers right before loadProblem
old_load_prob_head = '  /* ---------- 단일 문제 로드 ---------- */'
assert old_load_prob_head in js, "old_load_prob_head not found"
js = js.replace(old_load_prob_head, tools_helpers + '\n' + old_load_prob_head)

# 3. In loadProblem: reset trial state
old_load_reset = '''    state.boardSpec = detectBoardSpec(p);
    state.boardCols = state.boardSpec.cols;
    state.boardRows = state.boardSpec.rows;
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSpec);'''

new_load_reset = '''    state.boardSpec = detectBoardSpec(p);
    state.boardCols = state.boardSpec.cols;
    state.boardRows = state.boardSpec.rows;
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSpec);

    // 🌟 놓아보기 히스토리 초기화
    state.trialMoves = [];
    state.historyStack = [state.board.map(function(row){ return row.slice(); })];
    state.historyIndex = 0;
    state.nextTurn = (p.start && p.start.toUpperCase() === 'W') ? 2 : 1;'''

assert old_load_reset in js, "old_load_reset not found"
js = js.replace(old_load_reset, new_load_reset)

# 4. In drawBoard: add Coordinates, Atari Rings, Sweat Drops, and Step Numbers
old_draw_stones = '''    // 5. 돌 그리기 (돌 크기 cell * 0.44)
    var stoneRadius = cell * 0.44;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var v = state.board[y][x];
        if (v) {
          drawStone(startX + cell * x, startY + cell * y, stoneRadius, v);
        }
      }
    }'''

new_draw_stones = '''    // 🌟 [원장님 지침] 바둑판 좌표 표시 (좌·상)
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
    }'''

assert old_draw_stones in js, "old_draw_stones not found"
js = js.replace(old_draw_stones, new_draw_stones)

# 5. Update canvas click handler: add trialMode, stone removal, and captures
old_click_handler = '''    // 자유 모드: 강사가 원하는 색 돌 자유롭게 놓기
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
    if (state.board[gy][gx] !== 0) return;'''

new_click_handler = '''    // 🌟 [원장님 지침] 놓아보기 모드: 자유 착수, 흑/백 연속 착수, 이미 있는 돌 클릭 시 즉시 제거!
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
    if (state.board[gy][gx] !== 0) return;'''

assert old_click_handler in js, "old_click_handler not found"
js = js.replace(old_click_handler, new_click_handler)

# 6. Add history helper and toolbar event listeners
toolbar_listeners = '''
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
'''

# Add initTeachingToolbar call and append toolbar_listeners before the closing of the IIFE
assert 'checkAuth();\n})();' in js, "checkAuth(); not found"
js = js.replace('checkAuth();\n})();', toolbar_listeners + '\n  initTeachingToolbar();\n  checkAuth();\n})();')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("teacher/app.js updated successfully with all teaching tools!")
