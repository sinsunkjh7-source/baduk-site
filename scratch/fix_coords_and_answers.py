# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update state: replace showCoords with coordMode, add answer multi-step fields
old_state_coords = '''    showAtari: true,            // 🚨 단수 링 (기본 ON)
    showSweat: true,            // 💦 3D 땀방울 (기본 ON)
    showCoords: true,          // 🔤 좌표 표시
    showStepNumbers: false      // 🔢 수순 번호'''

new_state_coords = '''    showAtari: true,            // 🚨 단수 링 (기본 ON)
    showSweat: true,            // 💦 3D 땀방울 (기본 ON)
    coordMode: 'right-bottom',  // 🔤 좌표 회전 모드: 'right-bottom'(우측·하단) | 'left-top'(좌·상) | 'all-four'(전체) | 'none'(숨김)
    showStepNumbers: false,     // 🔢 수순 번호

    // 🌟 다중 수순 및 순서 무관 활로 정답 판정 엔진 🌟
    answerBranches: [],         // 모든 정답 수순 분기 [[move1, move2], ...]
    activeBranches: [],         // 현재 유효한 분기들
    playedMoves: [],            // 현재 문제 풀이에서 둔 착수 목록
    isOpponentResponding: false // 상대방(컴퓨터) 응수 대기 플래그'''

assert old_state_coords in js, "old_state_coords not found"
js = js.replace(old_state_coords, new_state_coords)

# 2. Update parseProblemSgf to parse ALL answer branches (answer1 ~ answer5)
old_parse_answer = '''    // 정답 수순 파싱 (answer1, answer2 등)
    var ansSgf = p.answer1 || p.answer || '';
    if (ansSgf) {
      var aRegex = /;([BW])\\[([a-s]{2})\\]/gi;
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
    }'''

new_parse_answer = '''    // 🌟 [원장님 지침] 모든 정답 수순 분기 파싱 (answer1 ~ answer5) 🌟
    state.answerBranches = [];
    for (var bi = 1; bi <= 5; bi++) {
      var rawAns = p['answer' + bi] || (bi === 1 ? p.answer : '');
      if (rawAns && typeof rawAns === 'string' && rawAns.trim()) {
        var aRegex = /;([BW])\\[([a-s]{2})\\]/gi;
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
    state.isOpponentResponding = false;'''

assert old_parse_answer in js, "old_parse_answer not found"
js = js.replace(old_parse_answer, new_parse_answer)

# 3. Update loadProblem: reset playedMoves and activeBranches
old_load_prob_init = '''    // 🌟 놓아보기 히스토리 초기화
    state.trialMoves = [];
    state.historyStack = [state.board.map(function(row){ return row.slice(); })];
    state.historyIndex = 0;
    state.nextTurn = (p.start && p.start.toUpperCase() === 'W') ? 2 : 1;'''

new_load_prob_init = '''    // 🌟 놓아보기 히스토리 및 문제 풀이 수순 초기화
    state.trialMoves = [];
    state.historyStack = [state.board.map(function(row){ return row.slice(); })];
    state.historyIndex = 0;
    state.playedMoves = [];
    state.isOpponentResponding = false;
    var defColor = 1;
    if (state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
      defColor = state.answerBranches[0][0].color;
    } else if (p.start && p.start.toUpperCase() === 'W') {
      defColor = 2;
    }
    state.nextTurn = defColor;'''

assert old_load_prob_init in js, "old_load_prob_init not found"
js = js.replace(old_load_prob_init, new_load_prob_init)

# 4. Update drawBoard coordinates with right-bottom, left-top, all-four, none rotation
old_draw_coords = '''    // 🌟 [원장님 지침] 바둑판 좌표 표시 (좌·상)
    if (state.showCoords) {
      ctx.fillStyle = '#6d4218';
      ctx.font = 'bold ' + Math.max(10, Math.round(cell * 0.30)) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 상단 가로 좌표 (A, B, C, D...)
      var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      var topCoordY = Math.max(10, Math.round((startY - overhang) * 0.52));
      for (var cc = 0; cc < cols; cc++) {
        var lblX = startX + cell * cc;
        ctx.fillText(colLabels[cc] || (cc + 1), lblX, topCoordY);
      }

      // 좌측 세로 좌표 (1, 2, 3...)
      var leftCoordX = Math.max(10, Math.round((startX - overhang) * 0.52));
      for (var rr = 0; rr < rows; rr++) {
        var lblY = startY + cell * rr;
        ctx.fillText(rows - rr, leftCoordX, lblY);
      }
    }'''

new_draw_coords = '''    // 🌟 [원장님 지침] 바둑판 좌표 회전 표시 (우측하변 -> 좌상 -> 전체 -> 숨김)
    if (state.coordMode !== 'none') {
      ctx.fillStyle = '#6d4218';
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
    }'''

assert old_draw_coords in js, "old_draw_coords not found"
js = js.replace(old_draw_coords, new_draw_coords)

# 5. Replace normal problem solving click handler with multi-move, order-independent, auto-capture engine
old_click_logic = '''    // 문제 풀이 모드: 이미 돌이 놓여진 자리는 무시
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
    }'''

