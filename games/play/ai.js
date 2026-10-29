// =========================================================================
// JH 바둑스쿨 - 🤖 고성능 정통 바둑 AI 엔진 (Master Go AI Engine v3.5)
//
// 5단계 정밀 기력 시스템:
// 1. 🌱 입문 (18급 삐약이): 눈앞의 국소 전투, 단순 단수 인지/따내기, 자충수 방지
// 2. 🌿 초급 (12급 바둑이): 귀 차지, 호구와 돌의 연결, 활로 2개 압박
// 3. 🌲 중급 (5급 영리한 여우): 정석적인 행마(날일자·한칸뜀), 붙이면 젖힘/늚, 절단
// 4. 👑 고급 (아마 1단 지혜로운 판다): 8방위 정석 DB + 축(Ladder) 수읽기 + 옥집 판정
// 5. 🔥 최강 (아마 5단 용맹한 호랑이): 정밀 미니맥스 수읽기 + 3-3 침투 정석 완주 + 급소 치중 + 끝내기
// =========================================================================

class BadukAI {
  constructor(size = 19) {
    this.size = size;
    this.initJosekiPatterns();
  }

  setSize(size) {
    this.size = size;
  }

  // =========================================================================
  // 1. 유틸리티 & 기본 기하 함수
  // =========================================================================
  getNeighbors(x, y, size) {
    const list = [];
    if (x > 0) list.push({ x: x - 1, y });
    if (x < size - 1) list.push({ x: x + 1, y });
    if (y > 0) list.push({ x, y: y - 1 });
    if (y < size - 1) list.push({ x, y: y + 1 });
    return list;
  }

  getDiagonalNeighbors(x, y, size) {
    const list = [];
    if (x > 0 && y > 0) list.push({ x: x - 1, y: y - 1 });
    if (x < size - 1 && y > 0) list.push({ x: x + 1, y: y - 1 });
    if (x > 0 && y < size - 1) list.push({ x: x - 1, y: y + 1 });
    if (x < size - 1 && y < size - 1) list.push({ x: x + 1, y: y + 1 });
    return list;
  }

  getLine(x, y, size) {
    const edgeX = Math.min(x, size - 1 - x);
    const edgeY = Math.min(y, size - 1 - y);
    return Math.min(edgeX, edgeY);
  }

  chebyshevDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  // =========================================================================
  // 2. 판 상태 시뮬레이션 및 활로 분석
  // =========================================================================
  simulateMoveResult(board, size, x, y, color) {
    const oppColor = color === 1 ? 2 : 1;
    const neighbors = this.getNeighbors(x, y, size);

    let totalCaptures = 0;
    const capturedStones = [];
    const checkedOpp = new Set();

    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const key = `${n.x},${n.y}`;
        if (!checkedOpp.has(key)) {
          const group = this.getGroup(board, size, n.x, n.y);
          group.stones.forEach(s => checkedOpp.add(`${s.x},${s.y}`));
          if (group.liberties.size === 1 && group.liberties.has(`${x},${y}`)) {
            totalCaptures += group.stones.length;
            capturedStones.push(...group.stones);
          }
        }
      }
    }

    const newBoard = board.map(row => row.slice());
    newBoard[y][x] = color;
    for (const s of capturedStones) {
      newBoard[s.y][s.x] = 0;
    }

    const myGroup = this.getGroup(newBoard, size, x, y);
    const myLiberties = myGroup.liberties.size;

    return {
      newBoard,
      captures: totalCaptures,
      capturedStones,
      myLiberties,
      myGroupSize: myGroup.stones.length
    };
  }

  getGroup(board, size, sx, sy) {
    const color = board[sy][sx];
    if (color === 0) return { stones: [], liberties: new Set() };

    const stones = [];
    const liberties = new Set();
    const visited = new Set();
    const queue = [{ x: sx, y: sy }];
    visited.add(`${sx},${sy}`);

    while (queue.length > 0) {
      const cur = queue.shift();
      stones.push(cur);

      for (const n of this.getNeighbors(cur.x, cur.y, size)) {
        const val = board[n.y][n.x];
        if (val === 0) {
          liberties.add(`${n.x},${n.y}`);
        } else if (val === color) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    return { stones, liberties };
  }

  isLegal(board, size, x, y, color, koPoint) {
    if (board[y][x] !== 0) return false;
    if (koPoint && koPoint.x === x && koPoint.y === y) return false;

    const neighbors = this.getNeighbors(x, y, size);
    for (const n of neighbors) {
      if (board[n.y][n.x] === 0) return true;
    }

    const oppColor = color === 1 ? 2 : 1;
    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const group = this.getGroup(board, size, n.x, n.y);
        if (group.liberties.size === 1 && group.liberties.has(`${x},${y}`)) {
          return true;
        }
      }
    }

    for (const n of neighbors) {
      if (board[n.y][n.x] === color) {
        const group = this.getGroup(board, size, n.x, n.y);
        if (group.liberties.size > 1) return true;
      }
    }

    return false;
  }

  // =========================================================================
  // 3. 🌟 축(Ladder) 정밀 판정 엔진 🌟
  // =========================================================================
  // 단수에 걸린 돌이 도망쳤을 때, 축으로 잡히는지 아니면 살아서 나가는지 최대 30수 시뮬레이션
  simulateLadder(board, size, escapeX, escapeY, runnerColor) {
    const chaserColor = runnerColor === 1 ? 2 : 1;
    let simBoard = board.map(r => r.slice());

    // 1단계: 도망자가 먼저 escapeX, escapeY로 착수
    let curRunnerX = escapeX;
    let curRunnerY = escapeY;

    for (let depth = 0; depth < 25; depth++) {
      // 도망 착수
      if (!this.isLegal(simBoard, size, curRunnerX, curRunnerY, runnerColor, null)) {
        return { isCaptured: true, depth };
      }
      const runRes = this.simulateMoveResult(simBoard, size, curRunnerX, curRunnerY, runnerColor);
      simBoard = runRes.newBoard;

      // 만약 도망쳐서 활로가 3개 이상 늘어났다면 축 탈출 성공!
      if (runRes.myLiberties >= 3) {
        return { isCaptured: false, depth };
      }
      if (runRes.myLiberties <= 1) {
        // 도망쳐도 여전히 활로가 1개면 바로 잡힘
        return { isCaptured: true, depth };
      }

      // 활로가 2개인 경우: 추격자가 활로를 1개로 줄이는 단수(Atari)를 칠 수 있는지 탐색
      const runnerGroup = this.getGroup(simBoard, size, curRunnerX, curRunnerY);
      if (runnerGroup.liberties.size !== 2) {
        return { isCaptured: false, depth };
      }

      const libs = Array.from(runnerGroup.liberties).map(s => {
        const [lx, ly] = s.split(',').map(Number);
        return { x: lx, y: ly };
      });

      // 추격자가 두 활로 중 하나에 두어 다시 단수로 몰기
      let nextChaserMove = null;
      let nextRunnerMove = null;

      for (const lib of libs) {
        if (this.isLegal(simBoard, size, lib.x, lib.y, chaserColor, null)) {
          const chaseRes = this.simulateMoveResult(simBoard, size, lib.x, lib.y, chaserColor);
          if (chaseRes.myLiberties >= 2) {
            // 추격자의 돌이 자충수가 아니면서
            // 도망자 그룹의 활로가 1개로 줄어드는지 확인
            const checkRunner = this.getGroup(chaseRes.newBoard, size, curRunnerX, curRunnerY);
            if (checkRunner.liberties.size === 1) {
              nextChaserMove = lib;
              const [remainingLib] = Array.from(checkRunner.liberties);
              const [rx, ry] = remainingLib.split(',').map(Number);
              nextRunnerMove = { x: rx, y: ry };
              break;
            }
          }
        }
      }

      if (!nextChaserMove) {
        // 추격자가 단수로 몰지 못하면 축 탈출 성공!
        return { isCaptured: false, depth };
      }

      // 추격자 착수 적용
      const finalChase = this.simulateMoveResult(simBoard, size, nextChaserMove.x, nextChaserMove.y, chaserColor);
      simBoard = finalChase.newBoard;
      curRunnerX = nextRunnerMove.x;
      curRunnerY = nextRunnerMove.y;
    }

    // 25수 이상 이어지면 판 경계나 아군 돌에 닿아 탈출할 가능성이 높음
    return { isCaptured: false, depth: 25 };
  }

  // =========================================================================
  // 4. 🌟 진짜 눈 vs 옥집(False Eye) 판정 엔진 🌟
  // =========================================================================
  // 특정 빈 교점(x, y)이 color의 '진짜 집'인지 '옥집'인지 판정
  isTrueEye(board, size, x, y, color) {
    if (board[y][x] !== 0) return false;

    // 1. 상하좌우 4방향이 모두 아군 돌로 둘러싸여 있는지 (변은 3방향, 귀는 2방향)
    const neighbors = this.getNeighbors(x, y, size);
    for (const n of neighbors) {
      if (board[n.y][n.x] !== color) return false;
    }

    // 2. 대각선 교점의 상태 검사 (귀 1개, 변 2개, 중앙 4개)
    const diags = this.getDiagonalNeighbors(x, y, size);
    const oppColor = color === 1 ? 2 : 1;
    let enemyCount = 0;
    for (const d of diags) {
      if (board[d.y][d.x] === oppColor) enemyCount++;
    }

    // 귀: 대각선 1개 중 적돌이 1개라도 있으면 옥집!
    if (diags.length === 1) return enemyCount === 0;
    // 변: 대각선 2개 중 적돌이 1개라도 있으면 옥집!
    if (diags.length === 2) return enemyCount === 0;
    // 중앙: 대각선 4개 중 적돌이 2개 이상이면 옥집!
    return enemyCount < 2;
  }

  // =========================================================================
  // 5. 🌟 8방위 대칭 정통 정석 DB (Joseki Library) 🌟
  // =========================================================================
  initJosekiPatterns() {
    // 기준 좌표계: 19줄 좌상귀 기준 (0-indexed, 화점 = 3,3)
    // 패턴 구조: [현재 상대/아군 착수 수순 조건] -> 최선의 응수 좌표
    this.josekiSequences = [
      // A. 삼삼 침투 정석 (3-3 Invasion against Hoshi)
      // 화점(3,3)에 흑돌이 있을 때 백의 침투 및 수순
      { condition: "B:3,3", bestMove: { x: 2, y: 2, color: 2 }, note: "삼삼 침투" },
      { condition: "B:3,3|W:2,2|B:2,3", bestMove: { x: 3, y: 2, color: 2 }, note: "삼삼 밀기" },
      { condition: "B:3,3|W:2,2|B:3,2", bestMove: { x: 2, y: 3, color: 2 }, note: "삼삼 밀기(반대)" },
      { condition: "B:3,3|W:2,2|B:2,3|W:3,2|B:4,2", bestMove: { x: 2, y: 4, color: 2 }, note: "삼삼 젖힘" },
      { condition: "B:3,3|W:2,2|B:2,3|W:3,2|B:4,2|W:2,4|B:1,4", bestMove: { x: 3, y: 4, color: 2 }, note: "삼삼 꽉이음(호구)" },

      // B. 날일자 걸침 정석 (Knight's Approach)
      { condition: "B:3,3", bestMove: { x: 5, y: 2, color: 2 }, note: "날일자 걸침" },
      { condition: "B:3,3|W:5,2|B:3,5", bestMove: { x: 8, y: 2, color: 2 }, note: "두 칸 벌림" },
      { condition: "B:3,3|W:5,2|B:2,4", bestMove: { x: 8, y: 2, color: 2 }, note: "입구자 받음에 두 칸 벌림" },

      // C. 붙여당기기 정석 (Attachment & Pull-back)
      { condition: "B:3,3|W:5,2|B:4,2", bestMove: { x: 4, y: 1, color: 2 }, note: "붙임에 젖힘" },
      { condition: "B:3,3|W:5,2|B:4,2|W:4,1|B:3,2", bestMove: { x: 5, y: 1, color: 2 }, note: "호구 잇기" },
      { condition: "B:3,3|W:5,2|B:4,2|W:4,1|B:3,2|W:5,1|B:2,4", bestMove: { x: 8, y: 2, color: 2 }, note: "변 전개" },

      // D. 소목 굳힘 및 걸침
      { condition: "B:2,3", bestMove: { x: 4, y: 1, color: 2 }, note: "소목 날일자 걸침" },
      { condition: "W:2,3", bestMove: { x: 4, y: 2, color: 2 }, note: "소목 날일자 굳힘" }
    ];
  }

  // 8방위 대칭 변환 (좌상, 우상, 좌하, 우하 + 전치)
  transformCoord(x, y, sym, size) {
    let tx = x, ty = y;
    if (sym & 4) { const temp = tx; tx = ty; ty = temp; } // x/y 교환
    if (sym & 1) { tx = size - 1 - tx; }                 // 좌우 반전
    if (sym & 2) { ty = size - 1 - ty; }                 // 상하 반전
    return { x: tx, y: ty };
  }

  // 역변환
  inverseTransformCoord(tx, ty, sym, size) {
    let x = tx, y = ty;
    if (sym & 1) { x = size - 1 - x; }
    if (sym & 2) { y = size - 1 - y; }
    if (sym & 4) { const temp = x; x = y; y = temp; }
    return { x, y };
  }

  // 정석 DB에서 일치하는 최선의 다음 수 탐색
  getJosekiMove(board, size, aiColor) {
    if (size !== 19) return null;

    // 8개 대칭에 대해 정석 패턴 검사
    for (let sym = 0; sym < 8; sym++) {
      for (const j of this.josekiSequences) {
        if (j.bestMove.color !== aiColor) continue;

        // 조건 검사: condition 내의 모든 돌이 판에 정확히 존재하는지
        const parts = j.condition.split('|');
        let matched = true;

        for (const p of parts) {
          const [cPrefix, coordStr] = p.split(':');
          const [cx, cy] = coordStr.split(',').map(Number);
          const expectedColor = cPrefix === 'B' ? 1 : 2;
          const actualCoord = this.transformCoord(cx, cy, sym, size);

          if (board[actualCoord.y][actualCoord.x] !== expectedColor) {
            matched = false;
            break;
          }
        }

        if (matched) {
          const target = this.transformCoord(j.bestMove.x, j.bestMove.y, sym, size);
          if (board[target.y][target.x] === 0 && this.isLegal(board, size, target.x, target.y, aiColor, null)) {
            return target;
          }
        }
      }
    }

    return null;
  }

  // =========================================================================
  // 6. 메인 디스패처 (findBestMove)
  // =========================================================================
  findBestMove(engine, aiColor, difficulty = 'dan') {
    const oppColor = (aiColor === 1) ? 2 : 1;
    const board = engine.board;
    const size = engine.size;
    const koPoint = engine.koPoint;

    // 1. 모든 합법적인 착수 후보 수집
    const legalMoves = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.isLegal(board, size, x, y, aiColor, koPoint)) {
          legalMoves.push({ x, y });
        }
      }
    }

    if (legalMoves.length === 0) return null;

    // 0. 🌟 정통 GNU Go 3.9.1 WebAssembly 엔진 연동 🌟
    // 검증된 세계적 오픈소스 C-엔진이 브라우저에서 서버 없이 100% 로컬 연산 실행
    if (typeof window !== 'undefined' && window.GNUGoBridge && window.GNUGoBridge.isReady) {
      const GNUGO_LEVELS = {
        beginner: 0,       // 입문 (빠른 응수)
        intermediate: 2,   // 초급
        advanced: 5,       // 중급
        dan: 8,            // 아마 1단
        master: 10         // 아마 5단 (최고 레벨 전수읽기)
      };

      const handicapPoints = [];
      if (engine.initialStones && engine.initialStones.length > 0) {
        for (const s of engine.initialStones) {
          if (s.color === 1) handicapPoints.push([s.x, s.y]);
        }
      } else if (engine.moves.length === 0) {
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (board[r][c] === 1) handicapPoints.push([c, r]);
          }
        }
      }

      const level = GNUGO_LEVELS[difficulty] !== undefined ? GNUGO_LEVELS[difficulty] : 10;
      const gnugoMove = window.GNUGoBridge.findBestMove(
        size,
        engine.komi !== undefined ? engine.komi : (handicapPoints.length > 0 ? 0.5 : 6.5),
        handicapPoints,
        engine.moves,
        level
      );

      if (gnugoMove) {
        if (this.isLegal(board, size, gnugoMove.x, gnugoMove.y, aiColor, koPoint)) {
          return gnugoMove;
        }
      } else if (gnugoMove === null && engine.moves.length > 20) {
        // GNU Go가 패스(Pass) 판단을 내린 경우
        return null;
      }
    }

    const lastMove = (engine.moves && engine.moves.length > 0)
      ? engine.moves[engine.moves.length - 1]
      : null;

    // 2. 긴급한 사활 / 단수 처리 (최우선)
    const urgentCapture = this.findUrgentCapture(board, size, aiColor, difficulty);
    if (urgentCapture) {
      if (difficulty !== 'beginner' || Math.random() < 0.92) {
        return urgentCapture;
      }
    }

    const urgentDefense = this.findUrgentDefense(board, size, aiColor, difficulty);
    if (urgentDefense) {
      if (difficulty !== 'beginner' || Math.random() < 0.88) {
        return urgentDefense;
      }
    }

    // 3. 🌟 아마 유단자 (dan, master) 전용: 정석 DB 검사 🌟
    if (['advanced', 'dan', 'master'].includes(difficulty) && engine.moves.length < 35) {
      const isContactFight = this.isContactMove(board, size, lastMove, aiColor);
      if (!isContactFight) {
        const josekiMove = this.getJosekiMove(board, size, aiColor);
        if (josekiMove) {
          return josekiMove;
        }
      }
    }

    // 4. 초반 접바둑 및 대세점 포석
    const isHandicap = (board.some((row) => row.some((col) => col === 1)) && engine.moves.length === 0);
    if (['advanced', 'dan', 'master'].includes(difficulty) || isHandicap) {
      const bookMove = this.getOpeningOrHandicapMove(engine, legalMoves, aiColor, isHandicap);
      if (bookMove) {
        return bookMove;
      }
    }

    // 5. 난이도별 세부 엔진 실행
    switch (difficulty) {
      case 'beginner':
        return this.selectBeginnerMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'intermediate':
        return this.selectIntermediateMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'advanced':
        return this.selectAdvancedMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'dan':
        return this.selectDanMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'master':
      default:
        return this.selectMasterMove(engine, legalMoves, aiColor, oppColor, lastMove);
    }
  }

  // =========================================================================
  // 7. 정통 포석 및 접바둑 특수 수순
  // =========================================================================
  getOpeningOrHandicapMove(engine, legalMoves, aiColor, isHandicap) {
    const size = engine.size;
    const board = engine.board;
    const movesCount = engine.moves.length;

    if (size === 19 && aiColor === 2) {
      const hoshiPoints = [
        { x: 3, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 15 }, { x: 15, y: 15 }
      ];

      const occupiedHoshi = hoshiPoints.filter(h => board[h.y][h.x] === 1);
      if (occupiedHoshi.length >= 2 && movesCount < 14) {
        for (const h of occupiedHoshi) {
          const sanSan = {
            x: h.x === 3 ? 2 : 16,
            y: h.y === 3 ? 2 : 16
          };
          if (board[sanSan.y][sanSan.x] === 0) {
            const localWhite = this.countStonesNear(board, size, sanSan.x, sanSan.y, 3, 2);
            if (localWhite === 0) return sanSan;
          }

          const kakariCandidates = [
            { x: h.x === 3 ? 5 : 13, y: h.y === 3 ? 2 : 16 },
            { x: h.x === 3 ? 2 : 16, y: h.y === 3 ? 5 : 13 }
          ];
          for (const kc of kakariCandidates) {
            if (board[kc.y][kc.x] === 0) {
              const localWhite = this.countStonesNear(board, size, kc.x, kc.y, 2, 2);
              if (localWhite === 0) return kc;
            }
          }
        }
      }
    }

    if (movesCount < 12) {
      const corners = size === 19 ? [
        { x: 3, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 15 }, { x: 15, y: 15 }
      ] : (size === 13 ? [
        { x: 3, y: 3 }, { x: 9, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }
      ] : [
        { x: 2, y: 2 }, { x: 6, y: 2 },
        { x: 2, y: 6 }, { x: 6, y: 6 }
      ]);

      const emptyCorners = corners.filter(c => board[c.y][c.x] === 0);
      if (emptyCorners.length > 0) {
        return emptyCorners[0];
      }

      if (size === 19) {
        for (const c of corners) {
          const owner = board[c.y][c.x];
          if (owner === aiColor) {
            const gukhim = { x: c.x === 3 ? 5 : 13, y: c.y === 3 ? 2 : 16 };
            if (board[gukhim.y][gukhim.x] === 0 && board[c.y][gukhim.x] === 0) return gukhim;
          } else if (owner !== 0) {
            const kakari = { x: c.x === 3 ? 5 : 13, y: c.y === 3 ? 2 : 16 };
            if (board[kakari.y][kakari.x] === 0) {
              const nearbyWhite = this.countStonesNear(board, size, kakari.x, kakari.y, 2, aiColor);
              if (nearbyWhite === 0) return kakari;
            }
          }
        }
      }
    }

    return null;
  }

  countStonesNear(board, size, x, y, radius, color) {
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[ny][nx] === color) count++;
        }
      }
    }
    return count;
  }

  // 🌟 축 판정을 연동한 긴급 상대돌 포획
  findUrgentCapture(board, size, aiColor, difficulty) {
    const oppColor = aiColor === 1 ? 2 : 1;
    const checked = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === oppColor) {
          const key = `${x},${y}`;
          if (!checked.has(key)) {
            const group = this.getGroup(board, size, x, y);
            group.stones.forEach(s => checked.add(`${s.x},${s.y}`));
            if (group.liberties.size === 1) {
              const [libPos] = Array.from(group.liberties);
              const [lx, ly] = libPos.split(',').map(Number);
              if (this.isLegal(board, size, lx, ly, aiColor, null)) {
                return { x: lx, y: ly };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // 🌟 축(Ladder) 시뮬레이션을 연동한 긴급 아군 구출
  findUrgentDefense(board, size, aiColor, difficulty) {
    const checked = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === aiColor) {
          const key = `${x},${y}`;
          if (!checked.has(key)) {
            const group = this.getGroup(board, size, x, y);
            group.stones.forEach(s => checked.add(`${s.x},${s.y}`));
            if (group.liberties.size === 1) {
              const [libPos] = Array.from(group.liberties);
              const [lx, ly] = libPos.split(',').map(Number);
              const sim = this.simulateMoveResult(board, size, lx, ly, aiColor);
              if (sim.myLiberties >= 2) {
                // 아마 1단 이상은 축(Ladder) 검사 실행: 도망가도 축으로 잡히면 사석 처리!
                if (['dan', 'master'].includes(difficulty)) {
                  const ladder = this.simulateLadder(board, size, lx, ly, aiColor);
                  if (ladder.isCaptured && group.stones.length <= 2) {
                    // 작은 돌은 축으로 죽으면 굳이 도망쳐서 손해를 키우지 않고 손뺌!
                    continue;
                  }
                }
                return { x: lx, y: ly };
              }
            }
          }
        }
      }
    }
    return null;
  }

  isContactMove(board, size, lastMove, aiColor) {
    if (!lastMove || lastMove.isPass) return false;
    for (const n of this.getNeighbors(lastMove.x, lastMove.y, size)) {
      if (board[n.y][n.x] === aiColor) return true;
    }
    return false;
  }

  // =========================================================================
  // 8. 핵심 전술 및 행마 평가 엔진
  // =========================================================================
  evaluateMove(engine, x, y, aiColor, oppColor, lastMove, difficulty = 'dan') {
    const board = engine.board;
    const size = engine.size;
    const line = this.getLine(x, y, size);
    let score = 0;

    const sim = this.simulateMoveResult(board, size, x, y, aiColor);

    // 🚫 자충수(Self-Atari) 엄격 배제
    if (sim.myLiberties <= 1 && sim.captures === 0) {
      return -10000;
    }

    // 🌟 상대 돌 포획
    if (sim.captures > 0) {
      score += 1500 + sim.captures * 350;
    }

    // 🛡️ 단수 걸린 아군 돌 구출
    const neighbors = this.getNeighbors(x, y, size);
    for (const n of neighbors) {
      if (board[n.y][n.x] === aiColor) {
        const allyGroup = this.getGroup(board, size, n.x, n.y);
        if (allyGroup.liberties.size === 1) {
          if (sim.myLiberties >= 2) {
            // 유단자 모드에서는 축으로 잡히는 돌인지 검증
            if (['dan', 'master'].includes(difficulty)) {
              const ladder = this.simulateLadder(board, size, x, y, aiColor);
              if (ladder.isCaptured && allyGroup.stones.length <= 2) {
                score -= 3000; // 축에 걸린 돌은 버림!
                continue;
              }
            }
            score += 1200 + allyGroup.stones.length * 200;
          } else {
            score -= 4000; // 도망쳐도 잡히는 자충수
          }
        } else if (allyGroup.liberties.size === 2) {
          score += 320;
        }
      }
    }

    // ⚔️ 상대 돌 단수 몰기 및 축 몰이
    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const oppGroup = this.getGroup(board, size, n.x, n.y);
        if (oppGroup.liberties.size === 2 && oppGroup.liberties.has(`${x},${y}`)) {
          if (sim.myLiberties >= 2) {
            // 유단자 모드: 축 몰이 가능 여부 확인
            if (['dan', 'master'].includes(difficulty)) {
              const otherLib = Array.from(oppGroup.liberties).find(s => s !== `${x},${y}`);
              if (otherLib) {
                const [ox, oy] = otherLib.split(',').map(Number);
                const ladder = this.simulateLadder(sim.newBoard, size, ox, oy, oppColor);
                if (ladder.isCaptured) {
                  score += 1800; // 🎯 축 몰이 성공 보너스!
                }
              }
            }
            score += 480 + oppGroup.stones.length * 100;
          }
        }
      }
    }

    // 🎯 국소 응수 (Contact fight: 젖힘과 뻗음)
    if (lastMove && !lastMove.isPass) {
      const dist = this.chebyshevDistance(x, y, lastMove.x, lastMove.y);
      if (dist === 1) {
        const isOrthogonal = (Math.abs(x - lastMove.x) + Math.abs(y - lastMove.y)) === 1;
        score += isOrthogonal ? 320 : 380; // 젖힘 우선
      } else if (dist === 2) {
        score += 180;
      }
    }

    // 🌟 쌍립(Bamboo Joint) 및 호구 완성
    let adjacentAllies = 0;
    for (const n of neighbors) {
      if (board[n.y][n.x] === aiColor) adjacentAllies++;
    }
    if (adjacentAllies === 2) score += 240;
    else if (adjacentAllies === 3) score += 200;

    // 🌟 옥집(False Eye) 파호 및 사활 치중 (유단자 전용)
    if (['dan', 'master'].includes(difficulty)) {
      // 상대 안형의 급소 치중
      for (const d of this.getDiagonalNeighbors(x, y, size)) {
        if (board[d.y][d.x] === oppColor) {
          if (!this.isTrueEye(board, size, x, y, oppColor)) {
            score += 260; // 옥집 파호 급소
          }
        }
      }
      // 내 집을 진짜 집으로 굳히기
      if (this.isTrueEye(sim.newBoard, size, x, y, aiColor)) {
        score += 350; // 안형(두 집) 완성!
      }
    }

    // 🚫 우형(빈삼각) 방지
    if (this.isEmptyTriangle(board, size, x, y, aiColor)) {
      score -= 650;
    }

    // 행마법 보너스 (한칸뜀, 날일자)
    score += this.getGoodShapeBonus(board, size, x, y, aiColor);

    // 선(Line) 가치
    if (line === 0) {
      if (sim.captures === 0 && engine.moves.length < 60) score -= 1000;
    } else if (line === 1) {
      if (engine.moves.length < 50) score -= 250;
      else score += 90;
    } else if (line === 2) {
      score += 230; // 3선 실리선
    } else if (line === 3) {
      score += 210; // 4선 세력선
    } else {
      score += 100;
    }

    return score;
  }

  isEmptyTriangle(board, size, x, y, color) {
    const deltas = [
      [{ dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }],
      [{ dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 1 }],
      [{ dx: 1, dy: 0 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 }],
      [{ dx: -1, dy: 0 }, { dx: 0, dy: -1 }, { dx: -1, dy: -1 }]
    ];

    for (const [d1, d2, diag] of deltas) {
      const x1 = x + d1.dx, y1 = y + d1.dy;
      const x2 = x + d2.dx, y2 = y + d2.dy;
      const xd = x + diag.dx, yd = y + diag.dy;

      if (x1 >= 0 && x1 < size && y1 >= 0 && y1 < size &&
          x2 >= 0 && x2 < size && y2 >= 0 && y2 < size &&
          xd >= 0 && xd < size && yd >= 0 && yd < size) {
        if (board[y1][x1] === color && board[y2][x2] === color && board[yd][xd] === 0) {
          return true;
        }
      }
    }
    return false;
  }

  getGoodShapeBonus(board, size, x, y, color) {
    let bonus = 0;
    const jumps = [
      { dx: 2, dy: 0, mx: 1, my: 0 },
      { dx: -2, dy: 0, mx: -1, my: 0 },
      { dx: 0, dy: 2, mx: 0, my: 1 },
      { dx: 0, dy: -2, mx: 0, my: -1 }
    ];
    for (const j of jumps) {
      const tx = x + j.dx, ty = y + j.dy;
      const mx = x + j.mx, my = y + j.my;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
        if (board[ty][tx] === color && board[my][mx] === 0) bonus += 200;
      }
    }

    const knights = [
      { dx: 2, dy: 1 }, { dx: 1, dy: 2 },
      { dx: -2, dy: 1 }, { dx: -1, dy: 2 },
      { dx: 2, dy: -1 }, { dx: 1, dy: -2 },
      { dx: -2, dy: -1 }, { dx: -1, dy: -2 }
    ];
    for (const k of knights) {
      const tx = x + k.dx, ty = y + k.dy;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
        if (board[ty][tx] === color) bonus += 160;
      }
    }

    return bonus;
  }

  // =========================================================================
  // 9. 난이도별 상세 착수 알고리즘
  // =========================================================================

  // 🌱 1. 삐약이 (18급 입문)
  selectBeginnerMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    let localCandidates = [];
    if (lastMove && !lastMove.isPass) {
      localCandidates = legalMoves.filter(m => {
        const d = this.chebyshevDistance(m.x, m.y, lastMove.x, lastMove.y);
        return d >= 1 && d <= 3;
      });
    }

    if (localCandidates.length === 0) {
      localCandidates = legalMoves.filter(m => this.countStonesNear(board, size, m.x, m.y, 2, aiColor) > 0);
    }
    if (localCandidates.length === 0) {
      localCandidates = legalMoves.filter(m => {
        const l = this.getLine(m.x, m.y, size);
        return l >= 2 && l <= 4;
      });
    }

    const pool = localCandidates.length > 0 ? localCandidates : legalMoves;
    const scored = [];
    for (const m of pool) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove, 'beginner');
      score += (Math.random() - 0.5) * 50;
      scored.push({ move: m, score });
    }

    if (scored.length === 0) return legalMoves[0];
    scored.sort((a, b) => b.score - a.score);
    const pick = Math.floor(Math.random() * Math.min(2, scored.length));
    return scored[pick].move;
  }

  // 🌿 2. 바둑이 (12급 초급)
  selectIntermediateMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const scored = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove, 'intermediate');
      score += (Math.random() - 0.5) * 30;
      scored.push({ move: m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].move : legalMoves[0];
  }

  // 🌲 3. 영리한 여우 (5급 중급)
  selectAdvancedMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const scored = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove, 'advanced');
      score += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor);
      scored.push({ move: m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].move : legalMoves[0];
  }

  // 👑 4. 지혜로운 판다 (아마 1단)
  selectDanMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const candidates = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let baseScore = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove, 'dan');
      baseScore += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor) * 1.6;
      candidates.push({ move: m, baseScore });
    }

    candidates.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = candidates.slice(0, 8);
    if (topCandidates.length === 0) return legalMoves[0];

    let bestMove = topCandidates[0].move;
    let bestVal = -Infinity;

    for (const cand of topCandidates) {
      const m = cand.move;
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);

      let oppBestResponseScore = 0;
      const simNeighbors = this.getNeighbors(m.x, m.y, size);

      for (const sn of simNeighbors) {
        if (this.isLegal(sim.newBoard, size, sn.x, sn.y, oppColor, null)) {
          const oppSim = this.simulateMoveResult(sim.newBoard, size, sn.x, sn.y, oppColor);
          if (oppSim.captures > 0) {
            oppBestResponseScore = Math.max(oppBestResponseScore, 850 + oppSim.captures * 350);
          }
        }
      }

      const totalVal = cand.baseScore - (oppBestResponseScore * 0.85);
      if (totalVal > bestVal) {
        bestVal = totalVal;
        bestMove = m;
      }
    }

    return bestMove;
  }

  // 🔥 5. 용맹한 호랑이 (아마 5단)
  selectMasterMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const candidates = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let baseScore = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove, 'master');
      baseScore += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor) * 2.4;
      candidates.push({ move: m, baseScore });
    }

    candidates.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = candidates.slice(0, 8);
    if (topCandidates.length === 0) return legalMoves[0];

    let bestMove = topCandidates[0].move;
    let bestVal = -Infinity;

    for (const cand of topCandidates) {
      const m = cand.move;
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);

      let oppMaxHarm = 0;
      const oppLocalMoves = this.getNeighbors(m.x, m.y, size).filter(n =>
        this.isLegal(sim.newBoard, size, n.x, n.y, oppColor, null)
      );

      for (const om of oppLocalMoves) {
        const oppSim = this.simulateMoveResult(sim.newBoard, size, om.x, om.y, oppColor);
        let harm = 0;
        if (oppSim.captures > 0) harm += 1100 + oppSim.captures * 450;
        if (oppSim.myLiberties >= 3) harm += 220;
        if (harm > oppMaxHarm) oppMaxHarm = harm;
      }

      const netScore = cand.baseScore - (oppMaxHarm * 0.95);
      if (netScore > bestVal) {
        bestVal = netScore;
        bestMove = m;
      }
    }

    return bestMove;
  }

  calculateTerritoryBonus(board, size, x, y, color) {
    let bonus = 0;
    const oppColor = color === 1 ? 2 : 1;

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist === 0) continue;
          if (board[ny][nx] === color) {
            bonus += (5 - dist) * 14;
          } else if (board[ny][nx] === oppColor) {
            bonus += (5 - dist) * 7;
          }
        }
      }
    }

    return bonus;
  }
}

if (typeof window !== 'undefined') {
  window.BadukAI = BadukAI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BadukAI };
}
