/**
 * Korean Janggi AI Engine
 * - Alpha-Beta Minimax search
 * - Piece-Square Tables & Mobility evaluation
 * - 3 Difficulty levels: 초급 (Easy), 중급 (Medium), 고급 (Hard)
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./rules.js'));
  } else {
    root.JanggiAI = factory(root.JanggiRules);
  }
})(typeof self !== 'undefined' ? self : this, function(rules) {
  'use strict';

  const { CHO, HAN, PIECES } = rules;

  const PIECE_VALUES = {
    K: 20000,
    R: 1300,
    C: 700,
    H: 500,
    E: 300,
    G: 300,
    P: 200
  };

  // Positional bonuses: favorable squares
  // Pawn advance bonus: Cho moving up (lower y is better), Han moving down (higher y is better)
  function evaluatePosition(board) {
    let score = 0;

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = board.grid[y][x];
        if (!p) continue;

        let val = PIECE_VALUES[p.type] || 0;
        let posBonus = 0;

        // Central control bonus for all minor pieces
        const centerDist = Math.abs(x - 4) + Math.abs(y - 4.5);
        posBonus += (8 - centerDist) * 2;

        if (p.type === 'P') {
          // Pawns advancing towards opponent
          if (p.side === CHO) {
            posBonus += (6 - y) * 12; // Advance bonus
            if (y <= 2 && x >= 3 && x <= 5) posBonus += 40; // Inside enemy palace!
          } else {
            posBonus += (y - 3) * 12;
            if (y >= 7 && x >= 3 && x <= 5) posBonus += 40;
          }
        } else if (p.type === 'R') {
          // Rooks like open files and penetration
          if (p.side === CHO && y <= 4) posBonus += 25;
          if (p.side === HAN && y >= 5) posBonus += 25;
        } else if (p.type === 'H') {
          // Horses like being forward and central
          if (p.side === CHO && y <= 6) posBonus += 15;
          if (p.side === HAN && y >= 3) posBonus += 15;
        }

        if (p.side === HAN) {
          score += (val + posBonus);
        } else {
          score -= (val + posBonus);
        }
      }
    }

    // Han komi: +1.5 pts = +15 in internal scale
    score += 15;

    return score; // Positive favors HAN, negative favors CHO
  }

  function orderMoves(moves, board) {
    return moves.slice().sort((a, b) => {
      let scoreA = 0, scoreB = 0;
      const destA = board.get(a.to[0], a.to[1]);
      const destB = board.get(b.to[0], b.to[1]);

      if (destA) scoreA += (PIECE_VALUES[destA.type] || 0) * 10 - (PIECE_VALUES[a.piece.type] || 0);
      if (destB) scoreB += (PIECE_VALUES[destB.type] || 0) * 10 - (PIECE_VALUES[b.piece.type] || 0);

      return scoreB - scoreA;
    });
  }

  function minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return { score: evaluatePosition(board) };
    }

    const side = isMaximizing ? HAN : CHO;
    const moves = board.getAllLegalMoves(side);

    if (moves.length === 0) {
      if (board.isInCheck(side)) {
        return { score: isMaximizing ? -999999 + depth : 999999 - depth };
      }
      return { score: 0 };
    }

    const ordered = orderMoves(moves, board);
    let bestMove = null;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const m of ordered) {
        const clone = board.clone();
        clone.makeRawMove(m.from[0], m.from[1], m.to[0], m.to[1]);
        clone.turn = CHO;
        const evalResult = minimax(clone, depth - 1, alpha, beta, false);
        if (evalResult.score > maxEval) {
          maxEval = evalResult.score;
          bestMove = m;
        }
        alpha = Math.max(alpha, evalResult.score);
        if (beta <= alpha) break; // Pruning
      }
      return { score: maxEval, move: bestMove };
    } else {
      let minEval = Infinity;
      for (const m of ordered) {
        const clone = board.clone();
        clone.makeRawMove(m.from[0], m.from[1], m.to[0], m.to[1]);
        clone.turn = HAN;
        const evalResult = minimax(clone, depth - 1, alpha, beta, true);
        if (evalResult.score < minEval) {
          minEval = evalResult.score;
          bestMove = m;
        }
        beta = Math.min(beta, evalResult.score);
        if (beta <= alpha) break; // Pruning
      }
      return { score: minEval, move: bestMove };
    }
  }

  class JanggiAI {
    constructor(level = 'medium') {
      this.level = level; // 'easy', 'medium', 'hard'
    }

    setLevel(level) {
      this.level = level;
    }

    // Compute best move asynchronously to keep the UI smooth
    async getBestMove(board, side = HAN) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const legalMoves = board.getAllLegalMoves(side);
          if (legalMoves.length === 0) {
            resolve(null);
            return;
          }

          const isMaximizing = (side === HAN);

          if (this.level === 'easy') {
            // Depth 1: quick tactical captures, 30% chance of picking a random safe move
            const scored = legalMoves.map(m => {
              const clone = board.clone();
              clone.makeRawMove(m.from[0], m.from[1], m.to[0], m.to[1]);
              return { move: m, score: evaluatePosition(clone) };
            });

            scored.sort((a, b) => isMaximizing ? b.score - a.score : a.score - b.score);

            // If beginner, occasionally choose from top 3
            if (scored.length > 1 && Math.random() < 0.4) {
              const pickIndex = Math.floor(Math.random() * Math.min(3, scored.length));
              resolve(scored[pickIndex].move);
              return;
            }
            resolve(scored[0].move);
            return;
          }

          if (this.level === 'medium') {
            // Depth 2
            const result = minimax(board, 2, -Infinity, Infinity, isMaximizing);
            resolve(result.move || legalMoves[0]);
            return;
          }

          // Hard (Level 3)
          const result = minimax(board, 3, -Infinity, Infinity, isMaximizing);
          resolve(result.move || legalMoves[0]);
        }, 300); // 300ms natural thinking feel
      });
    }
  }

  return {
    JanggiAI,
    evaluatePosition
  };
});
