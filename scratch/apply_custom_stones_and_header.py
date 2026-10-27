# -*- coding: utf-8 -*-

# 1. Update teacher/index.html
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Remove 자유시연모드 from header
old_free_btn = '<button type="button" id="btnToggleFree" class="btn-tool" title="자유롭게 돌을 놓아볼 수 있는 모드">✏️ 자유 시연 모드: <span id="freeModeStatus">OFF</span></button>'
assert old_free_btn in html, "old_free_btn not found"
html = html.replace(old_free_btn + '\n      ', '')

# Update stone style options in settings modal
old_stone_sec = '''      <!-- 3. 바둑알 스타일 -->
      <section class="settings-sec">
        <h3>⚪ 바둑알 스타일</h3>
        <div class="settings-options" data-setting="stoneStyle">
          <button type="button" class="opt-card active" data-val="classic">
            <span class="stone-icon-pair">⚫⚪</span>
            <span>정통 명품돌</span>
          </button>
          <button type="button" class="opt-card" data-val="gem">
            <span class="stone-icon-pair">💎💖</span>
            <span>영롱한 보석돌</span>
          </button>
          <button type="button" class="opt-card" data-val="cute">
            <span class="stone-icon-pair">🐱✨</span>
            <span>앙증 요정돌</span>
          </button>
        </div>
      </section>'''

new_stone_sec = '''      <!-- 3. 바둑알 스타일 -->
      <section class="settings-sec">
        <h3>⚪ 바둑알 스타일</h3>
        <div class="settings-options" data-setting="stoneStyle">
          <button type="button" class="opt-card active" data-val="classic">
            <span class="stone-icon-pair">⚫⚪</span>
            <span>정통 명품돌</span>
          </button>
          <button type="button" class="opt-card" data-val="cat">
            <span class="stone-icon-pair">🐱🐾</span>
            <span>고양이</span>
          </button>
          <button type="button" class="opt-card" data-val="galaxy">
            <span class="stone-icon-pair">🌌✨</span>
            <span>우주</span>
          </button>
          <button type="button" class="opt-card" data-val="crystal">
            <span class="stone-icon-pair">💎🤍</span>
            <span>흑백 다이아몬드</span>
          </button>
        </div>
      </section>'''

assert old_stone_sec in html, "old_stone_sec not found"
html = html.replace(old_stone_sec, new_stone_sec)

# Bump version to v12
html = html.replace('v=teacher-panel-v11', 'v=teacher-panel-v12')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated teacher/index.html")

# 2. Update teacher/style.css
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

old_style_opts = '''[data-setting="boardSkin"].settings-options,
[data-setting="stoneStyle"].settings-options {
  grid-template-columns: repeat(3, 1fr);
}'''

new_style_opts = '''[data-setting="boardSkin"].settings-options {
  grid-template-columns: repeat(3, 1fr);
}
[data-setting="stoneStyle"].settings-options {
  grid-template-columns: repeat(2, 1fr);
}'''

assert old_style_opts in css, "old_style_opts not found"
css = css.replace(old_style_opts, new_style_opts)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(css)
print("Updated teacher/style.css")

# 3. Update teacher/app.js
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Safe guard btnToggleFree
old_toggle_free = '''  document.getElementById('btnToggleFree').addEventListener('click', function () {
    state.freeMode = !state.freeMode;
    freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
    this.classList.toggle('active', state.freeMode);
    toast(state.freeMode ? '✏️ 자유 시연 모드 켜짐 (임의 착수 가능)' : '학습 문제 풀이 모드 복귀');
  });'''

new_toggle_free = '''  var btnToggleFree = document.getElementById('btnToggleFree');
  if (btnToggleFree) {
    btnToggleFree.addEventListener('click', function () {
      state.freeMode = !state.freeMode;
      if (freeModeStatus) freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
      this.classList.toggle('active', state.freeMode);
      toast(state.freeMode ? '✏️ 자유 시연 모드 켜짐' : '학습 문제 모드 복귀');
    });
  }'''

assert old_toggle_free in js, "old_toggle_free not found"
js = js.replace(old_toggle_free, new_toggle_free)

# Sprite preloading
sprite_code = '''  /* 🎨 바둑알 고화질 스프라이트 프리로딩 (고양이, 우주, 흑백 다이아몬드) */
  var stoneSprites = {};
  var spriteUrls = {
    cat_1: 'images/stone_cat_b.png',
    cat_2: 'images/stone_cat_w.png',
    galaxy_1: 'images/stone_galaxy_b.png',
    galaxy_2: 'images/stone_galaxy_w.png',
    crystal_1: 'images/stone_crystal_b.png',
    crystal_2: 'images/stone_crystal_w.png'
  };
  Object.keys(spriteUrls).forEach(function (key) {
    var img = new Image();
    img.src = spriteUrls[key];
    img.onload = function () {
      if (document.getElementById('teachingBoard')) {
        drawBoard();
      }
    };
    stoneSprites[key] = img;
  });
'''

assert 'var pinGate = document.getElementById(\'pinGate\');' in js, "pinGate not found"
js = js.replace('var pinGate = document.getElementById(\'pinGate\');', sprite_code + '\n  var pinGate = document.getElementById(\'pinGate\');')

# drawStone implementation
old_draw_stone = '''  function drawStone(cx, cy, r, color, alpha) {
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

new_draw_stone = '''  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // 🌟 고양이, 우주, 흑백 다이아몬드 스프라이트 렌더링
    var spriteKey = state.stoneStyle + '_' + color;
    var spriteImg = stoneSprites[spriteKey];

    if (spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = r * 0.38;
      ctx.shadowOffsetY = r * 0.14;
      ctx.drawImage(spriteImg, cx - r, cy - r, r * 2, r * 2);
    } else {
      // 정통 명품 바둑돌 (Classic) 3D 입체 그라데이션
      var grad = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.35, r * 0.08, cx, cy, r);
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
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = r * 0.4;
      ctx.shadowOffsetY = r * 0.15;
      ctx.fill();
    }
    ctx.restore();
  }'''

assert old_draw_stone in js, "old_draw_stone not found"
js = js.replace(old_draw_stone, new_draw_stone)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated teacher/app.js successfully!")
