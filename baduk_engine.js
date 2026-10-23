// ===================================================
// 정밀 바둑 규칙 코어 엔진 (BFS 기반 활로, 따냄, 착수금지)
// ===================================================

class BadukEngine {
  constructor(size = 9) {
    this.size = size;
    this.reset();
  }

  setSize(newSize) {
    this.size = newSize;
    this.initialStones = [];
    this.reset();
  }

  setInitialStones(stones = []) {
    this.initialStones = stones ? stones.map(s => ({ x: s.x, y: s.y, color: s.color })) : [];
    this.reset();
  }

  reset() {
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.moves = []; // [{x, y, color, step}] 전체 착수 수순
    this.currentStep = 0; // 현재 수순 포인터
    this.koPoint = null;
    this.blackCaptures = 0;
    this.whiteCaptures = 0;

    // 초기 배치 돌 복원 (문제 풀이 및 놓아보기 시 초기 돌 유지)
    if (this.initialStones && this.initialStones.length > 0) {
      for (const s of this.initialStones) {
        if (s.x >= 0 && s.x < this.size && s.y >= 0 && s.y < this.size) {
          this.board[s.y][s.x] = s.color;
        }
      }
    }
  }

  // 특정 수순(targetStep)으로 판 상태를 정확하게 재구성
  goToStep(targetStep) {
    if (targetStep < 0) targetStep = 0;
    if (targetStep > this.moves.length) targetStep = this.moves.length;

    // 0수부터 targetStep까지 순차 시뮬레이션
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.blackCaptures = 0;
    this.whiteCaptures = 0;
    this.koPoint = null;

    if (this.initialStones && this.initialStones.length > 0) {
      for (const s of this.initialStones) {
        if (s.x >= 0 && s.x < this.size && s.y >= 0 && s.y < this.size) {
          this.board[s.y][s.x] = s.color;
        }
      }
    }

    for (let i = 0; i < targetStep; i++) {
      const m = this.moves[i];
      this._applyMove(m.x, m.y, m.color);
    }

    this.currentStep = targetStep;
  }

  // 🌟 특정 좌표의 돌 제거 (놓아보기 / 수순 편집 지원) 🌟
  removeStone(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return false;
    if (this.board[y][x] === 0) return false;

    // 1. 해당 착수가 moves 수순 기록에 존재하는 경우
    const moveIdx = this.moves.findIndex(m => m.x === x && m.y === y);
    if (moveIdx !== -1) {
      this.moves.splice(moveIdx, 1);
      this.moves.forEach((m, idx) => { m.step = idx + 1; });
      this.goToStep(this.moves.length);
      return true;
    }

    // 2. 초기 배치 돌(initialStones)에 있는 경우
    const initIdx = this.initialStones.findIndex(s => s.x === x && s.y === y);
    if (initIdx !== -1) {
      this.initialStones.splice(initIdx, 1);
    }
    this.board[y][x] = 0;
    return true;
  }

  // 내부 착수 실행 (기록 추가 없이 보드 상태만 변경)
  _applyMove(x, y, color) {
    if (x < 0 || y < 0) return; // 패스(Pass)는 착수 없이 통과
    const oppColor = color === 1 ? 2 : 1;
    this.board[y][x] = color;

    let captured = [];
    const checked = new Set();
    for (const n of this.getNeighbors(x, y)) {
      if (this.board[n.y][n.x] === oppColor) {
        const key = `${n.x},${n.y}`;
        if (!checked.has(key)) {
          const { stones, liberties } = this.getGroupAndLiberties(n.x, n.y);
          stones.forEach(s => checked.add(`${s.x},${s.y}`));
          if (liberties.size === 0) {
            captured = captured.concat(stones);
          }
        }
      }
    }

    for (const s of captured) {
      this.board[s.y][s.x] = 0;
    }

    if (color === 1) this.blackCaptures += captured.length;
    else this.whiteCaptures += captured.length;
  }

