/**
 * Korean Traditional Janggi Controller & Visual Renderer
 * - High-DPI Canvas Rendering of 9x10 Wooden Board & Octagonal Wooden Pieces
 * - Move Guide Option (ON / OFF) as requested by user
 * - Sangcharim Modal, AI integration, Player Arena, and Web Audio
 */
(function() {
  'use strict';

  const { CHO, HAN, PIECES, FORMATIONS, JanggiBoard } = window.JanggiRules;
  const { JanggiAI } = window.JanggiAI;
  const JanggiAudio = window.JanggiAudio;

  // Game state
  let board = null;
  let audio = new JanggiAudio();
  let ai = new JanggiAI('medium');

  let mode = 'ai'; // 'ai' | 'pvp'
  let playerSide = CHO; // Human plays CHO in AI mode
  let aiSide = HAN;
  let aiDifficulty = 'medium'; // 'easy' | 'medium' | 'hard'

  let choFormation = 'SMMS'; // Default 귀마 (상마마상)
  let hanFormation = 'SMMS';

  // Option requested by user: 이동 길잡이 (착수 경로 가이드) ON/OFF
  let showGuide = true;
  try {
    const savedGuide = localStorage.getItem('bks_janggi_guide');
    if (savedGuide !== null) showGuide = (savedGuide === 'true');
  } catch (e) {}

  let selectedPos = null; // [x, y]
  let legalMovesForSelected = []; // [[tx, ty], ...]
  let lastMove = null; // { from: [fx, fy], to: [tx, ty] }
  let isAiThinking = false;
  let gameOver = false;

  // DOM Elements
  let canvas, ctx;
  let turnBanner, turnTitle, turnSub;
  let btnGuideToggle, btnPass, btnUndo, btnNewGame, btnToggleMode, btnToggleSound, btnDifficulty;
  let p1ScoreEl, p2ScoreEl, p1TrayEl, p2TrayEl;
  let setupModal, gameOverModal;

  // Layout parameters for canvas
  let boardWidth = 680;
  let boardHeight = 760;
  let marginX = 48;
  let marginY = 48;
  let cellW = (boardWidth - 2 * marginX) / 8;
  let cellH = (boardHeight - 2 * marginY) / 9;

  function init() {
    canvas = document.getElementById('janggiBoard');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    // Turn banner
    turnBanner = document.getElementById('turnBanner');
    turnTitle = document.getElementById('turnTitle');
    turnSub = document.getElementById('turnSub');

    // Controls
    btnGuideToggle = document.getElementById('btnGuideToggle');
    btnPass = document.getElementById('btnPass');
    btnUndo = document.getElementById('btnUndo');
    btnNewGame = document.getElementById('btnNewGame');
    btnToggleMode = document.getElementById('btnToggleMode');
    btnToggleSound = document.getElementById('btnToggleSound');
    btnDifficulty = document.getElementById('btnDifficulty');

    // Player arena stats
    p1ScoreEl = document.getElementById('p1Score');
    p2ScoreEl = document.getElementById('p2Score');
    p1TrayEl = document.getElementById('p1CapturedTray');
    p2TrayEl = document.getElementById('p2CapturedTray');

    // Modals
    setupModal = document.getElementById('setupModal');
    gameOverModal = document.getElementById('gameOverModal');

    // Bind event listeners
    bindEvents();

    // 바로 대국 화면을 보여주고, 대전 설정은 '새 대국' 버튼에서 연다
    startNewGame();
  }

  function updatePlayerCards() {
    const p1Card = document.getElementById('p1Card');
    const p2Card = document.getElementById('p2Card');
    const p1Badge = p1Card?.querySelector('.player-badge');
    const p2Badge = p2Card?.querySelector('.player-badge');
    const p1Name = p1Card?.querySelector('.player-name');
    const p2Name = document.getElementById('p2Name');
    const p1Img = p1Card?.querySelector('.avatar-wrapper img');
    const p2Img = p2Card?.querySelector('.avatar-wrapper img');

    if (mode === 'ai') {
      if (playerSide === CHO) {
        if (p1Badge) { p1Badge.className = 'player-badge blue'; p1Badge.textContent = '초(楚) · 청팀'; }
        if (p1Name) p1Name.textContent = '나 (카피바라)';
        if (p1Img) p1Img.src = '/games/omok/capybara-go/01-meditation.png';

        if (p2Badge) { p2Badge.className = 'player-badge red'; p2Badge.textContent = '한(漢) · 홍팀'; }
        if (p2Name) p2Name.textContent = '상대 (AI 로봇)';
        if (p2Img) p2Img.src = '/games/alkkagi/robot/01-idle.png';
      } else {
        if (p1Badge) { p1Badge.className = 'player-badge blue'; p1Badge.textContent = '초(楚) · AI 로봇'; }
        if (p1Name) p1Name.textContent = '상대 (AI 로봇)';
        if (p1Img) p1Img.src = '/games/alkkagi/robot/01-idle.png';

        if (p2Badge) { p2Badge.className = 'player-badge red'; p2Badge.textContent = '한(漢) · 나'; }
        if (p2Name) p2Name.textContent = '나 (카피바라)';
        if (p2Img) p2Img.src = '/games/omok/capybara-go/01-meditation.png';
      }
    } else {
      // 2-player mode
      if (p1Badge) { p1Badge.className = 'player-badge blue'; p1Badge.textContent = '초(楚) · 선공'; }
      if (p1Name) p1Name.textContent = '플레이어 1';
      if (p1Img) p1Img.src = '/games/omok/capybara-go/01-meditation.png';

      if (p2Badge) { p2Badge.className = 'player-badge red'; p2Badge.textContent = '한(漢) · 후공'; }
      if (p2Name) p2Name.textContent = '플레이어 2';
      if (p2Img) p2Img.src = '/games/omok/capybara-go/05-think-1.png';
    }

    if (btnToggleMode) {
      btnToggleMode.textContent = mode === 'ai' ? '🤖 모드: AI 대전' : '👥 모드: 2인 대전';
    }
    if (btnDifficulty) {
      btnDifficulty.style.display = mode === 'ai' ? 'inline-flex' : 'none';
      const names = { easy: '초급 (쉬움)', medium: '중급 (보통)', hard: '고급 (정밀)' };
      btnDifficulty.textContent = '🎯 난이도: ' + (names[aiDifficulty] || '중급 (보통)');
    }
  }

  function startNewGame() {
    board = new JanggiBoard(choFormation, hanFormation);
    selectedPos = null;
    legalMovesForSelected = [];
    lastMove = null;
    isAiThinking = false;
    gameOver = false;

    updatePlayerCards();
    updateUI();
    render();

    // If AI plays CHO, trigger AI opening move
    if (mode === 'ai' && playerSide === HAN) {
      checkPostMove();
    }
  }

  function bindEvents() {
    // Canvas click & touch
    canvas.addEventListener('click', onCanvasClick);

    // Guide Toggle (User's requested option!)
    if (btnGuideToggle) {
      btnGuideToggle.addEventListener('click', () => {
        showGuide = !showGuide;
        try {
          localStorage.setItem('bks_janggi_guide', String(showGuide));
        } catch (e) {}
        updateGuideButton();
        render();
      });
      updateGuideButton();
    }

    // Pass turn (한수 쉼)
    if (btnPass) {
      btnPass.addEventListener('click', () => {
        if (gameOver || isAiThinking) return;
        if (mode === 'ai' && board.turn !== playerSide) return;

        if (board.isInCheck(board.turn)) {
          alert('장군(체크) 상태에서는 한수 쉼을 할 수 없습니다!');
          return;
        }

        if (confirm('이번 차례를 한수 쉼(패스)하시겠습니까?')) {
          board.pass();
          audio.playPass();
          selectedPos = null;
          legalMovesForSelected = [];
          updateUI();
          render();
          checkPostMove();
        }
      });
    }

    // Undo (무르기)
    if (btnUndo) {
      btnUndo.addEventListener('click', () => {
        if (gameOver || isAiThinking) return;
        if (!board.history.length) return;

        // In AI mode, undo 2 moves (AI + User); in PvP undo 1 move
        const undoCount = (mode === 'ai' && board.history.length >= 2) ? 2 : 1;
        for (let i = 0; i < undoCount; i++) {
          board.history.pop();
        }

        // Replay history from fresh board
        const replayed = new JanggiBoard(choFormation, hanFormation);
        for (const h of board.history) {
          if (h.pass) {
            replayed.pass();
          } else {
            replayed.move(h.from[0], h.from[1], h.to[0], h.to[1]);
          }
        }
        board = replayed;
        selectedPos = null;
        legalMovesForSelected = [];
        lastMove = board.history.length ? board.history[board.history.length - 1] : null;

        updateUI();
        render();
      });
    }

    // New Game button -> opens setup modal
    if (btnNewGame) {
      btnNewGame.addEventListener('click', openSetupModal);
    }

    // 설정 모달 닫기 (X 버튼 / 닫기 버튼 / 바깥 클릭 / ESC)
    function closeSetupModal() {
      if (setupModal) setupModal.hidden = true;
    }
    ['btnCloseSetup', 'btnCancelSetup'].forEach(function (id) {
      const b = document.getElementById(id);
      if (b) b.addEventListener('click', closeSetupModal);
    });
    if (setupModal) {
      setupModal.addEventListener('click', function (e) {
        if (e.target === setupModal) closeSetupModal();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !setupModal.hidden) closeSetupModal();
      });
    }

    // Mode toggle
    if (btnToggleMode) {
      btnToggleMode.addEventListener('click', () => {
        mode = mode === 'ai' ? 'pvp' : 'ai';
        btnToggleMode.textContent = mode === 'ai' ? '🤖 모드: AI 대전' : '👥 모드: 2인 대전';
        if (btnDifficulty) btnDifficulty.style.display = mode === 'ai' ? 'inline-flex' : 'none';
        updateUI();
      });
    }

    // AI Difficulty toggle
    if (btnDifficulty) {
      btnDifficulty.addEventListener('click', () => {
        const levels = ['easy', 'medium', 'hard'];
        const names = { easy: '초급 (쉬움)', medium: '중급 (보통)', hard: '고급 (정밀)' };
        const nextIdx = (levels.indexOf(aiDifficulty) + 1) % levels.length;
        aiDifficulty = levels[nextIdx];
        ai.setLevel(aiDifficulty);
        btnDifficulty.textContent = `🎯 난이도: ${names[aiDifficulty]}`;
      });
    }

    // Sound toggle
    if (btnToggleSound) {
      btnToggleSound.addEventListener('click', () => {
        const active = audio.toggleSound();
        btnToggleSound.textContent = active ? '🔊 소리 켜짐' : '🔇 소리 꺼짐';
      });
    }

    // Window resize
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
  }

  function updateGuideButton() {
    if (!btnGuideToggle) return;
    if (showGuide) {
      btnGuideToggle.className = 'side-btn primary active';
      btnGuideToggle.innerHTML = '💡 이동 길잡이: <b>켜짐</b>';
      btnGuideToggle.title = '이동 가능한 위치가 보드에 표시됩니다 (클릭하여 끄기)';
    } else {
      btnGuideToggle.className = 'side-btn';
      btnGuideToggle.innerHTML = '💡 이동 길잡이: <b>꺼짐</b>';
      btnGuideToggle.title = '정통 모드: 힌트 없이 플레이합니다 (클릭하여 켜기)';
    }
  }

  function resizeCanvas() {
    const wrapper = document.querySelector('.board-wrapper');
    if (!wrapper || !canvas) return;

    const rect = wrapper.getBoundingClientRect();
    const maxW = Math.min(rect.width, 980);
    const maxH = Math.max(420, Math.min(window.innerHeight - rect.top - 28, 1020));
    const scale = Math.min(maxW / 680, maxH / 760);

    const displayW = Math.max(340, Math.floor(680 * scale));
    const displayH = Math.max(380, Math.floor(760 * scale));

    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';

    // Internal resolution (Retina crisp 2x)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 680 * dpr;
    canvas.height = 760 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    render();
  }

  function toScreenX(x) {
    return marginX + x * cellW;
  }

  function toScreenY(y) {
    return marginY + y * cellH;
  }

  function toGrid(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const sx = (clientX - rect.left) / (rect.width / 680);
    const sy = (clientY - rect.top) / (rect.height / 760);

    let bestX = -1, bestY = -1;
    let minDist = 36; // Click radius tolerance

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const px = toScreenX(x);
        const py = toScreenY(y);
        const d = Math.hypot(sx - px, sy - py);
        if (d < minDist) {
          minDist = d;
          bestX = x;
          bestY = y;
        }
      }
    }

    if (bestX !== -1) return [bestX, bestY];
    return null;
  }

  function onCanvasClick(e) {
    if (gameOver || isAiThinking) return;
    if (mode === 'ai' && board.turn !== playerSide) return;

    const clicked = toGrid(e.clientX, e.clientY);
    if (!clicked) return;

    const [cx, cy] = clicked;
    const clickedPiece = board.get(cx, cy);

    // If already selected a piece, check if clicked on legal destination
    if (selectedPos) {
      const isLegal = legalMovesForSelected.some(([lx, ly]) => lx === cx && ly === cy);
      if (isLegal) {
        // Execute move
        const [fx, fy] = selectedPos;
        const targetPiece = board.get(cx, cy);
        const success = board.move(fx, fy, cx, cy);

        if (success) {
          if (targetPiece) audio.playCapture();
          else audio.playMove();

          lastMove = { from: [fx, fy], to: [cx, cy] };
          selectedPos = null;
          legalMovesForSelected = [];
          updateUI();
          render();
          checkPostMove();
          return;
        }
      }
    }

    // Select piece if it belongs to current player
    if (clickedPiece && clickedPiece.side === board.turn) {
      if (selectedPos && selectedPos[0] === cx && selectedPos[1] === cy) {
        // Deselect
        selectedPos = null;
        legalMovesForSelected = [];
      } else {
        selectedPos = [cx, cy];
        legalMovesForSelected = board.getLegalMoves(cx, cy);
      }
      render();
    } else {
      selectedPos = null;
      legalMovesForSelected = [];
      render();
    }
  }

  async function checkPostMove() {
    const status = board.getStatus();

    if (status.status === 'check') {
      audio.playCheck();
      setTurnSub('⚡ <b>장군!</b> 멍군을 두어야 합니다.');
    }

    if (status.status === 'checkmate' || status.status === 'draw_pass' || status.status === 'bikjang') {
      gameOver = true;
      audio.playWin();
      openGameOverModal(status);
      updateUI();
      return;
    }

    // If AI's turn
    if (mode === 'ai' && board.turn === aiSide && !gameOver) {
      isAiThinking = true;
      updateUI();

      const aiMove = await ai.getBestMove(board, aiSide);
      isAiThinking = false;

      if (!aiMove) {
        // No moves for AI -> check status
        const postStatus = board.getStatus();
        gameOver = true;
        openGameOverModal(postStatus);
        updateUI();
        render();
        return;
      }

      const target = board.get(aiMove.to[0], aiMove.to[1]);
      board.move(aiMove.from[0], aiMove.from[1], aiMove.to[0], aiMove.to[1]);

      if (target) audio.playCapture();
      else audio.playMove();

      lastMove = { from: aiMove.from, to: aiMove.to };
      selectedPos = null;
      legalMovesForSelected = [];

      updateUI();
      render();

      const postAIStatus = board.getStatus();
      if (postAIStatus.status === 'check') {
        audio.playCheck();
        setTurnSub('⚡ <b>장군!</b> 상대가 장군을 쳤습니다!');
      } else if (postAIStatus.status === 'checkmate' || postAIStatus.status === 'draw_pass' || postAIStatus.status === 'bikjang') {
        gameOver = true;
        audio.playWin();
        openGameOverModal(postAIStatus);
      }
    }
  }

  function setTurnSub(html) {
    if (turnSub) turnSub.innerHTML = html;
  }

  function updateUI() {
    if (!board) return;

    // Scores
    const scores = board.getScores();
    if (p1ScoreEl) p1ScoreEl.textContent = scores.cho + '점';
    if (p2ScoreEl) p2ScoreEl.textContent = scores.han + '점 (덤 1.5점 포함)';

    // Active player card
    const p1Card = document.getElementById('p1Card');
    const p2Card = document.getElementById('p2Card');
    if (p1Card) p1Card.classList.toggle('active', board.turn === CHO);
    if (p2Card) p2Card.classList.toggle('active', board.turn === HAN);

    // Turn banner
    const isCho = board.turn === CHO;
    if (turnTitle) {
      if (isAiThinking) {
        turnTitle.textContent = '🤖 AI 장고 중...';
      } else {
        turnTitle.textContent = isCho ? '초(楚) 차례 — 청팀' : '한(漢) 차례 — 홍팀';
      }
    }

    if (turnBanner) {
      turnBanner.className = 'turn-center-banner ' + (isCho ? 'cho' : 'han');
    }

    // Update captured piece trays
    renderCapturedTray(p1TrayEl, board.captured[CHO]);
    renderCapturedTray(p2TrayEl, board.captured[HAN]);
  }

  function renderCapturedTray(tray, list) {
    if (!tray) return;
    tray.innerHTML = '';
    if (!list || !list.length) {
      tray.innerHTML = '<span class="empty-tray">잡은 기물 없음</span>';
      return;
    }

    // Sort by piece value descending
    const sorted = list.slice().sort((a, b) => (PIECES[b.type]?.score || 0) - (PIECES[a.type]?.score || 0));
    for (const p of sorted) {
      const chip = document.createElement('span');
      chip.className = 'captured-chip ' + (p.side === CHO ? 'cho' : 'han');
      chip.textContent = p.side === CHO ? PIECES[p.type].charCho : PIECES[p.type].charHan;
      chip.title = `${p.side === CHO ? '초' : '한'} ${p.type === 'P' ? (p.side === CHO ? '졸' : '병') : PIECES[p.type].name} (${PIECES[p.type].score}점)`;
      tray.appendChild(chip);
    }
  }

  // Canvas Drawing
  function render() {
    if (!ctx || !board) return;

    ctx.clearRect(0, 0, 680, 760);

    // 1. Draw Wooden Board Base & Grain
    drawBoardBase();

    // 2. Draw Grid Lines & Palaces
    drawGridLines();

    // 3. Draw Last Move Highlight
    drawLastMoveHighlight();

    // 4. Draw Selected Piece Glow
    drawSelectedHalo();

    // 5. Draw Pieces
    drawPieces();

    // 6. Draw Move Guide (Option: only if showGuide is true!)
    if (showGuide && selectedPos) {
      drawMoveGuides();
    }
  }

  function drawBoardBase() {
    // Rich natural wood grain gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 680, 760);
    bgGrad.addColorStop(0, '#f2d59f');
    bgGrad.addColorStop(0.5, '#eecb8e');
    bgGrad.addColorStop(1, '#e3be7a');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 680, 760);

    // Subtle wood grain lines
    ctx.strokeStyle = 'rgba(180, 130, 60, 0.12)';
    ctx.lineWidth = 1.2;
    for (let y = 10; y < 750; y += 14) {
      ctx.beginPath();
      ctx.moveTo(10, y);
      ctx.bezierCurveTo(220, y + (y % 5 - 2), 460, y - (y % 4 - 1), 670, y);
      ctx.stroke();
    }

    // Outer board border
    ctx.strokeStyle = '#6d4519';
    ctx.lineWidth = 4;
    ctx.strokeRect(marginX - 16, marginY - 16, 8 * cellW + 32, 9 * cellH + 32);

    ctx.strokeStyle = '#8d5e28';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(marginX - 20, marginY - 20, 8 * cellW + 40, 9 * cellH + 40);
  }

  function drawGridLines() {
    ctx.strokeStyle = '#4e3315';
    ctx.lineWidth = 2;

    // Horizontal lines (10 rows, y: 0..9)
    for (let y = 0; y < 10; y++) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(0), toScreenY(y));
      ctx.lineTo(toScreenX(8), toScreenY(y));
      ctx.stroke();
    }

    // Vertical lines (9 cols, x: 0..8) - in Korean Janggi, lines run straight through!
    for (let x = 0; x < 9; x++) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), toScreenY(0));
      ctx.lineTo(toScreenX(x), toScreenY(9));
      ctx.stroke();
    }

    // Palaces (궁성) diagonal X lines
    // Han Palace (top: x 3..5, y 0..2)
    ctx.beginPath();
    ctx.moveTo(toScreenX(3), toScreenY(0));
    ctx.lineTo(toScreenX(5), toScreenY(2));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toScreenX(5), toScreenY(0));
    ctx.lineTo(toScreenX(3), toScreenY(2));
    ctx.stroke();

    // Cho Palace (bottom: x 3..5, y 7..9)
    ctx.beginPath();
    ctx.moveTo(toScreenX(3), toScreenY(7));
    ctx.lineTo(toScreenX(5), toScreenY(9));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toScreenX(5), toScreenY(7));
    ctx.lineTo(toScreenX(3), toScreenY(9));
    ctx.stroke();
  }

  function drawLastMoveHighlight() {
    if (!lastMove || !lastMove.from || !lastMove.to) return;

    ctx.fillStyle = 'rgba(255, 215, 0, 0.28)';
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;

    for (const pos of [lastMove.from, lastMove.to]) {
      const px = toScreenX(pos[0]);
      const py = toScreenY(pos[1]);
      ctx.beginPath();
      ctx.arc(px, py, cellW * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function drawSelectedHalo() {
    if (!selectedPos) return;
    const px = toScreenX(selectedPos[0]);
    const py = toScreenY(selectedPos[1]);

    ctx.save();
    ctx.shadowColor = '#00e676';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#00c853';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(px, py, cellW * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw octagonal wooden pieces (팔각 목재 기물)
  function drawPieces() {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = board.get(x, y);
        if (!p) continue;

        const px = toScreenX(x);
        const py = toScreenY(y);

        // Size radius based on piece rank
        let radius = cellW * 0.40;
        if (p.type === 'K') radius = cellW * 0.46; // King is largest
        else if (p.type === 'R' || p.type === 'C' || p.type === 'H' || p.type === 'E') radius = cellW * 0.42;
        else radius = cellW * 0.38; // Guard and Pawn

        drawOctagonPiece(px, py, radius, p);
      }
    }
  }

  function drawOctagonPiece(cx, cy, r, piece) {
    const isCho = piece.side === CHO;

    ctx.save();

    // Piece drop shadow
    ctx.shadowColor = 'rgba(40, 20, 5, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // Outer octagonal wood bevel
    drawRegularPolygon(ctx, cx, cy, r, 8);
    const gradOuter = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    gradOuter.addColorStop(0, '#f9ecd4');
    gradOuter.addColorStop(0.5, '#e4cd9b');
    gradOuter.addColorStop(1, '#bfa068');
    ctx.fillStyle = gradOuter;
    ctx.fill();

    // Reset shadow for inner bevel
    ctx.shadowColor = 'transparent';

    // Octagon border line
    ctx.strokeStyle = '#7c5825';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner relief octagon
    const innerR = r * 0.88;
    drawRegularPolygon(ctx, cx, cy, innerR, 8);
    const gradInner = ctx.createLinearGradient(cx - innerR, cy - innerR, cx + innerR, cy + innerR);
    gradInner.addColorStop(0, '#fef9ee');
    gradInner.addColorStop(0.5, '#edd9b2');
    gradInner.addColorStop(1, '#d5ba84');
    ctx.fillStyle = gradInner;
    ctx.fill();
    ctx.strokeStyle = 'rgba(124, 88, 37, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Text Hanja (Chinese character)
    const char = isCho ? PIECES[piece.type].charCho : PIECES[piece.type].charHan;
    const textColor = isCho ? '#0d531a' : '#9c0006';

    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(r * 1.05)}px "Batang", "Gungsuh", "Malgun Gothic", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(char, cx, cy - 2);

    // Mini friendly Korean name for kids (한글 병기)
    const subName = piece.type === 'P' ? (isCho ? '졸' : '병') : PIECES[piece.type].name;
    ctx.fillStyle = isCho ? '#2e7d32' : '#c62828';
    ctx.font = `bold ${Math.max(9, Math.round(r * 0.32))}px "Malgun Gothic", sans-serif`;
    ctx.fillText(subName, cx, cy + r * 0.52);

    ctx.restore();
  }

  function drawRegularPolygon(ctx, x, y, radius, sides) {
    ctx.beginPath();
    const angleStep = (Math.PI * 2) / sides;
    const startAngle = Math.PI / sides; // Flat top/bottom
    for (let i = 0; i < sides; i++) {
      const a = startAngle + i * angleStep;
      const px = x + radius * Math.cos(a);
      const py = y + radius * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // Option: Draw Move Guides (착수 경로 가이드)
  function drawMoveGuides() {
    for (const [tx, ty] of legalMovesForSelected) {
      const px = toScreenX(tx);
      const py = toScreenY(ty);
      const targetPiece = board.get(tx, ty);

      ctx.save();
      if (targetPiece) {
        // Capture indicator: pulsing red ring around target enemy piece
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(px, py, cellW * 0.44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 23, 68, 0.22)';
        ctx.fill();
      } else {
        // Move to empty spot: soft glowing green dot
        ctx.fillStyle = '#00c853';
        ctx.shadowColor = '#00e676';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Modals
  function openSetupModal() {
    if (!setupModal) return;
    setupModal.hidden = false;

    // Sync match mode
    const modeRadios = document.querySelectorAll('input[name="matchMode"]');
    modeRadios.forEach(r => r.checked = (r.value === mode));

    const aiOptions = document.getElementById('aiOptionsGroup');
    const updateAiOptionsVisibility = () => {
      const currentMode = document.querySelector('input[name="matchMode"]:checked')?.value || 'ai';
      if (aiOptions) aiOptions.style.display = (currentMode === 'ai') ? 'block' : 'none';
    };
    modeRadios.forEach(r => r.onchange = updateAiOptionsVisibility);
    updateAiOptionsVisibility();

    // Sync player color & difficulty
    const colorRadios = document.querySelectorAll('input[name="playerColor"]');
    colorRadios.forEach(r => r.checked = (+r.value === playerSide));

    const diffRadios = document.querySelectorAll('input[name="modalDifficulty"]');
    diffRadios.forEach(r => r.checked = (r.value === aiDifficulty));

    // Sync formations
    const choRadios = document.querySelectorAll('input[name="choFormation"]');
    choRadios.forEach(r => r.checked = (r.value === choFormation));

    const hanRadios = document.querySelectorAll('input[name="hanFormation"]');
    hanRadios.forEach(r => r.checked = (r.value === hanFormation));

    const btnStart = document.getElementById('btnStartMatch');
    if (btnStart) {
      btnStart.onclick = () => {
        mode = document.querySelector('input[name="matchMode"]:checked')?.value || 'ai';
        if (mode === 'ai') {
          playerSide = parseInt(document.querySelector('input[name="playerColor"]:checked')?.value || '1', 10);
          aiSide = (playerSide === CHO) ? HAN : CHO;
          aiDifficulty = document.querySelector('input[name="modalDifficulty"]:checked')?.value || 'medium';
          ai.setLevel(aiDifficulty);
        }
        choFormation = document.querySelector('input[name="choFormation"]:checked')?.value || 'SMMS';
        hanFormation = document.querySelector('input[name="hanFormation"]:checked')?.value || 'SMMS';

        setupModal.hidden = true;
        startNewGame();
      };
    }
  }

  function openGameOverModal(status) {
    if (!gameOverModal) return;
    gameOverModal.hidden = false;

    const titleEl = document.getElementById('gameOverTitle');
    const descEl = document.getElementById('gameOverDesc');
    const scoreEl = document.getElementById('gameOverScore');

    if (status.status === 'checkmate') {
      const winnerName = status.winner === CHO ? '청팀 초(楚)' : '홍팀 한(漢)';
      if (titleEl) titleEl.textContent = `🎉 ${winnerName} 외통 승리!`;
      if (descEl) descEl.textContent = status.reason;
    } else if (status.status === 'draw_pass') {
      if (titleEl) titleEl.textContent = '🤝 계가 판정 종료';
      if (descEl) descEl.textContent = status.reason;
    } else if (status.status === 'bikjang') {
      if (titleEl) titleEl.textContent = '🤝 빅장 무승부';
      if (descEl) descEl.textContent = '두 궁이 마주보아 비겼습니다.';
    }

    const sc = board.getScores();
    if (scoreEl) {
      scoreEl.textContent = `최종 점수: 초 ${sc.cho}점 vs 한 ${sc.han}점 (덤 1.5점 포함)`;
    }

    const btnAgain = document.getElementById('btnPlayAgain');
    if (btnAgain) {
      btnAgain.onclick = () => {
        gameOverModal.hidden = true;
        openSetupModal();
      };
    }
  }

  // Bootstrap when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
