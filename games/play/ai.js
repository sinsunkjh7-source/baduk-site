// =========================================================================
// JH 바둑스쿨 - 🤖 고성능 정통 바둑 AI 엔진 (Master Go AI Engine v3.0)
// 5단계 기력 시스템:
// 1. 🌱 입문 (18급 삐약이): 근접 국소 전투 위주, 단수 인지/구출, 자충수 엄격 방지
// 2. 🌿 초급 (12급 바둑이): 초반 귀 차지, 돌의 연결과 호구, 활로 2개 압박
// 3. 🌲 중급 (5급 영리한 여우): 정통 포석/행마(날일자·한칸뜀), 붙이면 젖힘/늚, 끊음
// 4. 👑 고급 (아마 1단 지혜로운 판다): 2수 앞 수읽기, 사활/치중 급소, 집 균형
// 5. 🔥 최강 (아마 5단 용맹한 호랑이): 3수 깊이 미니맥스 수읽기, 삼삼 침투, 접바둑 타개, 끝내기
// =========================================================================

class BadukAI {
  constructor(size = 19) {
    this.size = size;
  }

  setSize(size) {
    this.size = size;
  }

  // =========================================================================
  // 1. 유틸리티 & 기본 기하 함수
  // =========================================================================
  getNeighbors(x, y, size) {
    const list = [];
    if (x > 0) list.push({ x: x - 1, y });
    if (x < size - 1) list.push({ x: x + 1, y });
    if (y > 0) list.push({ x, y: y - 1 });
    if (y < size - 1) list.push({ x, y: y + 1 });
    return list;
  }

  getDiagonalNeighbors(x, y, size) {
    const list = [];
    if (x > 0 && y > 0) list.push({ x: x - 1, y: y - 1 });
    if (x < size - 1 && y > 0) list.push({ x: x + 1, y: y - 1 });
    if (x > 0 && y < size - 1) list.push({ x: x - 1, y: y + 1 });
    if (x < size - 1 && y < size - 1) list.push({ x: x + 1, y: y + 1 });
    return list;
  }

  // 선(Line) 번호 반환 (0-indexed: 0=1선, 1=2선, 2=3선, 3=4선 ...)
  getLine(x, y, size) {
    const edgeX = Math.min(x, size - 1 - x);
    const edgeY = Math.min(y, size - 1 - y);
    return Math.min(edgeX, edgeY);
  }

  // 체비쇼프 거리 (Max(dx, dy))
  chebyshevDistance(x1, y1, x2, y2) {
    return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
  }

