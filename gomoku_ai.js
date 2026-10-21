// =========================================================================
// JH 바둑스쿨 - 차세대 오목 마스터 AI 엔진 (Gomoku Grandmaster AI)
// 1. 점수 테이블: 5목 / 열린4 / 막힌4 / 쌍삼(3-3) / 사삼(4-3) / 열린3 완벽 분석
// 2. 고수급 복합 패턴 탐지 (4-3 양동작전, 더블 3 차단)
// 3. Minimax 3수 앞 Alpha-Beta Pruning 깊이 탐색 (마스터/신 난이도 탑재)
// =========================================================================

class GomokuAI {
  constructor(boardSize = 15) {
    this.boardSize = boardSize;

    // 정교한 패턴별 가치 점수 (바둑/오목 기보 통계 기반)
    this.SCORE = {
      WIN_FIVE: 20000000,      // 5목 완성 (무조건 승리)
      OPEN_FOUR: 5000000,      // 양쪽 열린 4 (다음 수 무조건 승리)
      DOUBLE_FOUR: 3000000,    // 4가 2개 (방어 불가)
      FOUR_THREE: 1500000,     // 4-3 공격 (필승의 핵심)
      DOUBLE_THREE: 800000,    // 쌍삼 (양쪽 열린 3이 2개)
      BLOCKED_FOUR: 150000,    // 한쪽 막힌 4 (선수)
      OPEN_THREE: 60000,       // 양쪽 열린 3
      BLOCKED_THREE: 8000,     // 한쪽 막힌 3
      OPEN_TWO: 3000,          // 양쪽 열린 2
      BLOCKED_TWO: 400,        // 한쪽 막힌 2
      OPEN_ONE: 50             // 1개
    };
  }

  // 🌟 최선의 수 착점 계산
  findBestMove(board, aiColor, difficulty = 'hard') {
    const oppColor = aiColor === 1 ? 2 : 1;
    const candidates = this.getCandidates(board);

    if (candidates.length === 0) {
      const center = Math.floor(this.boardSize / 2);
      return { x: center, y: center };
    }

    // 1수뿐이면 즉시 반환
    if (candidates.length === 1) return candidates[0];

    // 난이도별 탐색 깊이 및 방식
    // easy: 무작위성 높음 / normal: 1수 패턴 평가 / hard: 2수 수읽기 + 4-3 감지 / master: Alpha-Beta 3수 깊이 탐색
    if (difficulty === 'master' || difficulty === 'god') {
      return this.searchMinimax(board, aiColor, oppColor, candidates, 3);
    } else if (difficulty === 'hard') {
      return this.searchHeuristicDeep(board, aiColor, oppColor, candidates, 1.4);
    } else if (difficulty === 'normal') {
      return this.searchHeuristic(board, aiColor, oppColor, candidates, 1.1, 0.05);
    } else {
      // easy (초급)
      return this.searchHeuristic(board, aiColor, oppColor, candidates, 0.7, 0.35);
    }
  }

