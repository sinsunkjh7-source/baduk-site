/* 숨은 그림 찾기 — 정교한 장면 + 찾기 로직 */
(function () {
  'use strict';

  var W = 1000, H = 700;
  var cv, ctx, msgEl;
  var targets = [];
  var found = {};
  var scores = [0, 0];
  var turn = 0;
  var over = false;
  var hints = 3;
  var hintUntil = 0, hintId = null;

  function el(id) { return document.getElementById(id); }
  function msg(t) { if (msgEl) msgEl.textContent = t; }

  /* ================= 아이콘 ================= */
  var ICONS = {
    key: function (c, x, y, s, col) {
      c.strokeStyle = col || '#c9a227';
      c.lineWidth = Math.max(1.6, s * 0.14);
      c.beginPath(); c.arc(x - s * 0.3, y, s * 0.22, 0, 6.283); c.stroke();
      c.beginPath();
      c.moveTo(x - s * 0.08, y); c.lineTo(x + s * 0.5, y);
      c.moveTo(x + s * 0.32, y); c.lineTo(x + s * 0.32, y + s * 0.2);
      c.moveTo(x + s * 0.46, y); c.lineTo(x + s * 0.46, y + s * 0.14);
      c.stroke();
    },
    glasses: function (c, x, y, s, col) {
      c.strokeStyle = col || '#38424d';
      c.lineWidth = Math.max(1.4, s * 0.09);
      c.beginPath(); c.arc(x - s * 0.27, y, s * 0.23, 0, 6.283); c.stroke();
      c.beginPath(); c.arc(x + s * 0.27, y, s * 0.23, 0, 6.283); c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.04, y); c.lineTo(x + s * 0.04, y); c.stroke();
      c.beginPath(); c.moveTo(x + s * 0.5, y - s * 0.05); c.lineTo(x + s * 0.7, y - s * 0.15); c.stroke();
      c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.05); c.lineTo(x - s * 0.7, y - s * 0.15); c.stroke();
    },
    pencil: function (c, x, y, s, col) {
      c.save(); c.translate(x, y); c.rotate(-0.55);
      c.fillStyle = col || '#f0b429';
      c.fillRect(-s * 0.09, -s * 0.5, s * 0.18, s * 0.8);
      c.fillStyle = '#efe4c8';
      c.beginPath(); c.moveTo(-s * 0.09, s * 0.3); c.lineTo(s * 0.09, s * 0.3); c.lineTo(0, s * 0.52); c.closePath(); c.fill();
      c.fillStyle = '#333';
      c.beginPath(); c.moveTo(-s * 0.03, s * 0.42); c.lineTo(s * 0.03, s * 0.42); c.lineTo(0, s * 0.52); c.closePath(); c.fill();
      c.fillStyle = '#e8798f';
      c.fillRect(-s * 0.09, -s * 0.5, s * 0.18, s * 0.12);
      c.restore();
    },
    apple: function (c, x, y, s, col) {
      c.fillStyle = col || '#cf3f3b';
      c.beginPath(); c.arc(x - s * 0.13, y + s * 0.05, s * 0.28, 0, 6.283); c.fill();
      c.beginPath(); c.arc(x + s * 0.13, y + s * 0.05, s * 0.28, 0, 6.283); c.fill();
      c.strokeStyle = '#6b4a24'; c.lineWidth = Math.max(1.2, s * 0.07);
      c.beginPath(); c.moveTo(x, y - s * 0.2); c.lineTo(x + s * 0.03, y - s * 0.44); c.stroke();
      c.fillStyle = '#4f9a4a';
      c.beginPath(); c.ellipse(x + s * 0.18, y - s * 0.38, s * 0.15, s * 0.07, -0.5, 0, 6.283); c.fill();
    },
    star: function (c, x, y, s, col) {
      c.fillStyle = col || '#f2c14e';
      c.beginPath();
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5;
        var rr = i % 2 ? s * 0.19 : s * 0.44;
        c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.closePath(); c.fill();
    },
    fish: function (c, x, y, s, col) {
      c.fillStyle = col || '#4aa3d8';
      c.beginPath(); c.ellipse(x, y, s * 0.34, s * 0.2, 0, 0, 6.283); c.fill();
      c.beginPath();
      c.moveTo(x + s * 0.28, y); c.lineTo(x + s * 0.48, y - s * 0.17); c.lineTo(x + s * 0.48, y + s * 0.17);
      c.closePath(); c.fill();
      c.fillStyle = '#fff';
      c.beginPath(); c.arc(x - s * 0.18, y - s * 0.04, Math.max(1.2, s * 0.045), 0, 6.283); c.fill();
    },
    butterfly: function (c, x, y, s, col) {
      c.fillStyle = col || '#a463c9';
      c.beginPath(); c.ellipse(x - s * 0.19, y - s * 0.09, s * 0.18, s * 0.24, -0.5, 0, 6.283); c.fill();
      c.beginPath(); c.ellipse(x + s * 0.19, y - s * 0.09, s * 0.18, s * 0.24, 0.5, 0, 6.283); c.fill();
      c.beginPath(); c.ellipse(x - s * 0.14, y + s * 0.14, s * 0.12, s * 0.14, 0.4, 0, 6.283); c.fill();
      c.beginPath(); c.ellipse(x + s * 0.14, y + s * 0.14, s * 0.12, s * 0.14, -0.4, 0, 6.283); c.fill();
      c.fillStyle = '#4a3357';
      c.beginPath(); c.ellipse(x, y, s * 0.045, s * 0.22, 0, 0, 6.283); c.fill();
    },
    coin: function (c, x, y, s, col) {
      c.fillStyle = col || '#d8ae35';
      c.beginPath(); c.arc(x, y, s * 0.25, 0, 6.283); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, s * 0.045);
      c.beginPath(); c.arc(x, y, s * 0.17, 0, 6.283); c.stroke();
    }
  };

  /* ================= 장면 ================= */
  function shadow(c, x, y, rx, ry, a) {
    c.save();
    c.fillStyle = 'rgba(40,30,15,' + (a || 0.16) + ')';
    c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.283); c.fill();
    c.restore();
  }

  function drawBackground(c) {
    var g = c.createLinearGradient(0, 0, 0, 520);
    g.addColorStop(0, '#f7f1e3');
    g.addColorStop(1, '#ece2ce');
    c.fillStyle = g; c.fillRect(0, 0, W, 520);

    c.strokeStyle = 'rgba(178,158,118,.18)'; c.lineWidth = 2;
    for (var x = 26; x < W; x += 58) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 520); c.stroke(); }

    /* 상단 몰딩 */
    c.fillStyle = '#e3d7bd'; c.fillRect(0, 0, W, 16);
    c.fillStyle = 'rgba(150,130,95,.25)'; c.fillRect(0, 16, W, 4);

    /* 걸레받이 */
    c.fillStyle = '#d7c9ad'; c.fillRect(0, 506, W, 16);

    /* 바닥 */
    var fg = c.createLinearGradient(0, 520, 0, H);
    fg.addColorStop(0, '#c8a071');
    fg.addColorStop(1, '#a9835a');
    c.fillStyle = fg; c.fillRect(0, 520, W, H - 520);
    c.strokeStyle = 'rgba(120,88,54,.32)'; c.lineWidth = 2;
    for (var y = 548; y < H; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    for (var i = 0; i < 16; i++) {
      var xx = (i * 89 + 30) % W, yy = 548 + (i % 4) * 36;
      c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx, yy + 36); c.stroke();
    }
  }

  function drawWindow(c) {
    /* 벽 그림자 */
    c.fillStyle = 'rgba(120,100,70,.10)';
    c.fillRect(38, 58, 268, 214);

    c.fillStyle = '#8b6b45';
    c.fillRect(38, 58, 268, 214);

    var sky = c.createLinearGradient(0, 66, 0, 264);
    sky.addColorStop(0, '#bfe3f5'); sky.addColorStop(1, '#eaf7ff');
    c.fillStyle = sky; c.fillRect(48, 68, 248, 194);

    /* 구름 */
    c.fillStyle = 'rgba(255,255,255,.95)';
    [[110, 108, 24], [150, 100, 18], [186, 112, 21]].forEach(function (p) {
      c.beginPath(); c.arc(p[0], p[1], p[2], 0, 6.283); c.fill();
    });
    /* 언덕 */
    c.fillStyle = '#8fbd77';
    c.beginPath(); c.arc(250, 250, 62, Math.PI, 0); c.fill();
    c.fillStyle = '#7cae66';
    c.beginPath(); c.arc(160, 262, 48, Math.PI, 0); c.fill();

    /* 유리 반사 */
    c.save();
    c.globalAlpha = 0.18; c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(60, 200); c.lineTo(150, 70); c.lineTo(190, 70); c.lineTo(90, 200); c.closePath(); c.fill();
    c.restore();

    /* 창살 */
    c.strokeStyle = '#7a5b3a'; c.lineWidth = 8;
    c.beginPath();
    c.moveTo(172, 68); c.lineTo(172, 262);
    c.moveTo(48, 165); c.lineTo(296, 165);
    c.stroke();

    /* 커튼 */
    c.fillStyle = 'rgba(203,116,116,.55)';
    c.beginPath(); c.moveTo(38, 58); c.quadraticCurveTo(92, 160, 60, 276); c.lineTo(26, 276); c.lineTo(26, 58); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(306, 58); c.quadraticCurveTo(252, 160, 284, 276); c.lineTo(318, 276); c.lineTo(318, 58); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(170,80,80,.35)'; c.lineWidth = 2;
    for (var k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(40 + k * 8, 70); c.quadraticCurveTo(80 + k * 6, 160, 52 + k * 6, 268); c.stroke();
      c.beginPath(); c.moveTo(304 - k * 8, 70); c.quadraticCurveTo(264 - k * 6, 160, 292 - k * 6, 268); c.stroke();
    }
  }

  function drawPoster(c) {
    c.fillStyle = '#fffdf7';
    c.fillRect(336, 76, 172, 158);
    c.strokeStyle = '#c9b48a'; c.lineWidth = 5;
    c.strokeRect(336, 76, 172, 158);

    c.fillStyle = '#eac98d';
    c.fillRect(352, 94, 140, 122);
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.4;
    for (var i = 1; i < 7; i++) {
      c.beginPath(); c.moveTo(352 + i * 20, 94); c.lineTo(352 + i * 20, 216); c.stroke();
    }
    for (var j = 1; j < 6; j++) {
      c.beginPath(); c.moveTo(352, 94 + j * 20.3); c.lineTo(492, 94 + j * 20.3); c.stroke();
    }
    [[392, 134], [452, 174], [412, 194]].forEach(function (p, k) {
      c.beginPath(); c.arc(p[0], p[1], 8, 0, 6.283);
      c.fillStyle = k === 1 ? '#faf8f2' : '#2b2b2b'; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.stroke();
    });
  }

  function drawShelf(c) {
    shadow(c, 810, 340, 190, 14, 0.14);
    c.fillStyle = '#b98d5c';
    c.fillRect(632, 78, 336, 248);
    c.fillStyle = '#a97c4c';
    c.fillRect(640, 86, 320, 232);

    /* 선반판 + 그림자 */
    [86, 144, 202, 260].forEach(function (y) {
      c.fillStyle = '#c99c68'; c.fillRect(640, y, 320, 11);
      c.fillStyle = 'rgba(120,88,54,.18)'; c.fillRect(640, y + 11, 320, 4);
    });

    var cols = ['#c0504d', '#4f81bd', '#9bbb59', '#8064a2', '#f79646', '#2f6fb7', '#d9a441'];
    /* 1층(맨 위) 책 */
    var x = 652;
    for (var i = 0; i < 9; i++) {
      var wdt = 12 + (i % 3) * 4, hgt = 38 + (i % 4) * 6;
      c.fillStyle = cols[i % cols.length];
      c.fillRect(x, 144 - hgt, wdt, hgt);
      c.fillStyle = 'rgba(255,255,255,.3)';
      c.fillRect(x + 2, 144 - hgt + 5, wdt - 4, 3);
      x += wdt + 3;
    }
    /* 2층 책 + 화분 */
    x = 652;
    for (var j = 0; j < 5; j++) {
      var w2 = 14, h2 = 30 + (j % 3) * 7;
      c.fillStyle = cols[(j + 3) % cols.length];
      c.fillRect(x, 202 - h2, w2, h2);
      x += w2 + 4;
    }
    c.fillStyle = '#c96f4a';
    c.beginPath(); c.moveTo(806, 202); c.lineTo(852, 202); c.lineTo(843, 160); c.lineTo(815, 160); c.closePath(); c.fill();
    c.fillStyle = '#4f9a4a';
    [[829, 150, 13, 21], [814, 146, 10, 17], [843, 148, 11, 18]].forEach(function (p) {
      c.beginPath(); c.ellipse(p[0], p[1], p[2], p[3], 0, 0, 6.283); c.fill();
    });

    /* 시계 */
    c.fillStyle = '#f4efe3';
    c.beginPath(); c.arc(900, 118, 21, 0, 6.283); c.fill();
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 3;
    c.beginPath(); c.arc(900, 118, 21, 0, 6.283); c.stroke();
    c.beginPath(); c.moveTo(900, 118); c.lineTo(900, 105); c.stroke();
    c.beginPath(); c.moveTo(900, 118); c.lineTo(911, 123); c.stroke();

    /* 3층 상자 */
    c.fillStyle = '#d8b98a';
    c.fillRect(660, 260, 44, 30);
    c.fillStyle = 'rgba(120,88,54,.25)';
    c.fillRect(660, 272, 44, 4);
  }

  function drawDesk(c) {
    shadow(c, 390, 640, 320, 18, 0.18);
    var g = c.createLinearGradient(0, 468, 0, 500);
    g.addColorStop(0, '#c08a52'); g.addColorStop(1, '#a3713f');
    c.fillStyle = g;
    c.fillRect(70, 468, 640, 28);
    c.fillStyle = 'rgba(255,255,255,.18)';
    c.fillRect(70, 468, 640, 4);

    c.fillStyle = '#8f6134';
    c.fillRect(92, 496, 22, 140);
    c.fillRect(664, 496, 22, 140);

    /* 서랍 */
    c.fillStyle = '#b07c46';
    c.fillRect(486, 496, 176, 116);
    c.strokeStyle = '#8f6134'; c.lineWidth = 3;
    c.strokeRect(496, 508, 156, 42);
    c.strokeRect(496, 558, 156, 42);
    c.fillStyle = '#6b4a24';
    c.beginPath(); c.arc(574, 529, 5, 0, 6.283); c.fill();
    c.beginPath(); c.arc(574, 579, 5, 0, 6.283); c.fill();
  }

  function drawBoard(c) {
    shadow(c, 300, 470, 120, 8, 0.14);
    c.fillStyle = '#e2b97c';
    c.fillRect(178, 372, 230, 96);
    c.strokeStyle = '#a87d45'; c.lineWidth = 5;
    c.strokeRect(178, 372, 230, 96);
    c.strokeStyle = '#8a6338'; c.lineWidth = 1.4;
    for (var i = 1; i < 9; i++) { c.beginPath(); c.moveTo(178 + i * 25.5, 372); c.lineTo(178 + i * 25.5, 468); c.stroke(); }
    for (var j = 1; j < 4; j++) { c.beginPath(); c.moveTo(178, 372 + j * 24); c.lineTo(408, 372 + j * 24); c.stroke(); }

    [[200, 396, '#2b2b2b'], [252, 420, '#f7f7f2'], [306, 396, '#2b2b2b'], [356, 444, '#f7f7f2'], [230, 444, '#2b2b2b']].forEach(function (p) {
      c.beginPath(); c.arc(p[0], p[1], 10, 0, 6.283);
      c.fillStyle = p[2]; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; c.stroke();
    });
  }

  function drawDeskBooks(c) {
    shadow(c, 128, 468, 44, 5, 0.14);
    var cols = ['#8f4a44', '#4a6f8f', '#7f8f4a'];
    for (var i = 0; i < 3; i++) {
      c.fillStyle = cols[i];
      c.fillRect(92 + i * 3, 452 - i * 9, 68 - i * 4, 9);
      c.fillStyle = 'rgba(255,255,255,.25)';
      c.fillRect(94 + i * 3, 453 - i * 9, 60 - i * 4, 2);
    }
  }

  function drawWallPhoto(c) {
    c.fillStyle = '#fffdf7';
    c.fillRect(560, 96, 56, 66);
    c.strokeStyle = '#c9b48a'; c.lineWidth = 4;
    c.strokeRect(560, 96, 56, 66);
    c.fillStyle = '#a9cbe0'; c.fillRect(566, 102, 44, 40);
    c.fillStyle = '#7cae66';
    c.beginPath(); c.arc(588, 148, 16, Math.PI, 0); c.fill();
  }

  function drawBowls(c) {
    [[446, 448, '#2b2b2b'], [522, 448, '#faf8f2']].forEach(function (b, bi) {
      shadow(c, b[0], b[1] + 16, 36, 8, 0.14);
      c.fillStyle = '#8f6134';
      c.beginPath(); c.ellipse(b[0], b[1] + 6, 34, 15, 0, 0, 6.283); c.fill();
      c.fillStyle = '#a3713f';
      c.beginPath(); c.ellipse(b[0], b[1] - 2, 34, 16, 0, 0, 6.283); c.fill();
      for (var k = 0; k < 5; k++) {
        var px = b[0] - 18 + k * 9, py = b[1] - 8 + (k % 2) * 5;
        c.beginPath(); c.arc(px, py, 6.4, 0, 6.283);
        c.fillStyle = bi === 0 ? '#2b2b2b' : '#ffffff'; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.2)'; c.lineWidth = 1; c.stroke();
      }
    });
  }

  function drawCup(c) {
    shadow(c, 574, 468, 20, 5, 0.16);
    c.fillStyle = '#5f8fb8';
    c.fillRect(558, 418, 32, 48);
    c.fillStyle = '#4a7599';
    c.fillRect(558, 418, 32, 9);
    c.strokeStyle = '#f0b429'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(566, 420); c.lineTo(561, 394); c.stroke();
    c.strokeStyle = '#8fbf6a';
    c.beginPath(); c.moveTo(576, 420); c.lineTo(578, 390); c.stroke();
    c.strokeStyle = '#d97a7a';
    c.beginPath(); c.moveTo(584, 420); c.lineTo(590, 398); c.stroke();
  }

  function drawChair(c) {
    shadow(c, 800, 646, 80, 12, 0.18);
    c.fillStyle = '#b07c46';
    c.fillRect(736, 468, 132, 14);
    c.fillRect(748, 482, 13, 150);
    c.fillRect(844, 482, 13, 150);
    c.fillRect(736, 600, 132, 11);
    c.fillStyle = '#c08a52';
    c.fillRect(736, 392, 15, 80);
    c.fillRect(760, 400, 84, 12);
    c.fillStyle = 'rgba(255,255,255,.15)';
    c.fillRect(736, 468, 132, 3);
  }

  function drawPlant(c) {
    shadow(c, 932, 686, 56, 12, 0.18);
    c.fillStyle = '#b5764a';
    c.beginPath();
    c.moveTo(886, 682); c.lineTo(982, 682); c.lineTo(966, 592); c.lineTo(902, 592); c.closePath(); c.fill();
    c.fillStyle = 'rgba(120,70,40,.25)';
    c.fillRect(898, 606, 72, 6);
    c.fillStyle = '#3f8f52';
    [[934, 560, 30, 46], [900, 574, 22, 36], [968, 578, 20, 32]].forEach(function (p) {
      c.beginPath(); c.ellipse(p[0], p[1], p[2], p[3], 0, 0, 6.283); c.fill();
    });
    c.fillStyle = '#57a862';
    [[922, 556, 16, 26], [950, 566, 14, 22]].forEach(function (p) {
      c.beginPath(); c.ellipse(p[0], p[1], p[2], p[3], 0, 0, 6.283); c.fill();
    });
  }

  function drawLamp(c) {
    c.strokeStyle = '#8a6a3a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(520, 0); c.lineTo(520, 52); c.stroke();
    var g = c.createLinearGradient(472, 52, 568, 120);
    g.addColorStop(0, '#f7db96'); g.addColorStop(1, '#e0ae52');
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(472, 116); c.lineTo(568, 116); c.lineTo(546, 54); c.lineTo(494, 54); c.closePath();
    c.fill();
    c.fillStyle = 'rgba(255,236,170,.30)';
    c.beginPath(); c.ellipse(520, 136, 78, 24, 0, 0, 6.283); c.fill();
  }

  function drawRugAndCat(c) {
    /* 러그 */
    c.fillStyle = 'rgba(126,166,112,.42)';
    c.beginPath(); c.ellipse(400, 646, 210, 44, 0, 0, 6.283); c.fill();
    c.fillStyle = 'rgba(158,198,140,.5)';
    c.beginPath(); c.ellipse(400, 642, 168, 32, 0, 0, 6.283); c.fill();
    c.strokeStyle = 'rgba(96,136,84,.5)'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(400, 642, 120, 22, 0, 0, 6.283); c.stroke();

    shadow(c, 356, 626, 62, 12, 0.16);
    /* 몸통 */
    c.fillStyle = '#e8c9a0';
    c.beginPath(); c.ellipse(352, 604, 58, 30, 0, 0, 6.283); c.fill();
    /* 머리 */
    c.beginPath(); c.arc(408, 594, 25, 0, 6.283); c.fill();
    /* 귀 */
    c.beginPath(); c.moveTo(392, 577); c.lineTo(398, 558); c.lineTo(409, 575); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(416, 575); c.lineTo(427, 558); c.lineTo(431, 577); c.closePath(); c.fill();
    c.fillStyle = '#d8a87e';
    c.beginPath(); c.moveTo(396, 575); c.lineTo(399, 565); c.lineTo(405, 574); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(420, 574); c.lineTo(425, 565); c.lineTo(428, 575); c.closePath(); c.fill();
    /* 줄무늬 */
    c.strokeStyle = '#cfa478'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(320, 596); c.lineTo(338, 602); c.stroke();
    c.beginPath(); c.moveTo(326, 610); c.lineTo(344, 616); c.stroke();
    /* 눈 */
    c.strokeStyle = '#6b4a24'; c.lineWidth = 2.5;
    c.beginPath(); c.arc(400, 594, 5, 0.25, 2.9); c.stroke();
    c.beginPath(); c.arc(418, 594, 5, 0.25, 2.9); c.stroke();
    /* 코 */
    c.fillStyle = '#c4808f';
    c.beginPath(); c.arc(409, 602, 3, 0, 6.283); c.fill();
    /* 꼬리 */
    c.strokeStyle = '#e8c9a0'; c.lineWidth = 15;
    c.beginPath(); c.moveTo(298, 600); c.quadraticCurveTo(266, 588, 278, 560); c.stroke();
    c.strokeStyle = '#d8b78e'; c.lineWidth = 15;
    c.beginPath(); c.moveTo(278, 560); c.lineTo(282, 552); c.stroke();
  }

  /* ================= 타깃 배치 ================= */
  var SPOTS = [
    { id: 'key', name: '열쇠', x: 700, y: 232, r: 26, icon: 'key' },
    { id: 'glasses', name: '안경', x: 634, y: 452, r: 28, icon: 'glasses' },
    { id: 'pencil', name: '연필', x: 574, y: 404, r: 24, icon: 'pencil' },
    { id: 'apple', name: '사과', x: 918, y: 288, r: 26, icon: 'apple' },
    { id: 'star', name: '별', x: 424, y: 200, r: 24, icon: 'star' },
    { id: 'fish', name: '물고기', x: 268, y: 656, r: 26, icon: 'fish' },
    { id: 'butterfly', name: '나비', x: 250, y: 108, r: 24, icon: 'butterfly' },
    { id: 'coin', name: '동전', x: 786, y: 660, r: 24, icon: 'coin' }
  ];

  function drawTargets(c, t) {
    targets.forEach(function (tg) {
      ICONS[tg.icon](c, tg.x, tg.y, tg.r * 1.45, null);
      if (found[tg.id]) {
        c.beginPath(); c.arc(tg.x, tg.y, tg.r * 1.15, 0, 6.283);
        c.strokeStyle = '#4a8a3a'; c.lineWidth = 4; c.stroke();
        c.beginPath(); c.arc(tg.x, tg.y, tg.r * 1.15, 0, 6.283);
        c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 2; c.stroke();
      }
    });
    if (hintId && t < hintUntil) {
      var h = targets.filter(function (x) { return x.id === hintId; })[0];
      if (h) {
        var pulse = 0.5 + 0.5 * Math.sin(t / 110);
        c.beginPath(); c.arc(h.x, h.y, h.r * (1.35 + pulse * 0.6), 0, 6.283);
        c.strokeStyle = 'rgba(240,161,28,' + (0.35 + pulse * 0.55) + ')';
        c.lineWidth = 5; c.stroke();
      }
    }
  }

  function drawScene(t) {
    ctx.clearRect(0, 0, W, H);
    drawBackground(ctx);
    drawWindow(ctx);
    drawPoster(ctx);
    drawWallPhoto(ctx);
    drawShelf(ctx);
    drawLamp(ctx);
    drawDesk(ctx);
    drawBoard(ctx);
    drawDeskBooks(ctx);
    drawBowls(ctx);
    drawCup(ctx);
    drawChair(ctx);
    drawPlant(ctx);
    drawRugAndCat(ctx);
    drawTargets(ctx, t);
  }

  /* ================= 칩/점수 ================= */
  function renderTargetChips() {
    var box = el('targets');
    box.innerHTML = '';
    targets.forEach(function (tg) {
      var d = document.createElement('div');
      d.className = 'h-tgt' + (found[tg.id] ? ' done' : '');
      d.dataset.id = tg.id;
      var cvs = document.createElement('canvas');
      cvs.width = 60; cvs.height = 60;
      ICONS[tg.icon](cvs.getContext('2d'), 30, 30, 40, null);
      d.appendChild(cvs);
      var s = document.createElement('span');
      s.textContent = tg.name;
      d.appendChild(s);
      box.appendChild(d);
    });
  }

  function renderScores() {
    el('s1').textContent = scores[0];
    el('s2').textContent = scores[1];
    el('left').textContent = Math.max(0, targets.length - Object.keys(found).length);
    el('hintLeft').textContent = hints;
    el('btnHint').disabled = hints <= 0;
    Array.prototype.forEach.call(document.querySelectorAll('.h-score'), function (n) {
      n.classList.toggle('active-turn',
        (n.classList.contains('p1') && turn === 0 && !over) ||
        (n.classList.contains('p2') && turn === 1 && !over));
    });
  }

  /* ================= 진행 ================= */
  function newGame() {
    over = false; found = {}; scores = [0, 0]; turn = 0; hints = 3; hintId = null;
    targets = SPOTS.map(function (s) { return { id: s.id, name: s.name, x: s.x, y: s.y, r: s.r, icon: s.icon }; });
    el('resultPanel').hidden = true;
    renderTargetChips();
    renderScores();
    msg('그림 속에서 물건 ' + targets.length + '개를 찾아 누르세요.');
  }

  function click(e) {
    if (over) return;
    var r = cv.getBoundingClientRect();
    var x = (e.clientX - r.left) * W / r.width;
    var y = (e.clientY - r.top) * H / r.height;

    var hit = null, best = 1e9;
    targets.forEach(function (tg) {
      if (found[tg.id]) return;
      var d = Math.hypot(x - tg.x, y - tg.y);
      if (d <= tg.r * 1.2 && d < best) { best = d; hit = tg; }
    });

    if (hit) {
      found[hit.id] = true;
      scores[turn] += 1;
      msg('찾았습니다! ' + hit.name + ' — 한 번 더');
      renderTargetChips(); renderScores();
      if (Object.keys(found).length >= targets.length) finish();
    } else {
      msg('거기는 아닙니다 — 차례가 넘어갑니다.');
      turn = 1 - turn;
      renderScores();
    }
  }

  function useHint() {
    if (hints <= 0 || over) return;
    var left = targets.filter(function (t) { return !found[t.id]; });
    if (!left.length) return;
    hints--;
    hintId = left[Math.floor(Math.random() * left.length)].id;
    hintUntil = performance.now() + 1700;
    renderScores();
    msg('힌트: 반짝이는 곳을 보세요.');
  }

  function finish() {
    over = true;
    var title = scores[0] === scores[1] ? '무승부' : (scores[0] > scores[1] ? '1P 승리!' : '2P 승리!');
    el('resultTitle').textContent = title;
    el('resultDesc').textContent = '1P ' + scores[0] + ' : ' + scores[1] + ' 2P · 물건 ' + targets.length + '개';
    el('resultPanel').hidden = false;
    renderScores();
  }

  /* ================= 검증 ================= */
  function selftest() {
    if (!/[?&]selftest=1/.test(location.search)) return;
    var log = [], ok = true;
    targets.forEach(function (a) {
      if (a.x < 24 || a.x > W - 24 || a.y < 24 || a.y > H - 24) { ok = false; log.push('oob:' + a.id); }
    });
    for (var i = 0; i < targets.length; i++) {
      for (var j = i + 1; j < targets.length; j++) {
        if (Math.hypot(targets[i].x - targets[j].x, targets[i].y - targets[j].y) < 70) {
          ok = false; log.push('near:' + targets[i].id + '-' + targets[j].id);
        }
      }
    }
    var rect = cv.getBoundingClientRect();
    targets.forEach(function (t) {
      click({
        clientX: rect.left + t.x * rect.width / W,
        clientY: rect.top + t.y * rect.height / H
      });
    });
    if (Object.keys(found).length !== targets.length) { ok = false; log.push('click:' + Object.keys(found).length); }

    document.body.setAttribute('data-selftest',
      (ok ? 'PASS' : 'FAIL') + '|targets=' + targets.length + '|found=' + Object.keys(found).length + '|' + log.join(','));
  }

  /* ================= 초기화 ================= */
  function fitCanvas() {
    var stage = document.querySelector('.h-stage');
    if (!stage) return;
    var sw = stage.clientWidth - 14, sh = stage.clientHeight - 14;
    var scale = Math.min(sw / W, sh / H);
    if (!isFinite(scale) || scale <= 0) scale = 1;
    cv.style.width = Math.round(W * scale) + 'px';
    cv.style.height = Math.round(H * scale) + 'px';
  }

  function init() {
    cv = el('scene'); ctx = cv.getContext('2d'); msgEl = el('msg');

    cv.addEventListener('click', click);
    el('btnHint').addEventListener('click', useHint);
    el('btnZoom').addEventListener('click', function () {
      var st = document.querySelector('.h-stage');
      st.classList.toggle('zoomed');
      var on = st.classList.contains('zoomed');
      el('btnZoom').textContent = on ? '원래대로' : '확대';
      if (on) {
        cv.style.width = '220%'; cv.style.height = 'auto';
        st.scrollLeft = (st.scrollWidth - st.clientWidth) / 2;
        st.scrollTop = 0;
      } else {
        cv.style.width = ''; cv.style.height = '';
        fitCanvas();
      }
    });
    el('btnNew').addEventListener('click', newGame);
    el('btnAgain').addEventListener('click', newGame);
    el('btnNext').addEventListener('click', newGame);
    el('btnCloseResult').addEventListener('click', function () { el('resultPanel').hidden = true; });
    el('btnRules').addEventListener('click', function () { el('rulesPanel').hidden = false; });
    el('btnCloseRules').addEventListener('click', function () { el('rulesPanel').hidden = true; });

    window.addEventListener('resize', fitCanvas);

    newGame();
    fitCanvas();
    selftest();

    (function loop(t) {
      drawScene(t || 0);
      if (hintId && (t || 0) > hintUntil) hintId = null;
      requestAnimationFrame(loop);
    })(0);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