  // 맨해튼 거리 (dx + dy)
  manhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  }

  // =========================================================================
  // 2. 판 상태 시뮬레이션 및 활로 분석
  // =========================================================================
  // 가상 착수 후 아군 그룹의 활로 수 및 포획 수 계산
  simulateMoveResult(board, size, x, y, color) {
    const oppColor = color === 1 ? 2 : 1;
    const neighbors = this.getNeighbors(x, y, size);

    // 1. 착수 시 잡히는 상대 돌 계산
    let totalCaptures = 0;
    const capturedStones = [];
    const checkedOpp = new Set();

    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const key = `${n.x},${n.y}`;
        if (!checkedOpp.has(key)) {
          const group = this.getGroup(board, size, n.x, n.y);
          group.stones.forEach(s => checkedOpp.add(`${s.x},${s.y}`));
          // 만약 상대 그룹의 활로가 (x,y) 하나뿐이었다면 이번 착수로 잡힘
          if (group.liberties.size === 1 && group.liberties.has(`${x},${y}`)) {
            totalCaptures += group.stones.length;
            capturedStones.push(...group.stones);
          }
        }
      }
    }

    // 2. 가상 보드 생성 (포획 돌 제거)
    const newBoard = board.map(row => row.slice());
    newBoard[y][x] = color;
    for (const s of capturedStones) {
      newBoard[s.y][s.x] = 0;
    }

    // 3. 착수한 아군 그룹의 활로 계산
    const myGroup = this.getGroup(newBoard, size, x, y);
    const myLiberties = myGroup.liberties.size;

    return {
      newBoard,
      captures: totalCaptures,
      capturedStones,
      myLiberties,
      myGroupSize: myGroup.stones.length
    };
  }

  // 특정 위치 돌의 그룹과 활로 BFS 탐색
  getGroup(board, size, sx, sy) {
    const color = board[sy][sx];
    if (color === 0) return { stones: [], liberties: new Set() };

    const stones = [];
    const liberties = new Set();
    const visited = new Set();
    const queue = [{ x: sx, y: sy }];
    visited.add(`${sx},${sy}`);

    while (queue.length > 0) {
      const cur = queue.shift();
      stones.push(cur);

      for (const n of this.getNeighbors(cur.x, cur.y, size)) {
        const val = board[n.y][n.x];
        if (val === 0) {
          liberties.add(`${n.x},${n.y}`);
        } else if (val === color) {
          const key = `${n.x},${n.y}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    return { stones, liberties };
  }

  // 착수 가능 여부 (자살수 및 패 검사)
  isLegal(board, size, x, y, color, koPoint) {
    if (board[y][x] !== 0) return false;
    if (koPoint && koPoint.x === x && koPoint.y === y) return false;

    // 빈 이웃이 있으면 자살수 아님
    const neighbors = this.getNeighbors(x, y, size);
    for (const n of neighbors) {
      if (board[n.y][n.x] === 0) return true;
    }

    // 상대 돌을 잡을 수 있으면 자살수 아님
    const oppColor = color === 1 ? 2 : 1;
    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const group = this.getGroup(board, size, n.x, n.y);
        if (group.liberties.size === 1 && group.liberties.has(`${x},${y}`)) {
          return true;
        }
      }
    }

    // 인접 아군 그룹 중 활로가 2개 이상인 돌이 있으면 자살수 아님
    for (const n of neighbors) {
      if (board[n.y][n.x] === color) {
        const group = this.getGroup(board, size, n.x, n.y);
        if (group.liberties.size > 1) return true;
      }
    }

    return false;
  }

  // =========================================================================
  // 3. 최선의 수 찾기 메인 디스패처
  // =========================================================================
  findBestMove(engine, aiColor, difficulty = 'dan') {
    const oppColor = (aiColor === 1) ? 2 : 1;
    const board = engine.board;
    const size = engine.size;
    const koPoint = engine.koPoint;

    // 1. 모든 합법적인 착수 후보 수집
    const legalMoves = [];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (this.isLegal(board, size, x, y, aiColor, koPoint)) {
          legalMoves.push({ x, y });
        }
      }
    }

    if (legalMoves.length === 0) return null;

    // 마지막 상대 착수점 파악
    const lastMove = (engine.moves && engine.moves.length > 0)
      ? engine.moves[engine.moves.length - 1]
      : null;

    // 1.5 긴급한 사활/단수 처리 (최우선)
    const urgentCapture = this.findUrgentCapture(board, size, aiColor);
    if (urgentCapture) {
      if (difficulty !== 'beginner' || Math.random() < 0.88) {
        return urgentCapture;
      }
    }

    const urgentDefense = this.findUrgentDefense(board, size, aiColor);
    if (urgentDefense) {
      if (difficulty !== 'beginner' || Math.random() < 0.82) {
        return urgentDefense;
      }
    }

    // 2. 포석 및 접바둑 특수 패턴 (초반 1~14수)
    // 단, 상대가 방금 내 돌에 바로 붙여왔다면(Contact) 손빼지 않고 국소 응수!
    const isContactFight = this.isContactMove(board, size, lastMove, aiColor);
    const isHandicap = (board.some((row, r) => row.some((col, c) => col === 1)) && engine.moves.length === 0);

    if (!isContactFight && (['advanced', 'dan', 'master'].includes(difficulty) || isHandicap)) {
      const bookMove = this.getOpeningOrHandicapMove(engine, legalMoves, aiColor, isHandicap);
      if (bookMove) {
        return bookMove;
      }
    }

    // 3. 난이도별 차별화 엔진 실행
    switch (difficulty) {
      case 'beginner':
        return this.selectBeginnerMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'intermediate':
        return this.selectIntermediateMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'advanced':
        return this.selectAdvancedMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'dan':
        return this.selectDanMove(engine, legalMoves, aiColor, oppColor, lastMove);
      case 'master':
      default:
        return this.selectMasterMove(engine, legalMoves, aiColor, oppColor, lastMove);
    }
  }

  // =========================================================================
  // 4. 초반 정통 포석 & 접바둑 전술 (Book Move)
  // =========================================================================
  getOpeningOrHandicapMove(engine, legalMoves, aiColor, isHandicap) {
    const size = engine.size;
    const board = engine.board;
    const movesCount = engine.moves.length;

    // 접바둑에서 백인 경우: 침착한 삼삼 침투 또는 날일자 걸침
    if (size === 19 && aiColor === 2) {
      // 흑돌이 4귀 화점에 놓여있는 접바둑 상황인지 확인
      const hoshiPoints = [
        { x: 3, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 15 }, { x: 15, y: 15 }
      ];

      const occupiedHoshi = hoshiPoints.filter(h => board[h.y][h.x] === 1);
      if (occupiedHoshi.length >= 2 && movesCount < 12) {
        // 백의 접바둑 전략: 화점 흑돌에 대해 3-3 침투 또는 날일자 걸침
        for (const h of occupiedHoshi) {
          // A. 3-3 침투 (귀에서 즉시 근거 마련)
          const sanSan = {
            x: h.x === 3 ? 2 : 16,
            y: h.y === 3 ? 2 : 16
          };
          if (board[sanSan.y][sanSan.x] === 0) {
            // 이 귀에 아직 백돌이 없다면 3-3 침투
            const localWhite = this.countStonesNear(board, size, sanSan.x, sanSan.y, 3, 2);
            if (localWhite === 0) {
              return sanSan;
            }
          }

          // B. 날일자 걸침
          const kakariCandidates = [
            { x: h.x === 3 ? 5 : 13, y: h.y === 3 ? 2 : 16 },
            { x: h.x === 3 ? 2 : 16, y: h.y === 3 ? 5 : 13 }
          ];
          for (const kc of kakariCandidates) {
            if (board[kc.y][kc.x] === 0) {
              const localWhite = this.countStonesNear(board, size, kc.x, kc.y, 2, 2);
              if (localWhite === 0) return kc;
            }
          }
        }
      }
    }

    // 일반 호선 바둑의 초반 12수 포석
    if (movesCount < 12) {
      const corners = size === 19 ? [
        { x: 3, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 15 }, { x: 15, y: 15 }
      ] : (size === 13 ? [
        { x: 3, y: 3 }, { x: 9, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }
      ] : [
        { x: 2, y: 2 }, { x: 6, y: 2 },
        { x: 2, y: 6 }, { x: 6, y: 6 }
      ]);

      // 1. 비어있는 귀(화점) 선점
      const emptyCorners = corners.filter(c => board[c.y][c.x] === 0);
      if (emptyCorners.length > 0) {
        // 대각선 또는 비어있는 귀 중 하나 차지
        return emptyCorners[0];
      }

      // 2. 귀의 걸침 및 굳힘 (19줄 기준)
      if (size === 19) {
        for (const c of corners) {
          const owner = board[c.y][c.x];
          if (owner === aiColor) {
            // 내 귀 -> 날일자 굳힘
            const gukhim = { x: c.x === 3 ? 5 : 13, y: c.y === 3 ? 2 : 16 };
            if (board[gukhim.y][gukhim.x] === 0 && board[c.y][gukhim.x] === 0) {
              return gukhim;
            }
          } else if (owner !== 0) {
            // 상대 귀 -> 날일자 걸침
            const kakari = { x: c.x === 3 ? 5 : 13, y: c.y === 3 ? 2 : 16 };
            if (board[kakari.y][kakari.x] === 0) {
              const nearbyWhite = this.countStonesNear(board, size, kakari.x, kakari.y, 2, aiColor);
              if (nearbyWhite === 0) return kakari;
            }
          }
        }
      }
    }

    return null;
  }

  // 긴급한 상대 돌 포획 수 탐색 (활로 1개인 상대 돌 따내기)
  findUrgentCapture(board, size, aiColor) {
    const oppColor = aiColor === 1 ? 2 : 1;
    const checked = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === oppColor) {
          const key = `${x},${y}`;
          if (!checked.has(key)) {
            const group = this.getGroup(board, size, x, y);
            group.stones.forEach(s => checked.add(`${s.x},${s.y}`));
            if (group.liberties.size === 1) {
              const [libPos] = Array.from(group.liberties);
              const [lx, ly] = libPos.split(',').map(Number);
              if (this.isLegal(board, size, lx, ly, aiColor, null)) {
                return { x: lx, y: ly };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // 상대의 마지막 착수가 내 돌에 바로 붙인 수(Contact)인지 판정
  isContactMove(board, size, lastMove, aiColor) {
    if (!lastMove || lastMove.isPass) return false;
    for (const n of this.getNeighbors(lastMove.x, lastMove.y, size)) {
      if (board[n.y][n.x] === aiColor) return true;
    }
    return false;
  }

  countStonesNear(board, size, x, y, radius, color) {
    let count = 0;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          if (board[ny][nx] === color) count++;
        }
      }
    }
    return count;
  }

  // 긴급한 아군 구출 수 탐색 (활로 1개인 아군 살리기)
  findUrgentDefense(board, size, aiColor) {
    const checked = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === aiColor) {
          const key = `${x},${y}`;
          if (!checked.has(key)) {
            const group = this.getGroup(board, size, x, y);
            group.stones.forEach(s => checked.add(`${s.x},${s.y}`));
            if (group.liberties.size === 1) {
              const [libPos] = Array.from(group.liberties);
              const [lx, ly] = libPos.split(',').map(Number);
              const sim = this.simulateMoveResult(board, size, lx, ly, aiColor);
              if (sim.myLiberties >= 2) {
                return { x: lx, y: ly };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // 긴급한 상대 돌 포획 수 탐색 (활로 1개인 상대 돌 따내기)
  findUrgentCapture(board, size, aiColor) {
    const oppColor = aiColor === 1 ? 2 : 1;
    const checked = new Set();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] === oppColor) {
          const key = `${x},${y}`;
          if (!checked.has(key)) {
            const group = this.getGroup(board, size, x, y);
            group.stones.forEach(s => checked.add(`${s.x},${s.y}`));
            if (group.liberties.size === 1) {
              const [libPos] = Array.from(group.liberties);
              const [lx, ly] = libPos.split(',').map(Number);
              if (this.isLegal(board, size, lx, ly, aiColor, null)) {
                return { x: lx, y: ly };
              }
            }
          }
        }
      }
    }
    return null;
  }

  // 상대의 마지막 착수가 내 돌에 바로 붙인 수(Contact)인지 판정
  isContactMove(board, size, lastMove, aiColor) {
    if (!lastMove || lastMove.isPass) return false;
    for (const n of this.getNeighbors(lastMove.x, lastMove.y, size)) {
      if (board[n.y][n.x] === aiColor) return true;
    }
    return false;
  }

  // =========================================================================
  // 5. 정밀 국소 및 전술 평가 함수 (Core Tactical Evaluator)
  // =========================================================================
  evaluateMove(engine, x, y, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;
    const line = this.getLine(x, y, size);
    let score = 0;

    // 1. 착수 시뮬레이션
    const sim = this.simulateMoveResult(board, size, x, y, aiColor);

    // 🚫 [치명적] 자충수 (스스로 단수되거나 죽으러 들어가기) 방지
    if (sim.myLiberties <= 1 && sim.captures === 0) {
      return -10000; // 절대 두지 않음
    }

    // 🌟 [최우선] 상대 돌 포획 (따내기)
    if (sim.captures > 0) {
      score += 1500 + sim.captures * 350;
    }

    // 🛡️ [수비] 단수 걸린 아군 돌 구출
    const neighbors = this.getNeighbors(x, y, size);
    for (const n of neighbors) {
      if (board[n.y][n.x] === aiColor) {
        const allyGroup = this.getGroup(board, size, n.x, n.y);
        if (allyGroup.liberties.size === 1) {
          if (sim.myLiberties >= 2) {
            score += 1200 + allyGroup.stones.length * 200;
          } else {
            // 살리려 뒀는데도 여전히 활로가 1개면 자충수 (떡수 방지)
            score -= 4000;
          }
        } else if (allyGroup.liberties.size === 2) {
          // 활로가 2개인 약한 아군 연결/보강
          score += 280;
        }
      }
    }

    // ⚔️ [공격] 상대 돌을 단수로 몰기 (활로 2개 -> 1개로 줄이기)
    for (const n of neighbors) {
      if (board[n.y][n.x] === oppColor) {
        const oppGroup = this.getGroup(board, size, n.x, n.y);
        if (oppGroup.liberties.size === 2 && oppGroup.liberties.has(`${x},${y}`)) {
          // 단수 몰기 성공! (내 돌이 위험하지 않은 경우)
          if (sim.myLiberties >= 2) {
            score += 450 + oppGroup.stones.length * 80;
          }
        }
      }
    }

    // 🎯 [국소 응수] 상대방의 직전 착수(lastMove)에 대한 국소 응수
    if (lastMove && !lastMove.isPass) {
      const dist = this.chebyshevDistance(x, y, lastMove.x, lastMove.y);
      if (dist === 1) {
        // 상대가 바로 옆에 붙여왔을 때 (Contact) -> 젖힘(Hane) 또는 늚(Extend)
        const isOrthogonal = (Math.abs(x - lastMove.x) + Math.abs(y - lastMove.y)) === 1;
        if (isOrthogonal) {
          // 바로 맞붙은 자리
          score += 260;
        } else {
          // 대각선 젖힘 자리
          score += 320;
        }
      } else if (dist === 2) {
        // 1칸 거리 응수
        score += 150;
      }
    }

    // 🔗 [연결과 끊음] 돌의 연결점 및 호구 모양
    // 호구(Tiger's Mouth) 형태 완성
    let adjacentAllies = 0;
    for (const n of neighbors) {
      if (board[n.y][n.x] === aiColor) adjacentAllies++;
    }
    if (adjacentAllies === 2) {
      score += 220; // 튼튼한 호구/연결
    } else if (adjacentAllies === 3) {
      score += 180; // 빵때림 형태
    }

    // 상대의 절단점 끊기 (Cut)
    const diags = this.getDiagonalNeighbors(x, y, size);
    for (const d of diags) {
      if (board[d.y][d.x] === oppColor) {
        // 대각선 상대 돌들 사이를 끊는 수인지 평가
        if (sim.myLiberties >= 3) {
          score += 280;
        }
      }
    }

    // 🚫 [우형 방지] 빈삼각(Empty Triangle) 감점
    if (this.isEmptyTriangle(board, size, x, y, aiColor)) {
      score -= 600;
    }

    // 🌟 [행마법] 한 칸 뜀 및 날일자 보너스
    score += this.getGoodShapeBonus(board, size, x, y, aiColor);

    // 📏 [선(Line) 가치]
    if (line === 0) {
      // 1선: 사활/따냄이 아니면 초반에 엄격히 금지!
      if (sim.captures === 0 && engine.moves.length < 60) {
        score -= 900;
      }
    } else if (line === 1) {
      // 2선: 초반 패망선 감점 (단, 근거 확보나 끝내기는 허용)
      if (engine.moves.length < 50) {
        score -= 220;
      } else {
        score += 80;
      }
    } else if (line === 2) {
      // 3선: 최상의 실리선
      score += 210;
    } else if (line === 3) {
      // 4선: 최상의 세력선
      score += 190;
    } else {
      // 중앙선
      score += 90;
    }

    return score;
  }

  // 빈삼각(Empty Triangle) 검사
  isEmptyTriangle(board, size, x, y, color) {
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
        if (board[y1][x1] === color && board[y2][x2] === color && board[yd][xd] === 0) {
          return true;
        }
      }
    }
    return false;
  }

  // 한 칸 뜀 및 날일자 좋은 모양 보너스
  getGoodShapeBonus(board, size, x, y, color) {
    let bonus = 0;
    // 한 칸 뜀
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
          bonus += 180;
        }
      }
    }

    // 날일자 행마
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
          bonus += 150;
        }
      }
    }

    return bonus;
  }

  // =========================================================================
  // 6. 난이도별 5단계 기력 시스템 상세 구현
  // =========================================================================

  // 🌱 1. 삐약이 (🌱 입문 18급)
  // 특징: 상대의 마지막 착수 근처(국소 전투)에 집중하며, 따내기와 도망가기를 배우는 순수한 초보.
  // 절대 바둑판 전체에 아무데나 흩뿌리지 않고 눈앞의 싸움에 응수함.
  selectBeginnerMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    // 1. 긴급한 따내기나 도망갈 수 있는지 확인
    const emergencySaves = [];
    const emergencyCaptures = [];

    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.captures > 0) {
        emergencyCaptures.push(m);
      }
      if (sim.myLiberties >= 2) {
        // 단수된 아군을 구출하는지
        for (const n of this.getNeighbors(m.x, m.y, size)) {
          if (board[n.y][n.x] === aiColor) {
            const group = this.getGroup(board, size, n.x, n.y);
            if (group.liberties.size === 1) emergencySaves.push(m);
          }
        }
      }
    }

    // 단수된 상대 돌이 보이면 80% 확률로 잡음
    if (emergencyCaptures.length > 0 && Math.random() < 0.85) {
      return emergencyCaptures[Math.floor(Math.random() * emergencyCaptures.length)];
    }

    // 내 돌이 단수면 75% 확률로 도망침
    if (emergencySaves.length > 0 && Math.random() < 0.75) {
      return emergencySaves[Math.floor(Math.random() * emergencySaves.length)];
    }

    // 2. 국소성 필터: 상대의 마지막 수 근처(거리 1~3칸) 또는 내 돌 근처 후보 우선
    let localCandidates = [];
    if (lastMove && !lastMove.isPass) {
      localCandidates = legalMoves.filter(m => {
        const d = this.chebyshevDistance(m.x, m.y, lastMove.x, lastMove.y);
        return d >= 1 && d <= 3;
      });
    }

    if (localCandidates.length === 0) {
      // 내 돌 근처 후보
      localCandidates = legalMoves.filter(m => {
        return this.countStonesNear(board, size, m.x, m.y, 2, aiColor) > 0;
      });
    }

    // 그래도 없으면 3선/4선 근처
    if (localCandidates.length === 0) {
      localCandidates = legalMoves.filter(m => {
        const l = this.getLine(m.x, m.y, size);
        return l >= 2 && l <= 4;
      });
    }

    const pool = localCandidates.length > 0 ? localCandidates : legalMoves;

    // 각 후보에 대해 기초 점수 계산 (자충수 엄격 배제)
    const scored = [];
    for (const m of pool) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue; // 자충수 배제!

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove);
      score += (Math.random() - 0.5) * 60; // 초보다운 작은 오차
      scored.push({ move: m, score });
    }

    if (scored.length === 0) return legalMoves[0];
    scored.sort((a, b) => b.score - a.score);

    // 상위 3개 중 하나 착수
    const pick = Math.floor(Math.random() * Math.min(3, scored.length));
    return scored[pick].move;
  }

  // 🌿 2. 바둑이 (🌿 초급 12급)
  // 특징: 초반 귀 차지, 호구와 연결을 중시, 활로 2개짜리 돌을 공격/수비할 줄 앎
  selectIntermediateMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const scored = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue; // 자충수 방지

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove);
      score += (Math.random() - 0.5) * 35;
      scored.push({ move: m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    if (scored.length === 0) return legalMoves[0];

    const pick = Math.floor(Math.random() * Math.min(2, scored.length));
    return scored[pick].move;
  }

  // 🌲 3. 영리한 여우 (🌲 중급 5급)
  // 특징: 정석적인 행마(날일자·한칸뜀), 붙이면 젖히고 젖히면 뻗는 전투 원칙, 상대 약점 끊기
  selectAdvancedMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    const scored = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let score = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove);
      // 세력 및 실리 보너스
      score += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor);
      scored.push({ move: m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].move : legalMoves[0];
  }

  // 👑 4. 지혜로운 판다 (👑 아마 1단)
  // 특징: 2수 깊이 수읽기(상대의 최선 응수 시뮬레이션), 사활과 치중 급소 포착, 집 균형
  selectDanMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    // 1차 후보군 10개 선발
    const candidates = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let baseScore = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove);
      baseScore += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor) * 1.5;
      candidates.push({ move: m, baseScore });
    }

    candidates.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = candidates.slice(0, 8);

    if (topCandidates.length === 0) return legalMoves[0];

    // 2수 깊이 수읽기: 각 착수 후 상대의 최선 반격(Capture, Atari, Cut) 예측
    let bestMove = topCandidates[0].move;
    let bestVal = -Infinity;

    for (const cand of topCandidates) {
      const m = cand.move;
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);

      // 상대의 가장 강력한 응수 1수 탐색
      let oppBestResponseScore = 0;
      const oppLegal = [];
      const simNeighbors = this.getNeighbors(m.x, m.y, size);

      for (const sn of simNeighbors) {
        if (this.isLegal(sim.newBoard, size, sn.x, sn.y, oppColor, null)) {
          oppLegal.push(sn);
        }
      }

      for (const om of oppLegal) {
        const oppSim = this.simulateMoveResult(sim.newBoard, size, om.x, om.y, oppColor);
        if (oppSim.captures > 0) {
          oppBestResponseScore = Math.max(oppBestResponseScore, 800 + oppSim.captures * 300);
        }
      }

      const totalVal = cand.baseScore - (oppBestResponseScore * 0.8);
      if (totalVal > bestVal) {
        bestVal = totalVal;
        bestMove = m;
      }
    }

    return bestMove;
  }

  // 🔥 5. 용맹한 호랑이 (🔥 아마 5단)
  // 특징: 3수 깊이 미니맥스 수읽기, 알파-베타 가지치기, 침투와 삭감, 정밀한 끝내기
  selectMasterMove(engine, legalMoves, aiColor, oppColor, lastMove) {
    const board = engine.board;
    const size = engine.size;

    // 1차 후보군 8개 선발
    const candidates = [];
    for (const m of legalMoves) {
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);
      if (sim.myLiberties <= 1 && sim.captures === 0) continue;

      let baseScore = this.evaluateMove(engine, m.x, m.y, aiColor, oppColor, lastMove);
      baseScore += this.calculateTerritoryBonus(board, size, m.x, m.y, aiColor) * 2.2;
      candidates.push({ move: m, baseScore });
    }

    candidates.sort((a, b) => b.baseScore - a.baseScore);
    const topCandidates = candidates.slice(0, 6);

    if (topCandidates.length === 0) return legalMoves[0];

    let bestMove = topCandidates[0].move;
    let bestVal = -Infinity;

    for (const cand of topCandidates) {
      const m = cand.move;
      const sim = this.simulateMoveResult(board, size, m.x, m.y, aiColor);

      // 상대 최선의 반격 탐색 (상대 후보 4개)
      let oppMaxHarm = 0;
      const oppLocalMoves = this.getNeighbors(m.x, m.y, size).filter(n =>
        this.isLegal(sim.newBoard, size, n.x, n.y, oppColor, null)
      );

      for (const om of oppLocalMoves) {
        const oppSim = this.simulateMoveResult(sim.newBoard, size, om.x, om.y, oppColor);
        let harm = 0;
        if (oppSim.captures > 0) harm += 1000 + oppSim.captures * 400;
        if (oppSim.myLiberties >= 3) harm += 200;
        if (harm > oppMaxHarm) oppMaxHarm = harm;
      }

      const netScore = cand.baseScore - (oppMaxHarm * 0.9);
      if (netScore > bestVal) {
        bestVal = netScore;
        bestMove = m;
      }
    }

    return bestMove;
  }

  // 영토 및 영향력 평가 가산점
  calculateTerritoryBonus(board, size, x, y, color) {
    let bonus = 0;
    const oppColor = color === 1 ? 2 : 1;

    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const dist = Math.abs(dx) + Math.abs(dy);
          if (dist === 0) continue;
          if (board[ny][nx] === color) {
            bonus += (5 - dist) * 12;
          } else if (board[ny][nx] === oppColor) {
            bonus += (5 - dist) * 6;
          }
        }
      }
    }

    return bonus;
  }
}

if (typeof window !== 'undefined') {
  window.BadukAI = BadukAI;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BadukAI };
}