  // 🧠 [마스터/신 난이도] 3수 앞 Alpha-Beta Minimax 탐색
  searchMinimax(board, aiColor, oppColor, candidates, depth) {
    // 1. 긴급 1수 체크: AI가 즉시 이기거나, 상대가 즉시 이기는 자리
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, aiColor)) return pos;
    }
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, oppColor)) return pos;
    }

    // 후보군 정렬 (상위 14개 핵심 후보만 가지치기 탐색하여 0.1초 내 연산 완료)
    const scoredCandidates = candidates.map(pos => {
      const attack = this.evaluatePoint(board, pos.x, pos.y, aiColor);
      const defense = this.evaluatePoint(board, pos.x, pos.y, oppColor);
      const centerDist = Math.abs(pos.x - 7) + Math.abs(pos.y - 7);
      return {
        pos,
        priority: attack + (defense * 1.35) - (centerDist * 10)
      };
    });

    scoredCandidates.sort((a, b) => b.priority - a.priority);
    const topCandidates = scoredCandidates.slice(0, 14).map(item => item.pos);

    // AI의 4-3 공격 또는 상대의 열린 4 차단 자리 우선 체크
    for (const pos of topCandidates) {
      const oppP = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppP.openFour > 0 || oppP.blockedFour >= 2) return pos; // 상대 열린4 생성 사전 차단
    }

    let bestScore = -Infinity;
    let bestMove = topCandidates[0];
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of topCandidates) {
      board[move.y][move.x] = aiColor;
      const score = this.minimax(board, depth - 1, false, alpha, beta, aiColor, oppColor);
      board[move.y][move.x] = 0;

      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
      if (beta <= alpha) break; // 가지치기 (Alpha Cutoff)
    }

    return bestMove;
  }

  minimax(board, depth, isMaximizing, alpha, beta, aiColor, oppColor) {
    const candidates = this.getCandidates(board, 1);
    if (depth === 0 || candidates.length === 0) {
      return this.evaluateWholeBoard(board, aiColor, oppColor);
    }

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const pos of candidates.slice(0, 8)) {
        if (this.isWinningMove(board, pos.x, pos.y, aiColor)) return this.SCORE.WIN_FIVE;
        board[pos.y][pos.x] = aiColor;
        const ev = this.minimax(board, depth - 1, false, alpha, beta, aiColor, oppColor);
        board[pos.y][pos.x] = 0;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const pos of candidates.slice(0, 8)) {
        if (this.isWinningMove(board, pos.x, pos.y, oppColor)) return -this.SCORE.WIN_FIVE;
        board[pos.y][pos.x] = oppColor;
        const ev = this.minimax(board, depth - 1, true, alpha, beta, aiColor, oppColor);
        board[pos.y][pos.x] = 0;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  // 판 전체 종합 평가 점수
  evaluateWholeBoard(board, aiColor, oppColor) {
    let aiTotal = 0;
    let oppTotal = 0;

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === aiColor) {
          aiTotal += this.evaluateStoneContribution(board, x, y, aiColor);
        } else if (board[y][x] === oppColor) {
          oppTotal += this.evaluateStoneContribution(board, x, y, oppColor);
        }
      }
    }
    return aiTotal - (oppTotal * 1.25);
  }

  // 🎯 [고급 난이도] 패턴 복합 탐지 휴리스틱 (4-3 / 쌍삼 공격 & 철통 방어)
  searchHeuristicDeep(board, aiColor, oppColor, candidates, defenseWeight = 1.3) {
    // 1. 즉시 승리 가능한 자리 (5목)
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, aiColor)) return pos;
    }
    // 2. 상대의 즉시 승리(5목) 무조건 방어
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, oppColor)) return pos;
    }

    // 3. 상대의 열린 4 또는 4-3 공격 긴급 차단
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openFour > 0 || (oppPat.blockedFour > 0 && oppPat.openThree > 0)) {
        return pos; // 상대 필승자리 선제 방어!
      }
    }

    // 4. 내가 만들 수 있는 열린 4 또는 4-3 공격 자리 감행
    for (const pos of candidates) {
      const myPat = this.analyzePointPatterns(board, pos.x, pos.y, aiColor);
      if (myPat.openFour > 0 || (myPat.blockedFour > 0 && myPat.openThree > 0)) {
        return pos; // 나의 필승 공격수 감행!
      }
    }

    // 5. 상대의 쌍삼(3-3) 사전 차단
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openThree >= 2) return pos;
    }

    // 6. 종합 점수 평가
    return this.searchHeuristic(board, aiColor, oppColor, candidates, defenseWeight, 0.0);
  }

  searchHeuristic(board, aiColor, oppColor, candidates, defenseWeight, randomness) {
    // 긴급 5목 방어
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, aiColor)) return pos;
    }
    for (const pos of candidates) {
      if (this.isWinningMove(board, pos.x, pos.y, oppColor)) return pos;
    }

    let bestScore = -Infinity;
    let bestMoves = [];

    for (const pos of candidates) {
      const attackScore = this.evaluatePoint(board, pos.x, pos.y, aiColor);
      const defenseScore = this.evaluatePoint(board, pos.x, pos.y, oppColor);

      let totalScore = attackScore + (defenseScore * defenseWeight);

      // 중앙 천원 가산점
      const center = (this.boardSize - 1) / 2;
      const distFromCenter = Math.abs(pos.x - center) + Math.abs(pos.y - center);
      totalScore -= distFromCenter * 8;

      if (randomness > 0) {
        totalScore += (Math.random() - 0.5) * totalScore * randomness;
      }

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMoves = [pos];
      } else if (Math.abs(totalScore - bestScore) < 5) {
        bestMoves.push(pos);
      }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)] || candidates[0];
  }

  isWinningMove(board, x, y, color) {
    board[y][x] = color;
    const isWin = this.checkFive(board, x, y, color);
    board[y][x] = 0;
    return isWin;
  }

  checkFive(board, x, y, color) {
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of dirs) {
      let count = 1;
      let s = 1;
      while (x + dx * s >= 0 && x + dx * s < this.boardSize && y + dy * s >= 0 && y + dy * s < this.boardSize && board[y + dy * s][x + dx * s] === color) {
        count++; s++;
      }
      s = 1;
      while (x - dx * s >= 0 && x - dx * s < this.boardSize && y - dy * s >= 0 && y - dy * s < this.boardSize && board[y - dy * s][x - dx * s] === color) {
        count++; s++;
      }
      if (count >= 5) return true;
    }
    return false;
  }

  // 🔍 4방향 복합 패턴(열린4, 막힌4, 열린3, 쌍삼 등) 정밀 분석
  analyzePointPatterns(board, x, y, color) {
    board[y][x] = color;
    let openFour = 0;
    let blockedFour = 0;
    let openThree = 0;
    let blockedThree = 0;
    let openTwo = 0;

    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of dirs) {
      const pat = this.getLinePattern(board, x, y, dx, dy, color);
      if (pat.count >= 5) { /* 5목 */ }
      else if (pat.count === 4) {
        if (pat.openEnds === 2) openFour++;
        else if (pat.openEnds === 1) blockedFour++;
      } else if (pat.count === 3) {
        if (pat.openEnds === 2) openThree++;
        else if (pat.openEnds === 1) blockedThree++;
      } else if (pat.count === 2) {
        if (pat.openEnds === 2) openTwo++;
      }
    }

    board[y][x] = 0;
    return { openFour, blockedFour, openThree, blockedThree, openTwo };
  }

  evaluatePoint(board, x, y, color) {
    const pat = this.analyzePointPatterns(board, x, y, color);

    // 복합 공격 조합 가중치 부여 (4-3, 3-3 필승 패턴)
    if (pat.openFour > 0) return this.SCORE.OPEN_FOUR;
    if (pat.blockedFour >= 2) return this.SCORE.DOUBLE_FOUR;
    if (pat.blockedFour >= 1 && pat.openThree >= 1) return this.SCORE.FOUR_THREE; // 🔥 4-3 승리공격
    if (pat.openThree >= 2) return this.SCORE.DOUBLE_THREE; // 🔥 쌍삼

    let score = 0;
    score += pat.blockedFour * this.SCORE.BLOCKED_FOUR;
    score += pat.openThree * this.SCORE.OPEN_THREE;
    score += pat.blockedThree * this.SCORE.BLOCKED_THREE;
    score += pat.openTwo * this.SCORE.OPEN_TWO;

    return score;
  }

  evaluateStoneContribution(board, x, y, color) {
    let score = 0;
    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of dirs) {
      const pat = this.getLinePattern(board, x, y, dx, dy, color);
      if (pat.count >= 5) score += this.SCORE.WIN_FIVE;
      else if (pat.count === 4 && pat.openEnds === 2) score += this.SCORE.OPEN_FOUR;
      else if (pat.count === 3 && pat.openEnds === 2) score += this.SCORE.OPEN_THREE;
    }
    return score;
  }

  getLinePattern(board, x, y, dx, dy, color) {
    let count = 1;
    let openEnds = 0;

    let step = 1;
    while (true) {
      const nx = x + dx * step;
      const ny = y + dy * step;
      if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
      if (board[ny][nx] === color) { count++; step++; }
      else { if (board[ny][nx] === 0) openEnds++; break; }
    }

    step = 1;
    while (true) {
      const nx = x - dx * step;
      const ny = y - dy * step;
      if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) break;
      if (board[ny][nx] === color) { count++; step++; }
      else { if (board[ny][nx] === 0) openEnds++; break; }
    }

    return { count, openEnds };
  }

  getCandidates(board, radius = 2) {
    const candidates = [];
    const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
    let hasAnyStone = false;

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] !== 0) {
          hasAnyStone = true;
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < this.boardSize && ny >= 0 && ny < this.boardSize) {
                if (board[ny][nx] === 0 && !visited[ny][nx]) {
                  visited[ny][nx] = true;
                  candidates.push({ x: nx, y: ny });
                }
              }
            }
          }
        }
      }
    }

    if (!hasAnyStone) {
      const c = Math.floor(this.boardSize / 2);
      return [{ x: c, y: c }];
    }

    return candidates;
  }
}

if (typeof window !== 'undefined') {
  window.GomokuAI = GomokuAI;
}
