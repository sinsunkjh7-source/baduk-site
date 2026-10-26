// ========================================================
// BadukStudy SGF Problem Adapter & Dynamic Mutation Engine
// 5만 개 문제를 현대적 인터랙티브 엔진 모델로 자동 변환 및 회전/반전
// ========================================================

class BadukProblemAdapter {
  /**
   * SGF 문자열 좌표(예: 'pp', 'qp')를 0-indexed (x, y)로 변환
   */
  static sgfCoordToXY(coordStr) {
    if (!coordStr || coordStr.length < 2) return null;
    const x = coordStr.charCodeAt(0) - 97; // 'a' -> 0
    const y = coordStr.charCodeAt(1) - 97; // 'a' -> 0
    return { x, y };
  }

  /**
   * (x, y)를 SGF 좌표 문자열로 변환
   */
  static xyToSgfCoord(x, y) {
    return String.fromCharCode(97 + x) + String.fromCharCode(97 + y);
  }

  /**
   * SGF 착수열 분해 (예: ";W[pp];B[qp];B[pq]" -> [{color: 2, x: 15, y: 15}, ...])
   */
  static parseSgfMoves(sgfStr) {
    const stones = [];
    if (!sgfStr) return stones;

    // Pattern for ;B[xy] or ;W[xy] or ;C[xy] (choice/square markers)
    const regex = /;([BW])\[([a-s]{2})\]/gi;
    let match;
    while ((match = regex.exec(sgfStr)) !== null) {
      const color = match[1].toUpperCase() === 'B' ? 1 : 2;
      const pt = this.sgfCoordToXY(match[2].toLowerCase());
      if (pt) {
        stones.push({ x: pt.x, y: pt.y, color });
      }
    }
    return stones;
  }

  /**
   * SGF 라벨 및 기호 마커 분해
   * - T[xy]: 세모(△) 마커
   * - C[xy]: 동그라미(○ / ◎) 마커
   * - M[xy]: 엑스(×) 마커
   * - S[xy]: 네모(□ / ■) 마커
   * - L[xy:text]: 보기 텍스트 라벨 (가, 나, 다, 1, 2, A, B 등)
   */
  static parseLabels(sgfStr) {
    const labels = [];
    if (!sgfStr) return labels;

    // 1. T[xy] 세모(△) 마커 형태
    const regT = /T\[([a-s]{2})\]/gi;
    let match;
    while ((match = regT.exec(sgfStr)) !== null) {
      const pt = this.sgfCoordToXY(match[1].toLowerCase());
      if (pt) {
        labels.push({ x: pt.x, y: pt.y, text: '△', type: 'triangle' });
      }
    }

    // 2. C[xy] 동그라미(○ / ◎) 마커 형태
    const regC = /C\[([a-s]{2})\]/gi;
    while ((match = regC.exec(sgfStr)) !== null) {
      const pt = this.sgfCoordToXY(match[1].toLowerCase());
      if (pt) {
        labels.push({ x: pt.x, y: pt.y, text: '○', type: 'circle' });
      }
    }

    // 3. M[xy] 엑스(×) 마커 형태
    const regM = /M\[([a-s]{2})\]/gi;
    while ((match = regM.exec(sgfStr)) !== null) {
      const pt = this.sgfCoordToXY(match[1].toLowerCase());
      if (pt) {
        labels.push({ x: pt.x, y: pt.y, text: '×', type: 'cross' });
      }
    }

    // 4. S[xy] 네모(□ / ■) 마커 형태
    const regS = /S\[([a-s]{2})\]/gi;
    while ((match = regS.exec(sgfStr)) !== null) {
      const pt = this.sgfCoordToXY(match[1].toLowerCase());
      if (pt) {
        labels.push({ x: pt.x, y: pt.y, text: '■', type: 'square' });
      }
    }

    // 5. L[xy:text] 형태 (가, 나, 다, 1, 2, A, B 등)
    const regL = /L\[([a-s]{2}):([^\]]+)\]/gi;
    while ((match = regL.exec(sgfStr)) !== null) {
      const pt = this.sgfCoordToXY(match[1].toLowerCase());
      if (pt) {
        labels.push({ x: pt.x, y: pt.y, text: match[2].trim(), type: 'label' });
      }
    }

