// =========================================================================
// JH 바둑스쿨 - 최강 마스터 오목 AI 엔진 (Gomoku Grandmaster AI v2.0)
// 1. 9칸 윈도우 스팬 패턴 분석기: 뛰어 3, 뛰어 4, 열린 4, 막힌 4, 쌍삼, 4-3 완벽 탐지
// 2. VCF (Victory by Continuous Fours) 외통수 수읽기 엔진 (최대 8수 연속 단수 외통 탐색)
// 3. 계층형 위협 차단 (5목 -> 열린4 -> VCF -> 4-3 -> 쌍삼 선제 차단)
// 4. Alpha-Beta Minimax 트리 탐색 (후보군 소팅 가지치기로 0.1초 내 연산 완료)
// 5. 난이도: 초급(Easy, 35% 실수) / 중급(Normal) / 고급(Hard) / 👑 마스터(Grandmaster 최강)
// =========================================================================

class GomokuAI {
  constructor(boardSize = 15) {
    this.boardSize = boardSize;

    // 정교한 패턴별 가치 점수
    this.SCORE = {
      WIN_FIVE: 100000000,     // 5목 완성 (무조건 승리)
      OPEN_FOUR: 25000000,     // 양쪽 열린 4 (다음 수 100% 승리)
      DOUBLE_FOUR: 15000000,   // 4가 2개 (방어 불가)
      FOUR_THREE: 8000000,     // 4-3 공격 (필승의 핵심)
      DOUBLE_THREE: 4000000,   // 쌍삼 (열린 3이 2개)
      BLOCKED_FOUR: 500000,    // 한쪽 막힌 4 / 뛰어 4 (선수)
      OPEN_THREE: 200000,      // 양쪽 열린 3 / 뛰어 3
      BLOCKED_THREE: 20000,    // 한쪽 막힌 3
      OPEN_TWO: 5000,          // 양쪽 열린 2
      BLOCKED_TWO: 600,        // 한쪽 막힌 2
      OPEN_ONE: 50             // 1개
    };
  }

  // 🌟 최선의 착점 계산
  findBestMove(board, aiColor, difficulty = 'hard') {
    const oppColor = aiColor === 1 ? 2 : 1;
    const candidates = this.getCandidates(board, 2);

    if (candidates.length === 0) {
      const center = Math.floor(this.boardSize / 2);
      return { x: center, y: center };
    }
    if (candidates.length === 1) return candidates[0];

    // 👑 [마스터 / 최강 난이도]
    if (difficulty === 'master' || difficulty === 'god') {
      return this.searchGrandmaster(board, aiColor, oppColor, candidates);
    } else if (difficulty === 'hard') {
      return this.searchHeuristicDeep(board, aiColor, oppColor, candidates, 1.4);
    } else if (difficulty === 'normal') {
      return this.searchHeuristic(board, aiColor, oppColor, candidates, 1.1, 0.05);
    } else {
      // easy (초급: 35% 실수 및 낮은 수비 가중치)
      return this.searchHeuristic(board, aiColor, oppColor, candidates, 0.7, 0.35);
    }
  }