  // 상하좌우 인접 좌표
  getNeighbors(x, y) {
    const list = [];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        list.push({ x: nx, y: ny });
      }
    }
    return list;
  }

  // 연결된 돌 그룹(Chain)과 활로(Liberties) 계산 (BFS)
  getGroupAndLiberties(startX, startY) {
    const color = this.board[startY][startX];
    if (color === 0) return { stones: [], liberties: new Set() };

    const stones = [];
    const liberties = new Set();
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
    const queue = [{ x: startX, y: startY }];
    visited[startY][startX] = true;

    while (queue.length > 0) {
      const curr = queue.shift();
      stones.push(curr);

      for (const n of this.getNeighbors(curr.x, curr.y)) {
        const nColor = this.board[n.y][n.x];
        if (nColor === 0) {
          liberties.add(`${n.x},${n.y}`);
        } else if (nColor === color && !visited[n.y][n.x]) {
          visited[n.y][n.x] = true;
          queue.push(n);
        }
      }
    }

    return { stones, liberties };
  }

  // 착수 유효성 검사 및 실행
  playMove(x, y, color) {
    // 1. 이미 돌이 놓여있는 곳
    if (this.board[y][x] !== 0) {
      return { success: false, reason: 'OCCUPIED' };
    }

    // 2. 패(Ko) 착수 금지
    if (this.koPoint && this.koPoint.x === x && this.koPoint.y === y) {
      return { success: false, reason: 'KO' };
    }

    const oppColor = color === 1 ? 2 : 1;

    // 가상으로 돌을 놓아봄
    this.board[y][x] = color;

    // 3. 인접한 상대 돌 그룹의 활로 검사 -> 0이면 따내기 대상
    let capturedStones = [];
    const checkedGroups = new Set();

    for (const n of this.getNeighbors(x, y)) {
      if (this.board[n.y][n.x] === oppColor) {
        const key = `${n.x},${n.y}`;
        if (!checkedGroups.has(key)) {
          const { stones, liberties } = this.getGroupAndLiberties(n.x, n.y);
          stones.forEach(s => checkedGroups.add(`${s.x},${s.y}`));

          if (liberties.size === 0) {
            capturedStones = capturedStones.concat(stones);
          }
        }
      }
    }

    // 4. 착수 금지점(자충수) 검사
    // 상대 돌을 따내지도 못했는데, 내 돌 그룹의 활로가 0이면 자충수!
    if (capturedStones.length === 0) {
      const { liberties } = this.getGroupAndLiberties(x, y);
      if (liberties.size === 0) {
        this.board[y][x] = 0; // 롤백
        return { success: false, reason: 'SUICIDE' };
      }
    }

    // 5. 실제 따내기 처리
    for (const s of capturedStones) {
      this.board[s.y][s.x] = 0;
    }

    if (color === 1) {
      this.blackCaptures += capturedStones.length;
    } else {
      this.whiteCaptures += capturedStones.length;
    }

    // 패(Ko) 상태 갱신
    if (capturedStones.length === 1) {
      const { stones, liberties } = this.getGroupAndLiberties(x, y);
      if (stones.length === 1 && liberties.size === 1) {
        this.koPoint = { x: capturedStones[0].x, y: capturedStones[0].y };
      } else {
        this.koPoint = null;
      }
    } else {
      this.koPoint = null;
    }

    // 만약 과거 수순으로 돌아간 상태에서 새로운 수를 두면, 그 뒤 수순들은 잘라냄 (새로운 분기)
    if (this.currentStep < this.moves.length) {
      this.moves = this.moves.slice(0, this.currentStep);
    }

    const stepNum = this.moves.length + 1;
    this.moves.push({ x, y, color, step: stepNum, captures: capturedStones });
    this.currentStep = this.moves.length;

    return {
      success: true,
      x, y, color,
      step: stepNum,
      captures: capturedStones
    };
  }

  // 🌟 한 수 쉬기 (Pass) 🌟
  pass(color) {
    if (this.currentStep < this.moves.length) {
      this.moves = this.moves.slice(0, this.currentStep);
    }
    const stepNum = this.moves.length + 1;
    this.moves.push({ x: -1, y: -1, color, step: stepNum, isPass: true, captures: [] });
    this.currentStep = this.moves.length;
    this.koPoint = null;
    return { success: true, isPass: true, color, step: stepNum, captures: [] };
  }

  // 현재 판 위의 모든 단수(Atari) 그룹 탐색
  getAtariGroups() {
    const ataris = [];
    const visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] !== 0 && !visited[y][x]) {
          const { stones, liberties } = this.getGroupAndLiberties(x, y);
          stones.forEach(s => visited[s.y][s.x] = true);

          if (liberties.size === 1) {
            const lastLibStr = Array.from(liberties)[0];
            const [lx, ly] = lastLibStr.split(',').map(Number);
            ataris.push({
              color: this.board[y][x],
              stones,
              lastLiberty: { x: lx, y: ly }
            });
          }
        }
      }
    }

    return ataris;
  }
}

window.BadukEngine = BadukEngine;
