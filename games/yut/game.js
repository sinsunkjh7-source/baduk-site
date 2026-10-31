/**
 * 전통 윷놀이 정통 엔진 (JH 바둑스쿨 EduFun)
 * 29밭 DAG 경로 그래프 · 연속 던지기(윷/모) 큐 · 말 업기 · 빽도 · 지름길 분기 · 스마트 AI
 */
(function () {
  'use strict';

  // 캔버스 및 렌더링 설정
  const canvas = document.getElementById('yutBoard');
  const ctx = canvas.getContext('2d');
  function updateCanvasResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(BOARD_SIZE * dpr);
    const targetH = Math.round(BOARD_SIZE * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }
    return dpr;
  }

  const BOARD_SIZE = 680;
  const PAD = 75;
  const SIDE = BOARD_SIZE - PAD * 2; // 530px
  const PIECE_RADIUS = 19;

  // 29개 밭(Station) 좌표 정의
  // 0: 참먹이(우하귀), 1~4: 우변, 5: 앞모(우상귀), 6~9: 상변, 10: 뒷모(좌상귀),
  // 11~14: 좌변, 15: 찌모(좌하귀), 16~19: 하변,
  // 20~21: 대각선(5->22), 22: 중앙 방, 23~24: 대각선(10->22),
  // 25~26: 대각선(22->0), 27~28: 대각선(22->15)
  const NODES = [];

  function initBoardNodes() {
    NODES.length = 0;
    // 1. 외곽 20개 노드 (시계 반대 방향)
    // 0: 우하귀 (출발/참먹이)
    NODES[0] = { id: 0, x: PAD + SIDE, y: PAD + SIDE, name: '참먹이 (출발/도착)', isCorner: true };
    // 1~4: 우변 (북쪽으로 전진)
    for (let i = 1; i <= 4; i++) {
      NODES[i] = { id: i, x: PAD + SIDE, y: PAD + SIDE - (SIDE / 5) * i, name: ['도', '개', '걸', '윷'][i - 1], isCorner: false };
    }
    // 5: 우상귀 (앞모)
    NODES[5] = { id: 5, x: PAD + SIDE, y: PAD, name: '앞모 (우상귀)', isCorner: true };
    // 6~9: 상변 (서쪽으로 전진)
    for (let i = 1; i <= 4; i++) {
      NODES[5 + i] = { id: 5 + i, x: PAD + SIDE - (SIDE / 5) * i, y: PAD, name: `상변 ${i}`, isCorner: false };
    }
    // 10: 좌상귀 (뒷모)
    NODES[10] = { id: 10, x: PAD, y: PAD, name: '뒷모 (좌상귀)', isCorner: true };
    // 11~14: 좌변 (남쪽으로 전진)
    for (let i = 1; i <= 4; i++) {
      NODES[10 + i] = { id: 10 + i, x: PAD, y: PAD + (SIDE / 5) * i, name: `좌변 ${i}`, isCorner: false };
    }
    // 15: 좌하귀 (찌모)
    NODES[15] = { id: 15, x: PAD, y: PAD + SIDE, name: '찌모 (좌하귀)', isCorner: true };
    // 16~19: 하변 (동쪽으로 전진)
    for (let i = 1; i <= 4; i++) {
      NODES[15 + i] = { id: 15 + i, x: PAD + (SIDE / 5) * i, y: PAD + SIDE, name: `하변 ${i}`, isCorner: false };
    }

    // 2. 대각선 노드들
    const CX = PAD + SIDE / 2;
    const CY = PAD + SIDE / 2;
    // 22: 중앙 방
    NODES[22] = { id: 22, x: CX, y: CY, name: '중앙 방', isCenter: true };

    // 20, 21: 우상귀(5) -> 중앙(22)
    NODES[20] = { id: 20, x: NODES[5].x + (CX - NODES[5].x) / 3, y: NODES[5].y + (CY - NODES[5].y) / 3, name: '앞모 대각 1' };
    NODES[21] = { id: 21, x: NODES[5].x + ((CX - NODES[5].x) * 2) / 3, y: NODES[5].y + ((CY - NODES[5].y) * 2) / 3, name: '앞모 대각 2' };

    // 23, 24: 좌상귀(10) -> 중앙(22)
    NODES[23] = { id: 23, x: NODES[10].x + (CX - NODES[10].x) / 3, y: NODES[10].y + (CY - NODES[10].y) / 3, name: '뒷모 대각 1' };
    NODES[24] = { id: 24, x: NODES[10].x + ((CX - NODES[10].x) * 2) / 3, y: NODES[10].y + ((CY - NODES[10].y) * 2) / 3, name: '뒷모 대각 2' };

    // 25, 26: 중앙(22) -> 우하귀 참먹이(0) 빠른 탈출로
    NODES[25] = { id: 25, x: CX + (NODES[0].x - CX) / 3, y: CY + (NODES[0].y - CY) / 3, name: '출구 대각 1' };
    NODES[26] = { id: 26, x: CX + ((NODES[0].x - CX) * 2) / 3, y: CY + ((NODES[0].y - CY) * 2) / 3, name: '출구 대각 2' };

    // 27, 28: 중앙(22) -> 좌하귀(15) 통과로
    NODES[27] = { id: 27, x: CX + (NODES[15].x - CX) / 3, y: CY + (NODES[15].y - CY) / 3, name: '좌하 대각 1' };
    NODES[28] = { id: 28, x: CX + ((NODES[15].x - CX) * 2) / 3, y: CY + ((NODES[15].y - CY) * 2) / 3, name: '좌하 대각 2' };
  }

  initBoardNodes();

  // Web Audio 효과음 합성 엔진
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  let soundEnabled = true;

  function playSound(type) {
    if (!soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;

      if (type === 'throw') {
        // 윷가락 나무 부딪히는 소리
        for (let i = 0; i < 4; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220 + Math.random() * 200, now + i * 0.04);
          gain.gain.setValueAtTime(0.2, now + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 0.12);
        }
      } else if (type === 'step') {
        // 말 착수음 (퐁!)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'catch') {
        // 말 잡았을 때 (팡!)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(640, now + 0.18);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'carry') {
        // 업기 (뾰로롱!)
        [523, 659, 784].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.2, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.12);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.12);
        });
      } else if (type === 'goal') {
        // 완주 골인 차임
        [523, 659, 784, 1046].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.25, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.2);
        });
      }
    } catch (e) {
      // Audio not permitted yet
    }
  }

  // -------------------------------------------------------------
  // 게임 상태 머신 (State Machine)
  // -------------------------------------------------------------
  const YUT_NAMES = {
    '-1': '뒷도(빽도)',
    1: '도',
    2: '개',
    3: '걸',
    4: '윷',
    5: '모'
  };

  let vsAI = true;
  let turn = 0; // 0: 청팀 (나), 1: 홍팀 (상대/AI)
  let phase = 'throw'; // 'throw' | 'move'
  let isThrowing = false;
  let isMoving = false;
  let gameOver = false;

  // 던져서 나온 패들 큐 (예: [{name:'윷', steps:4}, {name:'개', steps:2}])
  let handQueue = [];
  let selectedHandIdx = 0; // 현재 선택된 패 인덱스
  let selectedPieceId = null; // 선택된 말 ID

  // 각 플레이어별 4개의 말 (Pieces)
  // pos: -1 (대기석), 0~28 (판 위 밭 번호), null (완주/골인)
  // route: 'outer' | 'diag_ur_to_center' | 'diag_ul_to_center' | 'diag_center_to_exit' | 'diag_center_to_ll'
  // stacked: 함께 업힌 말 id 배열
  const players = [
    {
      id: 0,
      name: '청팀 (나)',
      color: '#2563eb',
      pieces: [
        { id: 'p0_1', owner: 0, label: '1', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p0_2', owner: 0, label: '2', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p0_3', owner: 0, label: '3', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p0_4', owner: 0, label: '4', pos: -1, route: 'outer', stacked: [], finished: false }
      ]
    },
    {
      id: 1,
      name: '홍팀 (AI)',
      color: '#dc2626',
      pieces: [
        { id: 'p1_1', owner: 1, label: '1', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p1_2', owner: 1, label: '2', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p1_3', owner: 1, label: '3', pos: -1, route: 'outer', stacked: [], finished: false },
        { id: 'p1_4', owner: 1, label: '4', pos: -1, route: 'outer', stacked: [], finished: false }
      ]
    }
  ];

  // DOM 요소 캐시
  const dom = {
    p1Card: document.getElementById('p1Card'),
    p2Card: document.getElementById('p2Card'),
    p1Goals: document.getElementById('p1Goals'),
    p2Goals: document.getElementById('p2Goals'),
    p1HomeTray: document.getElementById('p1HomeTray'),
    p2HomeTray: document.getElementById('p2HomeTray'),
    turnBanner: document.getElementById('turnBanner'),
    turnTitle: document.getElementById('turnTitle'),
    turnSub: document.getElementById('turnSub'),
    p2BadgeTitle: document.getElementById('p2BadgeTitle'),
    btnThrow: document.getElementById('btnThrow'),
    handChips: document.getElementById('handChips'),
    sticksContainer: document.getElementById('sticksContainer'),
    stickElements: [
      document.getElementById('stick0'),
      document.getElementById('stick1'),
      document.getElementById('stick2'),
      document.getElementById('stick3')
    ],
    btnNewGame: document.getElementById('btnNewGame'),
    btnToggleMode: document.getElementById('btnToggleMode'),
    btnToggleSound: document.getElementById('btnToggleSound')
  };

  // -------------------------------------------------------------
  // 윷놀이 이동 경로(Graph) 계산기
  // -------------------------------------------------------------
  function getNextStep(pos, route) {
    // 1보 전진 시 (next_pos, next_route, is_finish)
    if (pos === -1) {
      return { pos: 1, route: 'outer', finished: false };
    }

    if (route === 'outer') {
      if (pos === 19) return { pos: 0, route: 'outer', finished: false };
      if (pos === 0) return { pos: null, route: null, finished: true }; // 0을 넘어가면 골인
      return { pos: pos + 1, route: 'outer', finished: false };
    }

    if (route === 'diag_ur_to_center') {
      if (pos === 5) return { pos: 20, route: 'diag_ur_to_center', finished: false };
      if (pos === 20) return { pos: 21, route: 'diag_ur_to_center', finished: false };
      if (pos === 21) return { pos: 22, route: 'diag_ur_to_center', finished: false };
      if (pos === 22) return { pos: 27, route: 'diag_center_to_ll', finished: false }; // 22 통과 시 좌하귀행
    }

    if (route === 'diag_center_to_ll') {
      if (pos === 27) return { pos: 28, route: 'diag_center_to_ll', finished: false };
      if (pos === 28) return { pos: 15, route: 'outer', finished: false }; // 15번 외곽 합류
    }

    if (route === 'diag_ul_to_center') {
      if (pos === 10) return { pos: 23, route: 'diag_ul_to_center', finished: false };
      if (pos === 23) return { pos: 24, route: 'diag_ul_to_center', finished: false };
      if (pos === 24) return { pos: 22, route: 'diag_center_to_exit', finished: false };
      if (pos === 22) return { pos: 25, route: 'diag_center_to_exit', finished: false };
    }

    if (route === 'diag_center_to_exit') {
      if (pos === 22) return { pos: 25, route: 'diag_center_to_exit', finished: false };
      if (pos === 25) return { pos: 26, route: 'diag_center_to_exit', finished: false };
      if (pos === 26) return { pos: 0, route: 'outer', finished: false };
      if (pos === 0) return { pos: null, route: null, finished: true };
    }

    return { pos: null, route: null, finished: true };
  }

  function simulateMove(startPos, startRoute, steps) {
    if (steps === -1) {
      // 빽도 (뒷도)
      if (startPos === -1) {
        // 대기석 빽도 -> 참먹이(0번) 진입! (다음 턴 1보 골인 가능)
        return { pos: 0, route: 'outer', finished: false };
      }
      if (startRoute === 'outer') {
        if (startPos === 1) return { pos: 0, route: 'outer', finished: false };
        if (startPos === 0) return { pos: 19, route: 'outer', finished: false };
        return { pos: startPos - 1, route: 'outer', finished: false };
      }
      if (startRoute === 'diag_ur_to_center') {
        if (startPos === 20) return { pos: 5, route: 'outer', finished: false };
        if (startPos === 21) return { pos: 20, route: 'diag_ur_to_center', finished: false };
        if (startPos === 22) return { pos: 21, route: 'diag_ur_to_center', finished: false };
      }
      if (startRoute === 'diag_ul_to_center') {
        if (startPos === 23) return { pos: 10, route: 'outer', finished: false };
        if (startPos === 24) return { pos: 23, route: 'diag_ul_to_center', finished: false };
        if (startPos === 22) return { pos: 24, route: 'diag_ul_to_center', finished: false };
      }
      if (startRoute === 'diag_center_to_exit') {
        if (startPos === 25) return { pos: 22, route: 'diag_center_to_exit', finished: false };
        if (startPos === 26) return { pos: 25, route: 'diag_center_to_exit', finished: false };
        if (startPos === 0) return { pos: 26, route: 'diag_center_to_exit', finished: false };
      }
      if (startRoute === 'diag_center_to_ll') {
        if (startPos === 27) return { pos: 22, route: 'diag_ur_to_center', finished: false };
        if (startPos === 28) return { pos: 27, route: 'diag_center_to_ll', finished: false };
        if (startPos === 15) return { pos: 28, route: 'diag_center_to_ll', finished: false };
      }
      return { pos: startPos, route: startRoute, finished: false };
    }

    let curPos = startPos;
    let curRoute = startRoute;
    let finished = false;

    for (let s = 0; s < steps; s++) {
      if (finished) break;
      const res = getNextStep(curPos, curRoute);
      curPos = res.pos;
      curRoute = res.route;
      finished = res.finished;
    }

    // 도착 지점이 모서리나 중앙일 때 분기 활성화
    if (!finished) {
      if (curPos === 5) curRoute = 'diag_ur_to_center';
      else if (curPos === 10) curRoute = 'diag_ul_to_center';
      else if (curPos === 22) curRoute = 'diag_center_to_exit'; // 중앙에 멈추면 빠른 출구길로 전환!
    }

    return { pos: curPos, route: curRoute, finished };
  }

  // -------------------------------------------------------------
  // 윷 던지기 로직 (확률 모델 & 애니메이션)
  // -------------------------------------------------------------
  function rollYut() {
    // 실제 윷가락의 둥근 등과 평평한 배 확률 반영: 평평한 배가 나올 확률 약 58%
    const bellyProb = 0.58;
    const flips = [
      Math.random() < bellyProb, // 0번 윷: 뒷도(X) 표식
      Math.random() < bellyProb,
      Math.random() < bellyProb,
      Math.random() < bellyProb
    ];

    const bellyCount = flips.filter(b => b).length;
    let name = '';
    let steps = 0;
    let isBonus = false;

    if (bellyCount === 1) {
      if (flips[0]) {
        name = '뒷도(빽도)';
        steps = -1;
      } else {
        name = '도';
        steps = 1;
      }
    } else if (bellyCount === 2) {
      name = '개';
      steps = 2;
    } else if (bellyCount === 3) {
      name = '걸';
      steps = 3;
    } else if (bellyCount === 4) {
      name = '윷';
      steps = 4;
      isBonus = true; // 한 번 더!
    } else if (bellyCount === 0) {
      name = '모';
      steps = 5;
      isBonus = true; // 한 번 더!
    }

    return { flips, name, steps, isBonus };
  }

  function throwYutAction() {
    if (gameOver || isThrowing || isMoving || phase !== 'throw') return;
    if (vsAI && turn === 1) return; // AI 턴 동안 사용자 클릭 방지

    executeThrow();
  }

  function executeThrow() {
    isThrowing = true;
    dom.btnThrow.disabled = true;
    playSound('throw');

    // 윷가락 구르기 애니메이션 시작
    dom.sticksContainer.classList.add('tumbling');

    const result = rollYut();

    setTimeout(() => {
      dom.sticksContainer.classList.remove('tumbling');
      // 윷가락 면 뒤집기 상태 적용
      result.flips.forEach((isBelly, i) => {
        dom.stickElements[i].classList.toggle('flipped', !isBelly); // 등에 닿으면 flipped
      });

      // 던진 패 큐에 추가
      handQueue.push({
        name: result.name,
        steps: result.steps,
        isBonus: result.isBonus
      });

      isThrowing = false;
      renderHandChips();

      if (result.isBonus) {
        // 윷이나 모: 한 번 더 던지기!
        setBanner(`${result.name}!`, '한 번 더 던질 수 있습니다! 🎲', '#f59e0b');
        phase = 'throw';
        updateUI();
        if (vsAI && turn === 1) {
          setTimeout(aiTurn, 700);
        }
      } else {
        // 일반 패: 이동 단계로 전환
        phase = 'move';
        selectedHandIdx = 0;
        setBanner(
          `${result.name}!`,
          turn === 0 ? '이동할 말과 패를 선택하세요' : '상대가 이동할 말을 고르고 있습니다',
          turn === 0 ? '#2563eb' : '#dc2626'
        );
        updateUI();
        if (vsAI && turn === 1) {
          setTimeout(aiMove, 650);
        }
      }
    }, 450);
  }

  // -------------------------------------------------------------
  // 말 이동 및 규칙 (잡기, 업기, 완주)
  // -------------------------------------------------------------
  function selectHandChip(idx) {
    if (phase !== 'move' || isMoving || (vsAI && turn === 1)) return;
    selectedHandIdx = idx;
    renderHandChips();
    drawBoard();
  }

  // 업힌 말 그룹 조회 헬퍼 (동일 위치의 아군 말 묶음)
  function getPieceGroup(piece) {
    if (!piece || piece.finished || piece.pos === -1) return [piece];
    const myTeam = players[piece.owner];
    const group = myTeam.pieces.filter(p => !p.finished && p.pos === piece.pos);
    return group.length > 0 ? group : [piece];
  }

  function selectPiece(piece) {
    if (gameOver || isMoving || phase !== 'move') return;
    if (turn !== piece.owner) return;
    if (piece.finished) return;

    if (handQueue.length === 0) return;
    const currentHand = handQueue[selectedHandIdx];
    if (!currentHand) return;

    movePiece(piece, currentHand.steps, selectedHandIdx);
  }

  function movePiece(piece, steps, handIdx) {
    isMoving = true;
    dom.btnThrow.disabled = true;

    // 이 말과 같은 자리에 업혀있는 모든 아군 말을 한 묶음으로 취득
    const group = getPieceGroup(piece);

    // 경로 시뮬레이션 (리더 기준)
    const target = simulateMove(piece.pos, piece.route, steps);

    // 1보씩 걷는 애니메이션 경로 계산
    const animPath = [];
    if (steps === -1) {
      animPath.push(target.pos);
    } else {
      let tempPos = piece.pos;
      let tempRoute = piece.route;
      for (let s = 0; s < steps; s++) {
        const stepRes = getNextStep(tempPos, tempRoute);
        tempPos = stepRes.pos;
        tempRoute = stepRes.route;
        animPath.push(tempPos);
        if (stepRes.finished) break;
      }
    }

    let stepIdx = 0;
    function walkStep() {
      if (stepIdx < animPath.length) {
        const curPos = animPath[stepIdx];
        // 업힌 모든 말이 동시에 발을 맞춰 이동!
        group.forEach(gp => {
          gp.pos = curPos;
        });
        playSound('step');
        drawBoard();
        stepIdx++;
        setTimeout(walkStep, 130);
      } else {
        // 최종 착지 처리
        finishMove(group, target, handIdx);
      }
    }

    walkStep();
  }

  function finishMove(group, target, handIdx) {
    const leadPiece = group[0];
    const owner = leadPiece.owner;

    // 그룹 내 모든 말의 최종 상태 갱신
    group.forEach(gp => {
      gp.pos = target.pos;
      gp.route = target.route;
      gp.finished = target.finished;
    });

    // 패 소모
    handQueue.splice(handIdx, 1);
    selectedHandIdx = Math.max(0, Math.min(selectedHandIdx, handQueue.length - 1));

    let gotBonusThrow = false;

    if (target.finished) {
      playSound('goal');
      group.forEach(gp => {
        gp.pos = null;
        gp.stacked = [];
      });
      setBanner('골인!', `${owner === 0 ? '청팀' : '홍팀'} 말 ${group.length}개가 동시에 완주했습니다! 🏆`, '#16a34a');
    } else {
      // 1. 잡기 체크 (상대 말 확인)
      const enemy = players[1 - owner];
      const captured = enemy.pieces.filter(ep => !ep.finished && ep.pos === target.pos);

      if (captured.length > 0) {
        playSound('catch');
        const capturedCount = captured.length;
        captured.forEach(ep => {
          ep.pos = -1;
          ep.route = 'outer';
          ep.stacked = [];
        });
        gotBonusThrow = true;
        setBanner('잡았다!', `상대 말 ${capturedCount}개를 잡아 한 번 더 던집니다! 💥`, '#ea580c');
      } else {
        // 2. 업기 체크 & 상태 동기화
        const friendlyAtStation = players[owner].pieces.filter(fp => !fp.finished && fp.pos === target.pos);
        if (friendlyAtStation.length > 1) {
          playSound('carry');
          setBanner('업기 성공!', `말 ${friendlyAtStation.length}개가 합체되어 함께 달립니다! 🤝`, '#f59e0b');
        }
        friendlyAtStation.forEach(fp => {
          fp.stacked = friendlyAtStation.filter(other => other.id !== fp.id).map(other => other.id);
        });
      }
    }

    // 승리 조건 체크 (4말 모두 완주)
    const p1Done = players[0].pieces.filter(p => p.finished).length;
    const p2Done = players[1].pieces.filter(p => p.finished).length;

    dom.p1Goals.textContent = p1Done;
    dom.p2Goals.textContent = p2Done;

    if (p1Done >= 4 || p2Done >= 4) {
      gameOver = true;
      isMoving = false;
      const winner = p1Done >= 4 ? players[0] : players[1];
      setBanner('🎉 승리!', `${winner.name}이 4말을 모두 완주하여 승리했습니다!`, '#16a34a');
      updateUI();
      drawBoard();
      return;
    }

    isMoving = false;

    // 보너스 던지기 발생 시 phase를 throw로 유지
    if (gotBonusThrow) {
      phase = 'throw';
      updateUI();
      renderHandChips();
      drawBoard();
      if (vsAI && turn === 1) {
        setTimeout(aiTurn, 750);
      }
      return;
    }

    // 보유한 패가 남아있는지 확인
    if (handQueue.length > 0) {
      phase = 'move';
      updateUI();
      renderHandChips();
      drawBoard();
      if (vsAI && turn === 1) {
        setTimeout(aiMove, 650);
      }
    } else {
      // 턴 종료 -> 다음 플레이어
      turn = 1 - turn;
      phase = 'throw';
      setBanner(
        turn === 0 ? '청팀 차례' : `${vsAI ? '홍팀(AI)' : '홍팀'} 차례`,
        '윷을 던져주세요!',
        turn === 0 ? '#2563eb' : '#dc2626'
      );
      updateUI();
      renderHandChips();
      drawBoard();
      if (vsAI && turn === 1) {
        setTimeout(aiTurn, 750);
      }
    }
  }

  // -------------------------------------------------------------
  // 스마트 AI 엔진
  // -------------------------------------------------------------
  function aiTurn() {
    if (gameOver || turn !== 1 || phase !== 'throw') return;
    executeThrow();
  }

  function aiMove() {
    if (gameOver || turn !== 1 || phase !== 'move') return;
    if (handQueue.length === 0) return;

    const availableHands = handQueue.map((h, idx) => ({ ...h, idx }));
    const myPieces = players[1].pieces.filter(p => !p.finished);

    let bestChoice = null;
    let maxScore = -9999;

    availableHands.forEach(hand => {
      myPieces.forEach(piece => {
        const sim = simulateMove(piece.pos, piece.route, hand.steps);
        let score = 0;

        // 1. 완주 점수 (최우선)
        if (sim.finished) {
          score += 1000 + (piece.stacked ? piece.stacked.length * 500 : 0);
        } else {
          // 2. 상대 말 잡기 (엄청난 이득 + 한 번 더 던지기)
          const enemyOnLanding = players[0].pieces.filter(ep => !ep.finished && ep.pos === sim.pos);
          if (enemyOnLanding.length > 0) {
            score += 800 + enemyOnLanding.length * 300;
          }

          // 3. 지름길 진입 (우상귀 5, 좌상귀 10, 중앙 방 22)
          if (sim.pos === 22) score += 400;
          else if (sim.pos === 5 || sim.pos === 10) score += 300;

          // 4. 내 말 업기
          const friendsOnLanding = players[1].pieces.filter(fp => fp.id !== piece.id && !fp.finished && fp.pos === sim.pos);
          if (friendsOnLanding.length > 0) {
            score += 250;
          }

          // 5. 전진 진척도 점수
          score += (sim.pos >= 0 ? sim.pos : 0) * 5;

          // 6. 대기석에서 새 말 출전 권장
          if (piece.pos === -1 && hand.steps > 0) {
            score += 150;
          }
        }

        if (score > maxScore) {
          maxScore = score;
          bestChoice = { piece, handIdx: hand.idx, steps: hand.steps };
        }
      });
    });

    if (bestChoice) {
      selectedHandIdx = bestChoice.handIdx;
      movePiece(bestChoice.piece, bestChoice.steps, bestChoice.handIdx);
    } else {
      // 움직일 수 있는 말이 없을 때
      handQueue.length = 0;
      turn = 0;
      phase = 'throw';
      setBanner('청팀 차례', '윷을 던져주세요!', '#2563eb');
      updateUI();
      renderHandChips();
      drawBoard();
    }
  }

  // -------------------------------------------------------------
  // UI 갱신 및 렌더링
  // -------------------------------------------------------------
  function setBanner(title, sub, color) {
    dom.turnTitle.textContent = title;
    dom.turnSub.textContent = sub;
    if (color) dom.turnTitle.style.color = color;
  }

  function updateUI() {
    dom.p1Card.classList.toggle('active', turn === 0 && !gameOver);
    dom.p2Card.classList.toggle('active', turn === 1 && !gameOver);

    dom.btnThrow.disabled = gameOver || isThrowing || isMoving || phase !== 'throw' || (vsAI && turn === 1);

    renderHomeTrays();
  }

  function renderHandChips() {
    dom.handChips.innerHTML = '';
    if (handQueue.length === 0) {
      const empty = document.createElement('span');
      empty.className = 'empty-hand';
      empty.textContent = phase === 'throw' ? '윷을 던져주세요' : '패를 모두 사용했습니다';
      dom.handChips.appendChild(empty);
      return;
    }

    handQueue.forEach((item, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `yut-chip ${idx === selectedHandIdx ? 'active' : ''}`;
      chip.innerHTML = `<span>${item.name}</span><small>(${item.steps > 0 ? '+' + item.steps : item.steps})</small>`;
      chip.addEventListener('click', () => selectHandChip(idx));
      dom.handChips.appendChild(chip);
    });
  }

  function renderHomeTrays() {
    // 플레이어 1 대기석
    dom.p1HomeTray.innerHTML = '';
    players[0].pieces.forEach(p => {
      if (p.pos === -1 && !p.finished) {
        const el = document.createElement('div');
        el.className = `waiting-piece blue ${turn === 0 && phase === 'move' ? 'selectable' : ''}`;
        el.textContent = p.label;
        el.title = `청팀 ${p.label}번 말 (클릭하여 출전)`;
        el.addEventListener('click', () => selectPiece(p));
        dom.p1HomeTray.appendChild(el);
      }
    });

    // 플레이어 2 대기석
    dom.p2HomeTray.innerHTML = '';
    players[1].pieces.forEach(p => {
      if (p.pos === -1 && !p.finished) {
        const el = document.createElement('div');
        el.className = `waiting-piece red ${turn === 1 && !vsAI && phase === 'move' ? 'selectable' : ''}`;
        el.textContent = p.label;
        el.title = `홍팀 ${p.label}번 말`;
        if (!vsAI) el.addEventListener('click', () => selectPiece(p));
        dom.p2HomeTray.appendChild(el);
      }
    });
  }

  // -------------------------------------------------------------
  // 전통 말판 캔버스 드로잉
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 전통 말판 캔버스 드로잉 (고급 한옥 대청마루 원목 & 백옥 상감 기법)
  // -------------------------------------------------------------
  function drawBoard() {
    const dpr = updateCanvasResolution();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // 1. 고급 전통 느티나무 원목 바탕 (Zelkova Wood Texture)
    const woodGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
    woodGrad.addColorStop(0, '#fcf5e6');
    woodGrad.addColorStop(0.35, '#f4dfbe');
    woodGrad.addColorStop(0.7, '#e8caa0');
    woodGrad.addColorStop(1, '#d8b27f');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(8, 8, BOARD_SIZE - 16, BOARD_SIZE - 16, 22);
    ctx.fill();

    // 천연 나뭇결 곡선 (Organic Wood Grain Striations)
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 75, 25, 0.04)';
    for (let i = 0; i < 9; i++) {
      const yBase = 60 + i * 65;
      ctx.lineWidth = 3 + (i % 3) * 1.5;
      ctx.beginPath();
      ctx.moveTo(10, yBase);
      ctx.bezierCurveTo(
        BOARD_SIZE * 0.35, yBase - 25 + (i % 2) * 20,
        BOARD_SIZE * 0.65, yBase + 35 - (i % 3) * 15,
        BOARD_SIZE - 10, yBase + 10
      );
      ctx.stroke();
    }
    ctx.restore();

    // 2. 다크 월넛 외곽 몰딩 프레임 & 황금 상감선
    ctx.save();
    ctx.strokeStyle = '#48240a';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(15, 15, BOARD_SIZE - 30, BOARD_SIZE - 30, 18);
    ctx.stroke();

    ctx.strokeStyle = '#d4a34b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(24, 24, BOARD_SIZE - 48, BOARD_SIZE - 48, 14);
    ctx.stroke();
    ctx.restore();

    // 3. 4개 모서리 전통 놋쇠 장석 (Antique Brass Corner Brackets)
    drawCornerBrackets();

    // 4. 둘레길 & 대각선 (3중 상감 음각 홈 라인)
    drawBoardPaths();

    // 5. 29개 밭 (백옥 구슬 & 황동 림, 중앙 단청 루비 젬)
    drawBoardStations();

    // 6. 명칭 붓글씨 라벨 (출발, 앞모, 뒷모, 찌모, 방)
    drawStationLabels();

    // 7. 착수 가능한 목적지 하이라이트 (이동 단계 시)
    if (phase === 'move' && handQueue[selectedHandIdx] && (!vsAI || turn === 0)) {
      const curSteps = handQueue[selectedHandIdx].steps;
      players[turn].pieces.forEach(p => {
        if (!p.finished) {
          const sim = simulateMove(p.pos, p.route, curSteps);
          if (sim.pos !== null && NODES[sim.pos]) {
            drawHighlightNode(NODES[sim.pos]);
          }
        }
      });
    }

    // 8. 판 위에 놓인 말들 렌더링
    drawBoardPieces();
  }

  function drawCornerBrackets() {
    function drawBracket(cx, cy, rotAngle) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotAngle);
      
      // L자형 놋쇠 판
      ctx.fillStyle = '#b8862d';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(34, 0);
      ctx.lineTo(34, 10);
      ctx.lineTo(10, 10);
      ctx.lineTo(10, 34);
      ctx.lineTo(0, 34);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#6e470c';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      // 놋쇠 리벳 못 (3개)
      [[6, 6], [24, 5], [5, 24]].forEach(([rx, ry]) => {
        ctx.beginPath();
        ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fill();
        ctx.strokeStyle = '#5c3805';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      });

      ctx.restore();
    }

    drawBracket(25, 25, 0);
    drawBracket(BOARD_SIZE - 25, 25, Math.PI / 2);
    drawBracket(BOARD_SIZE - 25, BOARD_SIZE - 25, Math.PI);
    drawBracket(25, BOARD_SIZE - 25, -Math.PI / 2);
  }

  function drawBoardPaths() {
    // 1. 깊은 음각 홈 그림자
    ctx.strokeStyle = 'rgba(70, 35, 12, 0.45)';
    ctx.lineWidth = 5.5;
    ctx.strokeRect(PAD, PAD, SIDE, SIDE);
    ctx.beginPath();
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD + SIDE, PAD + SIDE);
    ctx.moveTo(PAD + SIDE, PAD); ctx.lineTo(PAD, PAD + SIDE);
    ctx.stroke();

    // 2. 상감 원목 채움선
    ctx.strokeStyle = '#8d5526';
    ctx.lineWidth = 3.2;
    ctx.strokeRect(PAD, PAD, SIDE, SIDE);
    ctx.beginPath();
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD + SIDE, PAD + SIDE);
    ctx.moveTo(PAD + SIDE, PAD); ctx.lineTo(PAD, PAD + SIDE);
    ctx.stroke();

    // 3. 미세 상감 하이라이트선
    ctx.strokeStyle = 'rgba(255, 245, 220, 0.55)';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(PAD, PAD, SIDE, SIDE);
    ctx.beginPath();
    ctx.moveTo(PAD, PAD); ctx.lineTo(PAD + SIDE, PAD + SIDE);
    ctx.moveTo(PAD + SIDE, PAD); ctx.lineTo(PAD, PAD + SIDE);
    ctx.stroke();
  }

  function drawBoardStations() {
    NODES.forEach(n => {
      const isBig = n.isCorner || n.isCenter;
      const isCenter = n.isCenter;

      if (isCenter) {
        // 중앙 '방' (Center Hub - 21px 3중 단청 링)
        const r = 21;
        // 황금빛 방사형 후광
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
        ctx.fill();

        // 놋쇠 외곽 림
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#b8862d';
        ctx.fill();
        ctx.strokeStyle = '#5a3407';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // 단청 루비 보석 젬 (Royal Dancheong Crimson)
        const gemGrad = ctx.createRadialGradient(n.x - 5, n.y - 6, 2, n.x, n.y, r * 0.75);
        gemGrad.addColorStop(0, '#fca5a5');
        gemGrad.addColorStop(0.45, '#dc2626');
        gemGrad.addColorStop(1, '#7f1d1d');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = gemGrad;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 중앙 백옥 심
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      } else if (isBig) {
        // 4대 거점 (참먹이 0, 앞모 5, 뒷모 10, 찌모 15 - 17px 황금 앰버 젬)
        const r = 17;
        // 그림자
        ctx.beginPath();
        ctx.arc(n.x + 1.5, n.y + 2.5, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 30, 10, 0.28)';
        ctx.fill();

        // 외곽 놋쇠 링
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#b3822a';
        ctx.fill();
        ctx.strokeStyle = '#633c09';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 황금 앰버 보석 젬
        const gemGrad = ctx.createRadialGradient(n.x - 4, n.y - 5, 1.5, n.x, n.y, r * 0.7);
        gemGrad.addColorStop(0, '#fef08a');
        gemGrad.addColorStop(0.5, '#d97706');
        gemGrad.addColorStop(1, '#78350f');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.68, 0, Math.PI * 2);
        ctx.fillStyle = gemGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // 일반 밭 24개 (13.5px 백옥 구슬)
        const r = 13.5;
        // 그림자
        ctx.beginPath();
        ctx.arc(n.x + 1.2, n.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(60, 30, 10, 0.22)';
        ctx.fill();

        // 놋쇠 테두리 링
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#9c6a32';
        ctx.fill();
        ctx.strokeStyle = '#58330d';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 백옥 구슬 (White Jade Pearl)
        const jadeGrad = ctx.createRadialGradient(n.x - 3.5, n.y - 4, 1.5, n.x, n.y, r * 0.75);
        jadeGrad.addColorStop(0, '#ffffff');
        jadeGrad.addColorStop(0.35, '#faf1e0');
        jadeGrad.addColorStop(0.8, '#ebd6b5');
        jadeGrad.addColorStop(1, '#caa77d');
        ctx.beginPath();
        ctx.arc(n.x, n.y, r * 0.74, 0, Math.PI * 2);
        ctx.fillStyle = jadeGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }

  function drawStationLabels() {
    ctx.save();
    ctx.font = '900 13px "Gowun Batang", "Batang", "Nanum Myeongjo", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 1;

    // 우하귀: 출발 · 완주
    const n0 = NODES[0];
    ctx.fillStyle = '#1e3a8a';
    ctx.fillText('출발 · 완주 (참먹이)', n0.x - 38, n0.y + 24);

    // 우상귀: 앞모 (안쪽으로 배치)
    const n5 = NODES[5];
    ctx.fillStyle = '#78350f';
    ctx.fillText('앞모', n5.x - 26, n5.y - 14);

    // 좌상귀: 뒷모 (안쪽으로 배치)
    const n10 = NODES[10];
    ctx.fillText('뒷모', n10.x + 26, n10.y - 14);

    // 좌하귀: 찌모 (안쪽으로 배치)
    const n15 = NODES[15];
    ctx.fillText('찌모', n15.x + 26, n15.y + 20);

    // 중앙: 방
    const n22 = NODES[22];
    ctx.fillStyle = '#991b1b';
    ctx.font = '900 14px "Gowun Batang", "Batang", serif';
    ctx.fillText('중앙 (방)', n22.x, n22.y - 28);

    ctx.restore();
  }

  function drawHighlightNode(node) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 158, 11, 0.24)';
    ctx.fill();
    ctx.restore();
  }

  function drawHighlightNode(node) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(node.x, node.y, 18, 0, Math.PI * 2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();

    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.fill();
    ctx.restore();
  }

  function drawBoardPieces() {
    // 밭별로 어떤 말들이 올라와 있는지 그룹화
    const stationGroups = {};

    players.forEach(pl => {
      pl.pieces.forEach(p => {
        if (!p.finished && p.pos >= 0 && p.pos <= 28) {
          stationGroups[p.pos] = stationGroups[p.pos] || [];
          stationGroups[p.pos].push(p);
        }
      });
    });

    Object.keys(stationGroups).forEach(stationId => {
      const list = stationGroups[stationId];
      const node = NODES[stationId];
      if (!node) return;
      drawPieceStack(node.x, node.y, list);
    });
  }

  function drawPieceStack(x, y, pieces) {
    if (!pieces || pieces.length === 0) return;
    const leadPiece = pieces[0];
    const isP1 = leadPiece.owner === 0;
    const isTurn = leadPiece.owner === turn;
    const isSelectable = phase === 'move' && isTurn && (!vsAI || turn === 0);
    const count = pieces.length;

    ctx.save();

    // 1. 다중 말인 경우 3D 겹침 칩 디스크 렌더링
    if (count > 1) {
      for (let layer = Math.min(count - 1, 3); layer >= 1; layer--) {
        const offY = layer * 3.5;
        const offX = layer * 1.5;

        ctx.beginPath();
        ctx.ellipse(x + offX, y + offY + 2, PIECE_RADIUS, PIECE_RADIUS * 0.85, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x + offX, y + offY, PIECE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isP1 ? '#1d4ed8' : '#b91c1c';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    // 2. 말 그림자
    ctx.beginPath();
    ctx.ellipse(x + 1.5, y + 3, PIECE_RADIUS, PIECE_RADIUS * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fill();

    // 3. 최상단 말 3D 구체 그라데이션
    const grad = ctx.createRadialGradient(
      x - PIECE_RADIUS * 0.35,
      y - PIECE_RADIUS * 0.4,
      PIECE_RADIUS * 0.15,
      x,
      y,
      PIECE_RADIUS
    );

    if (isP1) {
      grad.addColorStop(0, '#93c5fd');
      grad.addColorStop(0.55, '#2563eb');
      grad.addColorStop(1, '#1e40af');
    } else {
      grad.addColorStop(0, '#fca5a5');
      grad.addColorStop(0.55, '#dc2626');
      grad.addColorStop(1, '#991b1b');
    }

    ctx.beginPath();
    ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // 4. 선택 가능 시 황금 테두리 하이라이트
    ctx.lineWidth = isSelectable ? 3.5 : 1.8;
    ctx.strokeStyle = isSelectable ? '#f59e0b' : 'rgba(255, 255, 255, 0.75)';
    ctx.stroke();

    // 5. 말 번호 라벨 (1개면 '1', 2개면 '1·2', 3개면 '1·2·3')
    const labelStr = pieces.map(p => p.label).join('·');
    let fontSize = 13.5;
    if (count === 2) fontSize = 11;
    else if (count >= 3) fontSize = 9;

    ctx.font = `900 ${fontSize}px "Pretendard", "Malgun Gothic", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelStr, x, y);

    // 6. 업기 배지 (×2, ×3, ×4)
    if (count > 1) {
      ctx.beginPath();
      ctx.arc(x + 12, y - 12, 9.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.font = '900 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`×${count}`, x + 12, y - 12);
    }

    ctx.restore();
  }

  // -------------------------------------------------------------
  // 캔버스 클릭 이벤트 핸들러
  // -------------------------------------------------------------
  canvas.addEventListener('click', e => {
    if (gameOver || isMoving || phase !== 'move') return;
    if (vsAI && turn === 1) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (BOARD_SIZE / rect.width);
    const clickY = (e.clientY - rect.top) * (BOARD_SIZE / rect.height);

    // 내 말 중에서 클릭된 말 찾기
    let clickedPiece = null;
    let minDistance = 9999;

    players[turn].pieces.forEach(p => {
      if (!p.finished && p.pos >= 0 && p.pos <= 28) {
        const node = NODES[p.pos];
        if (node) {
          const dist = Math.hypot(clickX - node.x, clickY - node.y);
          if (dist < minDistance && dist <= PIECE_RADIUS * 2) {
            minDistance = dist;
            clickedPiece = p;
          }
        }
      }
    });

    if (clickedPiece) {
      selectPiece(clickedPiece);
    }
  });

  // -------------------------------------------------------------
  // 게임 초기화 (새 게임)
  // -------------------------------------------------------------
  function startNewGame() {
    turn = 0;
    phase = 'throw';
    isThrowing = false;
    isMoving = false;
    gameOver = false;
    handQueue = [];
    selectedHandIdx = 0;
    selectedPieceId = null;

    players.forEach(pl => {
      pl.pieces.forEach(p => {
        p.pos = -1;
        p.route = 'outer';
        p.stacked = [];
        p.finished = false;
      });
    });

    dom.p1Goals.textContent = '0';
    dom.p2Goals.textContent = '0';

    // 윷가락 초기화 (배가 보이게)
    dom.stickElements.forEach(el => el.classList.remove('flipped'));

    setBanner('청팀 차례', '윷을 던져주세요! 🎲', '#2563eb');
    updateUI();
    renderHandChips();
    drawBoard();
  }

  // -------------------------------------------------------------
  // 이벤트 리스너 바인딩
  // -------------------------------------------------------------
  dom.btnThrow.addEventListener('click', throwYutAction);
  dom.btnNewGame.addEventListener('click', startNewGame);

  dom.btnToggleMode.addEventListener('click', () => {
    vsAI = !vsAI;
    dom.btnToggleMode.textContent = vsAI ? '🤖 대전 모드: AI 대전' : '👥 대전 모드: 2인 대전';
    dom.p2BadgeTitle.textContent = vsAI ? '홍팀 (AI)' : '홍팀 (2P)';
    startNewGame();
  });

  dom.btnToggleSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    dom.btnToggleSound.textContent = soundEnabled ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
  });

  // 테스트/디버그 인터페이스 노출
  window.__yut = {
    players,
    getHandQueue: () => handQueue,
    setHandQueue: q => { handQueue.length = 0; q.forEach(item => handQueue.push(item)); },
    movePiece,
    drawBoard,
    selectPiece,
    startNewGame
  };

  // 초기 실행
  startNewGame();
})();
