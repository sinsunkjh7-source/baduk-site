# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update state with settings
old_state_settings = '''    coordMode: 'right-bottom',  // 🔤 좌표 회전 모드: 'right-bottom'(우측·하단) | 'left-top'(좌·상) | 'all-four'(전체) | 'none'(숨김)
    showStepNumbers: false,     // 🔢 수순 번호'''

new_state_settings = '''    coordMode: 'right-bottom',  // 🔤 좌표 회전 모드: 'right-bottom'(우측·하단) | 'left-top'(좌·상) | 'all-four'(전체) | 'none'(숨김)
    showStepNumbers: false,     // 🔢 수순 번호

    // 🌟 원장님 4대 환경설정 (바탕화면, 바둑판, 바둑알, 음량) 🌟
    theme: localStorage.getItem('teacher_theme') || 'theme-green',
    boardSkin: localStorage.getItem('teacher_board_skin') || 'wood',
    stoneStyle: localStorage.getItem('teacher_stone_style') || 'classic',
    soundType: localStorage.getItem('baduk_audio_type') || 'classic',
    volume: parseFloat(localStorage.getItem('baduk_audio_volume') || '1.0'),'''

assert old_state_settings in js, "old_state_settings not found"
js = js.replace(old_state_settings, new_state_settings)

# 2. Update drawStone function to support classic, gem, and cute stone styles
old_draw_stone = '''  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    var grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    if (color === 1) {
      grad.addColorStop(0, '#666666');
      grad.addColorStop(0.55, '#1e1e1e');
      grad.addColorStop(1, '#080808');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#f3f3f3');
      grad.addColorStop(1, '#d4d4d4');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = r * 0.4;
    ctx.shadowOffsetY = r * 0.15;
    ctx.fill();
    ctx.restore();
  }'''

new_draw_stone = '''  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    var grad = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.08, cx, cy, r);

    if (state.stoneStyle === 'gem') {
      // 💎 보석 바둑돌: 로열 사파이어(흑) & 로즈 핑크(백)
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
      // 정통 명품 바둑돌
      if (color === 1) {
        grad.addColorStop(0, '#666666');
        grad.addColorStop(0.55, '#1e1e1e');
        grad.addColorStop(1, '#080808');
      } else {
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#f3f3f3');
        grad.addColorStop(1, '#d4d4d4');
      }
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = r * 0.4;
    ctx.shadowOffsetY = r * 0.15;
    ctx.fill();
    ctx.restore();

    // 🐱 앙증 요정돌 모드: 귀여운 눈망울 렌더링
    if (state.stoneStyle === 'cute' && r >= 10) {
      ctx.save();
      var eyeY = cy - r * 0.06;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.30, eyeY, r * 0.18, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.30, eyeY, r * 0.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.beginPath();
      ctx.arc(cx - r * 0.28, eyeY, r * 0.10, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.32, eyeY, r * 0.10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - r * 0.33, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.27, eyeY - r * 0.04, r * 0.04, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }'''

assert old_draw_stone in js, "old_draw_stone not found"
js = js.replace(old_draw_stone, new_draw_stone)

# 3. Update drawBoard to support wood / green / sky boardSkins
old_board_bg_draw = '''    // 🌟 [원장님 지침 1번] 그라데이션 제거, 차분하고 밝은 단색 목재 바탕 (#f6ebd6)
    ctx.fillStyle = '#f6ebd6';
    ctx.fillRect(0, 0, dispW, dispH);

    // 🌟 [원장님 지침 2번] 바둑판에 아주 자연스러운 세로 결 렌더링
    ctx.save();
    // 1) 미세 촘촘한 세로 나뭇결
    for (var gx = 2; gx < dispW; gx += 3) {
      var grainAlpha = 0.015 + 0.02 * Math.sin(gx * 0.19 + (gx % 5));
      ctx.strokeStyle = 'rgba(120, 75, 25, ' + grainAlpha + ')';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, dispH);
      ctx.stroke();
    }
    // 2) 은은한 천연 비자목 나이테 결 (자연스러운 띠)
    var grainRibbons = [0.11, 0.24, 0.39, 0.54, 0.68, 0.83, 0.94];
    grainRibbons.forEach(function (r) {
      var rx = Math.round(dispW * r);
      ctx.strokeStyle = 'rgba(130, 80, 25, 0.04)';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx, dispH);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(rx + 1.5, 0);
      ctx.lineTo(rx + 1.5, dispH);
      ctx.stroke();
    });
    ctx.restore();'''

new_board_bg_draw = '''    // 🌟 바둑판 스킨 렌더링 (wood: 정통 비자목, green: 소프트 그린, sky: 시원한 스카이) 🌟
    var boardBorderColor = '#7c481e';
    if (state.boardSkin === 'green') {
      ctx.fillStyle = '#22421c';
      ctx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#142710';
    } else if (state.boardSkin === 'sky') {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#2563eb';
    } else {
      ctx.fillStyle = '#f6ebd6';
      ctx.fillRect(0, 0, dispW, dispH);

      ctx.save();
      for (var gx = 2; gx < dispW; gx += 3) {
        var grainAlpha = 0.015 + 0.02 * Math.sin(gx * 0.19 + (gx % 5));
        ctx.strokeStyle = 'rgba(120, 75, 25, ' + grainAlpha + ')';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, dispH);
        ctx.stroke();
      }
      var grainRibbons = [0.11, 0.24, 0.39, 0.54, 0.68, 0.83, 0.94];
      grainRibbons.forEach(function (r) {
        var rx = Math.round(dispW * r);
        ctx.strokeStyle = 'rgba(130, 80, 25, 0.04)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, dispH);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(rx + 1.5, 0);
        ctx.lineTo(rx + 1.5, dispH);
        ctx.stroke();
      });
      ctx.restore();
      boardBorderColor = '#7c481e';
    }
    canvas.style.borderColor = boardBorderColor;'''

