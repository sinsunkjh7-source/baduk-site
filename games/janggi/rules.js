/**
 * Korean Traditional Janggi (한국 정통 장기) Engine
 * - 9x10 intersections (x: 0..8, y: 0..9)
 * - CHO (1, 楚) plays first, HAN (2, 漢) plays second
 * - Full rules for all 7 pieces (K, G, R, C, H, E, P) including 멱 and palace diagonals
 * - 4 Sangcharim formations: 마상마상, 상마상마, 마상상마, 상마마상
 * - Check (장군), Checkmate (외통), Bikjang (빅장), Pass (한수쉼), Official Scoring
 */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JanggiRules = factory();
  }
})(typeof self !== 'undefined' ? self : this, function() {
  'use strict';

  const CHO = 1; // 초 (楚, Green / Blue)
  const HAN = 2; // 한 (漢, Red)

  // Piece types
  const PIECES = {
    K: { type: 'K', name: '궁', score: 0, charCho: '楚', charHan: '漢' },
    G: { type: 'G', name: '사', score: 3, charCho: '士', charHan: '士' },
    R: { type: 'R', name: '차', score: 13, charCho: '車', charHan: '車' },
    C: { type: 'C', name: '포', score: 7, charCho: '包', charHan: '包' },
    H: { type: 'H', name: '마', score: 5, charCho: '馬', charHan: '馬' },
    E: { type: 'E', name: '상', score: 3, charCho: '象', charHan: '象' },
    P: { type: 'P', nameCho: '졸', nameHan: '병', score: 2, charCho: '卒', charHan: '兵' }
  };

  const FORMATIONS = {
    // [col 1, col 2, col 6, col 7]
    'MSMS': { id: 'MSMS', name: '마상마상 (왼마)', pieces: ['H', 'E', 'H', 'E'] },
    'SMSM': { id: 'SMSM', name: '상마상마 (오른마)', pieces: ['E', 'H', 'E', 'H'] },
    'MSSM': { id: 'MSSM', name: '마상상마 (안상)', pieces: ['H', 'E', 'E', 'H'] },
    'SMMS': { id: 'SMMS', name: '상마마상 (귀마)', pieces: ['E', 'H', 'H', 'E'] }
  };

  // Helper: check inside board bounds
  function inBounds(x, y) {
    return x >= 0 && x <= 8 && y >= 0 && y <= 9;
  }

  // Palaces
  function inHanPalace(x, y) {
    return x >= 3 && x <= 5 && y >= 0 && y <= 2;
  }

  function inChoPalace(x, y) {
    return x >= 3 && x <= 5 && y >= 7 && y <= 9;
  }

  function inAnyPalace(x, y) {
    return inHanPalace(x, y) || inChoPalace(x, y);
  }

  // Palace diagonal adjacency graph: [x,y] -> array of [nx, ny]
  const PALACE_DIAGONALS = {
    // Han palace
    '3,0': [[4, 1]],
    '5,0': [[4, 1]],
    '4,1': [[3, 0], [5, 0], [3, 2], [5, 2]],
    '3,2': [[4, 1]],
    '5,2': [[4, 1]],
    // Cho palace
    '3,7': [[4, 8]],
    '5,7': [[4, 8]],
    '4,8': [[3, 7], [5, 7], [3, 9], [5, 9]],
    '3,9': [[4, 8]],
    '5,9': [[4, 8]]
  };

  // Board representation: 10 rows (y=0..9), each row 9 cols (x=0..8)
  class JanggiBoard {
    constructor(choFormation = 'SMMS', hanFormation = 'SMMS') {
      this.grid = Array(10).fill(null).map(() => Array(9).fill(null));
      this.turn = CHO;
      this.choFormation = choFormation;
      this.hanFormation = hanFormation;
      this.moveCount = 0;
      this.history = []; // { from: [x,y], to: [x,y], moved: piece, captured: piece|null }
      this.consecutivePasses = 0;
      this.captured = { [CHO]: [], [HAN]: [] }; // captured enemy pieces
      this.setup(choFormation, hanFormation);
    }

    clone() {
      const copy = new JanggiBoard(this.choFormation, this.hanFormation);
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
          const p = this.grid[y][x];
          copy.grid[y][x] = p ? { type: p.type, side: p.side } : null;
        }
      }
      copy.turn = this.turn;
      copy.moveCount = this.moveCount;
      copy.consecutivePasses = this.consecutivePasses;
      copy.captured[CHO] = this.captured[CHO].slice();
      copy.captured[HAN] = this.captured[HAN].slice();
      return copy;
    }

    get(x, y) {
      if (!inBounds(x, y)) return null;
      return this.grid[y][x];
    }

    set(x, y, piece) {
      if (!inBounds(x, y)) return;
      this.grid[y][x] = piece;
    }

    setup(choFormKey = 'SMMS', hanFormKey = 'SMMS') {
      this.grid = Array(10).fill(null).map(() => Array(9).fill(null));
      const choF = FORMATIONS[choFormKey] || FORMATIONS['SMMS'];
      const hanF = FORMATIONS[hanFormKey] || FORMATIONS['SMMS'];

      // Han (y: 0..3)
      this.set(0, 0, { type: 'R', side: HAN });
      this.set(1, 0, { type: hanF.pieces[0], side: HAN });
      this.set(2, 0, { type: hanF.pieces[1], side: HAN });
      this.set(3, 0, { type: 'G', side: HAN });
      this.set(5, 0, { type: 'G', side: HAN });
      this.set(6, 0, { type: hanF.pieces[2], side: HAN });
      this.set(7, 0, { type: hanF.pieces[3], side: HAN });
      this.set(8, 0, { type: 'R', side: HAN });

      this.set(4, 1, { type: 'K', side: HAN });

      this.set(1, 2, { type: 'C', side: HAN });
      this.set(7, 2, { type: 'C', side: HAN });

      this.set(0, 3, { type: 'P', side: HAN });
      this.set(2, 3, { type: 'P', side: HAN });
      this.set(4, 3, { type: 'P', side: HAN });
      this.set(6, 3, { type: 'P', side: HAN });
      this.set(8, 3, { type: 'P', side: HAN });

      // Cho (y: 6..9)
      this.set(0, 6, { type: 'P', side: CHO });
      this.set(2, 6, { type: 'P', side: CHO });
      this.set(4, 6, { type: 'P', side: CHO });
      this.set(6, 6, { type: 'P', side: CHO });
      this.set(8, 6, { type: 'P', side: CHO });

      this.set(1, 7, { type: 'C', side: CHO });
      this.set(7, 7, { type: 'C', side: CHO });

      this.set(4, 8, { type: 'K', side: CHO });

      this.set(0, 9, { type: 'R', side: CHO });
      this.set(1, 9, { type: choF.pieces[0], side: CHO });
      this.set(2, 9, { type: choF.pieces[1], side: CHO });
      this.set(3, 9, { type: 'G', side: CHO });
      this.set(5, 9, { type: 'G', side: CHO });
      this.set(6, 9, { type: choF.pieces[2], side: CHO });
      this.set(7, 9, { type: choF.pieces[3], side: CHO });
      this.set(8, 9, { type: 'R', side: CHO });
    }

    // Find the King position for a given side
    findKing(side) {
      const minX = 3, maxX = 5;
      const minY = side === HAN ? 0 : 7;
      const maxY = side === HAN ? 2 : 9;
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const p = this.grid[y][x];
          if (p && p.type === 'K' && p.side === side) {
            return [x, y];
          }
        }
      }
      return null;
    }

    // Check if the given side's King is in check (장군)
    isInCheck(side) {
      const kingPos = this.findKing(side);
      if (!kingPos) return true; // Captured or missing
      const [kx, ky] = kingPos;
      const enemy = side === CHO ? HAN : CHO;

      // Check if any enemy piece can attack kingPos
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
          const p = this.grid[y][x];
          if (p && p.side === enemy) {
            if (this.canPseudoAttack(x, y, p, kx, ky)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    // Can piece at (x, y) attack target (tx, ty) ignoring check constraints?
    canPseudoAttack(x, y, p, tx, ty) {
      const moves = this.getPseudoMoves(x, y);
      return moves.some(([mx, my]) => mx === tx && my === ty);
    }

    // Pseudo-legal moves for piece at (x, y) without verifying king safety
    getPseudoMoves(x, y) {
      const p = this.get(x, y);
      if (!p) return [];
      const moves = [];
      const side = p.side;
      const enemy = side === CHO ? HAN : CHO;

      const addIfValid = (nx, ny) => {
        if (!inBounds(nx, ny)) return false;
        const dest = this.get(nx, ny);
        if (!dest) {
          moves.push([nx, ny]);
          return true; // continue sliding if line piece
        }
        if (dest.side === enemy) {
          moves.push([nx, ny]);
        }
        return false; // hit a piece, stop sliding
      };

      switch (p.type) {
        case 'K':
        case 'G': {
          // Restricted to own palace
          const inPalace = side === HAN ? inHanPalace : inChoPalace;
          const orthos = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of orthos) {
            const nx = x + dx, ny = y + dy;
            if (inPalace(nx, ny)) addIfValid(nx, ny);
          }
          // Palace diagonal moves
          const key = `${x},${y}`;
          if (PALACE_DIAGONALS[key]) {
            for (const [nx, ny] of PALACE_DIAGONALS[key]) {
              if (inPalace(nx, ny)) addIfValid(nx, ny);
            }
          }
          break;
        }

        case 'P': { // 졸/병
          // Cho moves UP (-1), Han moves DOWN (+1)
          const forwardDy = side === CHO ? -1 : 1;
          // Forward, Left, Right
          addIfValid(x, y + forwardDy);
          addIfValid(x - 1, y);
          addIfValid(x + 1, y);

          // In enemy palace, can move forward along diagonal lines
          const enemyPalace = side === CHO ? inHanPalace : inChoPalace;
          if (enemyPalace(x, y)) {
            const key = `${x},${y}`;
            if (PALACE_DIAGONALS[key]) {
              for (const [nx, ny] of PALACE_DIAGONALS[key]) {
                // Must be moving forward
                if ((side === CHO && ny < y) || (side === HAN && ny > y)) {
                  addIfValid(nx, ny);
                }
              }
            }
          }
          break;
        }

        case 'R': { // 차
          // Orthogonal sliding in 4 directions
          const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of dirs) {
            let step = 1;
            while (true) {
              const nx = x + dx * step, ny = y + dy * step;
              if (!addIfValid(nx, ny)) break;
              step++;
            }
          }

          // In palaces, can slide along diagonal lines
          if (inAnyPalace(x, y)) {
            this.addRookPalaceDiagonals(x, y, moves, side);
          }
          break;
        }

        case 'C': { // 포
          // Orthogonal jumping over exactly 1 piece (cannot jump or capture 포)
          const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of dirs) {
            let step = 1;
            let jumped = null;
            while (true) {
              const nx = x + dx * step, ny = y + dy * step;
              if (!inBounds(nx, ny)) break;
              const cur = this.get(nx, ny);
              if (!jumped) {
                if (cur) {
                  if (cur.type === 'C') break; // 포 cannot jump over 포!
                  jumped = cur; // Found the bridge
                }
              } else {
                // Already jumped 1 piece
                if (!cur) {
                  moves.push([nx, ny]);
                } else {
                  // Hit a piece: can only capture if enemy and NOT a 포
                  if (cur.side === enemy && cur.type !== 'C') {
                    moves.push([nx, ny]);
                  }
                  break; // Stop after hitting second piece
                }
              }
              step++;
            }
          }

          // Palace diagonal jump
          this.addCannonPalaceDiagonals(x, y, moves, side);
          break;
        }

        case 'H': { // 마 (날일자, 멱 체크)
          const horseMoves = [
            // [mx, my, tx1, ty1, tx2, ty2]
            // Up: 멱 at (x, y-1)
            { mx: 0, my: -1, targets: [[-1, -2], [1, -2]] },
            // Down: 멱 at (x, y+1)
            { mx: 0, my: 1, targets: [[-1, 2], [1, 2]] },
            // Left: 멱 at (x-1, y)
            { mx: -1, my: 0, targets: [[-2, -1], [-2, 1]] },
            // Right: 멱 at (x+1, y)
            { mx: 1, my: 0, targets: [[2, -1], [2, 1]] }
          ];

          for (const item of horseMoves) {
            const bx = x + item.mx, by = y + item.my;
            if (inBounds(bx, by) && !this.get(bx, by)) { // 멱 must be empty!
              for (const [tdx, tdy] of item.targets) {
                addIfValid(x + tdx, y + tdy);
              }
            }
          }
          break;
        }

        case 'E': { // 상 (쓸용자, 1 orthogonal + 2 diagonal, 2 멱 체크)
          const elephantMoves = [
            // Up
            {
              bx1: 0, by1: -1,
              branches: [
                { bx2: -1, by2: -2, tx: -2, ty: -3 },
                { bx2: 1, by2: -2, tx: 2, ty: -3 }
              ]
            },
            // Down
            {
              bx1: 0, by1: 1,
              branches: [
                { bx2: -1, by2: 2, tx: -2, ty: 3 },
                { bx2: 1, by2: 2, tx: 2, ty: 3 }
              ]
            },
            // Left
            {
              bx1: -1, by1: 0,
              branches: [
                { bx2: -2, by2: -1, tx: -3, ty: -2 },
                { bx2: -2, by2: 1, tx: -3, ty: 2 }
              ]
            },
            // Right
            {
              bx1: 1, by1: 0,
              branches: [
                { bx2: 2, by2: -1, tx: 3, ty: -2 },
                { bx2: 2, by2: 1, tx: 3, ty: 2 }
              ]
            }
          ];

          for (const item of elephantMoves) {
            const step1X = x + item.bx1, step1Y = y + item.by1;
            if (inBounds(step1X, step1Y) && !this.get(step1X, step1Y)) { // First 멱 empty
              for (const br of item.branches) {
                const step2X = x + br.bx2, step2Y = y + br.by2;
                if (inBounds(step2X, step2Y) && !this.get(step2X, step2Y)) { // Second 멱 empty
                  addIfValid(x + br.tx, y + br.ty);
                }
              }
            }
          }
          break;
        }
      }

      return moves;
    }

    addRookPalaceDiagonals(x, y, moves, side) {
      const enemy = side === CHO ? HAN : CHO;
      const add = (tx, ty) => {
        if (!inBounds(tx, ty)) return false;
        const cur = this.get(tx, ty);
        if (!cur) {
          moves.push([tx, ty]);
          return true;
        }
        if (cur.side === enemy) moves.push([tx, ty]);
        return false;
      };

      // Han Palace diagonal paths
      if (x === 3 && y === 0) {
        if (add(4, 1)) add(5, 2);
      } else if (x === 5 && y === 0) {
        if (add(4, 1)) add(3, 2);
      } else if (x === 3 && y === 2) {
        if (add(4, 1)) add(5, 0);
      } else if (x === 5 && y === 2) {
        if (add(4, 1)) add(3, 0);
      } else if (x === 4 && y === 1) {
        add(3, 0); add(5, 0); add(3, 2); add(5, 2);
      }

      // Cho Palace diagonal paths
      if (x === 3 && y === 7) {
        if (add(4, 8)) add(5, 9);
      } else if (x === 5 && y === 7) {
        if (add(4, 8)) add(3, 9);
      } else if (x === 3 && y === 9) {
        if (add(4, 8)) add(5, 7);
      } else if (x === 5 && y === 9) {
        if (add(4, 8)) add(3, 7);
      } else if (x === 4 && y === 8) {
        add(3, 7); add(5, 7); add(3, 9); add(5, 9);
      }
    }

    addCannonPalaceDiagonals(x, y, moves, side) {
      const enemy = side === CHO ? HAN : CHO;
      const checkDiagonalJump = (midX, midY, destX, destY) => {
        const mid = this.get(midX, midY);
        if (mid && mid.type !== 'C') { // Valid bridge
          const dest = this.get(destX, destY);
          if (!dest) {
            moves.push([destX, destY]);
          } else if (dest.side === enemy && dest.type !== 'C') {
            moves.push([destX, destY]);
          }
        }
      };

      // Han palace corners jump over (4, 1) to opposite corner
      if (x === 3 && y === 0) checkDiagonalJump(4, 1, 5, 2);
      else if (x === 5 && y === 0) checkDiagonalJump(4, 1, 3, 2);
      else if (x === 3 && y === 2) checkDiagonalJump(4, 1, 5, 0);
      else if (x === 5 && y === 2) checkDiagonalJump(4, 1, 3, 0);

      // Cho palace corners jump over (4, 8) to opposite corner
      if (x === 3 && y === 7) checkDiagonalJump(4, 8, 5, 9);
      else if (x === 5 && y === 7) checkDiagonalJump(4, 8, 3, 9);
      else if (x === 3 && y === 9) checkDiagonalJump(4, 8, 5, 7);
      else if (x === 5 && y === 9) checkDiagonalJump(4, 8, 3, 7);
    }

    // Get strictly legal moves for piece at (x, y) (ensuring own king not left in check)
    getLegalMoves(x, y) {
      const p = this.get(x, y);
      if (!p || p.side !== this.turn) return [];
      const pseudo = this.getPseudoMoves(x, y);
      const legal = [];

      for (const [tx, ty] of pseudo) {
        // Try move on a clone and test check
        const clone = this.clone();
        clone.makeRawMove(x, y, tx, ty);
        if (!clone.isInCheck(p.side)) {
          legal.push([tx, ty]);
        }
      }
      return legal;
    }

    // Get all legal moves for current player
    getAllLegalMoves(side = this.turn) {
      const all = [];
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
          const p = this.grid[y][x];
          if (p && p.side === side) {
            const targets = this.getLegalMoves(x, y);
            for (const [tx, ty] of targets) {
              all.push({ from: [x, y], to: [tx, ty], piece: p });
            }
          }
        }
      }
      return all;
    }

    // Execute move without validation
    makeRawMove(fx, fy, tx, ty) {
      const moved = this.grid[fy][fx];
      const captured = this.grid[ty][tx];
      this.grid[ty][tx] = moved;
      this.grid[fy][fx] = null;
      if (captured) {
        this.captured[moved.side].push(captured);
      }
      return captured;
    }

    // Public move method
    move(fx, fy, tx, ty) {
      const p = this.get(fx, fy);
      if (!p || p.side !== this.turn) return false;

      const legal = this.getLegalMoves(fx, fy);
      const isLegal = legal.some(([lx, ly]) => lx === tx && ly === ty);
      if (!isLegal) return false;

      const captured = this.makeRawMove(fx, fy, tx, ty);
      this.history.push({
        from: [fx, fy],
        to: [tx, ty],
        moved: { type: p.type, side: p.side },
        captured: captured ? { type: captured.type, side: captured.side } : null
      });

      this.consecutivePasses = 0;
      this.moveCount++;
      this.turn = this.turn === CHO ? HAN : CHO;
      return true;
    }

    // Pass turn (한수 쉼) - only legal if NOT currently in check!
    pass() {
      if (this.isInCheck(this.turn)) return false; // Cannot pass when in check!
      this.history.push({
        from: null,
        to: null,
        moved: null,
        captured: null,
        pass: true,
        side: this.turn
      });
      this.consecutivePasses++;
      this.moveCount++;
      this.turn = this.turn === CHO ? HAN : CHO;
      return true;
    }

    // Check Bikjang condition (stare-down of Kings)
    isBikjang() {
      const choK = this.findKing(CHO);
      const hanK = this.findKing(HAN);
      if (!choK || !hanK) return false;
      if (choK[0] !== hanK[0]) return false; // Not on the same vertical file

      const x = choK[0];
      const minY = hanK[1] + 1;
      const maxY = choK[1] - 1;
      for (let y = minY; y <= maxY; y++) {
        if (this.grid[y][x]) return false; // Blocked by a piece
      }
      return true; // Kings face each other openly!
    }

    // Calculate official scores for both sides
    getScores() {
      let choScore = 0;
      let hanScore = 1.5; // Han Komi (덤)

      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
          const p = this.grid[y][x];
          if (p) {
            const val = PIECES[p.type]?.score || 0;
            if (p.side === CHO) choScore += val;
            else hanScore += val;
          }
        }
      }

      return {
        cho: Math.round(choScore * 10) / 10,
        han: Math.round(hanScore * 10) / 10
      };
    }

    // Game state assessment: { status: 'playing'|'check'|'checkmate'|'draw_pass'|'draw_bikjang', winner: null|1|2 }
    getStatus() {
      const currentInCheck = this.isInCheck(this.turn);
      const legalMoves = this.getAllLegalMoves(this.turn);

      // Checkmate
      if (legalMoves.length === 0) {
        if (currentInCheck) {
          // Checkmate! The other player wins!
          return {
            status: 'checkmate',
            winner: this.turn === CHO ? HAN : CHO,
            reason: `${this.turn === CHO ? '초(楚)' : '한(漢)'} 외통패!`
          };
        } else {
          // No legal moves and not in check: Stalemate / pass
          return {
            status: 'stalemate',
            winner: null,
            reason: '둘 수 있는 수가 없습니다.'
          };
        }
      }

      // Consecutive passes -> score decision
      if (this.consecutivePasses >= 2) {
        const scores = this.getScores();
        let winner = null;
        if (scores.cho > scores.han) winner = CHO;
        else if (scores.han > scores.cho) winner = HAN;
        return {
          status: 'draw_pass',
          winner,
          scores,
          reason: `양측 연속 한수 쉼으로 점수 판정: 초 ${scores.cho}점 vs 한 ${scores.han}점`
        };
      }

      // Bikjang check
      if (this.isBikjang()) {
        return {
          status: 'bikjang',
          winner: null,
          reason: '빅장 (두 궁이 마주봄)'
        };
      }

      if (currentInCheck) {
        return {
          status: 'check',
          winner: null,
          reason: `${this.turn === CHO ? '초(楚)' : '한(漢)'} 장군!`
        };
      }

      return {
        status: 'playing',
        winner: null,
        reason: `${this.turn === CHO ? '초(楚)' : '한(漢)'} 차례`
      };
    }
  }

  return {
    CHO,
    HAN,
    PIECES,
    FORMATIONS,
    inBounds,
    inHanPalace,
    inChoPalace,
    inAnyPalace,
    JanggiBoard
  };
});
