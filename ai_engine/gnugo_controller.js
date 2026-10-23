// ==============================================================================
// GNU Go WebAssembly AI Controller for BadukSchool
// 100% Client-Side Genuine Go Engine (GNU Go 3.9.1)
// Zero Server Cost, Unlimited Concurrent Students
// ==============================================================================

(function (window) {
  'use strict';

  // 아동용 6단계 레벨 설정
  const AI_LEVELS = {
    1: { name: '삐약이', rank: '25~30급', avatar: '🐣', title: '샛별부 삐약이', desc: '초보 병아리! 알기 쉽게 두며 따내기 기회를 선물합니다.', blunderRate: 0.45 },
    2: { name: '토끼', rank: '20~24급', avatar: '🐰', title: '꿈나무부 토끼', desc: '착한 토끼! 평화롭고 조심스럽게 돌을 연결합니다.', blunderRate: 0.30 },
    3: { name: '여우', rank: '15~19급', avatar: '🦊', title: '기초반 여우', desc: '꾀돌이 여우! 사활과 기본 행마를 꼼꼼히 챙깁니다.', blunderRate: 0.18 },
    4: { name: '판다', rank: '12~14급', avatar: '🐼', title: '초급반 판다', desc: '듬직한 판다! 탄탄한 집짓기와 기본 정석을 구사합니다.', blunderRate: 0.08 },
    5: { name: '호랑이', rank: '10~11급', avatar: '🐯', title: '중급반 호랑이', desc: '용맹한 호랑이! 날카로운 맥점과 공격적인 행마를 보여줍니다.', blunderRate: 0.02 },
    6: { name: '사자', rank: '8~10급', avatar: '🦁', title: '도장 마스터 사자', desc: '도장 챔피언 사자! 그누고 AI의 최대 실력을 발휘합니다.', blunderRate: 0.00 }
  };

  class GnuGoController {
    constructor() {
      this.isReady = false;
      this.isLoading = false;
      this.module = null;
      this.readyCallbacks = [];
      this.basePath = this.detectBasePath();
    }

    detectBasePath() {
      // baduk 디렉터리 기준 상대 경로 감지
      if (typeof window !== 'undefined' && window.location) {
        return 'ai_engine/';
      }
      return './baduk/ai_engine/';
    }

    // WASM 및 엔진 초기화 (최초 1회 비동기 로딩)
    async init() {
      if (this.isReady) return true;
      if (this.isLoading) {
        return new Promise((resolve) => this.readyCallbacks.push(resolve));
      }

      this.isLoading = true;
      try {
        console.log('[GNU Go] 엔진 로딩 시작...');
        const wasmPath = this.basePath + 'gnugo.wasm';
        const jsPath = this.basePath + 'gnugo.js';

        // 1. gnugo.js 로드 (브라우저 스크립트 주입 또는 전역 주입)
        if (!window.__gnugo_init) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = jsPath;
            script.onload = () => {
              if (window.exports && window.exports.init) {
                window.__gnugo_init = window.exports.init;
              }
              resolve();
            };
            script.onerror = (err) => reject(new Error('gnugo.js 로드 실패: ' + err));
            document.head.appendChild(script);
          });
        }

        // 2. gnugo.wasm 바이너리 페치
        const response = await fetch(wasmPath);
        if (!response.ok) throw new Error('gnugo.wasm 다운로드 실패: ' + response.statusText);
        const wasmBinary = await response.arrayBuffer();

        // 3. Module 생성 및 Emscripten 초기화
        const Module = { wasmBinary: wasmBinary };
        window.__gnugo_init(Module);

        // Emscripten 런타임 준비 완료 대기
        await new Promise((resolve) => setTimeout(resolve, 300));

        this.module = Module;
        this.isReady = true;
        this.isLoading = false;
        console.log('[GNU Go] 엔진 준비 완료! 버전:', Module.ccall('get_version', 'string', [], []));

        while (this.readyCallbacks.length > 0) {
          const cb = this.readyCallbacks.shift();
          try { cb(true); } catch (e) { console.error(e); }
        }
        return true;
      } catch (err) {
        this.isLoading = false;
        console.error('[GNU Go] 초기화 에러:', err);
        while (this.readyCallbacks.length > 0) {
          const cb = this.readyCallbacks.shift();
          try { cb(false); } catch (e) { console.error(e); }
        }
        return false;
      }
    }

    // 치수에 따른 화점 접바둑 돌 좌표 반환
    getHandicapCoordinates(boardSize, handicapCount) {
      if (handicapCount < 2 || handicapCount > 9) return [];

      if (boardSize === 19) {
        const starMap = {
          2: [{ x: 15, y: 3 }, { x: 3, y: 15 }],
          3: [{ x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }],
          4: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }],
          5: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 9, y: 9 }],
          6: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }],
          7: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 9 }],
          8: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 3 }, { x: 9, y: 15 }],
          9: [{ x: 3, y: 3 }, { x: 15, y: 3 }, { x: 3, y: 15 }, { x: 15, y: 15 }, { x: 3, y: 9 }, { x: 15, y: 9 }, { x: 9, y: 3 }, { x: 9, y: 15 }, { x: 9, y: 9 }]
        };
        return starMap[handicapCount] || [];
      } else if (boardSize === 13) {
        const starMap = {
          2: [{ x: 9, y: 3 }, { x: 3, y: 9 }],
          3: [{ x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }],
          4: [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }],
          5: [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 6, y: 6 }]
        };
        return starMap[Math.min(handicapCount, 5)] || [];
      } else if (boardSize === 9) {
        const starMap = {
          2: [{ x: 6, y: 2 }, { x: 2, y: 6 }],
          3: [{ x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }],
          4: [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }],
          5: [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }, { x: 4, y: 4 }]
        };
        return starMap[Math.min(handicapCount, 5)] || [];
      }
      return [];
    }

    // 좌표를 SGF 좌표 문자열로 변환 (0,0 -> "aa")
    toSgfCoord(x, y) {
      if (x < 0 || y < 0) return '';
      return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
    }

    // SGF 좌표 문자열을 좌표 객체로 변환 ("aa" -> {x:0, y:0})
    fromSgfCoord(str, boardSize) {
      if (!str || str === '' || str === 'tt') return null; // Pass
      const x = str.charCodeAt(0) - 97;
      const y = str.charCodeAt(1) - 97;
      if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) return null;
      return { x, y };
    }

    // 대국 상태를 SGF 문자열로 조립
    buildSgf(boardSize, handicapStones, moves, komi = 6.5) {
      let sgf = `(;GM[1]SZ[${boardSize}]KM[${komi}]`;
      if (handicapStones && handicapStones.length > 0) {
        sgf += `HA[${handicapStones.length}]AB`;
        for (const s of handicapStones) {
          sgf += `[${this.toSgfCoord(s.x, s.y)}]`;
        }
      }
      if (moves && moves.length > 0) {
        for (const m of moves) {
          const colStr = m.color === 1 ? 'B' : 'W';
          if (m.isPass || m.x < 0 || m.y < 0) {
            sgf += `;${colStr}[]`;
          } else {
            sgf += `;${colStr}[${this.toSgfCoord(m.x, m.y)}]`;
          }
        }
      }
      sgf += ')';
      return sgf;
    }

    // GNU Go에게 다음 착수 계산 요청
    async getAIMove(boardSize, handicapStones, moves, aiColor, level = 3, komi = 6.5) {
      if (!this.isReady) {
        const ok = await this.init();
        if (!ok) throw new Error('GNU Go 엔진을 초기화할 수 없습니다.');
      }

      const seed = Math.floor(Math.random() * 1000000) + 1;
      const sgf = this.buildSgf(boardSize, handicapStones, moves, komi);

      // WebAssembly ccall('play', ...)
      const output = this.module.ccall('play', 'string', ['number', 'string'], [seed, sgf]);
      if (!output) {
        return { isPass: true, reason: 'EMPTY_OUTPUT' };
      }

      // GNU Go 출력 SGF에서 마지막 추가된 착수 추출
      // 예: ;W[dd]C[load and analyze mode]) 또는 ;W[]C[load and analyze mode])
      const match = output.match(/;([BW])\[([a-z]{0,2})\]C\[load and analyze mode\]/);
      if (!match) {
        console.warn('[GNU Go] 착수 패턴 파싱 실패, 전체 출력:', output);
        return { isPass: true, reason: 'PARSE_FAIL' };
      }

      const colorStr = match[1];
      const coordStr = match[2];
      const parsedCoord = this.fromSgfCoord(coordStr, boardSize);

      if (!parsedCoord) {
        return { isPass: true, color: colorStr === 'B' ? 1 : 2 };
      }

      let chosenX = parsedCoord.x;
      let chosenY = parsedCoord.y;

      // 아동용 난이도 실수/부드러운 응수 조절
      const levelConf = AI_LEVELS[level] || AI_LEVELS[3];
      if (levelConf.blunderRate > 0 && Math.random() < levelConf.blunderRate) {
        // 급수가 낮은 아이들을 위해 인접한 여유 있는 자리를 찾거나 느슨하게 응수
        const gentleMove = this.findGentleMove(boardSize, handicapStones, moves, chosenX, chosenY);
        if (gentleMove) {
          chosenX = gentleMove.x;
          chosenY = gentleMove.y;
        }
      }

      return {
        isPass: false,
        x: chosenX,
        y: chosenY,
        color: colorStr === 'B' ? 1 : 2,
        engineMove: parsedCoord
      };
    }

    // 저급자(샛별/꿈나무)를 위한 친절한 행마 탐색
    findGentleMove(boardSize, handicapStones, moves, bestX, bestY) {
      // 보드 현황 복원
      const occupied = new Set();
      if (handicapStones) {
        handicapStones.forEach(s => occupied.add(`${s.x},${s.y}`));
      }
      if (moves) {
        moves.forEach(m => {
          if (!m.isPass && m.x >= 0 && m.y >= 0) occupied.add(`${m.x},${m.y}`);
        });
      }

      // AI 최선의 수 주변 1~2칸 거리의 여유 있는 빈 자리 찾기
      const candidates = [];
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const nx = bestX + dx;
          const ny = bestY + dy;
          if (nx >= 1 && nx < boardSize - 1 && ny >= 1 && ny < boardSize - 1) {
            const key = `${nx},${ny}`;
            if (!occupied.has(key)) {
              candidates.push({ x: nx, y: ny });
            }
          }
        }
      }

      if (candidates.length > 0) {
        const randIdx = Math.floor(Math.random() * candidates.length);
        return candidates[randIdx];
      }
      return null;
    }

    // GNU Go 형세 판단 및 계가
    async evaluateScore(boardSize, handicapStones, moves, komi = 6.5) {
      if (!this.isReady) {
        const ok = await this.init();
        if (!ok) return 0;
      }

      const seed = Math.floor(Math.random() * 1000000) + 1;
      const sgf = this.buildSgf(boardSize, handicapStones, moves, komi);

      try {
        const scoreVal = this.module.ccall('score', 'number', ['number', 'string'], [seed, sgf]);
        return scoreVal; // 양수: 흑 리드, 음수: 백 리드
      } catch (e) {
        console.error('[GNU Go] 형세 판단 에러:', e);
        return 0;
      }
    }

    getLevelInfo(level) {
      return AI_LEVELS[level] || AI_LEVELS[3];
    }

    getAllLevels() {
      return AI_LEVELS;
    }
  }

  // 전역 인스턴스 등록
  window.GnuGoController = GnuGoController;
  window.gnugoController = new GnuGoController();

})(typeof window !== 'undefined' ? window : global);
