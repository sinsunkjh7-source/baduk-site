/**
 * rules.js - 미니 동물장기 (Doubutsu Shogi) 게임 규칙 & 판 상태 엔진
 */
(function(window) {
  'use strict';

  // 플레이어 정의
  const PLAYER_1 = 'p1'; // 나 (아래쪽, 초록/숲)
  const PLAYER_2 = 'p2'; // 상대/AI (위쪽, 하늘)

  // 기물 정의
  const PIECES = {
    LION: 'lion',         // 사자 (왕)
    GIRAFFE: 'giraffe',   // 기린
    ELEPHANT: 'elephant', // 코끼리
    CHICK: 'chick',       // 병아리
    HEN: 'hen'            // 닭 (승급된 병아리)
  };

  // 방향 벡터 (dx: x열 변화, dy: y행 변화 - p1 기준 위쪽이 -1)
  const MOVES = {
    [PIECES.LION]: [
      { dx: 0, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 0 }, { dx: 1, dy: 1 },
      { dx: 0, dy: 1 },  { dx: -1, dy: 1 }, { dx: -1, dy: 0 }, { dx: -1, dy: -1 }
    ],
    [PIECES.GIRAFFE]: [
      { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ],
    [PIECES.ELEPHANT]: [
      { dx: -1, dy: -1 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }, { dx: -1, dy: 1 }
    ],
    [PIECES.CHICK]: [
      { dx: 0, dy: -1 } // P1은 위로, P2는 아래로
    ],
    [PIECES.HEN]: [
      { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
      { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
      { dx: 0, dy: 1 } // 뒤로 1칸만 가능 (대각선 뒤는 불가)
    ]
  };

  class AnimalJanggiRules {
    constructor() {
      this.reset();
    }

    reset() {
      // 3열 x 4행 보드 (x: 0..2, y: 0..3)
      // null 또는 { owner: 'p1'|'p2', type: 'lion'|'giraffe'|... }
      this.board = Array(4).fill(null).map(() => Array(3).fill(null));

      // 포획한 기물 벤치
      this.hands = {
        [PLAYER_1]: [],
        [PLAYER_2]: []
      };

      this.currentTurn = PLAYER_1;
      this.moveHistory = [];
      this.stateHistory = []; // 반복수(선일수) 감지용
      this.winner = null;
      this.winReason = null; // 'catch' | 'try' | 'stalemate' | 'repetition'

      this.initBoard();
      this.recordState();
    }

    /**
     * 표준 동물장기 초기 배치
     * 상대(P2, y=0): [기린, 사자, 코끼리] (P2 기준 [코끼리, 사자, 기린])
     * 상대 병아리(P2, y=1, x=1)
     * 내 병아리(P1, y=2, x=1)
     * 나(P1, y=3): [코끼리, 사자, 기린]
     */
    initBoard() {
      // P2 (상대/AI, 위쪽)
      this.board[0][0] = { owner: PLAYER_2, type: PIECES.GIRAFFE };
      this.board[0][1] = { owner: PLAYER_2, type: PIECES.LION };
      this.board[0][2] = { owner: PLAYER_2, type: PIECES.ELEPHANT };
      this.board[1][1] = { owner: PLAYER_2, type: PIECES.CHICK };

      // P1 (나, 아래쪽)
      this.board[2][1] = { owner: PLAYER_1, type: PIECES.CHICK };
      this.board[3][0] = { owner: PLAYER_1, type: PIECES.ELEPHANT };
      this.board[3][1] = { owner: PLAYER_1, type: PIECES.LION };
      this.board[3][2] = { owner: PLAYER_1, type: PIECES.GIRAFFE };
    }

    // 판 범위 확인
    isInside(x, y) {
      return x >= 0 && x < 3 && y >= 0 && y < 4;
    }

    // 특정 위치 기물 가져오기
    getPiece(x, y) {
      if (!this.isInside(x, y)) return null;
      return this.board[y][x];
    }

    // 현재 플레이어의 모든 합법적인 수 생성
    // 반환: [ { type: 'move', from: {x,y}, to: {x,y}, piece, captured, promoted }, { type: 'drop', to: {x,y}, piece } ]
    getLegalMoves(player = this.currentTurn) {
      if (this.winner) return [];
      const moves = [];

      // 1. 판 위의 기물 이동
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 3; x++) {
          const piece = this.board[y][x];
          if (piece && piece.owner === player) {
            const pieceMoves = this.getPieceMoves(x, y);
            moves.push(...pieceMoves);
          }
        }
      }

      // 2. 포획 기물 소환 (Drop)
      const hand = this.hands[player];
      if (hand.length > 0) {
        // 중복 방지 (기물 타입별로 1번씩만 계산)
        const uniqueTypes = [...new Set(hand)];
        for (let y = 0; y < 4; y++) {
          for (let x = 0; x < 3; x++) {
            if (this.board[y][x] === null) {
              for (const pType of uniqueTypes) {
                // 병아리는 상대방 맨 끝 행에 소환 불가 (갈 곳이 없으므로)
                if (pType === PIECES.CHICK) {
                  if (player === PLAYER_1 && y === 0) continue;
                  if (player === PLAYER_2 && y === 3) continue;
                }
                moves.push({
                  action: 'drop',
                  to: { x, y },
                  piece: pType,
                  owner: player
                });
              }
            }
          }
        }
      }

      return moves;
    }

    // 특정 위치 기물의 이동 가능한 수 목록
    getPieceMoves(x, y) {
      const piece = this.getPiece(x, y);
      if (!piece) return [];
      const moves = [];
      const dirList = MOVES[piece.type];
      const isP1 = piece.owner === PLAYER_1;

      for (const dir of dirList) {
        // P2의 경우 dy와 dx 방향이 180도 반대 (위-아래 반전)
        const dx = isP1 ? dir.dx : -dir.dx;
        const dy = isP1 ? dir.dy : -dir.dy;

        const nx = x + dx;
        const ny = y + dy;

        if (!this.isInside(nx, ny)) continue;

        const target = this.board[ny][nx];
        // 아군 기물이 있는 곳은 이동 불가
        if (target && target.owner === piece.owner) continue;

        // 병아리 승급 여부 확인 (적진 최후방 도달)
        const canPromote = (piece.type === PIECES.CHICK) &&
          ((isP1 && ny === 0) || (!isP1 && ny === 3));

        moves.push({
          action: 'move',
          from: { x, y },
          to: { x: nx, y: ny },
          piece: piece.type,
          owner: piece.owner,
          captured: target ? target.type : null,
          promoted: canPromote
        });
      }

      return moves;
    }

    // 수 실행
    applyMove(move) {
      if (this.winner) return false;

      // 이전 상태 기록 (무르기 지원)
      const prevState = this.serializeState();

      if (move.action === 'move') {
        const { from, to, promoted } = move;
        const movingPiece = this.board[from.y][from.x];
        const targetPiece = this.board[to.y][to.x];

        // 상대 기물 포획 처리
        if (targetPiece) {
          // 닭을 잡으면 병아리로 되돌려 가짐
          const capturedType = targetPiece.type === PIECES.HEN ? PIECES.CHICK : targetPiece.type;
          this.hands[movingPiece.owner].push(capturedType);
        }

        // 말 이동 및 승급
        this.board[from.y][from.x] = null;
        this.board[to.y][to.x] = {
          owner: movingPiece.owner,
          type: promoted ? PIECES.HEN : movingPiece.type
        };

        // 승리 판정 1: 사자 포획 (Catch)
        if (targetPiece && targetPiece.type === PIECES.LION) {
          this.winner = movingPiece.owner;
          this.winReason = 'catch';
        }

        // 승리 판정 2: 트라이 (Try)
        // 사자가 상대 최후방에 도달했을 때
        if (!this.winner && movingPiece.type === PIECES.LION) {
          const reachedTry = (movingPiece.owner === PLAYER_1 && to.y === 0) ||
                             (movingPiece.owner === PLAYER_2 && to.y === 3);
          if (reachedTry) {
            // 트라이 상태 플래그 설정
            move.tryReached = true;
          }
        }
      } else if (move.action === 'drop') {
        const { to, piece, owner } = move;
        // 핸드에서 기물 제거
        const hand = this.hands[owner];
        const idx = hand.indexOf(piece);
        if (idx !== -1) {
          hand.splice(idx, 1);
        }

        // 보드에 기물 배치
        this.board[to.y][to.x] = {
          owner: owner,
          type: piece
        };
      }

      this.moveHistory.push({
        move,
        prevState
      });

      // 턴 넘기기
      const prevPlayer = this.currentTurn;
      this.currentTurn = this.currentTurn === PLAYER_1 ? PLAYER_2 : PLAYER_1;

      // 트라이 승리 최종 체크:
      // 직전 수에서 이전 플레이어의 사자가 상대 진영에 도달했고,
      // 그 사자가 잡히지 않고 살아남았는지는 상대가 그 사자를 잡을 수 있는지에 따라 결정
      // 표준 동물장기 규칙: "사자가 상대 진영에 들어가고, 다음 턴에 잡히지 않으면 트라이로 승리"
      this.checkTryResolution(prevPlayer);

      // 반복수(선일수) 감지
      if (!this.winner) {
        this.recordState();
        if (this.checkRepetition()) {
          this.winner = 'draw';
          this.winReason = 'repetition';
        }
      }

      return true;
    }

    // 트라이 해결 확인
    checkTryResolution(prevPlayer) {
      if (this.winner) return;

      // 이전 이전 수가 트라이 도달 수였고, 방금 상대가 사자를 잡지 못했다면 이전 도달 플레이어 승리!
      if (this.moveHistory.length >= 2) {
        const twoMovesAgo = this.moveHistory[this.moveHistory.length - 2].move;
        if (twoMovesAgo.tryReached && twoMovesAgo.owner === this.currentTurn) {
          // 현재 턴인 사람(2수 전 트라이한 사람)의 사자가 여전히 상대 진영에 살아있는지 확인
          const targetY = twoMovesAgo.owner === PLAYER_1 ? 0 : 3;
          let lionAliveInZone = false;
          for (let x = 0; x < 3; x++) {
            const p = this.board[targetY][x];
            if (p && p.owner === twoMovesAgo.owner && p.type === PIECES.LION) {
              lionAliveInZone = true;
              break;
            }
          }

          if (lionAliveInZone) {
            this.winner = twoMovesAgo.owner;
            this.winReason = 'try';
          }
        }
      }
    }

    // 무르기 (Undo)
    undo() {
      if (this.moveHistory.length === 0) return false;
      const last = this.moveHistory.pop();
      this.deserializeState(last.prevState);
      this.winner = null;
      this.winReason = null;
      if (this.stateHistory.length > 0) {
        this.stateHistory.pop();
      }
      return true;
    }

    // 상태 직렬화
    serializeState() {
      return {
        board: this.board.map(row => row.map(cell => cell ? { ...cell } : null)),
        hands: {
          [PLAYER_1]: [...this.hands[PLAYER_1]],
          [PLAYER_2]: [...this.hands[PLAYER_2]]
        },
        currentTurn: this.currentTurn,
        winner: this.winner,
        winReason: this.winReason
      };
    }

    // 상태 복원
    deserializeState(state) {
      this.board = state.board.map(row => row.map(cell => cell ? { ...cell } : null));
      this.hands = {
        [PLAYER_1]: [...state.hands[PLAYER_1]],
        [PLAYER_2]: [...state.hands[PLAYER_2]]
      };
      this.currentTurn = state.currentTurn;
      this.winner = state.winner;
      this.winReason = state.winReason;
    }

    // 상태 키 생성 (선일수 감지용)
    getStateKey() {
      let key = this.currentTurn + '|';
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 3; x++) {
          const p = this.board[y][x];
          key += p ? `${p.owner[1]}${p.type[0]}` : '--';
        }
      }
      key += '|' + [...this.hands[PLAYER_1]].sort().join('');
      key += '|' + [...this.hands[PLAYER_2]].sort().join('');
      return key;
    }

    recordState() {
      const key = this.getStateKey();
      this.stateHistory.push(key);
    }

    checkRepetition() {
      const currentKey = this.getStateKey();
      let count = 0;
      for (const k of this.stateHistory) {
        if (k === currentKey) count++;
        if (count >= 3) return true; // 3회 반복 시 무승부
      }
      return false;
    }

    // 복제 (AI 시뮬레이션용)
    clone() {
      const copy = new AnimalJanggiRules();
      copy.board = this.board.map(row => row.map(cell => cell ? { ...cell } : null));
      copy.hands = {
        [PLAYER_1]: [...this.hands[PLAYER_1]],
        [PLAYER_2]: [...this.hands[PLAYER_2]]
      };
      copy.currentTurn = this.currentTurn;
      copy.winner = this.winner;
      copy.winReason = this.winReason;
      return copy;
    }
  }

  window.AnimalJanggiRules = AnimalJanggiRules;
  window.PLAYER_1 = PLAYER_1;
  window.PLAYER_2 = PLAYER_2;
  window.PIECES = PIECES;
  window.ANIMAL_MOVES = MOVES;
})(window);