new_click_logic = '''    // 문제 풀이 모드: 이미 돌이 놓여진 자리는 무시, 상대방 응수 중 클릭 방지
    if (state.board[gy][gx] !== 0 || state.isOpponentResponding) return;

    var p = state.currentProblems[state.currentProblemIndex];
    var myColor = state.nextTurn || 1;
    if (state.answerBranches.length > 0 && state.answerBranches[0].length > 0) {
      if (state.playedMoves.length === 0) {
        myColor = state.answerBranches[0][0].color;
      }
    }
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
      toast('오답입니다. 다시 도전해 보세요! 🤔');
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
      toast('정답입니다! 👏');

      // 🌟 문제 정답 시 1.1초 후 자동으로 다음 문제로 전환
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = setTimeout(function () {
        if (state.currentProblemIndex < state.currentProblems.length - 1) {
          loadProblem(state.currentProblemIndex + 1);
        } else {
          toast('축하합니다! 이 단원의 모든 문제를 완료했습니다! 🎉');
        }
      }, 1100);
    } else {
      // 다음 수가 상대방(컴퓨터) 응수인지 확인
      var nextStep = state.playedMoves.length;
      var nextOppMove = currentBranch[nextStep];
      if (nextOppMove && nextOppMove.color === oppColor) {
        state.isOpponentResponding = true;
        toast('상대방 응수를 확인하세요...');
        setTimeout(function () {
          state.board[nextOppMove.y][nextOppMove.x] = oppColor;
          state.playedMoves.push(nextOppMove);
          state.isOpponentResponding = false;
          sfx('playStone');
          drawBoard();

          // 상대방 응수 후 문제 완료 여부 확인
          if (state.playedMoves.length >= currentBranch.length) {
            state.solved = true;
            var cKey = (state.currentBook ? (state.currentBook.bookCode || '') : '') + '_' + state.currentProblemIndex;
            state.solvedMap[cKey] = true;
            renderProblemGrid();
            sfx('playSuccess');
            toast('정답입니다! 👏');
            clearTimeout(state.autoNextTimer);
            state.autoNextTimer = setTimeout(function () {
              if (state.currentProblemIndex < state.currentProblems.length - 1) {
                loadProblem(state.currentProblemIndex + 1);
              }
            }, 1100);
          }
        }, 500);
      } else {
        // 남은 활로를 연속으로 막아야 하는 다중 착수 문제
        toast('좋아요! 👏 남은 활로도 마저 막아보세요! (' + (currentBranch.length - state.playedMoves.length) + '개 남음)');
      }
    }'''

assert old_click_logic in js, "old_click_logic not found"
js = js.replace(old_click_logic, new_click_logic)

# 6. Update initTeachingToolbar for coordMode rotation
old_init_coords = '''    var btnToggleCoords = document.getElementById('btnToggleCoords');
    if (btnToggleCoords) {
      btnToggleCoords.classList.toggle('active', state.showCoords);
      btnToggleCoords.addEventListener('click', function () {
        state.showCoords = !state.showCoords;
        btnToggleCoords.classList.toggle('active', state.showCoords);
        drawBoard();
      });
    }'''

new_init_coords = '''    var coordModes = ['right-bottom', 'left-top', 'all-four', 'none'];
    var coordLabels = {
      'right-bottom': '🔤 좌표: 우·하',
      'left-top': '🔤 좌표: 좌·상',
      'all-four': '🔤 좌표: 전체',
      'none': '🔤 좌표: 숨김'
    };
    var btnToggleCoords = document.getElementById('btnToggleCoords');
    if (btnToggleCoords) {
      btnToggleCoords.innerHTML = coordLabels[state.coordMode] || '🔤 좌표';
      btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
      btnToggleCoords.addEventListener('click', function () {
        var cIdx = coordModes.indexOf(state.coordMode);
        state.coordMode = coordModes[(cIdx + 1) % coordModes.length];
        btnToggleCoords.innerHTML = coordLabels[state.coordMode];
        btnToggleCoords.classList.toggle('active', state.coordMode !== 'none');
        toast('좌표 모드: ' + coordLabels[state.coordMode].replace('🔤 ', ''));
        drawBoard();
      });
    }'''

assert old_init_coords in js, "old_init_coords not found"
js = js.replace(old_init_coords, new_init_coords)

# 7. Update btnReset event listener to reset playedMoves & activeBranches
old_reset_listener = '''  document.getElementById('btnReset').addEventListener('click', function () {
    state.board = state.initialBoard.map(function (row) { return row.slice(); });
    state.showAnswer = false;
    document.getElementById('btnAnswer').textContent = '👁️ 정답 보기';
    drawBoard();
  });'''

new_reset_listener = '''  document.getElementById('btnReset').addEventListener('click', function () {
    state.board = state.initialBoard.map(function (row) { return row.slice(); });
    state.showAnswer = false;
    state.playedMoves = [];
    state.activeBranches = state.answerBranches.slice();
    state.isOpponentResponding = false;
    document.getElementById('btnAnswer').textContent = '👁️ 정답 보기';
    drawBoard();
  });'''

assert old_reset_listener in js, "old_reset_listener not found"
js = js.replace(old_reset_listener, new_reset_listener)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("teacher/app.js successfully updated with coord rotation and multi-move engine!")
