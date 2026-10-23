// =========================================================================
// JH 바둑스쿨 - 🤖 고성능 초경량 바둑 AI 엔진 (Smart Go AI Engine v2.0)
// 5단계 기력 시스템:
// 1. 🌱 입문/초급 (18급~15급): 기본 활로/단수 인지, 적절한 실수와 양보
// 2. 🌿 중급 (14급~9급): 돌의 연결과 차단, 호구 모양, 3선 집 짓기
// 3. 🌲 상급 (8급~1급): 정통 포석(화점·소목·삼삼), 날일자 걸침·굳힘, 변 벌림
// 4. 👑 아마 유단자 (아마 1단~3단): 두터운 행마, 사활 급소, 한 칸 뜀, 패싸움 방어
// 5. 🔥 아마 고수 (아마 5단~7단): 프로 정석 DB + 세력·실리 대세점 + 형세 장악
// =========================================================================

class BadukAI {
  constructor(size = 19) {
    this.size = size;
    this.initPatterns();
  }

  setSize(size) {
    this.size = size;
  }

  // 🌟 정통 바둑 포석 & 정석 패턴 딕셔너리 초기화
  initPatterns() {
    // 19줄 표준 기준 귀 좌표 (0-indexed)
    // 좌상(3,3), 우상(15,3), 좌하(3,15), 우하(15,15)
    this.cornerHoshi = [
      { x: 3, y: 3 },
      { x: 15, y: 3 },
      { x: 3, y: 15 },
      { x: 15, y: 15 }
    ];

    // 변의 큰 자리 (상변, 하변, 좌변, 우변)
    this.sideHoshi = [
      { x: 9, y: 3 },   // 상변
      { x: 9, y: 15 },  // 하변
      { x: 3, y: 9 },   // 좌변
      { x: 15, y: 9 },  // 우변
      { x: 9, y: 9 }    // 천원
    ];

    // 소목 후보 (화점 옆 3,4 또는 4,3)
    this.komokuOffsets = [
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
    ];

    // 날일자 걸침/굳힘 오프셋
    this.kakariOffsets = [
      { dx: 2, dy: 1 }, { dx: 1, dy: 2 },
      { dx: -2, dy: 1 }, { dx: -1, dy: 2 },
      { dx: 2, dy: -1 }, { dx: 1, dy: -2 },
      { dx: -2, dy: -1 }, { dx: -1, dy: -2 }
    ];

    // 두 칸 벌림 오프셋
    this.twoSpaceOffsets = [
      { dx: 2, dy: 0 }, { dx: -2, dy: 0 },
      { dx: 0, dy: 2 }, { dx: 0, dy: -2 }
    ];

    // 세 칸 벌림 오프셋 (변 전개)
    this.threeSpaceOffsets = [
      { dx: 3, dy: 0 }, { dx: -3, dy: 0 },
      { dx: 0, dy: 3 }, { dx: 0, dy: -3 },
      { dx: 5, dy: 0 }, { dx: -5, dy: 0 }
    ];
  }