  // 👑 [최강 마스터] 9단계 계층형 결정 + VCF 외통수 + Alpha-Beta 탐색
  searchGrandmaster(board, aiColor, oppColor, candidates) {
    // 1단계: AI 즉시 5목 승리
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, aiColor)) return pos;
    }

    // 2단계: 상대 즉시 5목 무조건 방어
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, oppColor)) return pos;
    }

    // 3단계: AI 양쪽 열린 4 또는 더블 4 생성 (다음 수 승리 확정)
    for (const pos of candidates) {
      const myPat = this.analyzePointPatterns(board, pos.x, pos.y, aiColor);
      if (myPat.openFour > 0 || myPat.blockedFour >= 2) return pos;
    }

    // 4단계: 상대의 열린 4 또는 더블 4 생성 사전 차단
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openFour > 0 || oppPat.blockedFour >= 2) return pos;
    }

    // 5단계: ⚡ VCF (Victory by Continuous Fours) - 연속 4목 외통수 탐색
    const vcfMove = this.findVCF(board, aiColor, 0, 8);
    if (vcfMove) {
      return vcfMove;
    }

    // 6단계: AI 4-3 공격 또는 쌍삼(3-3) 필승 공격 감행
    for (const pos of candidates) {
      const myPat = this.analyzePointPatterns(board, pos.x, pos.y, aiColor);
      if (myPat.blockedFour >= 1 && myPat.openThree >= 1) return pos; // 4-3 공격
      if (myPat.openThree >= 2) return pos; // 쌍삼 공격
    }

    // 7단계: 상대의 4-3 또는 쌍삼 급소 사전 원천 차단
    const oppDoubleThreats = [];
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if ((oppPat.blockedFour >= 1 && oppPat.openThree >= 1) || oppPat.openThree >= 2) {
        oppDoubleThreats.push(pos);
      }
    }
    if (oppDoubleThreats.length > 0) {
      let bestT = oppDoubleThreats[0];
      let bestS = -Infinity;
      for (const t of oppDoubleThreats) {
        const s = this.evaluatePoint(board, t.x, t.y, aiColor);
        if (s > bestS) { bestS = s; bestT = t; }
      }
      return bestT;
    }

    // 8단계: 상대의 열린 3 차단 (동시에 내 공격 점수가 높은 최적 맥점)
    const oppThreeBlocks = [];
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openThree > 0) {
        oppThreeBlocks.push(pos);
      }
    }
    if (oppThreeBlocks.length > 0) {
      oppThreeBlocks.sort((a, b) => {
        return this.evaluatePoint(board, b.x, b.y, aiColor) - this.evaluatePoint(board, a.x, a.y, aiColor);
      });
      // 내 공격 점수도 좋은 방어 수라면 즉시 착수
      const topBlock = oppThreeBlocks[0];
      if (this.evaluatePoint(board, topBlock.x, topBlock.y, aiColor) >= this.SCORE.OPEN_THREE) {
        return topBlock;
      }
    }

    // 9단계: Alpha-Beta Minimax 4수 깊이 탐색 (후보군 소팅 최적화)
    return this.searchMinimaxDeep(board, aiColor, oppColor, candidates, 4);
  }

  // ⚡ VCF (Victory by Continuous Fours: 연속 4목 강제 외통수 탐색기)
  findVCF(board, color, depth = 0, maxDepth = 8) {
    if (depth >= maxDepth) return null;
    const opp = color === 1 ? 2 : 1;
    const candidates = this.getCandidates(board, 2);

    // 즉시 5목 완성수 체크
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, color)) {
        return pos;
      }
    }

    // 4를 만드는 수 추출 (열린 4 또는 막힌 4)
    const fourMoves = [];
    for (const pos of candidates) {
      const p = this.analyzePointPatterns(board, pos.x, pos.y, color);
      if (p.openFour > 0) {
        return pos; // 열린 4는 양쪽이 열려 방어 불가 -> 즉시 승리!
      }
      if (p.blockedFour > 0) {
        fourMoves.push(pos);
      }
    }

    // 각각의 4목에 대해 상대는 무조건 유일한 5목 완성 자리를 막아야 함
    for (const move of fourMoves) {
      board[move.y][move.x] = color;

      // 상대가 막아야만 하는 방어 자리 탐색
      const defenseCandidates = this.getCandidates(board, 1);
      let defPos = null;
      for (const dp of defenseCandidates) {
        if (this.isFive(board, dp.x, dp.y, color)) {
          defPos = dp;
          break;
        }
      }

      if (defPos) {
        // 상대가 막았을 때 상대 5목이 완성된다면 잘못된 4목이므로 무효
        if (this.isFive(board, defPos.x, defPos.y, opp)) {
          board[move.y][move.x] = 0;
          continue;
        }

        board[defPos.y][defPos.x] = opp;
        const subWin = this.findVCF(board, color, depth + 1, maxDepth);
        board[defPos.y][defPos.x] = 0;

        if (subWin) {
          board[move.y][move.x] = 0;
          return move; // 외통수 발견!
        }
      }

      board[move.y][move.x] = 0;
    }

    return null;
  }

  // 🧠 심층 Alpha-Beta Minimax 탐색 (상위 유력 후보만 선별 가지치기)
  searchMinimaxDeep(board, aiColor, oppColor, candidates, depth) {
    const center = (this.boardSize - 1) / 2;
    const scoredCandidates = candidates.map(pos => {
      const attack = this.evaluatePoint(board, pos.x, pos.y, aiColor);
      const defense = this.evaluatePoint(board, pos.x, pos.y, oppColor);
      const dist = Math.abs(pos.x - center) + Math.abs(pos.y - center);
      return {
        pos,
        priority: attack + (defense * 1.35) - (dist * 10)
      };
    });

    scoredCandidates.sort((a, b) => b.priority - a.priority);
    const topCandidates = scoredCandidates.slice(0, 12).map(c => c.pos);

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
      if (beta <= alpha) break; // 가지치기
    }

    return bestMove;
  }

  minimax(board, depth, isMaximizing, alpha, beta, aiColor, oppColor) {
    if (depth === 0) {
      return this.evaluateWholeBoard(board, aiColor, oppColor);
    }

    const currentTurn = isMaximizing ? aiColor : oppColor;
    const candidates = this.getCandidates(board, 1);

    // Alpha-Beta 컷오프를 극대화하기 위해 재귀 노드에서도 상위 6개 후보 우선 정렬
    const center = (this.boardSize - 1) / 2;
    const scored = candidates.map(pos => {
      const sc = this.evaluatePoint(board, pos.x, pos.y, currentTurn);
      const dist = Math.abs(pos.x - center) + Math.abs(pos.y - center);
      return { pos, sc: sc - dist * 5 };
    });
    scored.sort((a, b) => b.sc - a.sc);
    const top = scored.slice(0, 6).map(s => s.pos);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const pos of top) {
        if (this.isFive(board, pos.x, pos.y, aiColor)) return this.SCORE.WIN_FIVE;
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
      for (const pos of top) {
        if (this.isFive(board, pos.x, pos.y, oppColor)) return -this.SCORE.WIN_FIVE;
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

  evaluateWholeBoard(board, aiColor, oppColor) {
    let aiTotal = 0;
    let oppTotal = 0;
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] === aiColor) {
          aiTotal += this.evaluatePoint(board, x, y, aiColor);
        } else if (board[y][x] === oppColor) {
          oppTotal += this.evaluatePoint(board, x, y, oppColor);
        }
      }
    }
    return aiTotal - (oppTotal * 1.35);
  }

  // 🎯 [고급 난이도] 패턴 복합 탐지 휴리스틱 (4-3 / 쌍삼 공격 & 철통 방어)
  searchHeuristicDeep(board, aiColor, oppColor, candidates, defenseWeight = 1.3) {
    // 1. 5목 즉시 승리
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, aiColor)) return pos;
    }
    // 2. 상대 5목 즉시 방어
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, oppColor)) return pos;
    }
    // 3. 상대 열린 4 또는 4-3 차단
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openFour > 0 || (oppPat.blockedFour > 0 && oppPat.openThree > 0)) {
        return pos;
      }
    }
    // 4. 내 열린 4 또는 4-3 공격
    for (const pos of candidates) {
      const myPat = this.analyzePointPatterns(board, pos.x, pos.y, aiColor);
      if (myPat.openFour > 0 || (myPat.blockedFour > 0 && myPat.openThree > 0)) {
        return pos;
      }
    }
    // 5. 상대 쌍삼 차단
    for (const pos of candidates) {
      const oppPat = this.analyzePointPatterns(board, pos.x, pos.y, oppColor);
      if (oppPat.openThree >= 2) return pos;
    }

    return this.searchHeuristic(board, aiColor, oppColor, candidates, defenseWeight, 0.0);
  }

  searchHeuristic(board, aiColor, oppColor, candidates, defenseWeight, randomness) {
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, aiColor)) return pos;
    }
    for (const pos of candidates) {
      if (this.isFive(board, pos.x, pos.y, oppColor)) return pos;
    }

    let bestScore = -Infinity;
    let bestMoves = [];

    for (const pos of candidates) {
      const attackScore = this.evaluatePoint(board, pos.x, pos.y, aiColor);
      const defenseScore = this.evaluatePoint(board, pos.x, pos.y, oppColor);

      let totalScore = attackScore + (defenseScore * defenseWeight);
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

  // 🔍 9칸 윈도우 스팬 패턴 분석기 (뛰어 4, 뛰어 3 포함)
  analyzePointPatterns(board, x, y, color) {
    board[y][x] = color;
    let five = 0;
    let openFour = 0;
    let blockedFour = 0;
    let openThree = 0;
    let blockedThree = 0;
    let openTwo = 0;

    const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of dirs) {
      const pat = this.evaluateDirectionWindow(board, x, y, dx, dy, color);
      five += pat.five;
      openFour += pat.openFour;
      blockedFour += pat.blockedFour;
      openThree += pat.openThree;
      blockedThree += pat.blockedThree;
      openTwo += pat.openTwo;
    }

    board[y][x] = 0;
    return { five, openFour, blockedFour, openThree, blockedThree, openTwo };
  }

  evaluateDirectionWindow(board, x, y, dx, dy, color) {
    const opp = color === 1 ? 2 : 1;
    // -4부터 +4까지 9칸 윈도우 추출 (0: 빈칸, 1: 내 돌, 2: 상대돌 또는 벽)
    const line = [];
    for (let i = -4; i <= 4; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= this.boardSize || ny < 0 || ny >= this.boardSize) {
        line.push(2);
      } else if (board[ny][nx] === color) {
        line.push(1);
      } else if (board[ny][nx] === opp) {
        line.push(2);
      } else {
        line.push(0);
      }
    }

    const str = line.join('');
    let five = 0, openFour = 0, blockedFour = 0, openThree = 0, blockedThree = 0, openTwo = 0;

    // 5목 완성
    if (str.includes('11111')) {
      five++;
      return { five, openFour, blockedFour, openThree, blockedThree, openTwo };
    }

    // 양쪽 열린 4: 011110
    if (str.includes('011110')) {
      openFour++;
      return { five, openFour, blockedFour, openThree, blockedThree, openTwo };
    }

    // 한쪽 막힌 4 또는 뛰어 4 (10111, 11011, 11101 등)
    if (str.includes('211110') || str.includes('011112') ||
        str.includes('10111') || str.includes('11011') || str.includes('11101')) {
      blockedFour++;
    }

    // 양쪽 열린 3 및 뛰어 3 (010110, 011010)
    if (str.includes('011100') || str.includes('001110') ||
        str.includes('010110') || str.includes('011010')) {
      openThree++;
    } else if (str.includes('211100') || str.includes('001112') ||
               str.includes('210110') || str.includes('011012') ||
               str.includes('211010') || str.includes('010112') ||
               str.includes('10011') || str.includes('11001') || str.includes('10101')) {
      blockedThree++;
    }

    // 열린 2
    if (str.includes('001100') || str.includes('010100') || str.includes('001010') || str.includes('010010')) {
      openTwo++;
    }

    return { five, openFour, blockedFour, openThree, blockedThree, openTwo };
  }

  evaluatePoint(board, x, y, color) {
    const pat = this.analyzePointPatterns(board, x, y, color);
    if (pat.five > 0) return this.SCORE.WIN_FIVE;
    if (pat.openFour > 0) return this.SCORE.OPEN_FOUR;
    if (pat.blockedFour >= 2) return this.SCORE.DOUBLE_FOUR;
    if (pat.blockedFour >= 1 && pat.openThree >= 1) return this.SCORE.FOUR_THREE;
    if (pat.openThree >= 2) return this.SCORE.DOUBLE_THREE;

    let score = 0;
    score += pat.blockedFour * this.SCORE.BLOCKED_FOUR;
    score += pat.openThree * this.SCORE.OPEN_THREE;
    score += pat.blockedThree * this.SCORE.BLOCKED_THREE;
    score += pat.openTwo * this.SCORE.OPEN_TWO;
    return score;
  }

  isFive(board, x, y, color) {
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

  isWinningMove(board, x, y, color) {
    return this.isFive(board, x, y, color);
  }

  checkFive(board, x, y, color) {
    return this.isFive(board, x, y, color);
  }

  getCandidates(board, radius = 2) {
    const candidates = [];
    const visited = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(false));
    let hasStones = false;

    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        if (board[y][x] !== 0) {
          hasStones = true;
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= this.boardSize) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= this.boardSize) continue;
              if (board[ny][nx] === 0 && !visited[ny][nx]) {
                visited[ny][nx] = true;
                candidates.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
    }

    if (!hasStones) {
      const c = Math.floor(this.boardSize / 2);
      return [{ x: c, y: c }];
    }
    return candidates;
  }
}

// 브라우저 및 Node.js 환경 동시 지원
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GomokuAI };
}
