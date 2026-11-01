/**
 * ai.js - 미니 동물장기 스마트 AI 엔진 (알파베타 가지치기 & 난이도별 탐색)
 */
(function(window) {
  'use strict';

  const PIECE_VALUES = {
    lion: 100000,
    hen: 650,
    giraffe: 480,
    elephant: 420,
    chick: 150
  };

  const HAND_VALUES = {
    giraffe: 500,
    elephant: 440,
    chick: 180
  };

  class AnimalJanggiAI {
    constructor(difficulty = 'medium') {
      this.difficulty = difficulty; // 'easy' | 'medium' | 'hard'
    }

    setDifficulty(diff) {
      this.difficulty = diff;
    }

    // 최적의 수 결정
    getBestMove(gameRules) {
      const legalMoves = gameRules.getLegalMoves(PLAYER_2);
      if (legalMoves.length === 0) return null;

      // 1. 즉시 이길 수 있는 수 (사자 포획) 우선 확인
      for (const m of legalMoves) {
        if (m.action === 'move' && m.captured === 'lion') {
          return m;
        }
      }

      // 쉬움 모드: 가벼운 평가 + 랜덤성
      if (this.difficulty === 'easy') {
        return this.getEasyMove(gameRules, legalMoves);
      }

      // 보통 모드: 깊이 3 탐색
      if (this.difficulty === 'medium') {
        return this.searchMinimax(gameRules, 3);
      }

      // 어려움 모드: 깊이 5 탐색 + 정교한 수 정렬
      return this.searchMinimax(gameRules, 5);
    }

    getEasyMove(gameRules, legalMoves) {
      // 70% 확률로 기물 잡는 수나 단순 최선 수, 30% 확률로 랜덤
      if (Math.random() < 0.35) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }

      let bestScore = -Infinity;
      let bestMoves = [];

      for (const move of legalMoves) {
        const sim = gameRules.clone();
        sim.applyMove(move);
        const score = this.evaluate(sim, PLAYER_2);
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [move];
        } else if (score === bestScore) {
          bestMoves.push(move);
        }
      }

      return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    searchMinimax(gameRules, depth) {
      const legalMoves = gameRules.getLegalMoves(PLAYER_2);
      this.orderMoves(legalMoves);

      let bestScore = -Infinity;
      let bestMove = legalMoves[0];
      let alpha = -Infinity;
      const beta = Infinity;

      for (const move of legalMoves) {
        const sim = gameRules.clone();
        sim.applyMove(move);

        // 즉시 승리 판정
        if (sim.winner === PLAYER_2) {
          return move;
        }

        const score = this.minimax(sim, depth - 1, alpha, beta, false);

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }

      return bestMove;
    }

    minimax(sim, depth, alpha, beta, isMaximizing) {
      if (sim.winner === PLAYER_2) return 100000 + depth * 100;
      if (sim.winner === PLAYER_1) return -100000 - depth * 100;
      if (sim.winner === 'draw') return 0;
      if (depth <= 0) return this.evaluate(sim, PLAYER_2);

      const currentTurn = isMaximizing ? PLAYER_2 : PLAYER_1;
      const legalMoves = sim.getLegalMoves(currentTurn);
      if (legalMoves.length === 0) {
        return isMaximizing ? -50000 : 50000;
      }

      this.orderMoves(legalMoves);

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of legalMoves) {
          const nextSim = sim.clone();
          nextSim.applyMove(move);
          const ev = this.minimax(nextSim, depth - 1, alpha, beta, false);
          maxEval = Math.max(maxEval, ev);
          alpha = Math.max(alpha, ev);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of legalMoves) {
          const nextSim = sim.clone();
          nextSim.applyMove(move);
          const ev = this.minimax(nextSim, depth - 1, alpha, beta, true);
          minEval = Math.min(minEval, ev);
          beta = Math.min(beta, ev);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    }

    // 수 정렬 (포획수, 승급수 우선 탐색 -> 가지치기 극대화)
    orderMoves(moves) {
      moves.sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.captured) scoreA += PIECE_VALUES[a.captured] || 200;
        if (b.captured) scoreB += PIECE_VALUES[b.captured] || 200;

        if (a.promoted) scoreA += 300;
        if (b.promoted) scoreB += 300;

        if (a.action === 'drop') scoreA += 50;
        if (b.action === 'drop') scoreB += 50;

        return scoreB - scoreA;
      });
    }

    // 형세 평가 함수
    evaluate(sim, aiPlayer) {
      let score = 0;
      const humanPlayer = PLAYER_1;

      // 1. 보드 위 기물 가치 평가
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 3; x++) {
          const p = sim.board[y][x];
          if (!p) continue;
          const val = PIECE_VALUES[p.type] || 0;
          let posBonus = 0;

          if (p.owner === aiPlayer) {
            // AI 사자가 P1 진영(y=3)으로 전진할수록 보너스 (트라이 압박)
            if (p.type === 'lion') {
              posBonus += y * 40;
            }
            score += val + posBonus;
          } else {
            // 인간 사자가 P2 진영(y=0)으로 전진할수록 감점
            if (p.type === 'lion') {
              posBonus += (3 - y) * 40;
            }
            score -= (val + posBonus);
          }
        }
      }

      // 2. 핸드(포획) 기물 가치 평가
      for (const p of sim.hands[aiPlayer]) {
        score += HAND_VALUES[p] || 200;
      }
      for (const p of sim.hands[humanPlayer]) {
        score -= HAND_VALUES[p] || 200;
      }

      // 3. 기동성 (이동 가능한 수의 개수)
      const aiMoves = sim.getLegalMoves(aiPlayer).length;
      const humanMoves = sim.getLegalMoves(humanPlayer).length;
      score += (aiMoves - humanMoves) * 8;

      return score;
    }
  }

  window.AnimalJanggiAI = AnimalJanggiAI;
})(window);