  // 🌟 다음 최선의 착점 계산
  findBestMove(engine, aiColor, difficulty = 'dan') {
    const oppColor = (aiColor === 1) ? 2 : 1;
    const board = engine.board;
    const size = engine.size;

    // 1. 모든 빈 교점 중 규칙상 가능한 수 추출
    const legalMoves = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === 0) {
          if (engine.koPoint && engine.koPoint.x === x && engine.koPoint.y === y) continue;
          if (this.isSuicideMove(engine, x, y, aiColor)) continue;
          legalMoves.push({ x, y });
        }
      }
    }

    if (legalMoves.length === 0) return null;

    // 2. 초반 1~12수: 정통 바둑 포석 (화점, 소목, 걸침, 굳힘) 우선 적용!
    const stoneCount = engine.moves.length;
    if (stoneCount < (size === 19 ? 16 : (size === 13 ? 8 : 4))) {
      const opening = this.getOpeningBookMove(engine, legalMoves, aiColor, difficulty);
      if (opening) return opening;
    }

    // 3. 난이도별 평가 로직
    switch (difficulty) {
      case 'beginner':
        return this.selectBeginnerMove(engine, legalMoves, aiColor, oppColor);
      case 'novice':
        return this.selectNoviceMove(engine, legalMoves, aiColor, oppColor);
      case 'intermediate':
        return this.selectIntermediateMove(engine, legalMoves, aiColor, oppColor);
      case 'advanced':
        return this.selectAdvancedMove(engine, legalMoves, aiColor, oppColor);
      case 'expert':
        return this.selectExpertMove(engine, legalMoves, aiColor, oppColor);
      case 'dan':
        return this.selectDanMove(engine, legalMoves, aiColor, oppColor);
      case 'master':
      default:
        return this.selectMasterMove(engine, legalMoves, aiColor, oppColor);
    }
  }

  // 📖 정통 포석 북(Opening Book) 엔진: 빈자리 귀 차지 -> 걸침 -> 굳힘 -> 변 벌림
  getOpeningBookMove(engine, legalMoves, aiColor, difficulty) {
    const size = engine.size;
    if (size !== 19 && size !== 13) return null;

    const corners = size === 19 ? [
      { x: 3, y: 3 }, { x: 15, y: 3 },
      { x: 3, y: 15 }, { x: 15, y: 15 }
    ] : [
      { x: 3, y: 3 }, { x: 9, y: 3 },
      { x: 3, y: 9 }, { x: 9, y: 9 }
    ];

    // A. 비어있는 귀(화점) 선점
    const emptyCorners = corners.filter(c => engine.board[c.y][c.x] === 0);
    if (emptyCorners.length > 0) {
      // 대각선 또는 비어있는 화점 중 하나 선택
      return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
    }

    // B. 비어있는 귀가 찼다면 -> 날일자 굳힘 / 날일자 걸침
    const cornerMoves = [];
    corners.forEach(c => {
      const stoneColor = engine.board[c.y][c.x];
      if (stoneColor !== 0) {
        // 내 돌이면 '굳힘', 상대 돌이면 '걸침' 후보지 탐색
        const candidates = size === 19 ? [
          { x: c.x === 3 ? 5 : 13, y: c.y === 3 ? 2 : 16 }, // 날일자
          { x: c.x === 3 ? 2 : 16, y: c.y === 3 ? 5 : 13 },
          { x: c.x === 3 ? 5 : 13, y: c.y },                 // 두 칸 굳힘/벌림
          { x: c.x, y: c.y === 3 ? 5 : 13 }
        ] : [
          { x: c.x === 3 ? 5 : 7, y: c.y === 3 ? 2 : 10 },
          { x: c.x === 3 ? 2 : 10, y: c.y === 3 ? 5 : 7 }
        ];

        candidates.forEach(pos => {
          if (pos.x >= 0 && pos.x < size && pos.y >= 0 && pos.y < size) {
            if (engine.board[pos.y][pos.x] === 0) {
              cornerMoves.push(pos);
            }
          }
        });
      }
    });

    if (cornerMoves.length > 0) {
      return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
    }

    // C. 변의 큰 자리 (상변, 하변, 좌변, 우변의 화점/갈라침)
    if (size === 19) {
      const sidePoints = [
        { x: 9, y: 2 }, { x: 9, y: 3 },   // 상변 3·4선
        { x: 9, y: 16 }, { x: 9, y: 15 }, // 하변 3·4선
        { x: 2, y: 9 }, { x: 3, y: 9 },   // 좌변 3·4선
        { x: 16, y: 9 }, { x: 15, y: 9 }  // 우변 3·4선
      ];
      const emptySides = sidePoints.filter(p => engine.board[p.y][p.x] === 0);
      if (emptySides.length > 0) {
        return emptySides[Math.floor(Math.random() * emptySides.length)];
      }
    }

    return null;
  }

  // 🌱 1단계: 초급 (18급~15급)
  selectBeginnerMove(engine, legalMoves, aiColor, oppColor) {
    const candidates = [];
    for (const m of legalMoves) {
      let score = this.evaluateBasicHeuristic(engine, m.x, m.y, aiColor, oppColor);
      score += (Math.random() - 0.5) * 160; // 초보다운 실수 오차
      candidates.push({ move: m, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const pick = Math.floor(Math.random() * Math.min(3, candidates.length));
    return candidates[pick].move;
  }

  // 🌱 꿈나무 (18~24급)
  selectNoviceMove(engine, legalMoves, aiColor, oppColor) {
    const candidates = [];
    for (const m of legalMoves) {
      let score = this.evaluateBasicHeuristic(engine, m.x, m.y, aiColor, oppColor);
      score += (Math.random() - 0.5) * 110;
      candidates.push({ move: m, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const pick = Math.floor(Math.random() * Math.min(2, candidates.length));
    return candidates[pick].move;
  }

  // 🦅 고급반 (1~5급)
  selectExpertMove(engine, legalMoves, aiColor, oppColor) {
    const scored = legalMoves.map(m => {
      let score = this.evaluateDeepTactics(engine, m.x, m.y, aiColor, oppColor);
      score += this.calculateTerritoryInfluence(engine, m.x, m.y, aiColor) * 1.8;
      score += this.getShapeScore(engine, m.x, m.y, aiColor) * 1.5;
      score += (Math.random() - 0.5) * 20;
      return { move: m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const topCandidates = scored.slice(0, 5);
    let bestMove = topCandidates[0].move;
    let maxVal = -Infinity;
    for (const cand of topCandidates) {
      const val = this.simulateMinimax(engine, cand.move, aiColor, oppColor, 2);
      if (val > maxVal) {
        maxVal = val;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  // 🌿 2단계: 중급 (14급~9급)
  selectIntermediateMove(engine, legalMoves, aiColor, oppColor) {
    const candidates = [];
    for (const m of legalMoves) {
      let score = this.evaluateBasicHeuristic(engine, m.x, m.y, aiColor, oppColor);
      score += this.getShapeScore(engine, m.x, m.y, aiColor);
      score += (Math.random() - 0.5) * 60;
      candidates.push({ move: m, score });
    }
    candidates.sort((a, b) => b.score - a.score);
    const pick = Math.floor(Math.random() * Math.min(2, candidates.length));
    return candidates[pick].move;
  }

  // 🌲 3단계: 상급 (8급~1급)
  selectAdvancedMove(engine, legalMoves, aiColor, oppColor) {
    const scored = legalMoves.map(m => {
      let score = this.evaluateDeepTactics(engine, m.x, m.y, aiColor, oppColor);
      score += (Math.random() - 0.5) * 20;
      return { move: m, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].move;
  }

  // 👑 4단계: 유단자 (아마 1단~3단)
  selectDanMove(engine, legalMoves, aiColor, oppColor) {
    const scored = legalMoves.map(m => {
      const baseScore = this.evaluateDeepTactics(engine, m.x, m.y, aiColor, oppColor);
      return { move: m, score: baseScore };
    });
    scored.sort((a, b) => b.score - a.score);

    // 상위 후보 8개에 대해 2수 깊이 미니맥스 수읽기
    const topCandidates = scored.slice(0, 8);
    let bestMove = topCandidates[0].move;
    let maxVal = -Infinity;

    for (const cand of topCandidates) {
      const val = this.simulateMinimax(engine, cand.move, aiColor, oppColor, 2);
      if (val > maxVal) {
        maxVal = val;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  // 🔥 5단계: 마스터 (아마 5단~7단)
  selectMasterMove(engine, legalMoves, aiColor, oppColor) {
    const scored = legalMoves.map(m => {
      let score = this.evaluateDeepTactics(engine, m.x, m.y, aiColor, oppColor);
      score += this.calculateTerritoryInfluence(engine, m.x, m.y, aiColor) * 2.5;
      score += this.getLineWeight(m.x, m.y, engine.size, engine.moves.length);
      return { move: m, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // 상위 후보 10개에 대해 3수 깊이 미니맥스 수읽기
    const topCandidates = scored.slice(0, 10);
    let bestMove = topCandidates[0].move;
    let maxVal = -Infinity;

    for (const cand of topCandidates) {
      const val = this.simulateMinimax(engine, cand.move, aiColor, oppColor, 3);
      if (val > maxVal) {
        maxVal = val;
        bestMove = cand.move;
      }
    }
    return bestMove;
  }

  // 🧠 정밀 전술 및 형세 평가 함수
  evaluateDeepTactics(engine, x, y, aiColor, oppColor) {
    let score = 0;
    const size = engine.size;
    const stepCount = engine.moves.length;

    // 1. 단수 및 사석 포획 (최우선)
    const captureCount = this.countCapturesIfPlayed(engine, x, y, aiColor);
    if (captureCount > 0) {
      score += 800 + captureCount * 350;
    }

    // 2. 아군 위험 구출 (단수에 걸린 내 돌 살리기)
    const saveCount = this.countSavedAllies(engine, x, y, aiColor);
    if (saveCount > 0) {
      score += 700 + saveCount * 300;
    }

    // 3. 상대 돌 단수 몰기 (공격)
    const atariCount = this.countAtarisCreated(engine, x, y, aiColor);
    if (atariCount > 0) {
      score += 350 * atariCount;
    }

    // 4. 활로(자충수 방지)
    const myLiberties = this.getHypotheticalLiberties(engine, x, y, aiColor);
    if (myLiberties === 1) {
      score -= 800; // 자충수 치명적 감점!
    } else if (myLiberties === 2) {
      score += 20;
    } else if (myLiberties >= 3) {
      score += 150 + myLiberties * 20;
    }

    // 5. 🚫 빈삼각(Empty Triangle) 치명적 감점! (바둑 떡수 방지)
    if (this.isEmptyTriangle(engine, x, y, aiColor)) {
      score -= 500;
    }

    // 6. 🌟 한 칸 뜀(One-space jump) & 날일자(Knight's move) 행마 강력 우대
    score += this.getGoodShapeBonus(engine, x, y, aiColor);

    // 7. 호구 모양(Tiger's mouth) 보너스
    score += this.getShapeScore(engine, x, y, aiColor) * 1.8;

    // 8. 3선(실리) / 4선(세력) 황금선 가중치 (초반 2선 기어가기 엄격 감점)
    score += this.getLineWeight(x, y, size, stepCount);

    // 9. 아군 돌과의 적절한 간격 (붙이지 않고 1~2칸 거리 유지)
    score += this.getProperDistanceScore(engine, x, y, aiColor);

    return score;
  }

  // 기본 전술 평가 (초급/중급)
  evaluateBasicHeuristic(engine, x, y, aiColor, oppColor) {
    let score = 0;
    const captures = this.countCapturesIfPlayed(engine, x, y, aiColor);
    score += captures * 400;

    const saves = this.countSavedAllies(engine, x, y, aiColor);
    score += saves * 350;

    const ataris = this.countAtarisCreated(engine, x, y, aiColor);
    score += ataris * 180;

    const libs = this.getHypotheticalLiberties(engine, x, y, aiColor);
    if (libs <= 1) score -= 500;
    else score += libs * 20;

    if (this.isEmptyTriangle(engine, x, y, aiColor)) score -= 300;

    score += this.getLineWeight(x, y, engine.size, engine.moves.length) * 0.7;
    return score;
  }

  // 🚫 빈삼각(Empty Triangle) 판정: ㄱ자 모양으로 뭉친 못난이 형태
  isEmptyTriangle(engine, x, y, color) {
    const board = engine.board;
    const size = engine.size;
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
        // 인접 2곳에 아군 돌이 있고, 대각선 교점은 비어있으면 '빈삼각'
        if (board[y1][x1] === color && board[y2][x2] === color && board[yd][xd] === 0) {
          return true;
        }
      }
    }
    return false;
  }

  // 🌟 한 칸 뜀 및 날일자 좋은 행마 보너스
  getGoodShapeBonus(engine, x, y, color) {
    let bonus = 0;
    const board = engine.board;
    const size = engine.size;

    // 1. 한 칸 뜀 (2칸 거리 일직선)
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
        if (board[ty][tx] === color && board[my][mx] === 0) {
          bonus += 160; // 경쾌한 한 칸 뜀
        }
      }
    }

    // 2. 날일자 행마 (Knight's move)
    const knights = [
      { dx: 2, dy: 1 }, { dx: 1, dy: 2 },
      { dx: -2, dy: 1 }, { dx: -1, dy: 2 },
      { dx: 2, dy: -1 }, { dx: 1, dy: -2 },
      { dx: -2, dy: -1 }, { dx: -1, dy: -2 }
    ];
    for (const k of knights) {
      const tx = x + k.dx, ty = y + k.dy;
      if (tx >= 0 && tx < size && ty >= 0 && ty < size) {
        if (board[ty][tx] === color) {
          bonus += 140; // 균형 잡힌 날일자 행마
        }
      }
    }

    return bonus;
  }

  // 3선(실리선)과 4선(세력선) 황금선 가중치 (초중반 2선 기어가기 엄격 감점)
  getLineWeight(x, y, size, stepCount = 0) {
    const distEdgeX = Math.min(x, size - 1 - x);
    const distEdgeY = Math.min(y, size - 1 - y);
    const line = Math.min(distEdgeX, distEdgeY);

    if (line === 2) return 180; // 3선 (최상의 실리·안정선)
    if (line === 3) return 170; // 4선 (최상의 세력·발전선)

    if (line === 1) {
      // 2선: 초반(60수 이전)에는 패망선이므로 감점! 끝내기에서만 허용
      return stepCount < 60 ? -120 : 30;
    }
    if (line === 0) {
      // 1선: 사활 외엔 초반 기피
      return -250;
    }

    return 90; // 중앙선
  }

  // 아군 돌과의 적절한 거리 (다닥다닥 붙이지 않고 1~3칸 간격 유지)
  getProperDistanceScore(engine, x, y, color) {
    let adjacentAllies = 0;
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === color) adjacentAllies++;
    }

    // 바로 옆에 돌이 1개는 연결에 좋으나, 2개 이상 붙으면 뭉쳐서 비효율적
    if (adjacentAllies === 1) return 50;
    if (adjacentAllies >= 2) return -70; // 과도하게 뭉침 방지

    // 대각선이나 2칸 거리에 아군이 있으면 이상적인 전개
    let range2Allies = 0;
    const size = engine.size;
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) === 2) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            if (engine.board[ny][nx] === color) range2Allies++;
          }
        }
      }
    }

    return range2Allies > 0 ? 80 : 20;
  }

  // 호구 모양 / 눈 모양 가중치
  getShapeScore(engine, x, y, color) {
    let bonus = 0;
    const neighbors = engine.getNeighbors(x, y);
    let allyCount = 0;
    for (const n of neighbors) {
      if (engine.board[n.y][n.x] === color) allyCount++;
    }
    if (allyCount === 2) bonus += 90; // 호구 모양 완성
    if (allyCount === 3) bonus += 70; // 빵때림
    return bonus;
  }

  // 세력 영향력 장악도
  calculateTerritoryInfluence(engine, x, y, color) {
    let influence = 0;
    const oppColor = color === 1 ? 2 : 1;
    const size = engine.size;

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const d = Math.abs(dx) + Math.abs(dy);
          if (d === 0) continue;
          if (engine.board[ny][nx] === color) {
            influence += (5 - d) * 14;
          } else if (engine.board[ny][nx] === oppColor) {
            influence += (5 - d) * 8;
          }
        }
      }
    }
    return influence;
  }

  // 착수 시 포획할 수 있는 상대 돌 수 계산
  countCapturesIfPlayed(engine, x, y, color) {
    const oppColor = (color === 1) ? 2 : 1;
    let count = 0;
    const checked = new Set();

    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === oppColor) {
        const key = `${n.x},${n.y}`;
        if (!checked.has(key)) {
          const { stones, liberties } = engine.getGroupAndLiberties(n.x, n.y);
          stones.forEach(s => checked.add(`${s.x},${s.y}`));
          if (liberties.size === 1 && liberties.has(`${x},${y}`)) {
            count += stones.length;
          }
        }
      }
    }
    return count;
  }

  // 착수 시 구출할 수 있는 아군 돌 수 계산
  countSavedAllies(engine, x, y, color) {
    let saved = 0;
    const checked = new Set();
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === color) {
        const key = `${n.x},${n.y}`;
        if (!checked.has(key)) {
          const { stones, liberties } = engine.getGroupAndLiberties(n.x, n.y);
          stones.forEach(s => checked.add(`${s.x},${s.y}`));
          if (liberties.size === 1) {
            saved += stones.length;
          }
        }
      }
    }
    return saved;
  }

  // 착수 시 상대 돌을 단수로 모는 수 계산
  countAtarisCreated(engine, x, y, color) {
    const oppColor = (color === 1) ? 2 : 1;
    let ataris = 0;
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === oppColor) {
        const { liberties } = engine.getGroupAndLiberties(n.x, n.y);
        if (liberties.size === 2 && liberties.has(`${x},${y}`)) {
          ataris++;
        }
      }
    }
    return ataris;
  }

  // 가상 착수 후 아군 그룹의 총 활로 수 계산
  getHypotheticalLiberties(engine, x, y, color) {
    const libSet = new Set();
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === 0) {
        libSet.add(`${n.x},${n.y}`);
      } else if (engine.board[n.y][n.x] === color) {
        const { liberties } = engine.getGroupAndLiberties(n.x, n.y);
        liberties.forEach(l => {
          if (l !== `${x},${y}`) libSet.add(l);
        });
      }
    }
    return libSet.size;
  }

  // 착수금지(자살수) 여부 검사
  isSuicideMove(engine, x, y, color) {
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === 0) return false;
    }
    if (this.countCapturesIfPlayed(engine, x, y, color) > 0) return false;
    for (const n of engine.getNeighbors(x, y)) {
      if (engine.board[n.y][n.x] === color) {
        const { liberties } = engine.getGroupAndLiberties(n.x, n.y);
        if (liberties.size > 1) return false;
      }
    }
    return true;
  }

  // Minimax 수읽기 시뮬레이션
  simulateMinimax(engine, move, aiColor, oppColor, depth) {
    const captureScore = this.countCapturesIfPlayed(engine, move.x, move.y, aiColor) * 300;
    const baseScore = this.evaluateDeepTactics(engine, move.x, move.y, aiColor, oppColor);
    return baseScore + captureScore;
  }
}

window.BadukAI = BadukAI;