    return labels;
  }

  /**
   * 정답 수순 분기별 분해 (answer1 ~ answer5 를 개별 수순 분기로 분리)
   */
  static parseAnswerBranches(rawProb) {
    const branches = [];
    for (let i = 1; i <= 5; i++) {
      const ansKey = 'answer' + i;
      if (rawProb[ansKey] && rawProb[ansKey].trim()) {
        const moves = this.parseSgfMoves(rawProb[ansKey]);
        if (moves.length > 0) {
          branches.push(moves);
        }
      }
    }
    return branches;
  }

  /**
   * 대표 정답 수순 분해 (answer1 기본)
   */
  static parseAnswerMoves(rawProb) {
    const branches = this.parseAnswerBranches(rawProb);
    return branches.length > 0 ? branches[0] : [];
  }

  /**
   * 객관식 보기 문제(sample)와 정답 번호(answer)를 분석하여
   * 바둑판 라벨(labels) 중에서 정답 착점 좌표를 도출
   */
  static deriveAnswerFromLabels(rawProb, labels) {
    if (!rawProb.sample || !rawProb.answer || !labels || labels.length === 0) return null;
    const sampleOptions = rawProb.sample.split('|').map(s => s.trim()).filter(Boolean);
    if (sampleOptions.length === 0) return null;

    // 순수 O/X 문제는 바둑판 착점이 아닌 하단 O/X 버튼 선택 문제이므로 제외
    const oxSymbols = ['o', 'x', '○', '×', 'χ', '0'];
    const isPureOX = sampleOptions.every(opt => oxSymbols.includes(opt.toLowerCase()));
    if (isPureOX) return null;

    const rawAns = String(rawProb.answer).trim();
    let correctOptIndex = -1;
    let correctOptText = '';

    if (/^\d+$/.test(rawAns)) {
      const num = parseInt(rawAns, 10);
      if (num >= 1 && num <= sampleOptions.length) {
        correctOptIndex = num;
        correctOptText = sampleOptions[num - 1];
      }
    } else {
      const idx = sampleOptions.findIndex(o => o.toLowerCase() === rawAns.toLowerCase());
      if (idx !== -1) {
        correctOptIndex = idx + 1;
        correctOptText = sampleOptions[idx];
      }
    }

    if (!correctOptText && correctOptIndex === -1) return null;

    // 1. 라벨 텍스트와 보기 텍스트 직접 비교
    if (correctOptText) {
      const targetLower = correctOptText.toLowerCase();
      // 1-1) 완전 일치 (예: 보기 'A', 라벨 'A')
      const exact = labels.find(l => l.text && l.text.trim().toLowerCase() === targetLower);
      if (exact) return exact;

      // 1-2) 접두사 일치 또는 포함 (예: 보기 'A (귀)', 라벨 'A')
      const prefixMatch = labels.find(l => {
        if (!l.text) return false;
        const lt = l.text.trim().toLowerCase();
        return targetLower.startsWith(lt) || (lt.length > 1 && targetLower.includes(lt));
      });
      if (prefixMatch) return prefixMatch;
    }

    // 2. 정형화된 기호 인덱스 매핑 (A/B, 가/나, 1/2 등)
    if (correctOptIndex > 0) {
      const canonicalGroups = [
        ['a', 'b', 'c', 'd', 'e', 'f'],
        ['가', '나', '다', '라', '마', '바'],
        ['1', '2', '3', '4', '5', '6'],
        ['①', '②', '③', '④', '⑤', '⑥']
      ];
      for (const group of canonicalGroups) {
        if (correctOptIndex - 1 < group.length) {
          const cand = group[correctOptIndex - 1];
          const matched = labels.find(l => l.text && l.text.trim().toLowerCase() === cand);
          if (matched) return matched;
        }
      }
    }

    return null;
  }

  /**
   * 문제 객체 생성 (기존 ThinkTank 엔진과 100% 호환 구조)
   * @param {Object} rawProb - 크롤링된 문제 원본
   * @param {number} index - 문제 순번 (1-based)
   * @param {number} totalCount - 전체 문제 수
   * @param {string} chapterTitle - 단원 이름
   * @param {bookTitle} bookTitle - 교재 이름
   * @param {string} mutationMode - 'none' | 'rot90' | 'rot180' | 'rot270' | 'flipH' | 'flipV' | 'random'
   */
  static adaptProblem(rawProb, index, totalCount, chapterTitle, bookTitle, mutationMode = 'none') {
    let initialStones = this.parseSgfMoves(rawProb.data);
    let branches = this.parseAnswerBranches(rawProb);
    let answers = branches.length > 0 ? branches[0] : [];
    let labels = this.parseLabels(rawProb.data);

    // 🌟 각 라벨이 원래 초기 바둑돌 위에 있던 마커(세모 △, 동그라미 ○ 등)인지 판별
    labels.forEach(lb => {
      const matchStone = initialStones.find(s => s.x === lb.x && s.y === lb.y);
      if (matchStone) {
        lb.isStoneMarker = true;
        lb.initialStoneColor = matchStone.color;
      } else {
        lb.isStoneMarker = false;
        lb.initialStoneColor = 0;
      }
    });

    const hasRawAnswerMoves = Boolean(rawProb.answer1 && rawProb.answer1.trim() && this.parseSgfMoves(rawProb.answer1).length > 0);
    const questionText = (rawProb.question || '').replace(/\r\n/g, ' ');
    const isNamedChoice = questionText.includes('맞는 이름에') || questionText.includes('활로 개수는');

    // 🌟 [원장님 원칙] 흑선 / 백선 정밀 판별
    // 1) 정답 수순(answers)의 첫 수가 백돌이면 반드시 백선(2), 흑돌이면 흑선(1)
    // 2) 정답 수순이 없는 경우 rawProb.start가 'W'로 시작(WA, WK, WH, W 등)하면 백선(2), 그 외 흑선(1)
    let targetPlayer = 1;
    if (answers.length > 0 && answers[0].color && !isNamedChoice) {
      targetPlayer = answers[0].color;
    } else if (rawProb.start && String(rawProb.start).toUpperCase().startsWith('W')) {
      targetPlayer = 2;
    }
    const opponentPlayer = targetPlayer === 1 ? 2 : 1;

    // 🌟 객관식 문제 중 정답 수순(answer1)이 비어있지만 보기에 라벨(A, B 또는 1, 2 등)이 존재하는 경우
    // 바둑판에 직접 돌을 놓아도 정답 판정이 되도록 라벨 좌표를 정답 착수(answers)로 자동 보강
    if (answers.length === 0 && rawProb.sample && rawProb.answer) {
      const derivedAnswerPoint = this.deriveAnswerFromLabels(rawProb, labels);
      if (derivedAnswerPoint) {
        const derivedMove = {
          x: derivedAnswerPoint.x,
          y: derivedAnswerPoint.y,
          color: targetPlayer
        };
        answers = [derivedMove];
        branches = [[derivedMove]];
      }
    }

    // 문제 변형 (Mutation) 적용 모드 보존
    let appliedMutation = mutationMode;
    if (mutationMode === 'random') {
      const modes = ['none', 'rot90', 'rot180', 'rot270', 'flipH', 'flipV'];
      appliedMutation = modes[Math.floor(Math.random() * modes.length)];
    }

    // 🌟 [원장님 지침 반영] 문제의 실제 돌과 정답 수순 전체를 정밀 분석하여
    // 원 교재 다이어그램 규격(9, 11, 13, 19줄)에 100% 맞춤형 가변 뷰포트 및 우하귀 1선 절대 고정 엔진
    const allAnswerPoints = branches.flat();
    const allPoints = initialStones.concat(allAnswerPoints).concat(labels);
    let minX = 19, maxX = 0, minY = 19, maxY = 0;
    allPoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const spanX = allPoints.length > 0 ? (maxX - minX + 1) : 4;
    const spanY = allPoints.length > 0 ? (maxY - minY + 1) : 4;

    /* 넓은 문제(포석 등)는 자르지 않고 19줄 전체로 */
    const WIDE = (spanX > 12 || spanY > 12);

    // 🌟 사분면 및 원본 영역 정밀 판별 (원 교재 size 코드 1, 2, 4, 5, 6, 7, 9 완벽 지원)
    // 1: 19줄 전판 / 중앙 문제
    // 2: 하변 (Bottom Side)
    // 4: 우하귀 (Right-Bottom Corner)
    // 5: 우상귀 (Right-Top Corner)
    // 6: 좌상귀 (Left-Top Corner)
    // 7: 좌하귀 (Left-Bottom Corner)
    // 9: 9줄 전판 (입문용 순수 9줄)
    let quadrant = 'BR';
    let recommendedSize = 9;

    const rawSizeStr = String(rawProb.size || '').trim();

    if (rawSizeStr === '1') {
      // 고전 명국, 천원/중앙, 축, 전판 사활 (예: 현현기경 1번 명주출해세 등)
      quadrant = 'FULL19';
      recommendedSize = 19;
    } else if (rawSizeStr === '2') {
      // 하변 문제 (좌우로 넓게 펼쳐진 변 사활) -> 19줄 전판으로 시원하게 표시
      quadrant = 'FULL19';
      recommendedSize = 19;
    } else if (rawSizeStr === '7' || (minX <= 8 && minY >= 10 && maxX <= 9)) {
      // 좌하귀 (Bottom-Left)
      quadrant = 'BL';
      const needed = Math.max(maxX + 1, 19 - minY);
      if (needed <= 9) recommendedSize = 9;
      else if (needed <= 11) recommendedSize = 11;
      else if (needed <= 13) recommendedSize = 13;
      else recommendedSize = 19;
    } else if (rawSizeStr === '5' || (minX >= 10 && maxY <= 8 && minY <= 8)) {
      // 우상귀 (Top-Right)
      quadrant = 'TR';
      const needed = Math.max(19 - minX, maxY + 1);
      if (needed <= 9) recommendedSize = 9;
      else if (needed <= 11) recommendedSize = 11;
      else if (needed <= 13) recommendedSize = 13;
      else recommendedSize = 19;
    } else if (rawSizeStr === '4' || (maxX >= 10 && maxY >= 10) || (minX >= 7 && minY >= 7)) {
      // 우하귀 (Bottom-Right) - 표준 사활 및 교재 대부분 (size 4 및 우하귀 돌 배치)
      quadrant = 'BR';
      const needed = Math.max(19 - minX, 19 - minY);
      if (needed <= 9) recommendedSize = 9;
      else if (needed <= 11) recommendedSize = 11;
      else if (needed <= 13) recommendedSize = 13;
      else recommendedSize = 19;
    } else if (rawSizeStr === '6') {
      // 좌상귀 (Top-Left)
      quadrant = 'TL';
      const needed = Math.max(maxX + 1, maxY + 1);
      if (needed <= 9) recommendedSize = 9;
      else if (needed <= 11) recommendedSize = 11;
      else if (needed <= 13) recommendedSize = 13;
      else recommendedSize = 19;
    } else if (maxX <= 8 && maxY <= 8) {
      // 모든 돌이 0~8 안에 있는 순수 9줄 입문 문제
      quadrant = 'NATIVE9';
      recommendedSize = 9;
    } else {
      // 기타 범위가 넓거나 중앙에 걸친 고전 사활 -> 19줄 전판
      quadrant = 'FULL19';
      recommendedSize = 19;
    }

        const titleStr = `${chapterTitle} (${index}/${totalCount})`;

    return {
      id: index,
      code: rawProb.code,
      title: titleStr,
      bookTitle: bookTitle,
      chapterTitle: chapterTitle,
      desc: (rawProb.question || '').replace(/\r\n/g, ' ').trim(),
      hint: rawProb.hint || '',
      speech: rawProb.speech || (rawProb.question ? (rawProb.question.includes('\r\n') ? rawProb.question.split('\r\n')[1] : rawProb.question) : '올바른 곳에 돌을 놓아보세요!'),
      targetPlayer: targetPlayer,
      opponentPlayer: opponentPlayer,
      turnName: targetPlayer === 2 ? '백선' : '흑선',
      movesNeeded: Math.max(1, answers.length),
      initialStones19: initialStones,
      answers19: answers,
      branches19: branches,
      labels19: labels,
      appliedMutation: appliedMutation,
      recommendedSize: recommendedSize,
      quadrant: quadrant,
      minX: minX,
      maxX: maxX,
      minY: minY,
      maxY: maxY,
      __wide: WIDE,
      spanX: spanX,
      spanY: spanY,

      // 🌟 O/X 및 객관식 선택지 정보
      // 정답 착수(answers)가 명확히 존재하는 정통 바둑 수순 문제인 경우,
      // 크롤링 잔여물(O|X 또는 가|나 등)로 인한 가짜 객관식 판정을 방지하고 바둑판 직접 착수를 우선합니다.
      sample: rawProb.sample || '',
      choiceAnswer: rawProb.answer ? String(rawProb.answer).trim() : '',
      isChoiceProblem: Boolean(rawProb.sample && rawProb.sample.split('|').map(s => s.trim()).filter(Boolean).length > 0 && (!hasRawAnswerMoves || isNamedChoice)),
      choiceOptions: (rawProb.sample && (!hasRawAnswerMoves || isNamedChoice)) ? rawProb.sample.split('|').map(s => s.trim()).filter(Boolean) : [],

      getQuadrant: function() {
        return quadrant;
      },

      // 🌟 [원장님 원칙] 우하귀 부분도에서는 1선에서 4번째 줄에 정확히 단 1개의 4선 화점만 표시!
      getStarPoints: function(size) {
        if (size >= 19 || quadrant === 'FULL19') {
          return [
            { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
            { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
            { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
          ];
        }
        if (quadrant === 'NATIVE9') {
          // 9줄 바둑판은 정중앙 천원 1개만 표시
          return [{ x: 4, y: 4 }];
        }
        if (quadrant === 'BR') {
          // 우하귀 4선 화점: (size - 4, size - 4)
          return [{ x: size - 4, y: size - 4 }];
        } else if (quadrant === 'TL') {
          return [{ x: 3, y: 3 }];
        } else if (quadrant === 'TR') {
          return [{ x: size - 4, y: 3 }];
        } else if (quadrant === 'BL') {
          return [{ x: 3, y: size - 4 }];
        }
        return [];
      },

      // 🌟 [우하귀 1선 절대 고정] 1선 테두리와의 거리를 100% 보존하는 정밀 오프셋
      getShift: function(size) {
        if (size >= 19 || quadrant === 'FULL19') return { x: 0, y: 0 };
        if (quadrant === 'NATIVE9') return { x: 0, y: 0 };

        if (quadrant === 'BR') {
          // 우하귀(18, 18)를 부분도의 (size-1, size-1)에 일치시킴: 18 - (size - 1) = 19 - size
          return { x: 19 - size, y: 19 - size };
        } else if (quadrant === 'TL') {
          return { x: 0, y: 0 };
        } else if (quadrant === 'TR') {
          return { x: 19 - size, y: 0 };
        } else if (quadrant === 'BL') {
          return { x: 0, y: 19 - size };
        }
        return { x: 0, y: 0 };
      },

      // 라벨('가', '나', '다', '■', '△', '○') 현재 바둑판 크기 및 회전/반전에 맞게 계산
      getLabels: function(size) {
        if (size === 19) {
          if (this.appliedMutation && this.appliedMutation !== 'none') {
            return this.labels19.map(l => ({
              ...BadukProblemAdapter.transformPoint(l, this.appliedMutation, size),
              text: l.text,
              type: l.type,
              isStoneMarker: l.isStoneMarker,
              initialStoneColor: l.initialStoneColor
            }));
          }
          return this.labels19;
        }

        const shift = this.getShift(size);
        const scaled = this.labels19.map(l => ({
          x: Math.max(0, Math.min(size - 1, l.x - shift.x)),
          y: Math.max(0, Math.min(size - 1, l.y - shift.y)),
          text: l.text,
          type: l.type,
          isStoneMarker: l.isStoneMarker,
          initialStoneColor: l.initialStoneColor
        }));

        if (this.appliedMutation && this.appliedMutation !== 'none') {
          return scaled.map(l => ({
            ...BadukProblemAdapter.transformPoint(l, this.appliedMutation, size),
            text: l.text,
            type: l.type,
            isStoneMarker: l.isStoneMarker,
            initialStoneColor: l.initialStoneColor
          }));
        }
        return scaled;
      },

      // 9, 13, 19줄 보드 규격 스마트 오프셋 및 회전/반전 변환
      initBoard: function(size) {
        if (size === 19) {
          if (this.appliedMutation && this.appliedMutation !== 'none') {
            return this.initialStones19.map(s => BadukProblemAdapter.transformPoint(s, this.appliedMutation, size));
          }
          return this.initialStones19;
        }

        const shift = this.getShift(size);
        const scaled = this.initialStones19.map(s => ({
          x: Math.max(0, Math.min(size - 1, s.x - shift.x)),
          y: Math.max(0, Math.min(size - 1, s.y - shift.y)),
          color: s.color
        }));

        if (this.appliedMutation && this.appliedMutation !== 'none') {
          return scaled.map(s => BadukProblemAdapter.transformPoint(s, this.appliedMutation, size));
        }
        return scaled;
      },

      // 🌟 모든 정답 수순 분기 목록 반환 (변화도 지원)
      getBranches: function(size) {
        const shift = this.getShift(size);
        return this.branches19.map(branch => {
          if (size === 19) {
            if (this.appliedMutation && this.appliedMutation !== 'none') {
              return branch.map(a => BadukProblemAdapter.transformPoint(a, this.appliedMutation, size));
            }
            return branch;
          }

          const scaled = branch.map(a => ({
            x: Math.max(0, Math.min(size - 1, a.x - shift.x)),
            y: Math.max(0, Math.min(size - 1, a.y - shift.y)),
            color: a.color
          }));

          if (this.appliedMutation && this.appliedMutation !== 'none') {
            return scaled.map(a => BadukProblemAdapter.transformPoint(a, this.appliedMutation, size));
          }
          return scaled;
        });
      },

      getAnswers: function(size) {
        const branches = this.getBranches(size);
        return branches.length > 0 ? branches[0] : [];
      },

      getAnswer: function(size) {
        const ans = this.getAnswers(size);
        return ans[0] || null;
      },

      // 정답 착수 또는 따냄 성공 검증
      isValidLibertyMove: function(x, y, engine, size) {
        const branches = this.getBranches(size);
        return branches.some(b => b.some(ans => ans.x === x && ans.y === y));
      },

      checkSuccess: function(engine, size) {
        const branches = this.getBranches(size);
        if (branches.length === 0) {
          // 수순 데이터가 없는 순수 단수 따내기 문제
          if (this.targetPlayer === 2) return engine.whiteCaptures >= 1;
          return engine.blackCaptures >= 1;
        }

        // 수순 문제인 경우: 활성화된 분기 중 어느 하나라도 끝까지 완료되었는지 확인
        return branches.some(branch => {
          if (engine.currentStep < branch.length) return false;
          // 해당 분기의 모든 수순이 올바르게 두어졌는지 확인
          for (let i = 0; i < branch.length; i++) {
            const expMove = branch[i];
            const playedMove = engine.moves[i];
            if (!playedMove || playedMove.x !== expMove.x || playedMove.y !== expMove.y || playedMove.color !== expMove.color) {
              return false;
            }
          }
          return true;
        });
      },

      successMessage: "참 잘했습니다! 👏 정답의 급소를 정확히 찾았습니다! 🎉"
    };
  }

  /**
   * 19줄 좌표계 변환 (회전 및 대칭)
   */
  static transformPoint(pt, mode, boardSize = 19) {
    const max = boardSize - 1;
    let { x, y } = pt;

    switch (mode) {
      case 'rot90':
        // 90도 회전: (x, y) -> (max - y, x)
        return { ...pt, x: max - y, y: x };
      case 'rot180':
        // 180도 회전: (x, y) -> (max - x, max - y)
        return { ...pt, x: max - x, y: max - y };
      case 'rot270':
        // 270도 회전: (x, y) -> (y, max - x)
        return { ...pt, x: y, y: max - x };
      case 'flipH':
        // 좌우 반전
        return { ...pt, x: max - x, y: y };
      case 'flipV':
        // 상하 반전
        return { ...pt, x: x, y: max - y };
      default:
        return { ...pt };
    }
  }
}

if (typeof window !== 'undefined') {
  window.BadukProblemAdapter = BadukProblemAdapter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BadukProblemAdapter;
}
