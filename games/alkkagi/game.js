/* ============================================================
   바둑스쿨 알까기 — 본체 엔진(AlkkagiEngine)을 그대로 쓰는 호스트
   엔진이 요구하는 app 어댑터만 우리가 제공한다.
   ============================================================ */
(function () {
  var SIZE = 19;
  var canvas = document.getElementById('alkkagiBoard');
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;

  var app = {
    canvas: canvas,
    ctx: ctx,
    size: SIZE,
    displaySize: 0,
    cellSize: 0,
    isAlkkagiMode: true,
    boardSkin: 'wood',

    /* 바둑판 배경 + 격자 */
    renderBoardGridOnly: function () {
      var s = this.displaySize, cell = this.cellSize;
      var g = ctx.createLinearGradient(0, 0, s, s);
      g.addColorStop(0, '#F2CE93');
      g.addColorStop(0.5, '#E8B96A');
      g.addColorStop(1, '#DDA751');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);

      ctx.strokeStyle = 'rgba(110, 74, 30, .8)';
      ctx.lineWidth = Math.max(1, s / 640);
      for (var i = 1; i <= SIZE; i++) {
        ctx.beginPath(); ctx.moveTo(i * cell, cell); ctx.lineTo(i * cell, SIZE * cell); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cell, i * cell); ctx.lineTo(SIZE * cell, i * cell); ctx.stroke();
      }

      /* 화점 */
      [4, 10, 16].forEach(function (a) {
        [4, 10, 16].forEach(function (b) {
          ctx.beginPath();
          ctx.arc(a * cell, b * cell, Math.max(2, s / 240), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(110, 74, 30, .9)';
          ctx.fill();
        });
      });
    },

    /* 돌 그리기 */
    drawCharacterStone: function (x, y, r, color) {
      var grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      if (color === 1) {
        grad.addColorStop(0, '#6e6e6e');
        grad.addColorStop(0.55, '#1c1c1c');
        grad.addColorStop(1, '#070707');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#f4f4f4');
        grad.addColorStop(1, '#d3d3d3');
      }
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = 'rgba(0,0,0,.4)';
      ctx.shadowBlur = r * 0.5;
      ctx.shadowOffsetY = r * 0.14;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
    }
  };

  var engine = new AlkkagiEngine(app);

  /* ---------- 크기 ---------- */
  function layout() {
    var isMobile = window.innerWidth <= 900;
    var avail;
    if (isMobile) {
      /* 모바일/태블릿: 상단 여백을 살려 화면 폭에 맞춘 시원한 30% 확대 */
      avail = Math.min(window.innerWidth - 24, window.innerHeight * 0.62);
    } else {
      /* PC: 여백을 최소화하여 큼직하고 시원한 30% 확대 바둑판 */
      var col = canvas.parentElement.getBoundingClientRect();
      avail = Math.min(col.width - 20, col.height - 20);
      avail = Math.min(avail, 1020);
    }
    avail = Math.max(340, Math.round(avail));
    if (window.innerWidth < 360) avail = window.innerWidth - 16;

    app.displaySize = avail;
    app.cellSize = avail / (SIZE + 1);

    canvas.width = Math.round(avail * dpr);
    canvas.height = Math.round(avail * dpr);
    canvas.style.width = avail + 'px';
    canvas.style.height = avail + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (engine && engine.render) engine.render();
  }

  /* ---------- 입력 ---------- */
  function point(e) {
    var rect = canvas.getBoundingClientRect();
    var sx = app.displaySize / rect.width;
    var sy = app.displaySize / rect.height;
    return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
  }

  canvas.addEventListener('mousedown', function (e) {
    var p = point(e);
    engine.handlePointerDown(p.x, p.y);
  });
  canvas.addEventListener('mousemove', function (e) {
    var p = point(e);
    engine.handlePointerMove(p.x, p.y);
  });
  window.addEventListener('mouseup', function () {
    engine.handlePointerUp();
  });

  canvas.addEventListener('touchstart', function (e) {
    e.preventDefault();
    var t = e.touches[0];
    var p = point(t);
    if (engine.isPlacingCustom) engine.handlePlacementPointerDown(p.x, p.y);
    else engine.handlePointerDown(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
    var t = e.touches[0];
    var p = point(t);
    if (engine.isPlacingCustom) engine.handlePlacementPointerMove(p.x, p.y);
    else engine.handlePointerMove(p.x, p.y);
  }, { passive: false });

  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    if (engine.isPlacingCustom) engine.handlePlacementPointerUp();
    else engine.handlePointerUp();
  }, { passive: false });

  /* ---------- 버튼 ---------- */
  function on(sel, handler) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.addEventListener('click', function () { handler(el); });
    });
  }

  on('[data-alkkagi-mode]', function (btn) {
    document.querySelectorAll('[data-alkkagi-mode]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var mode = btn.dataset.alkkagiMode;
    var diffRow = document.getElementById('alkkagiDiffRow');
    var colorBox = document.getElementById('alkkagiColorBox');
    if (diffRow) diffRow.style.display = (mode === 'ai') ? 'flex' : 'none';
    if (colorBox) colorBox.style.display = (mode === 'ai') ? 'flex' : 'none';
    engine.mode = mode;
    engine.initGame();
  });

  on('[data-alkkagi-diff]', function (btn) {
    document.querySelectorAll('[data-alkkagi-diff]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    engine.difficulty = btn.dataset.alkkagiDiff || 'normal';
    try { localStorage.setItem('jh_alkkagi_difficulty', engine.difficulty); } catch (e) {}
  });

  on('[data-alkkagi-color]', function (btn) {
    document.querySelectorAll('[data-alkkagi-color]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    engine.playerColor = parseInt(btn.dataset.alkkagiColor, 10) || 1;
    engine.initGame();
  });

  on('[data-formation]', function (btn) {
    document.querySelectorAll('[data-formation]').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var type = btn.dataset.formation || 'line5';

    if (type === 'custom') { engine.enterCustomPlacement(); return; }

    var customBox = document.getElementById('alkkagiCustomBox');
    if (customBox) customBox.style.display = 'none';
    var btnEdit = document.getElementById('btnAlkkagiEditPlacement');
    if (btnEdit) btnEdit.style.display = 'none';
    var btnRestart = document.getElementById('btnAlkkagiRestart');
    if (btnRestart) btnRestart.textContent = '🔄 새로 시작';

    engine.isPlacingCustom = false;
    engine.formation = type;
    engine.initGame();
  });

  on('.custom-tool-btn', function (btn) {
    if (btn.dataset.tool) engine.setCustomTool(btn.dataset.tool);
  });

  on('.custom-preset-btn[data-preset]', function (btn) {
    engine.loadPresetCustom(parseInt(btn.dataset.preset, 10) || 5);
  });

  var btnClear = document.querySelector('.custom-tool-btn.clear, [data-tool="clear"]');
  if (btnClear) btnClear.addEventListener('click', function () { engine.clearAllCustomStones(); });

  var btnStartCustom = document.getElementById('btnAlkkagiStartCustomMatch');
  if (btnStartCustom) btnStartCustom.addEventListener('click', function () { engine.startCustomMatch(); });

  var btnEditPlacement = document.getElementById('btnAlkkagiEditPlacement');
  if (btnEditPlacement) btnEditPlacement.addEventListener('click', function () { engine.enterCustomPlacement(); });

  var btnRestart = document.getElementById('btnAlkkagiRestart');
  if (btnRestart) btnRestart.addEventListener('click', function () { engine.initGame(); });

  /* 저장된 난이도 복원 */
  try {
    var saved = localStorage.getItem('jh_alkkagi_difficulty');
    if (saved) {
      engine.difficulty = saved;
      document.querySelectorAll('[data-alkkagi-diff]').forEach(function (b) {
        b.classList.toggle('active', b.dataset.alkkagiDiff === saved);
      });
    }
  } catch (e) {}

  /* 엔진이 자체 rAF 루프를 돌리므로 중복 루프 없음 */

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'bk:audio' || !window.badukAudio) return;
    try {
      window.badukAudio.setVolume((d.volume || 100) / 100);
      window.badukAudio.enabled = !!d.enabled;
      if (d.soundType) window.badukAudio.setSoundType(d.soundType);
    } catch (err) {}
  });

  window.addEventListener('resize', layout);

  layout();
  engine.initGame();
})();
