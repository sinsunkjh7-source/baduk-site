# -*- coding: utf-8 -*-

# 1. Update teacher/index.html
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_board_sec = '''      <!-- 2. 바둑판 스킨 -->
      <section class="settings-sec">
        <h3>🪵 바둑판 스킨</h3>
        <div class="settings-options" data-setting="boardSkin">
          <button type="button" class="opt-card active" data-val="wood">
            <span class="color-dot" style="background:#f6ebd6;border:2px solid #7c481e;"></span>
            <span>정통 비자목 원목판</span>
          </button>
          <button type="button" class="opt-card" data-val="green">
            <span class="color-dot" style="background:#274720;border:2px solid #142710;"></span>
            <span>소프트 그린판</span>
          </button>
          <button type="button" class="opt-card" data-val="sky">
            <span class="color-dot" style="background:#dbeafe;border:2px solid #2563eb;"></span>
            <span>시원한 스카이판</span>
          </button>
        </div>
      </section>'''

new_board_sec = '''      <!-- 2. 바둑판 스킨 -->
      <section class="settings-sec">
        <h3>🪵 바둑판 스킨</h3>
        <div class="settings-options" data-setting="boardSkin">
          <button type="button" class="opt-card active" data-val="wood">
            <span class="color-dot" style="background:#f6ebd6;border:2px solid #7c481e;"></span>
            <span>밝은 비자목</span>
          </button>
          <button type="button" class="opt-card" data-val="darkwood">
            <span class="color-dot" style="background:#deb06c;border:2px solid #5c300c;"></span>
            <span>진한 원목</span>
          </button>
          <button type="button" class="opt-card" data-val="sky">
            <span class="color-dot" style="background:#dbeafe;border:2px solid #2563eb;"></span>
            <span>시원한 스카이</span>
          </button>
        </div>
      </section>'''

html = html.replace(old_board_sec, new_board_sec)
# Bump version query to v10
html = html.replace('v=teacher-panel-v9', 'v=teacher-panel-v10')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated teacher/index.html")

# 2. Update teacher/app.js
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Board skin state init
old_state_skin = "boardSkin: localStorage.getItem('teacher_board_skin') || 'wood',"
new_state_skin = '''boardSkin: (function() {
      var saved = localStorage.getItem('teacher_board_skin');
      if (saved === 'green') return 'darkwood';
      return saved || 'wood';
    })(),'''
js = js.replace(old_state_skin, new_state_skin)

# Board skin drawing
old_board_draw = '''    // 🌟 바둑판 스킨 렌더링 (wood: 정통 비자목, green: 소프트 그린, sky: 시원한 스카이) 🌟
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

new_board_draw = '''    // 🌟 바둑판 스킨 렌더링 (wood: 밝은 비자목, darkwood: 진한 원목 [선명한 세로 나뭇결], sky: 시원한 스카이) 🌟
    var boardBorderColor = '#7c481e';
    if (state.boardSkin === 'darkwood') {
      // 🌟 [원장님 지침] 1번보다 진한 바둑판 & 세로 나뭇결이 또렷하게 잘 보이는 바둑판 🌟
      ctx.fillStyle = '#deb06c';
      ctx.fillRect(0, 0, dispW, dispH);

      ctx.save();
      // 1) 촘촘하고 뚜렷한 세로 나뭇결 스트로크
      for (var gx = 1; gx < dispW; gx += 2.5) {
        var wave = Math.sin(gx * 0.14 + (gx % 7) * 0.5);
        var grainAlpha = 0.045 + 0.05 * (wave * 0.5 + 0.5);
        ctx.strokeStyle = 'rgba(90, 48, 12, ' + grainAlpha + ')';
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, dispH);
        ctx.stroke();
      }
      // 2) 뚜렷한 천연 나이테 결 띠 (세로 리본)
      var deepRibbons = [0.08, 0.18, 0.29, 0.43, 0.58, 0.72, 0.85, 0.95];
      deepRibbons.forEach(function (r, idx) {
        var rx = Math.round(dispW * r);
        ctx.strokeStyle = 'rgba(80, 40, 8, 0.14)';
        ctx.lineWidth = (idx % 2 === 0) ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx, dispH);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.13)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(rx + 1.8, 0);
        ctx.lineTo(rx + 1.8, dispH);
        ctx.stroke();
      });
      ctx.restore();
      boardBorderColor = '#5c300c';
    } else if (state.boardSkin === 'sky') {
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(0, 0, dispW, dispH);
      boardBorderColor = '#2563eb';
    } else {
      // wood: 밝은 비자목
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

js = js.replace(old_board_draw, new_board_draw)

# Grid line color
old_grid = "var gridLineColor = (state.boardSkin === 'green') ? 'rgba(255, 255, 255, 0.82)' : ((state.boardSkin === 'sky') ? '#1e3a8a' : 'rgba(45, 25, 10, 0.85)');"
new_grid = "var gridLineColor = (state.boardSkin === 'darkwood') ? 'rgba(35, 18, 5, 0.92)' : ((state.boardSkin === 'sky') ? '#1e3a8a' : 'rgba(45, 25, 10, 0.85)');"
js = js.replace(old_grid, new_grid)

# Coordinate color
old_coord = "var coordTextColor = (state.boardSkin === 'green') ? '#bbf7d0' : ((state.boardSkin === 'sky') ? '#1e3a8a' : '#6d4218');"
new_coord = "var coordTextColor = (state.boardSkin === 'darkwood') ? '#4a2608' : ((state.boardSkin === 'sky') ? '#1e3a8a' : '#6d4218');"
js = js.replace(old_coord, new_coord)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated teacher/app.js")
