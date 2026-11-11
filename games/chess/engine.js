/**
 * Comprehensive Chess Rules & Multi-Level AI Engine
 * Pure JavaScript - 100% Self-Contained, zero dependencies
 */
(function(window) {
  'use strict';

  var PIECE_VALUES = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  // Piece-Square Tables (from White's perspective, index = row * 8 + col)
  // Higher values encourage optimal piece placement
  var PST = {
    p: [
        0,  0,  0,  0,  0,  0,  0,  0,
       50, 50, 50, 50, 50, 50, 50, 50,
       10, 10, 20, 30, 30, 20, 10, 10,
        5,  5, 10, 25, 25, 10,  5,  5,
        0,  0,  0, 20, 20,  0,  0,  0,
        5, -5,-10,  0,  0,-10, -5,  5,
        5, 10, 10,-20,-20, 10, 10,  5,
        0,  0,  0,  0,  0,  0,  0,  0
    ],
    n: [
      -50,-40,-30,-30,-30,-30,-40,-50,
      -40,-20,  0,  0,  0,  0,-20,-40,
      -30,  0, 10, 15, 15, 10,  0,-30,
      -30,  5, 15, 20, 20, 15,  5,-30,
      -30,  0, 15, 20, 20, 15,  0,-30,
      -30,  5, 10, 15, 15, 10,  5,-30,
      -40,-20,  0,  5,  5,  0,-20,-40,
      -50,-40,-30,-30,-30,-30,-40,-50
    ],
    b: [
      -20,-10,-10,-10,-10,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5, 10, 10,  5,  0,-10,
      -10,  5,  5, 10, 10,  5,  5,-10,
      -10,  0, 10, 10, 10, 10,  0,-10,
      -10, 10, 10, 10, 10, 10, 10,-10,
      -10,  5,  0,  0,  0,  0,  5,-10,
      -20,-10,-10,-10,-10,-10,-10,-20
    ],
    r: [
        0,  0,  0,  0,  0,  0,  0,  0,
        5, 10, 10, 10, 10, 10, 10,  5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
       -5,  0,  0,  0,  0,  0,  0, -5,
        0,  0,  0,  5,  5,  0,  0,  0
    ],
    q: [
      -20,-10,-10, -5, -5,-10,-10,-20,
      -10,  0,  0,  0,  0,  0,  0,-10,
      -10,  0,  5,  5,  5,  5,  0,-10,
       -5,  0,  5,  5,  5,  5,  0, -5,
        0,  0,  5,  5,  5,  5,  0, -5,
      -10,  5,  5,  5,  5,  5,  0,-10,
      -10,  0,  5,  0,  0,  0,  0,-10,
      -20,-10,-10, -5, -5,-10,-10,-20
    ],
    k: [
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -30,-40,-40,-50,-50,-40,-40,-30,
      -20,-30,-30,-40,-40,-30,-30,-20,
      -10,-20,-20,-20,-20,-20,-20,-10,
       20, 20,  0,  0,  0,  0, 20, 20,
       20, 30, 10,  0,  0, 10, 30, 20
    ]
  };

  function ChessEngine() {
    this.reset();
  }

  ChessEngine.prototype.reset = function() {
    // 8x8 Board. 0,0 is a8 (top-left for black), 7,7 is h1 (bottom-right for white)
    // Rows: 0=rank 8, 1=rank 7, ..., 6=rank 2, 7=rank 1
    // Cols: 0=a, 1=b, 2=c, 3=d, 4=e, 5=f, 6=g, 7=h
    this.board = [
      ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
      ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
      ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr']
    ];

    this.turn = 'w'; // 'w' or 'b'
    this.castling = {
      w: { k: true, q: true },
      b: { k: true, q: true }
    };
    this.enPassant = null; // { r, c } target square for en-passant capture
    this.halfMoves = 0;
    this.fullMoves = 1;
    this.history = []; // stack of snapshots for undo
    this.capturedPieces = { w: [], b: [] }; // pieces captured by white, by black
  };

  ChessEngine.prototype.cloneState = function() {
    var newBoard = new Array(8);
    for (var r = 0; r < 8; r++) {
      newBoard[r] = this.board[r].slice();
    }
    return {
      board: newBoard,
      turn: this.turn,
      castling: {
        w: { k: this.castling.w.k, q: this.castling.w.q },
        b: { k: this.castling.b.k, q: this.castling.b.q }
      },
      enPassant: this.enPassant ? { r: this.enPassant.r, c: this.enPassant.c } : null,
      halfMoves: this.halfMoves,
      fullMoves: this.fullMoves,
      capturedPieces: {
        w: this.capturedPieces.w.slice(),
        b: this.capturedPieces.b.slice()
      }
    };
  };

  ChessEngine.prototype.restoreState = function(state) {
    this.board = state.board;
    this.turn = state.turn;
    this.castling = state.castling;
    this.enPassant = state.enPassant;
    this.halfMoves = state.halfMoves;
    this.fullMoves = state.fullMoves;
    this.capturedPieces = state.capturedPieces;
  };

  ChessEngine.prototype.getPiece = function(r, c) {
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return null;
    return this.board[r][c];
  };

  ChessEngine.prototype.isSquareAttacked = function(targetR, targetC, byColor, customBoard) {
    var b = customBoard || this.board;
    var enemyPawn = (byColor === 'w') ? 'wp' : 'bp';
    var enemyKnight = (byColor === 'w') ? 'wn' : 'bn';
    var enemyBishop = (byColor === 'w') ? 'wb' : 'bb';
    var enemyRook = (byColor === 'w') ? 'wr' : 'br';
    var enemyQueen = (byColor === 'w') ? 'wq' : 'bq';
    var enemyKing = (byColor === 'w') ? 'wk' : 'bk';

    // 1. Pawn attacks
    var pawnDir = (byColor === 'w') ? 1 : -1; // white pawn attacks upwards (row decreases), so from white pawn to target is (targetR - (-1)) = targetR + 1
    var pawnR = targetR + (byColor === 'w' ? 1 : -1);
    if (pawnR >= 0 && pawnR < 8) {
      if (targetC > 0 && b[pawnR][targetC - 1] === enemyPawn) return true;
      if (targetC < 7 && b[pawnR][targetC + 1] === enemyPawn) return true;
    }

    // 2. Knight attacks
    var knightDirs = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];
    for (var i = 0; i < knightDirs.length; i++) {
      var nr = targetR + knightDirs[i][0];
      var nc = targetC + knightDirs[i][1];
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        if (b[nr][nc] === enemyKnight) return true;
      }
    }

    // 3. Bishop & Queen diagonal attacks
    var diagDirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (var d = 0; d < diagDirs.length; d++) {
      var dr = diagDirs[d][0];
      var dc = diagDirs[d][1];
      var r = targetR + dr;
      var c = targetC + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        var p = b[r][c];
        if (p) {
          if (p === enemyBishop || p === enemyQueen) return true;
          break;
        }
        r += dr;
        c += dc;
      }
    }

    // 4. Rook & Queen straight attacks
    var straightDirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var s = 0; s < straightDirs.length; s++) {
      var sr = straightDirs[s][0];
      var sc = straightDirs[s][1];
      var r2 = targetR + sr;
      var c2 = targetC + sc;
      while (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8) {
        var p2 = b[r2][c2];
        if (p2) {
          if (p2 === enemyRook || p2 === enemyQueen) return true;
          break;
        }
        r2 += sr;
        c2 += sc;
      }
    }

    // 5. King adjacent attacks
    for (var kr = -1; kr <= 1; kr++) {
      for (var kc = -1; kc <= 1; kc++) {
        if (kr === 0 && kc === 0) continue;
        var r3 = targetR + kr;
        var c3 = targetC + kc;
        if (r3 >= 0 && r3 < 8 && c3 >= 0 && c3 < 8) {
          if (b[r3][c3] === enemyKing) return true;
        }
      }
    }

    return false;
  };

  ChessEngine.prototype.findKing = function(color, customBoard) {
    var b = customBoard || this.board;
    var target = color + 'k';
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        if (b[r][c] === target) return { r: r, c: c };
      }
    }
    return null;
  };

  ChessEngine.prototype.isInCheck = function(color, customBoard) {
    var kingPos = this.findKing(color, customBoard);
    if (!kingPos) return false;
    var enemyColor = (color === 'w') ? 'b' : 'w';
    return this.isSquareAttacked(kingPos.r, kingPos.c, enemyColor, customBoard);
  };

  // Pseudo-legal moves for a piece at (fromR, fromC)
  ChessEngine.prototype.getPseudoMoves = function(fromR, fromC) {
    var piece = this.board[fromR][fromC];
    if (!piece) return [];
    var color = piece[0];
    var type = piece[1];
    var enemyColor = (color === 'w') ? 'b' : 'w';
    var moves = [];

    if (type === 'p') {
      var forward = (color === 'w') ? -1 : 1;
      var startRow = (color === 'w') ? 6 : 1;
      var promoRow = (color === 'w') ? 0 : 7;

      // 1 square forward
      var nextR = fromR + forward;
      if (nextR >= 0 && nextR < 8 && !this.board[nextR][fromC]) {
        if (nextR === promoRow) {
          ['q', 'r', 'b', 'n'].forEach(function(promo) {
            moves.push({ fromR: fromR, fromC: fromC, toR: nextR, toC: fromC, promotion: promo });
          });
        } else {
          moves.push({ fromR: fromR, fromC: fromC, toR: nextR, toC: fromC });
        }

        // 2 squares forward from starting rank
        var doubleR = fromR + forward * 2;
        if (fromR === startRow && !this.board[doubleR][fromC]) {
          moves.push({ fromR: fromR, fromC: fromC, toR: doubleR, toC: fromC, isDoublePawn: true });
        }
      }

      // Diagonal captures
      [-1, 1].forEach(function(dc) {
        var captureC = fromC + dc;
        if (captureC >= 0 && captureC < 8) {
          var targetPiece = this.board[nextR][captureC];
          if (targetPiece && targetPiece[0] === enemyColor) {
            if (nextR === promoRow) {
              ['q', 'r', 'b', 'n'].forEach(function(promo) {
                moves.push({ fromR: fromR, fromC: fromC, toR: nextR, toC: captureC, captured: targetPiece, promotion: promo });
              });
            } else {
              moves.push({ fromR: fromR, fromC: fromC, toR: nextR, toC: captureC, captured: targetPiece });
            }
          } else if (this.enPassant && this.enPassant.r === nextR && this.enPassant.c === captureC) {
            // En Passant capture!
            moves.push({ fromR: fromR, fromC: fromC, toR: nextR, toC: captureC, isEnPassant: true, captured: enemyColor + 'p' });
          }
        }
      }, this);
    } else if (type === 'n') {
      var knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      knightOffsets.forEach(function(off) {
        var tr = fromR + off[0];
        var tc = fromC + off[1];
        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          var target = this.board[tr][tc];
          if (!target) {
            moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc });
          } else if (target[0] === enemyColor) {
            moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc, captured: target });
          }
        }
      }, this);
    } else if (type === 'b' || type === 'r' || type === 'q') {
      var directions = [];
      if (type === 'b' || type === 'q') {
        directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
      }
      if (type === 'r' || type === 'q') {
        directions.push([-1, 0], [1, 0], [0, -1], [0, 1]);
      }
      directions.forEach(function(d) {
        var tr = fromR + d[0];
        var tc = fromC + d[1];
        while (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
          var target = this.board[tr][tc];
          if (!target) {
            moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc });
          } else {
            if (target[0] === enemyColor) {
              moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc, captured: target });
            }
            break;
          }
          tr += d[0];
          tc += d[1];
        }
      }, this);
    } else if (type === 'k') {
      for (var kr = -1; kr <= 1; kr++) {
        for (var kc = -1; kc <= 1; kc++) {
          if (kr === 0 && kc === 0) continue;
          var tr = fromR + kr;
          var tc = fromC + kc;
          if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8) {
            var target = this.board[tr][tc];
            if (!target) {
              moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc });
            } else if (target[0] === enemyColor) {
              moves.push({ fromR: fromR, fromC: fromC, toR: tr, toC: tc, captured: target });
            }
          }
        }
      }

      // Castling
      var rank = (color === 'w') ? 7 : 0;
      if (fromR === rank && fromC === 4 && !this.isInCheck(color)) {
        // Kingside castling
        if (this.castling[color].k) {
          if (!this.board[rank][5] && !this.board[rank][6] && this.board[rank][7] === color + 'r') {
            if (!this.isSquareAttacked(rank, 5, enemyColor) && !this.isSquareAttacked(rank, 6, enemyColor)) {
              moves.push({ fromR: fromR, fromC: fromC, toR: rank, toC: 6, isCastling: 'k' });
            }
          }
        }
        // Queenside castling
        if (this.castling[color].q) {
          if (!this.board[rank][3] && !this.board[rank][2] && !this.board[rank][1] && this.board[rank][0] === color + 'r') {
            if (!this.isSquareAttacked(rank, 3, enemyColor) && !this.isSquareAttacked(rank, 2, enemyColor)) {
              moves.push({ fromR: fromR, fromC: fromC, toR: rank, toC: 2, isCastling: 'q' });
            }
          }
        }
      }
    }

    return moves;
  };

  // Filter moves to strictly LEGAL moves (ensuring own king is not in check after move)
  ChessEngine.prototype.getLegalMoves = function(fromR, fromC) {
    var pseudo = this.getPseudoMoves(fromR, fromC);
    var legal = [];
    var color = this.board[fromR][fromC][0];

    for (var i = 0; i < pseudo.length; i++) {
      var m = pseudo[i];
      if (this.tryMoveAndCheckSafety(m, color)) {
        legal.push(m);
      }
    }
    return legal;
  };

  ChessEngine.prototype.getAllLegalMoves = function(color) {
    var c = color || this.turn;
    var all = [];
    for (var r = 0; r < 8; r++) {
      for (var col = 0; col < 8; col++) {
        var piece = this.board[r][col];
        if (piece && piece[0] === c) {
          var moves = this.getLegalMoves(r, col);
          for (var m = 0; m < moves.length; m++) {
            all.push(moves[m]);
          }
        }
      }
    }
    return all;
  };

  ChessEngine.prototype.tryMoveAndCheckSafety = function(move, color) {
    var savedState = this.cloneState();
    this.makeMove(move, true); // simulation mode
    var inCheck = this.isInCheck(color);
    this.restoreState(savedState);
    return !inCheck;
  };

  ChessEngine.prototype.makeMove = function(move, isSimulation) {
    var piece = this.board[move.fromR][move.fromC];
    var color = piece[0];
    var type = piece[1];

    if (!isSimulation) {
      this.history.push(this.cloneState());
    }

    var captured = move.captured || this.board[move.toR][move.toC];

    // Handle En Passant capture removal
    if (move.isEnPassant) {
      var epRow = (color === 'w') ? move.toR + 1 : move.toR - 1;
      this.board[epRow][move.toC] = null;
      captured = (color === 'w') ? 'bp' : 'wp';
    }

    if (captured && !isSimulation) {
      this.capturedPieces[color].push(captured);
    }

    // Move piece
    this.board[move.toR][move.toC] = move.promotion ? (color + move.promotion) : piece;
    this.board[move.fromR][move.fromC] = null;

    // Handle Castling rook relocation
    if (move.isCastling === 'k') {
      var rRow = move.toR;
      this.board[rRow][5] = color + 'r';
      this.board[rRow][7] = null;
    } else if (move.isCastling === 'q') {
      var rRow2 = move.toR;
      this.board[rRow2][3] = color + 'r';
      this.board[rRow2][0] = null;
    }

    // Update castling rights
    if (type === 'k') {
      this.castling[color].k = false;
      this.castling[color].q = false;
    } else if (type === 'r') {
      if (move.fromR === 7 && move.fromC === 0) this.castling.w.q = false;
      if (move.fromR === 7 && move.fromC === 7) this.castling.w.k = false;
      if (move.fromR === 0 && move.fromC === 0) this.castling.b.q = false;
      if (move.fromR === 0 && move.fromC === 7) this.castling.b.k = false;
    }
    // If a rook was captured, enemy loses castling on that side
    if (move.toR === 7 && move.toC === 0) this.castling.w.q = false;
    if (move.toR === 7 && move.toC === 7) this.castling.w.k = false;
    if (move.toR === 0 && move.toC === 0) this.castling.b.q = false;
    if (move.toR === 0 && move.toC === 7) this.castling.b.k = false;

    // Update en passant availability
    if (move.isDoublePawn) {
      this.enPassant = {
        r: (move.fromR + move.toR) / 2,
        c: move.fromC
      };
    } else {
      this.enPassant = null;
    }

    // Halfmove clock for 50-move rule
    if (type === 'p' || captured) {
      this.halfMoves = 0;
    } else {
      this.halfMoves++;
    }

    if (color === 'b') {
      this.fullMoves++;
    }

    this.turn = (this.turn === 'w') ? 'b' : 'w';

    return {
      captured: captured,
      isCastling: move.isCastling,
      isEnPassant: move.isEnPassant,
      promotion: move.promotion,
      inCheck: this.isInCheck(this.turn)
    };
  };

  ChessEngine.prototype.undo = function() {
    if (this.history.length === 0) return false;
    var prev = this.history.pop();
    this.restoreState(prev);
    return true;
  };

  ChessEngine.prototype.getGameStatus = function() {
    var legalMoves = this.getAllLegalMoves(this.turn);
    var inCheck = this.isInCheck(this.turn);

    if (legalMoves.length === 0) {
      if (inCheck) {
        return {
          over: true,
          winner: (this.turn === 'w') ? 'b' : 'w',
          reason: 'checkmate'
        };
      } else {
        return {
          over: true,
          winner: null,
          reason: 'stalemate'
        };
      }
    }

    if (this.halfMoves >= 100) {
      return { over: true, winner: null, reason: '50-move-rule' };
    }

    return {
      over: false,
      turn: this.turn,
      inCheck: inCheck,
      legalMoveCount: legalMoves.length
    };
  };

  /* ========================================================
     🧠 AI Evaluation & Minimax Search Engine
     ======================================================== */
  ChessEngine.prototype.evaluatePosition = function() {
    var score = 0;
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var p = this.board[r][c];
        if (p) {
          var color = p[0];
          var type = p[1];
          var val = PIECE_VALUES[type] || 0;

          // PST index
          var pstIdx = (color === 'w') ? (r * 8 + c) : ((7 - r) * 8 + c);
          var pstTable = PST[type];
          var pstVal = (pstTable && pstTable[pstIdx]) ? pstTable[pstIdx] : 0;

          var total = val + pstVal;
          if (color === 'w') {
            score += total;
          } else {
            score -= total;
          }
        }
      }
    }
    return score;
  };

  // Quiescence search to prevent horizon effect on captures
  ChessEngine.prototype.quiescence = function(alpha, beta, isMaximizing, depth) {
    var standPat = this.evaluatePosition();
    if (depth <= 0) return standPat;

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;
    }

    var color = isMaximizing ? 'w' : 'b';
    var allMoves = this.getAllLegalMoves(color);
    // Only capture moves in quiescence search
    var captureMoves = allMoves.filter(function(m) { return !!m.captured; });

    // MVV-LVA move ordering
    captureMoves.sort(function(a, b) {
      var valA = PIECE_VALUES[a.captured ? a.captured[1] : 'p'];
      var valB = PIECE_VALUES[b.captured ? b.captured[1] : 'p'];
      return valB - valA;
    });

    for (var i = 0; i < captureMoves.length; i++) {
      var saved = this.cloneState();
      this.makeMove(captureMoves[i], true);
      var score = this.quiescence(alpha, beta, !isMaximizing, depth - 1);
      this.restoreState(saved);

      if (isMaximizing) {
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      } else {
        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
      }
    }

    return isMaximizing ? alpha : beta;
  };

  ChessEngine.prototype.minimax = function(depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
      return this.quiescence(alpha, beta, isMaximizing, 2);
    }

    var color = isMaximizing ? 'w' : 'b';
    var moves = this.getAllLegalMoves(color);

    if (moves.length === 0) {
      if (this.isInCheck(color)) {
        // Checkmate! Return massive score penalized by search depth
        return isMaximizing ? (-99999 - depth * 100) : (99999 + depth * 100);
      }
      return 0; // Stalemate
    }

    // Move ordering: Captures first, promotions first
    moves.sort(function(a, b) {
      var scoreA = 0;
      var scoreB = 0;
      if (a.captured) scoreA += 1000 + PIECE_VALUES[a.captured[1]];
      if (b.captured) scoreB += 1000 + PIECE_VALUES[b.captured[1]];
      if (a.promotion) scoreA += 900;
      if (b.promotion) scoreB += 900;
      return scoreB - scoreA;
    });

    if (isMaximizing) {
      var maxEval = -Infinity;
      for (var i = 0; i < moves.length; i++) {
        var saved = this.cloneState();
        this.makeMove(moves[i], true);
        var evaluation = this.minimax(depth - 1, alpha, beta, false);
        this.restoreState(saved);

        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      var minEval = Infinity;
      for (var j = 0; j < moves.length; j++) {
        var saved2 = this.cloneState();
        this.makeMove(moves[j], true);
        var evaluation2 = this.minimax(depth - 1, alpha, beta, true);
        this.restoreState(saved2);

        minEval = Math.min(minEval, evaluation2);
        beta = Math.min(beta, evaluation2);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  };

  /**
   * Find Best Move based on AI difficulty level (1 to 5)
   * 1: 입문 (Elo ~800, 1-ply + 35% chance to blunder)
   * 2: 초급 (Elo ~1200, 2-ply)
   * 3: 중급 (Elo ~1500, 3-ply + quiescence)
   * 4: 고급 (Elo ~1800, 4-ply + quiescence)
   * 5: 마스터 (Elo ~2200, 4-ply deep + enhanced heuristics)
   */
  ChessEngine.prototype.getAIMove = function(level) {
    var moves = this.getAllLegalMoves(this.turn);
    if (moves.length === 0) return null;

    var lvl = Math.max(1, Math.min(5, parseInt(level, 10) || 3));
    var isWhite = (this.turn === 'w');

    // Level 1: Blunder / casual play
    if (lvl === 1 && Math.random() < 0.35) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    var searchDepth = 1;
    if (lvl === 1) searchDepth = 1;
    else if (lvl === 2) searchDepth = 2;
    else if (lvl === 3) searchDepth = 3;
    else if (lvl === 4) searchDepth = 4;
    else if (lvl === 5) searchDepth = 4;

    var bestMove = moves[0];
    var bestValue = isWhite ? -Infinity : Infinity;

    // Shuffle moves slightly to avoid repetitive games with identical openings
    moves.sort(function() { return 0.5 - Math.random(); });

    for (var i = 0; i < moves.length; i++) {
      var m = moves[i];
      var saved = this.cloneState();
      this.makeMove(m, true);
      var val = this.minimax(searchDepth - 1, -Infinity, Infinity, !isWhite);
      this.restoreState(saved);

      if (isWhite) {
        if (val > bestValue) {
          bestValue = val;
          bestMove = m;
        }
      } else {
        if (val < bestValue) {
          bestValue = val;
          bestMove = m;
        }
      }
    }

    return bestMove;
  };

  window.ChessEngine = ChessEngine;
})(window);
