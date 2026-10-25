// ==============================================================================
// 바둑스쿨 바둑판 (19줄 기본, 9·13줄 지원)
// 기존 보드와 같은 인터페이스를 제공해서 앱 코드를 거의 건드리지 않는다.
//   - boardState, currentTurn, selectedSquare, validMoves
//   - reset(), render(), setTheme(), handleSquareClick(r,c), makeMove(...)
//   - onMoveCallback(sr, sc, tr, tc, stone, captured)
// ==============================================================================

class BadukBoard {
  constructor(containerId, size = 19) {
    this.container = document.getElementById(containerId);
    this.size = size;
    this.currentTurn = 'b';        // 'b' 흑, 'w' 백
    this.boardState = [];          // 0 빈칸, 1 흑, 2 백
    this.selectedSquare = null;    // 호환용 (바둑은 선택 개념이 없음)
    this.validMoves = [];          // 호환용
    this.boardTheme = 'wood';
    this.moveHistory = [];         // {r,c,color,captured:[...]}
    this.whiteCaptures = [];       // 호환용
    this.blackCaptures = [];       // 호환용
    this.onMoveCallback = null;
    this.lastMove = null;
    this.koPoint = null;           // 패 금지점
    this.passCount = 0;

    this.reset();
  }

  // ---------- 초기화 ----------
  reset() {
    const n = this.size;
    this.boardState = Array.from({ length: n }, () => Array(n).fill(0));
    this.currentTurn = 'b';
    this.selectedSquare = null;
    this.validMoves = [];
    this.moveHistory = [];
    this.whiteCaptures = [];
    this.blackCaptures = [];
    this.lastMove = null;
    this.koPoint = null;
    this.passCount = 0;
    this.render();
  }

  setSize(size) {
    this.size = size;
    this.reset();
  }

  setTheme(theme) {
    this.boardTheme = theme || 'wood';
    this.render();
  }

  // ---------- 규칙 ----------
  _idx(r, c) {
    return r >= 0 && c >= 0 && r < this.size && c < this.size;
  }

