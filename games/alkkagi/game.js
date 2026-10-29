/* ============================================================
   바둑스쿨 알까기 — 본체 엔진(AlkkagiEngine)을 그대로 쓰는 호스트
   엔진이 요구하는 app 어댑터만 우리가 제공한다.
   ============================================================ */
(function () {
  var SIZE = 19;
  var canvas = document.getElementById('alkkagiBoard');
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;

  /* 🌟 환경설정 상태 (로컬 스토리지 연동) 🌟 */
  var alkkagiSettings = {
    theme: localStorage.getItem('alkkagi_theme') || localStorage.getItem('baduk_theme') || 'green',
    boardSkin: localStorage.getItem('alkkagi_board_skin') || localStorage.getItem('baduk_board_skin') || 'darkwood',
    stoneStyle: localStorage.getItem('alkkagi_stone_style') || localStorage.getItem('baduk_stone_style') || 'classic',
    volume: parseFloat(localStorage.getItem('alkkagi_audio_volume') || localStorage.getItem('baduk_audio_volume') || '1.0'),
    soundType: localStorage.getItem('alkkagi_audio_type') || localStorage.getItem('baduk_audio_type') || 'classic'
  };

  /* 3D 돌 스프라이트 이미지 */
  var stoneSprites = {};
  var spriteUrls = {
    'cat_1': '../../images/stone_cat_b.png',
    'cat_2': '../../images/stone_cat_w.png',
    'galaxy_1': '../../images/stone_galaxy_b.png',
    'galaxy_2': '../../images/stone_galaxy_w.png',
    'crystal_1': '../../images/stone_crystal_b.png',
    'crystal_2': '../../images/stone_crystal_w.png'
  };
  Object.keys(spriteUrls).forEach(function (k) {
    var img = new Image();
    img.src = spriteUrls[k];
    img.onload = function () { if (engine && engine.render) engine.render(); };
    stoneSprites[k] = img;
  });


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
      if (alkkagiSettings.boardSkin === 'darkwood') {
        ctx.fillStyle = '#deb06c';
        ctx.fillRect(0, 0, s, s);
        ctx.save();
        for (var gx = 1; gx < s; gx += 2) {
          var wave = Math.sin(gx * 0.18 + (gx % 5));
          var grainAlpha = 0.035 + 0.04 * (wave * 0.5 + 0.5);
          ctx.strokeStyle = 'rgba(95, 48, 14, ' + grainAlpha + ')';
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, s);
          ctx.stroke();
        }
        ctx.restore();
      } else if (alkkagiSettings.boardSkin === 'sky') {
        ctx.fillStyle = '#dbeafe';
        ctx.fillRect(0, 0, s, s);
      } else {
        // 밝은 비자목 - 그라데이션 없는 깔끔한 단색 솔리드
        ctx.fillStyle = '#f2cc84';
        ctx.fillRect(0, 0, s, s);
      }

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
      ctx.save();
      var spriteKey = alkkagiSettings.stoneStyle + '_' + color;
      var spriteImg = stoneSprites[spriteKey];

      if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.42)';
        ctx.shadowBlur = r * 0.4;
        ctx.shadowOffsetY = r * 0.14;
        ctx.drawImage(spriteImg, x - r, y - r, r * 2, r * 2);
      } else {
        var grad = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        if (alkkagiSettings.stoneStyle === 'gem') {
          if (color === 1) {
            grad.addColorStop(0, '#dbeafe');
            grad.addColorStop(0.2, '#60a5fa');
            grad.addColorStop(0.5, '#2563eb');
            grad.addColorStop(0.8, '#1e40af');
            grad.addColorStop(1, '#0f172a');
          } else {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.2, '#fdf2f8');
            grad.addColorStop(0.48, '#fbcfe8');
            grad.addColorStop(0.8, '#f472b6');
            grad.addColorStop(1, '#be185d');
          }
        } else {
          if (color === 1) {
            grad.addColorStop(0, '#6e6e6e');
            grad.addColorStop(0.55, '#1c1c1c');
            grad.addColorStop(1, '#070707');
          } else {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.6, '#f4f4f4');
            grad.addColorStop(1, '#d3d3d3');
          }
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,.4)';
        ctx.shadowBlur = r * 0.5;
        ctx.shadowOffsetY = r * 0.14;
        ctx.fill();

        // 귀여운 눈 두개 돌 연출 (cute)
        if (alkkagiSettings.stoneStyle === 'cute') {
          ctx.shadowColor = 'transparent';
          var eyeR = r * 0.18;
          var eyeY = y - r * 0.08;
          var eyeOffsetX = r * 0.28;

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
          ctx.arc(x + eyeOffsetX, eyeY, eyeR, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = (color === 1) ? '#111827' : '#1e3a8a';
          ctx.beginPath();
          ctx.arc(x - eyeOffsetX, eyeY + eyeR * 0.15, eyeR * 0.65, 0, Math.PI * 2);
          ctx.arc(x + eyeOffsetX, eyeY + eyeR * 0.15, eyeR * 0.65, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - eyeOffsetX + eyeR * 0.2, eyeY - eyeR * 0.15, eyeR * 0.3, 0, Math.PI * 2);
          ctx.arc(x + eyeOffsetX + eyeR * 0.2, eyeY - eyeR * 0.15, eyeR * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  };

  var engine = new AlkkagiEngine(app);
  if (window.BKSAlkkagiReactions) window.BKSAlkkagiReactions.bind(engine);

  /* ---------- 크기 ---------- */
  function layout() {
    /* Fit the live board container on all screen sizes; gameplay remains unchanged. */
    var col = canvas.parentElement.getBoundingClientRect();
    var avail = Math.round(Math.max(120, Math.min(col.width - 20, col.height - 20, 1020)));

    var previousSize = app.displaySize;
    if (engine && previousSize > 0 && previousSize !== avail) {
      var ratio = avail / previousSize;
      var seen = new Set();
      function scalePoint(point) {
        if (!point || seen.has(point)) return;
        seen.add(point);
        ['x', 'y', 'vx', 'vy', 'radius', 'dx', 'dy'].forEach(function (key) {
          if (typeof point[key] === 'number') point[key] *= ratio;
        });
      }
      (engine.stones || []).forEach(scalePoint);
      (engine.customSavedStones || []).forEach(scalePoint);
      [engine.dragStone, engine.draggedPlacementStone, engine.dragStart, engine.dragCurrent, engine.dragOffset].forEach(scalePoint);
      if (engine.aiAimPreview) {
        scalePoint(engine.aiAimPreview.stone);
        engine.aiAimPreview.length *= ratio;
      }
    }

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

  /* ---------- 🌟 환경설정 이벤트 바인딩 🌟 ---------- */
  function initAlkkagiSettings() {
    var panel = document.getElementById('settingsPanel');
    var btnOpen = document.getElementById('btnOpenSettings');
    var btnOpenTurn = document.getElementById('btnOpenSettingsTurn');
    var btnClose = document.getElementById('btnCloseSettings');
    if (!panel) return;

    panel.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    panel.addEventListener('touchstart', function (e) { e.stopPropagation(); });
    panel.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });

    function togglePanel(e) {
      if (e) e.stopPropagation();
      panel.hidden = !panel.hidden;
    }

    if (btnOpen) btnOpen.addEventListener('click', togglePanel);
    if (btnOpenTurn) btnOpenTurn.addEventListener('click', togglePanel);
    if (btnClose) {
      btnClose.addEventListener('click', function (e) {
        if (e) e.stopPropagation();
        panel.hidden = true;
      });
    }

    // 테마 복원 및 바인딩
    document.body.className = 'theme-' + alkkagiSettings.theme;
    document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.theme === alkkagiSettings.theme);
      b.addEventListener('click', function () {
        document.querySelectorAll('#optTheme .setting-opt-btn').forEach(function (btn) { btn.classList.remove('active'); });
        b.classList.add('active');
        alkkagiSettings.theme = b.dataset.theme;
        localStorage.setItem('alkkagi_theme', alkkagiSettings.theme);
        localStorage.setItem('baduk_theme', alkkagiSettings.theme);
        document.body.className = 'theme-' + alkkagiSettings.theme;
      });
    });

    // 바둑판 스킨
    document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.skin === alkkagiSettings.boardSkin);
      b.addEventListener('click', function () {
        document.querySelectorAll('#optBoardSkin .setting-opt-btn').forEach(function (btn) { btn.classList.remove('active'); });
        b.classList.add('active');
        alkkagiSettings.boardSkin = b.dataset.skin;
        localStorage.setItem('alkkagi_board_skin', alkkagiSettings.boardSkin);
        localStorage.setItem('baduk_board_skin', alkkagiSettings.boardSkin);
        if (engine && engine.render) engine.render();
      });
    });

    // 바둑알 디자인 (6종)
    document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.stone === alkkagiSettings.stoneStyle);
      b.addEventListener('click', function () {
        document.querySelectorAll('#optStoneStyle .setting-opt-btn').forEach(function (btn) { btn.classList.remove('active'); });
        b.classList.add('active');
        alkkagiSettings.stoneStyle = b.dataset.stone;
        localStorage.setItem('alkkagi_stone_style', alkkagiSettings.stoneStyle);
        localStorage.setItem('baduk_stone_style', alkkagiSettings.stoneStyle);
        if (engine && engine.render) engine.render();
      });
    });

    // 사운드 종류 & 볼륨
    document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.sound === alkkagiSettings.soundType);
      b.addEventListener('click', function () {
        document.querySelectorAll('#optSoundType .setting-opt-btn').forEach(function (btn) { btn.classList.remove('active'); });
        b.classList.add('active');
        alkkagiSettings.soundType = b.dataset.sound;
        localStorage.setItem('alkkagi_audio_type', alkkagiSettings.soundType);
        localStorage.setItem('baduk_audio_type', alkkagiSettings.soundType);
        if (window.badukAudio) {
          window.badukAudio.setSoundType(alkkagiSettings.soundType);
          window.badukAudio.playStone();
        }
      });
    });

    var volumeSlider = document.getElementById('volumeSlider');
    var volumeVal = document.getElementById('volumeVal');
    if (volumeSlider) {
      volumeSlider.value = Math.round(alkkagiSettings.volume * 100);
      if (volumeVal) volumeVal.textContent = volumeSlider.value + '%';
      volumeSlider.addEventListener('input', function () {
        var val = parseInt(volumeSlider.value, 10);
        if (volumeVal) volumeVal.textContent = val + '%';
        alkkagiSettings.volume = val / 100;
        localStorage.setItem('alkkagi_audio_volume', alkkagiSettings.volume);
        localStorage.setItem('baduk_audio_volume', alkkagiSettings.volume);
        if (window.badukAudio) window.badukAudio.setVolume(alkkagiSettings.volume);
      });
    }

    if (window.badukAudio) {
      window.badukAudio.setSoundType(alkkagiSettings.soundType);
      window.badukAudio.setVolume(alkkagiSettings.volume);
    }
  }

  initAlkkagiSettings();

})();