assert old_board_bg_draw in js, "old_board_bg_draw not found"
js = js.replace(old_board_bg_draw, new_board_bg_draw)

# 4. In drawBoard: grid line & coords color according to boardSkin
old_grid_stroke = '''    // 🌟 [원장님 지침 1번] 테두리 외의 격자선은 얇고 또렷하게 (1px)
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(45, 25, 10, 0.85)';'''

new_grid_stroke = '''    // 🌟 [원장님 지침 1번] 테두리 외의 격자선은 얇고 또렷하게 (1px)
    ctx.lineWidth = 1.0;
    var gridLineColor = (state.boardSkin === 'green') ? 'rgba(255, 255, 255, 0.82)' : ((state.boardSkin === 'sky') ? '#1e3a8a' : 'rgba(45, 25, 10, 0.85)');
    ctx.strokeStyle = gridLineColor;'''

assert old_grid_stroke in js, "old_grid_stroke not found"
js = js.replace(old_grid_stroke, new_grid_stroke)

old_coords_color = '''    // 🌟 [원장님 지침] 바둑판 좌표 회전 표시 (우측하변 -> 좌상 -> 전체 -> 숨김)
    if (state.coordMode !== 'none') {
      ctx.fillStyle = '#6d4218';'''

new_coords_color = '''    // 🌟 [원장님 지침] 바둑판 좌표 회전 표시 (우측하변 -> 좌상 -> 전체 -> 숨김)
    if (state.coordMode !== 'none') {
      var coordTextColor = (state.boardSkin === 'green') ? '#bbf7d0' : ((state.boardSkin === 'sky') ? '#1e3a8a' : '#6d4218');
      ctx.fillStyle = coordTextColor;'''

assert old_coords_color in js, "old_coords_color not found"
js = js.replace(old_coords_color, new_coords_color)

# 5. Add initSettingsModal function and call it
settings_js_func = '''
  /* ---------- 🌟 환경설정 모달 제어 (바탕화면, 바둑판, 바둑알, 음량) 🌟 ---------- */
  function applyTheme(themeName) {
    state.theme = themeName || 'theme-green';
    var stage = document.querySelector('.teacher-stage');
    if (stage) {
      stage.classList.remove('theme-green', 'theme-forest', 'theme-cream', 'theme-slate');
      stage.classList.add(state.theme);
    }
    localStorage.setItem('teacher_theme', state.theme);
  }

  function initSettingsModal() {
    var modal = document.getElementById('settingsModal');
    var btnOpen = document.getElementById('btnOpenSettings');
    var btnClose = document.getElementById('btnCloseSettings');
    var btnSave = document.getElementById('btnSaveSettings');
    var volRange = document.getElementById('volRange');
    var volLabel = document.getElementById('volValLabel');

    applyTheme(state.theme);

    // 열기
    if (btnOpen) {
      btnOpen.addEventListener('click', function () {
        syncModalUI();
        modal.hidden = false;
      });
    }

    // 닫기
    function closeModal() {
      modal.hidden = true;
    }
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnSave) btnSave.addEventListener('click', closeModal);

    // 바탕화면 / 바둑판 / 바둑알 옵션 카드 클릭
    document.querySelectorAll('.settings-options .opt-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var group = card.parentElement;
        var settingType = group.dataset.setting;
        var val = card.dataset.val;

        group.querySelectorAll('.opt-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');

        if (settingType === 'theme') {
          applyTheme(val);
        } else if (settingType === 'boardSkin') {
          state.boardSkin = val;
          localStorage.setItem('teacher_board_skin', val);
          drawBoard();
        } else if (settingType === 'stoneStyle') {
          state.stoneStyle = val;
          localStorage.setItem('teacher_stone_style', val);
          drawBoard();
        } else if (settingType === 'soundType') {
          state.soundType = val;
          if (window.badukAudio) {
            window.badukAudio.setSoundType(val);
            window.badukAudio.playStone(); // 미리듣기
          }
        }
      });
    });

    // 음량 슬라이더
    if (volRange) {
      var currentVol = Math.round((window.badukAudio ? window.badukAudio.volume : state.volume) * 100);
      volRange.value = currentVol;
      if (volLabel) volLabel.textContent = currentVol + '%';

      volRange.addEventListener('input', function () {
        var pct = parseInt(volRange.value, 10);
        if (volLabel) volLabel.textContent = pct + '%';
        var val = pct / 100;
        state.volume = val;
        if (window.badukAudio) window.badukAudio.setVolume(val);
      });

      volRange.addEventListener('change', function () {
        if (window.badukAudio) window.badukAudio.playStone();
      });
    }

    function syncModalUI() {
      document.querySelectorAll('[data-setting="theme"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.theme);
      });
      document.querySelectorAll('[data-setting="boardSkin"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.boardSkin);
      });
      document.querySelectorAll('[data-setting="stoneStyle"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.stoneStyle);
      });
      document.querySelectorAll('[data-setting="soundType"] .opt-card').forEach(function (c) {
        c.classList.toggle('active', c.dataset.val === state.soundType);
      });
      if (volRange) {
        var v = Math.round((window.badukAudio ? window.badukAudio.volume : state.volume) * 100);
        volRange.value = v;
        if (volLabel) volLabel.textContent = v + '%';
      }
    }
  }
'''

assert 'initTeachingToolbar();' in js, "initTeachingToolbar(); not found"
js = js.replace('initTeachingToolbar();', settings_js_func + '\n  initSettingsModal();\n  initTeachingToolbar();')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated teacher/app.js with Settings Modal logic!")