  _neighbors(r, c) {
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => this._idx(y, x));
  }

  /** 한 점의 돌 그룹과 활로를 구한다 */
  _group(r, c, state = this.boardState) {
    const color = state[r][c];
    if (!color) return { stones: [], liberties: 0 };
    const seen = new Set();
    const stack = [[r, c]];
    const stones = [];
    const libs = new Set();
    while (stack.length) {
      const [y, x] = stack.pop();
      const key = y * this.size + x;
      if (seen.has(key)) continue;
      seen.add(key);
      if (state[y][x] !== color) continue;
      stones.push([y, x]);
      for (const [ny, nx] of this._neighbors(y, x)) {
        if (state[ny][nx] === 0) libs.add(ny * this.size + nx);
        else if (state[ny][nx] === color) stack.push([ny, nx]);
      }
    }
    return { stones, liberties: libs.size };
  }

  /** 착수 가능 여부 */
  isLegal(r, c) {
    if (!this._idx(r, c)) return false;
    if (this.boardState[r][c] !== 0) return false;
    if (this.koPoint && this.koPoint[0] === r && this.koPoint[1] === c) return false;

    const me = this.currentTurn === 'b' ? 1 : 2;
    const opp = me === 1 ? 2 : 1;
    const next = this.boardState.map(row => row.slice());
    next[r][c] = me;

    // 상대 돌 따냄 확인
    let captured = 0;
    for (const [ny, nx] of this._neighbors(r, c)) {
      if (next[ny][nx] === opp) {
        const g = this._group(ny, nx, next);
        if (g.liberties === 0) captured += g.stones.length;
      }
    }
    if (captured > 0) return true;

    // 자충수 금지 (따낸 돌이 없을 때 자기 그룹 활로 0이면 불법)
    const mine = this._group(r, c, next);
    return mine.liberties > 0;
  }

  // ---------- 착수 ----------
  handleSquareClick(r, c) {
    if (!this._idx(r, c)) return;
    if (this.boardState[r][c] !== 0) return;   // 이미 돌이 있으면 무시
    this.makeMove(null, null, r, c);
  }

  makeMove(sr, sc, tr, tc) {
    const r = tr, c = tc;
    if (!this.isLegal(r, c)) return false;

    const me = this.currentTurn === 'b' ? 1 : 2;
    const opp = me === 1 ? 2 : 1;

    this.boardState[r][c] = me;
    const captured = [];

    // 상대 그룹 따내기
    for (const [ny, nx] of this._neighbors(r, c)) {
      if (this.boardState[ny][nx] === opp) {
        const g = this._group(ny, nx);
        if (g.liberties === 0) {
          for (const [gy, gx] of g.stones) {
            this.boardState[gy][gx] = 0;
            captured.push([gy, gx]);
          }
        }
      }
    }

    // 패 감지 (1점만 따냈고, 되따냄이 1점이 되는 형태)
    this.koPoint = null;
    if (captured.length === 1) {
      const mineGroup = this._group(r, c);
      if (mineGroup.stones.length === 1 && mineGroup.liberties === 1) {
        this.koPoint = captured[0];
      }
    }

    this.moveHistory.push({ r, c, color: this.currentTurn, captured });
    this.lastMove = [r, c];
    this.passCount = 0;

    // 따낸 돌 기록 (호환용)
    if (captured.length) {
      if (this.currentTurn === 'b') this.blackCaptures.push(...captured);
      else this.whiteCaptures.push(...captured);
    }

    this.currentTurn = this.currentTurn === 'b' ? 'w' : 'b';

    if (window.badukAudio && typeof window.badukAudio.playStone === 'function') {
      window.badukAudio.playStone();
    }

    this.render();

    if (typeof this.onMoveCallback === 'function') {
      this.onMoveCallback(sr, sc, r, c, me, captured);
    }
    return true;
  }

  /** 초기 배치(문제 세팅) — stones: [{x,y,color}] */
  setStones(stones, turn) {
    this.reset();
    (stones || []).forEach(st => {
      if (this._idx(st.y, st.x)) this.boardState[st.y][st.x] = st.color || st.c;
    });
    this.currentTurn = turn || 'b';
    this.koPoint = null;
    this.lastMove = null;
    this.render();
  }

  /** 마지막 착수 되돌리기 (문제 오답 시) */
  undo() {
    const last = this.moveHistory.pop();
    if (!last) return false;
    this.boardState[last.r][last.c] = 0;
    last.captured.forEach(([y, x]) => {
      this.boardState[y][x] = last.color === 'b' ? 2 : 1;
    });
    this.currentTurn = last.color;
    this.lastMove = this.moveHistory.length
      ? [this.moveHistory[this.moveHistory.length - 1].r, this.moveHistory[this.moveHistory.length - 1].c]
      : null;
    this.koPoint = null;
    this.render();
    return true;
  }

  pass() {
    this.passCount++;
    this.koPoint = null;
    this.lastMove = null;
    this.currentTurn = this.currentTurn === 'b' ? 'w' : 'b';
    this.render();
    if (typeof this.onMoveCallback === 'function') {
      this.onMoveCallback(null, null, null, null, 0, []);
    }
  }

  // ---------- 좌표 표기 (바둑식: A~T, I 제외) ----------
  _fileLetter(c) {
    const letters = 'ABCDEFGHJKLMNOPQRST';
    return letters[c] || '?';
  }

  _starPoints() {
    const n = this.size;
    if (n === 19) return [[3, 3], [3, 9], [3, 15], [9, 3], [9, 9], [9, 15], [15, 3], [15, 9], [15, 15]];
    if (n === 13) return [[3, 3], [3, 9], [9, 3], [9, 9], [6, 6]];
    if (n === 9) return [[2, 2], [2, 6], [6, 2], [6, 6], [4, 4]];
    return [];
  }

  // ---------- 그리기 ----------
  render() {
    if (!this.container) return;
    const n = this.size;
    const stars = this._starPoints();
    const isStar = (r, c) => stars.some(([y, x]) => y === r && x === c);

    let html = `<div class="bk-board bk-board--${this.boardTheme}" style="--bk-n:${n}">`;

    // 위쪽 좌표 (A~)
    html += '<div class="bk-board__files">';
    for (let c = 0; c < n; c++) html += `<span>${this._fileLetter(c)}</span>`;
    html += '</div>';

    html += '<div class="bk-board__body">';
    // 왼쪽 숫자
    html += '<div class="bk-board__ranks">';
    for (let r = 0; r < n; r++) html += `<span>${n - r}</span>`;
    html += '</div>';

    html += '<div class="bk-board__grid">';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = this.boardState[r][c];
        const stone = v === 1 ? '<i class="bk-stone bk-stone--black"></i>'
                    : v === 2 ? '<i class="bk-stone bk-stone--white"></i>' : '';
        const last = this.lastMove && this.lastMove[0] === r && this.lastMove[1] === c
          ? '<b class="bk-last"></b>' : '';
        const star = (!stone && isStar(r, c)) ? '<b class="bk-star"></b>' : '';
        html += `<div class="bk-cell" data-row="${r}" data-col="${c}">${star}${stone}${last}</div>`;
      }
    }
    html += '</div></div></div>';

    this.container.innerHTML = html;

    this.container.querySelectorAll('.bk-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        this.handleSquareClick(parseInt(cell.dataset.row, 10), parseInt(cell.dataset.col, 10));
      });
    });
  }
}

// 기존 코드가 BadukSchoolBoard 이름을 쓰고 있어도 동작하도록 별칭 유지
window.BadukBoard = BadukBoard;
window.BadukSchoolBoard = BadukBoard;
