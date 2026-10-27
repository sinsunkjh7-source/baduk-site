# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update state definition to add solvedMap and autoNextTimer
old_state_def = '''    boardSpec: null,
    board: [],            // 0: 빈칸, 1: 흑, 2: 백
    initialBoard: [],
    shiftX: 0,
    shiftY: 0,
    answerMoves: [],      // [{x, y, color, step}]
    showAnswer: false,
    freeMode: false,
    freeColor: 1,         // 1: 흑, 2: 백
    solved: false
  };'''

new_state_def = '''    boardSpec: null,
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
    autoNextTimer: null
  };'''

assert old_state_def in js, "old_state_def not found"
js = js.replace(old_state_def, new_state_def)

# 2. Update renderProblemGrid
old_render_grid = '''  function renderProblemGrid() {
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
  }'''

new_render_grid = '''  function renderProblemGrid() {
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
  }'''

assert old_render_grid in js, "old_render_grid not found"
js = js.replace(old_render_grid, new_render_grid)

# 3. Update loadProblem: cancel autoNextTimer and update grid buttons
old_load_prob_btns = '''    // 문제 그리드 활성 버튼 업데이트
    var btns = problemGrid.querySelectorAll('.prob-btn');
    btns.forEach(function (b, i) {
      b.classList.toggle('active', i === idx);
    });'''

new_load_prob_btns = '''    if (state.autoNextTimer) {
      clearTimeout(state.autoNextTimer);
      state.autoNextTimer = null;
    }

    // 문제 그리드 버튼 상태(현재/푼 문제/안 푼 문제) 갱신
    renderProblemGrid();'''

assert old_load_prob_btns in js, "old_load_prob_btns not found"
js = js.replace(old_load_prob_btns, new_load_prob_btns)

# 4. Update layoutBoard & drawBoard
old_layout_and_draw = '''  /* ---------- 바둑판 렌더링 (가로선 9 x 세로선 10, 열린 선 다이어그램) ---------- */
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
  }'''

new_layout_and_draw = '''  /* ---------- 바둑판 렌더링 (가로선 9 x 세로선 10, 열린 선 다이어그램) ---------- */
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
  }'''

assert old_layout_and_draw in js, "old_layout_and_draw not found"
js = js.replace(old_layout_and_draw, new_layout_and_draw)

# 5. Update click handler for auto-next problem and solved status
old_click_end = '''    if (isCorrect) {
      state.solved = true;
      sfx('playSuccess');
      toast('정답입니다! 👏');
    } else {
      sfx('playDdang');
      toast('오답입니다. 다시 도전해 보세요! 🤔');
    }
  });'''

new_click_end = '''    if (isCorrect) {
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
  });'''

assert old_click_end in js, "old_click_end not found"
js = js.replace(old_click_end, new_click_end)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("teacher/app.js updated successfully with all 6 points!")
