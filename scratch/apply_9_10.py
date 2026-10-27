# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace state.boardSize with boardCols/boardRows
old_state = '''    currentProblemIndex: 0,
    boardSize: 9,
    board: [],            // 0: 빈칸, 1: 흑, 2: 백'''

new_state = '''    currentProblemIndex: 0,
    boardCols: 10,        // 🌟 원장님 지침: 세로선 10개
    boardRows: 9,         // 🌟 원장님 지침: 가로선 9개
    boardSpec: null,
    board: [],            // 0: 빈칸, 1: 흑, 2: 백'''

assert old_state in code, "old_state not found"
code = code.replace(old_state, new_state)

# Replace loadProblem boardSize handling
old_load = '''    // 바둑판 크기 자동 판별
    state.boardSize = detectBoardSize(p);
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSize);
    layoutBoard();
    drawBoard();'''

new_load = '''    // 🌟 원 교재 규격 자동 판별: 가로선 9, 세로선 10 (열린 선 다이어그램)
    state.boardSpec = detectBoardSpec(p);
    state.boardCols = state.boardSpec.cols;
    state.boardRows = state.boardSpec.rows;
    
    // SGF 파싱 및 보드 초기화
    parseProblemSgf(p, state.boardSpec);
    layoutBoard();
    drawBoard();'''

assert old_load in code, "old_load not found"
code = code.replace(old_load, new_load)

# Replace detectBoardSize and parseProblemSgf
old_detect_and_parse = '''  /* ---------- 바둑판 크기 자동 판별 ---------- */
  function detectBoardSize(p) {
    if (!p) return 9;
    if (p.size) {
      var s = parseInt(p.size, 10);
      if (s === 19 || s === 13 || s === 9) return s;
      if (s === 1 || s === 2) return 19;
    }
    var points = [];
    var reg = /;([BW])\\[([a-s]{2})\\]/gi;
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
    var testRegex = /;([BW])\\[([a-s]{2})\\]/gi;
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
    var regex = /;([BW])\\[([a-s]{2})\\]/gi;
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
      var aRegex = /;([BW])\\[([a-s]{2})\\]/gi;
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
  }'''

new_detect_and_parse = '''  /* ---------- 🌟 원 교재 규격 판별 (가로선 9, 세로선 10 / 열린 선) ---------- */
  function detectBoardSpec(p) {
    if (!p) return { cols: 10, rows: 9, isFull19: false, quadrant: 'BR' };
    
    var rawSize = p.size ? String(p.size).trim() : '';
    if (rawSize === '1' || rawSize === '2') {
      return { cols: 19, rows: 19, isFull19: true, quadrant: 'FULL19' };
    }

    var points = [];
    var reg = /;([BW])\\[([a-s]{2})\\]/gi;
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
    var regex = /;([BW])\\[([a-s]{2})\\]/gi;
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
    }

    // 원본 상태 복사본
    state.initialBoard = state.board.map(function (row) { return row.slice(); });
  }'''

assert old_detect_and_parse in code, "old_detect_and_parse not found"
code = code.replace(old_detect_and_parse, new_detect_and_parse)

# Replace layoutBoard and drawBoard
old_layout_and_draw = '''  /* ---------- 바둑판 렌더링 ---------- */
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
  }'''

new_layout_and_draw = '''  /* ---------- 바둑판 렌더링 (가로선 9 x 세로선 10, 열린 선 다이어그램) ---------- */
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

assert old_layout_and_draw in code, "old_layout_and_draw not found"
code = code.replace(old_layout_and_draw, new_layout_and_draw)

# Replace click handler coordinate calculation
old_click = '''    var gx = Math.round(px / cell) - 1;
    var gy = Math.round(py / cell) - 1;

    if (gx < 0 || gx >= state.boardSize || gy < 0 || gy >= state.boardSize) return;'''

new_click = '''    var startX = metrics.startX || cell;
    var startY = metrics.startY || cell;
    var gx = Math.round((px - startX) / cell);
    var gy = Math.round((py - startY) / cell);

    if (gx < 0 || gx >= state.boardCols || gy < 0 || gy >= state.boardRows) return;'''

assert old_click in code, "old_click not found"
code = code.replace(old_click, new_click)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("teacher/app.js successfully updated with 9 horizontal x 10 vertical open lines engine!")
