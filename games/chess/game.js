/**
 * JH 바둑스쿨 EduFun - 정통 체스 (Chess) Controller
 * Interactive UI, Canvas Rendering & Multi-Level AI Integration
 */
(function(window, document) {
  'use strict';

  var engine = new window.ChessEngine();
  var audio = window.ChessAudio;

  // DOM Elements
  var canvas = document.getElementById('chessBoard');
  var ctx = canvas.getContext('2d');
  var boardWrapper = document.getElementById('boardWrapper');

  var p1Card = document.getElementById('p1Card');
  var p2Card = document.getElementById('p2Card');
  var p1Name = document.getElementById('p1Name');
  var p2Name = document.getElementById('p2Name');
  var p1Status = document.getElementById('p1Status');
  var p2Status = document.getElementById('p2Status');
  var p1Score = document.getElementById('p1Score');
  var p2Score = document.getElementById('p2Score');
  var p1Captured = document.getElementById('p1Captured');
  var p2Captured = document.getElementById('p2Captured');
  var p1Diff = document.getElementById('p1Diff');
  var p2Diff = document.getElementById('p2Diff');

  var turnBanner = document.getElementById('turnBanner');
  var turnBadgeIcon = document.getElementById('turnBadgeIcon');
  var turnTitle = document.getElementById('turnTitle');
  var turnSub = document.getElementById('turnSub');
  var checkAlarmBadge = document.getElementById('checkAlarmBadge');

  var evalBarWhite = document.getElementById('evalBarWhite');
  var evalText = document.getElementById('evalText');

  var btnNew = document.getElementById('btnNew');
  var btnMode = document.getElementById('btnMode');
  var btnGuide = document.getElementById('btnGuide');
  var btnUndo = document.getElementById('btnUndo');
  var btnHint = document.getElementById('btnHint');
  var btnFlip = document.getElementById('btnFlip');

  var selLevel = document.getElementById('selLevel');
  var selSide = document.getElementById('selSide');
  var selSkin = document.getElementById('selSkin');
  var selSound = document.getElementById('selSound');

  var promoModal = document.getElementById('promoModal');
  var gameOverModal = document.getElementById('gameOverModal');
  var goIcon = document.getElementById('goIcon');
  var goTitle = document.getElementById('goTitle');
  var goSub = document.getElementById('goSub');
  var btnRestartModal = document.getElementById('btnRestartModal');
  var btnCloseModal = document.getElementById('btnCloseModal');

  // Game Settings State
  var state = {
    gameMode: 'ai', // 'ai' or 'pvp'
    playerSide: 'w', // 'w' (player is white), 'b' (player is black)
    aiLevel: 3,
    skin: 'wood', // 'wood', 'green', 'blue'
    showGuide: true,
    isFlipped: false, // if true, board is rendered with Black at bottom (row 0 bottom)
    selectedSquare: null, // { r, c }
    legalMovesForSelected: [],
    lastMove: null, // { fromR, fromC, toR, toC }
    hintMove: null, // { fromR, fromC, toR, toC }
    pendingPromoMove: null,
    isAIThinking: false,
    gameOver: false
  };

  // High-DPI display metrics
  var metrics = {
    size: 640,
    squareSize: 80,
    dpr: window.devicePixelRatio || 1
  };

  // Theme Color Palettes
  var THEMES = {
    wood: {
      light: '#f0d9b5',
      dark: '#b58863',
      selected: 'rgba(246, 224, 94, 0.65)',
      lastMove: 'rgba(205, 210, 106, 0.55)',
      hint: 'rgba(34, 197, 94, 0.75)'
    },
    green: {
      light: '#eeeed2',
      dark: '#769656',
      selected: 'rgba(247, 236, 89, 0.65)',
      lastMove: 'rgba(186, 202, 68, 0.55)',
      hint: 'rgba(59, 130, 246, 0.75)'
    },
    blue: {
      light: '#dee3e6',
      dark: '#8ca2ad',
      selected: 'rgba(147, 197, 253, 0.65)',
      lastMove: 'rgba(191, 219, 254, 0.55)',
      hint: 'rgba(16, 185, 129, 0.75)'
    }
  };

  // Unicode Chess Glyphs for High-Contrast Fallback & Trays
  var GLYPHS = {
    wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
    bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟'
  };

  // Piece Images Cache (Clean Vector SVGs)
  var pieceImages = {};
  var imagesLoaded = false;

  function initPieceSVGs() {
    // Elegant Staunton SVG Definitions
    var svgData = {
      wp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#fff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/></svg>',
      wn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="m22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff" stroke="#1e293b" stroke-width="1.5"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.632 4.02-3 4-1.6 0-2.435-.91-3-2-.76-1.57.067-3.9 1-5 2.12-2.49 6.27-5.9 7-8 1.5-4.2 4-6 8-6 2.5 0 5 1.5 6 3 1.3 1.9 1.1 4.5 1 6z" fill="#fff" stroke="#1e293b" stroke-width="1.5"/><circle cx="9.5" cy="25.5" r="1.5" fill="#1e293b"/></svg>',
      wb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill="#fff"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#fff"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" fill="#fff"/><path d="M17.5 26h10M22.5 21v10"/></g></svg>',
      wr: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5v-18h17v18H14zM11 13.5h23V9h-4v2h-4V9h-7v2h-4V9h-4v4.5z"/></g></svg>',
      wq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#fff" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/></g></svg>',
      wk: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="m22.5 25c0-4 4.5-4 4.5-7.5 0-3-2.5-5.5-4.5-5.5s-4.5 2.5-4.5 5.5c0 3.5 4.5 3.5 4.5 7.5" fill="#fff"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#fff"/><path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/></g></svg>',

      bp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="m22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/></svg>',
      bn: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><path d="m22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/><path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.632 4.02-3 4-1.6 0-2.435-.91-3-2-.76-1.57.067-3.9 1-5 2.12-2.49 6.27-5.9 7-8 1.5-4.2 4-6 8-6 2.5 0 5 1.5 6 3 1.3 1.9 1.1 4.5 1 6z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/><circle cx="9.5" cy="25.5" r="1.5" fill="#f8fafc"/></svg>',
      bb: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" fill="#1e293b"/><path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#1e293b"/><path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" fill="#1e293b"/><path d="M17.5 26h10M22.5 21v10" stroke="#cbd5e1"/></g></svg>',
      br: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="M9 39h27v-3H9v3zm3-3v-4.5h21V36H12zm2-4.5v-18h17v18H14zM11 13.5h23V9h-4v2h-4V9h-7v2h-4V9h-4v4.5z"/></g></svg>',
      bq: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z"/><path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/><circle cx="6" cy="12" r="2" fill="#1e293b"/><circle cx="14" cy="9" r="2" fill="#1e293b"/><circle cx="22.5" cy="8" r="2" fill="#1e293b"/><circle cx="31" cy="9" r="2" fill="#1e293b"/><circle cx="39" cy="12" r="2" fill="#1e293b"/></g></svg>',
      bk: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"><g fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"><path d="M22.5 11.63V6M20 8h5" stroke-linejoin="miter"/><path d="m22.5 25c0-4 4.5-4 4.5-7.5 0-3-2.5-5.5-4.5-5.5s-4.5 2.5-4.5 5.5c0 3.5 4.5 3.5 4.5 7.5" fill="#1e293b"/><path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V23.5c-2.5-7.5-12-10.5-16-4-3 6 6 10.5 6 10.5v7z" fill="#1e293b"/><path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/></g></svg>'
    };

    var keys = Object.keys(svgData);
    var loadedCount = 0;

    keys.forEach(function(key) {
      var img = new Image();
      img.onload = function() {
        loadedCount++;
        if (loadedCount === keys.length) {
          imagesLoaded = true;
          drawBoard();
        }
      };
      img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgData[key]);
      pieceImages[key] = img;
    });
  }

  // Handle Board Resize & High-DPI
  function resizeBoard() {
    var rect = boardWrapper.getBoundingClientRect();
    var size = Math.min(rect.width, 640);
    var dpr = window.devicePixelRatio || 1;

    metrics.size = size;
    metrics.squareSize = size / 8;
    metrics.dpr = dpr;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);

    drawBoard();
  }

  // Coordinate Conversion (accounting for board flip)
  function boardToCanvasCoord(r, c) {
    var renderR = state.isFlipped ? (7 - r) : r;
    var renderC = state.isFlipped ? (7 - c) : c;
    return {
      x: renderC * metrics.squareSize,
      y: renderR * metrics.squareSize
    };
  }

  function canvasToBoardCoord(pixelX, pixelY) {
    var c = Math.floor(pixelX / metrics.squareSize);
    var r = Math.floor(pixelY / metrics.squareSize);
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return null;
    return {
      r: state.isFlipped ? (7 - r) : r,
      c: state.isFlipped ? (7 - c) : c
    };
  }

  /* ========================================================
     🎨 Board Rendering
     ======================================================== */
  function drawBoard() {
    var theme = THEMES[state.skin] || THEMES.wood;
    var sq = metrics.squareSize;
    var dpr = metrics.dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, metrics.size, metrics.size);

    // 1. Draw 8x8 alternating squares
    for (var r = 0; r < 8; r++) {
      for (var c = 0; c < 8; c++) {
        var isLight = ((r + c) % 2 === 0);
        var pt = boardToCanvasCoord(r, c);

        ctx.fillStyle = isLight ? theme.light : theme.dark;
        ctx.fillRect(pt.x, pt.y, sq, sq);

        // Coordinates text (files a-h on bottom, ranks 1-8 on left)
        var fileChar = String.fromCharCode(97 + c);
        var rankNum = 8 - r;
        var renderR = state.isFlipped ? (7 - r) : r;
        var renderC = state.isFlipped ? (7 - c) : c;

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = isLight ? theme.dark : theme.light;

        // Rank numbers (only on left column)
        if (renderC === 0) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          ctx.fillText(rankNum.toString(), pt.x + 4, pt.y + 4);
        }

        // File letters (only on bottom row)
        if (renderR === 7) {
          ctx.textAlign = 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(fileChar, pt.x + sq - 4, pt.y + sq - 4);
        }
      }
    }

    // 2. Highlight Last Move
    if (state.lastMove) {
      ctx.fillStyle = theme.lastMove;
      var pFrom = boardToCanvasCoord(state.lastMove.fromR, state.lastMove.fromC);
      var pTo = boardToCanvasCoord(state.lastMove.toR, state.lastMove.toC);
      ctx.fillRect(pFrom.x, pFrom.y, sq, sq);
      ctx.fillRect(pTo.x, pTo.y, sq, sq);
    }

    // 3. Highlight In-Check King
    if (engine.isInCheck(engine.turn)) {
      var kingPos = engine.findKing(engine.turn);
      if (kingPos) {
        var kp = boardToCanvasCoord(kingPos.r, kingPos.c);
        var grad = ctx.createRadialGradient(kp.x + sq / 2, kp.y + sq / 2, sq * 0.1, kp.x + sq / 2, kp.y + sq / 2, sq * 0.7);
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
        ctx.fillStyle = grad;
        ctx.fillRect(kp.x, kp.y, sq, sq);
      }
    }

    // 4. Highlight Selected Square
    if (state.selectedSquare) {
      ctx.fillStyle = theme.selected;
      var selPt = boardToCanvasCoord(state.selectedSquare.r, state.selectedSquare.c);
      ctx.fillRect(selPt.x, selPt.y, sq, sq);
    }

    // 5. Draw Legal Move Markers (Guide Dots & Capture Rings)
    if (state.showGuide && state.legalMovesForSelected.length > 0) {
      state.legalMovesForSelected.forEach(function(m) {
        var pt2 = boardToCanvasCoord(m.toR, m.toC);
        var cx = pt2.x + sq / 2;
        var cy = pt2.y + sq / 2;

        if (m.captured || m.isEnPassant) {
          // Capture target: red/amber outer ring
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
          ctx.lineWidth = Math.max(3, sq * 0.07);
          ctx.beginPath();
          ctx.arc(cx, cy, sq * 0.42, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Empty square move: clean dot
          ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
          ctx.beginPath();
          ctx.arc(cx, cy, sq * 0.16, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 6. Draw Hint Arrow (if active)
    if (state.hintMove) {
      drawHintArrow(state.hintMove, theme.hint);
    }

    // 7. Draw Chess Pieces
    var pad = sq * 0.08;
    var pSize = sq - pad * 2;

    for (var r2 = 0; r2 < 8; r2++) {
      for (var c2 = 0; c2 < 8; c2++) {
        var piece = engine.board[r2][c2];
        if (piece) {
          var pt3 = boardToCanvasCoord(r2, c2);
          var img = pieceImages[piece];
          if (imagesLoaded && img) {
            ctx.drawImage(img, pt3.x + pad, pt3.y + pad, pSize, pSize);
          } else {
            // High-contrast unicode fallback
            ctx.fillStyle = (piece[0] === 'w') ? '#ffffff' : '#0f172a';
            ctx.font = Math.round(sq * 0.7) + 'px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(GLYPHS[piece] || '?', pt3.x + sq / 2, pt3.y + sq / 2);
          }
        }
      }
    }
  }

  function drawHintArrow(move, color) {
    var sq = metrics.squareSize;
    var fromPt = boardToCanvasCoord(move.fromR, move.fromC);
    var toPt = boardToCanvasCoord(move.toR, move.toC);

    var x1 = fromPt.x + sq / 2;
    var y1 = fromPt.y + sq / 2;
    var x2 = toPt.x + sq / 2;
    var y2 = toPt.y + sq / 2;

    var angle = Math.atan2(y2 - y1, x2 - x1);
    var headLen = sq * 0.28;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(4, sq * 0.09);
    ctx.lineCap = 'round';

    // Shaft
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - headLen * Math.cos(angle) * 0.6, y2 - headLen * Math.sin(angle) * 0.6);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  /* ========================================================
     🎮 User Interaction & Input Handling
     ======================================================== */
  function onSquareClick(r, c) {
    if (state.gameOver || state.isAIThinking) return;

    // Check if it's currently human player's turn in AI mode
    if (state.gameMode === 'ai' && engine.turn !== state.playerSide) {
      return;
    }

    state.hintMove = null; // Clear hint on any user click

    var piece = engine.getPiece(r, c);

    // Case 1: Clicking an already selected piece -> Deselect
    if (state.selectedSquare && state.selectedSquare.r === r && state.selectedSquare.c === c) {
      state.selectedSquare = null;
      state.legalMovesForSelected = [];
      drawBoard();
      return;
    }

    // Case 2: Attempting to move selected piece to (r, c)
    if (state.selectedSquare) {
      var matchingMove = state.legalMovesForSelected.find(function(m) {
        return m.toR === r && m.toC === c;
      });

      if (matchingMove) {
        // If move involves pawn promotion, trigger promotion modal
        if (matchingMove.promotion) {
          state.pendingPromoMove = matchingMove;
          showPromotionModal(engine.turn);
          return;
        }

        executeMove(matchingMove);
        return;
      }
    }

    // Case 3: Selecting a piece belonging to current turn
    if (piece && piece[0] === engine.turn) {
      state.selectedSquare = { r: r, c: c };
      state.legalMovesForSelected = engine.getLegalMoves(r, c);
      drawBoard();
    } else {
      state.selectedSquare = null;
      state.legalMovesForSelected = [];
      drawBoard();
    }
  }

  function executeMove(move) {
    var moveResult = engine.makeMove(move);
    state.lastMove = move;
    state.selectedSquare = null;
    state.legalMovesForSelected = [];
    state.hintMove = null;

    // Audio triggers
    if (moveResult.inCheck) {
      audio.playCheck();
    } else if (moveResult.isCastling) {
      audio.playCastle();
    } else if (moveResult.promotion) {
      audio.playPromote();
    } else if (moveResult.captured) {
      audio.playCapture();
    } else {
      audio.playMove();
    }

    updateUI();
    drawBoard();

    // Check game termination
    var status = engine.getGameStatus();
    if (status.over) {
      handleGameOver(status);
      return;
    }

    // AI Turn Trigger
    if (state.gameMode === 'ai' && engine.turn !== state.playerSide) {
      triggerAIMove();
    }
  }

  function triggerAIMove() {
    state.isAIThinking = true;
    p2Status.textContent = '수읽는 중...';
    p2Status.style.background = '#fef3c7';
    p2Status.style.color = '#b45309';

    var thinkTime = 250 + Math.random() * 300;

    setTimeout(function() {
      var aiMove = engine.getAIMove(state.aiLevel);
      state.isAIThinking = false;

      if (aiMove) {
        // Default AI pawn promotion to Queen
        if (aiMove.promotion) {
          aiMove.promotion = 'q';
        }
        executeMove(aiMove);
      }
    }, thinkTime);
  }

  /* ========================================================
     👑 Pawn Promotion Modal
     ======================================================== */
  function showPromotionModal(color) {
    document.getElementById('promoIconQ').textContent = (color === 'w') ? '♕' : '♛';
    document.getElementById('promoIconR').textContent = (color === 'w') ? '♖' : '♜';
    document.getElementById('promoIconB').textContent = (color === 'w') ? '♗' : '♝';
    document.getElementById('promoIconN').textContent = (color === 'w') ? '♘' : '♞';
    promoModal.hidden = false;
  }

  document.querySelectorAll('.promo-choice-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var promoPiece = btn.dataset.promo;
      promoModal.hidden = true;
      if (state.pendingPromoMove) {
        state.pendingPromoMove.promotion = promoPiece;
        executeMove(state.pendingPromoMove);
        state.pendingPromoMove = null;
      }
    });
  });

  /* ========================================================
     🏆 Game Over & Status Handling
     ======================================================== */
  function handleGameOver(status) {
    state.gameOver = true;
    var userWon = (state.gameMode === 'ai' && status.winner === state.playerSide);
    var userLost = (state.gameMode === 'ai' && status.winner && status.winner !== state.playerSide);

    if (userWon) {
      audio.playVictory();
      goIcon.textContent = '🏆';
      goTitle.textContent = '체크메이트! 멋진 승리!';
      goSub.textContent = '상대방의 킹을 완벽하게 포위하여 체크메이트로 승리하였습니다!';
    } else if (userLost) {
      audio.playDefeat();
      goIcon.textContent = '🛡️';
      goTitle.textContent = '체크메이트 (패배)';
      goSub.textContent = '아쉽게도 상대방에게 체크메이트를 허용했습니다. 다시 도전해 보세요!';
    } else if (status.winner) {
      audio.playVictory();
      var winName = (status.winner === 'w') ? '백(White)' : '흑(Black)';
      goIcon.textContent = '👑';
      goTitle.textContent = winName + ' 승리!';
      goSub.textContent = '체크메이트로 ' + winName + '의 승리입니다.';
    } else {
      // Draw / Stalemate
      goIcon.textContent = '🤝';
      goTitle.textContent = '무승부 (Draw)';
      var reasonText = (status.reason === 'stalemate') ? '스테일메이트(합법적인 수가 없음)' : '50수 무승부 규칙';
      goSub.textContent = reasonText + '로 대국이 무승부로 종료되었습니다.';
    }

    gameOverModal.hidden = false;
  }

  btnRestartModal.addEventListener('click', function() {
    gameOverModal.hidden = true;
    newGame();
  });

  btnCloseModal.addEventListener('click', function() {
    gameOverModal.hidden = true;
  });

  /* ========================================================
     📊 UI Updates (Cards, Eval Bar, Captured Pieces)
     ======================================================== */
  function updateUI() {
    var isWhiteTurn = (engine.turn === 'w');
    var inCheck = engine.isInCheck(engine.turn);

    // Turn Banner
    turnBanner.className = 'turn-center-banner ' + (isWhiteTurn ? 'white-turn' : 'black-turn');
    if (inCheck) turnBanner.classList.add('check-active');

    turnBadgeIcon.className = 'turn-badge-icon ' + (isWhiteTurn ? 'white' : 'black');
    turnTitle.textContent = isWhiteTurn ? '백(White) 차례' : '흑(Black) 차례';

    if (inCheck) {
      turnSub.textContent = '⚠️ 킹이 공격받고 있습니다! 체크를 방어하세요.';
      checkAlarmBadge.hidden = false;
    } else {
      turnSub.textContent = '이동할 기물을 선택하세요';
      checkAlarmBadge.hidden = true;
    }

    // Player Cards Active States
    var isP1Turn = (state.gameMode === 'ai') ? (engine.turn === state.playerSide) : isWhiteTurn;
    p1Card.classList.toggle('active', isP1Turn);
    p2Card.classList.toggle('active', !isP1Turn);

    p1Card.classList.toggle('check-warning', inCheck && isP1Turn);
    p2Card.classList.toggle('check-warning', inCheck && !isP1Turn);

    p1Status.textContent = isP1Turn ? '내 차례' : '대기 중';
    p2Status.textContent = !isP1Turn ? (state.isAIThinking ? '수읽는 중...' : '상대 차례') : '대기 중';
    p2Status.style.background = '';
    p2Status.style.color = '';

    // Captured pieces & Material difference
    renderCapturedTrays();

    // Eval Bar
    updateEvalBar();
  }

  function renderCapturedTrays() {
    var PIECE_VALS = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    var whiteCap = engine.capturedPieces.w; // pieces white captured (black pieces)
    var blackCap = engine.capturedPieces.b; // pieces black captured (white pieces)

    var whiteScore = whiteCap.reduce(function(acc, p) { return acc + (PIECE_VALS[p[1]] || 0); }, 0);
    var blackScore = blackCap.reduce(function(acc, p) { return acc + (PIECE_VALS[p[1]] || 0); }, 0);

    var p1CapList = (state.playerSide === 'w') ? whiteCap : blackCap;
    var p2CapList = (state.playerSide === 'w') ? blackCap : whiteCap;
    var p1Total = (state.playerSide === 'w') ? whiteScore : blackScore;
    var p2Total = (state.playerSide === 'w') ? blackScore : whiteScore;

    p1Captured.innerHTML = p1CapList.map(function(p) { return GLYPHS[p] || ''; }).join('');
    p2Captured.innerHTML = p2CapList.map(function(p) { return GLYPHS[p] || ''; }).join('');

    p1Score.textContent = '+' + p1Total;
    p2Score.textContent = '+' + p2Total;

    var diff = p1Total - p2Total;
    if (diff > 0) {
      p1Diff.textContent = '(+' + diff + ')';
      p2Diff.textContent = '';
    } else if (diff < 0) {
      p1Diff.textContent = '';
      p2Diff.textContent = '(+' + Math.abs(diff) + ')';
    } else {
      p1Diff.textContent = '';
      p2Diff.textContent = '';
    }
  }

  function updateEvalBar() {
    var evalScore = engine.evaluatePosition(); // + for white advantage, - for black
    // Normalize into percentage (0 to 100)
    // 0 = completely black winning (-1000cp), 50 = equal (0cp), 100 = completely white winning (+1000cp)
    var clamped = Math.max(-1200, Math.min(1200, evalScore));
    var whitePct = Math.round(50 + (clamped / 1200) * 45);

    evalBarWhite.style.width = whitePct + '%';

    if (Math.abs(evalScore) < 50) {
      evalText.textContent = '균형 (50:50)';
    } else if (evalScore > 0) {
      var pawnsW = (evalScore / 100).toFixed(1);
      evalText.textContent = '백 유리 (+' + pawnsW + ')';
    } else {
      var pawnsB = (Math.abs(evalScore) / 100).toFixed(1);
      evalText.textContent = '흑 유리 (+' + pawnsB + ')';
    }
  }

  /* ========================================================
     ⚙️ Game Initialization & Actions
     ======================================================== */
  function newGame() {
    engine.reset();
    state.gameOver = false;
    state.isAIThinking = false;
    state.selectedSquare = null;
    state.legalMovesForSelected = [];
    state.lastMove = null;
    state.hintMove = null;
    state.pendingPromoMove = null;

    var chosenSide = selSide.value;
    if (chosenSide === 'random') {
      state.playerSide = (Math.random() < 0.5) ? 'w' : 'b';
    } else {
      state.playerSide = chosenSide;
    }

    // Auto-flip board so player's pieces are always at bottom
    state.isFlipped = (state.playerSide === 'b');

    // Update Player Names & Badges
    if (state.gameMode === 'ai') {
      p1Name.textContent = '나 (' + (state.playerSide === 'w' ? '백' : '흑') + ')';
      p2Name.textContent = '상대 (AI ' + state.aiLevel + '단계)';
      p1Badge.textContent = (state.playerSide === 'w') ? '⚪ 백(White) · 선공' : '⚫ 흑(Black) · 후공';
      p2Badge.textContent = (state.playerSide === 'w') ? '⚫ 흑(Black) · 후공' : '⚪ 백(White) · 선공';
    } else {
      p1Name.textContent = '플레이어 1 (백)';
      p2Name.textContent = '플레이어 2 (흑)';
      p1Badge.textContent = '⚪ 백(White) · 선공';
      p2Badge.textContent = '⚫ 흑(Black) · 후공';
    }

    updateUI();
    drawBoard();

    // If player is Black in AI mode, AI takes 1st move as White
    if (state.gameMode === 'ai' && state.playerSide === 'b') {
      triggerAIMove();
    }
  }

  function undoMove() {
    if (state.isAIThinking || state.gameOver) return;

    if (state.gameMode === 'ai') {
      // In AI mode, undo 2 ply (AI's move + Human's move)
      engine.undo();
      engine.undo();
    } else {
      // In 2P mode, undo 1 ply
      engine.undo();
    }

    state.selectedSquare = null;
    state.legalMovesForSelected = [];
    state.hintMove = null;
    state.lastMove = null;

    updateUI();
    drawBoard();
  }

  function showHint() {
    if (state.isAIThinking || state.gameOver) return;
    var hint = engine.getAIMove(4); // Use Level 4 search for high quality hint
    if (hint) {
      state.hintMove = hint;
      drawBoard();
    }
  }

  /* ========================================================
     🖱️ Event Listeners
     ======================================================== */
  canvas.addEventListener('click', function(e) {
    var rect = canvas.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    var coord = canvasToBoardCoord(x, y);
    if (coord) {
      onSquareClick(coord.r, coord.c);
    }
  });

  // Touch Support
  canvas.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      var rect = canvas.getBoundingClientRect();
      var x = e.touches[0].clientX - rect.left;
      var y = e.touches[0].clientY - rect.top;
      var coord = canvasToBoardCoord(x, y);
      if (coord) {
        onSquareClick(coord.r, coord.c);
      }
    }
  }, { passive: true });

  btnNew.addEventListener('click', function() {
    newGame();
  });

  btnUndo.addEventListener('click', function() {
    undoMove();
  });

  btnHint.addEventListener('click', function() {
    showHint();
  });

  btnFlip.addEventListener('click', function() {
    state.isFlipped = !state.isFlipped;
    drawBoard();
  });

  btnGuide.addEventListener('click', function() {
    state.showGuide = !state.showGuide;
    btnGuide.innerHTML = '💡 행마 가이드: <b>' + (state.showGuide ? '켜짐' : '꺼짐') + '</b>';
    drawBoard();
  });

  btnMode.addEventListener('click', function() {
    state.gameMode = (state.gameMode === 'ai') ? 'pvp' : 'ai';
    btnMode.textContent = (state.gameMode === 'ai') ? '🤖 대전: AI 대전' : '👥 대전: 2인 대전';
    newGame();
  });

  selLevel.addEventListener('change', function() {
    state.aiLevel = parseInt(selLevel.value, 10);
    p2Name.textContent = '상대 (AI ' + state.aiLevel + '단계)';
  });

  selSide.addEventListener('change', function() {
    newGame();
  });

  selSkin.addEventListener('change', function() {
    state.skin = selSkin.value;
    boardWrapper.className = 'board-wrapper ' + (state.skin === 'green' ? 'green-theme' : (state.skin === 'blue' ? 'blue-theme' : ''));
    drawBoard();
  });

  selSound.addEventListener('change', function() {
    audio.setMuted(selSound.value === 'off');
  });

  window.addEventListener('resize', resizeBoard);

  // Boot Application
  initPieceSVGs();
  resizeBoard();
  newGame();

})(window, document);
