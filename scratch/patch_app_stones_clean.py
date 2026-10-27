# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. State stoneStyle fallback / migration
old_state_stone = "stoneStyle: localStorage.getItem('teacher_stone_style') || 'classic',"
new_state_stone = '''stoneStyle: (function() {
      var saved = localStorage.getItem('teacher_stone_style');
      if (saved === 'gem' || saved === 'cute') return 'cat';
      return saved || 'classic';
    })(),'''
assert old_state_stone in js, "old_state_stone not found"
js = js.replace(old_state_stone, new_state_stone)

# 2. Add sprite preloading
sprite_code = '''  /* 🎨 바둑알 고화질 3D 스프라이트 프리로딩 (고양이, 우주, 흑백 다이아몬드) */
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

# 3. Replace drawStone
p_stone_start = js.find('  function drawStone(cx, cy, r, color, alpha) {')
p_stone_end = js.find('  /* ---------- 착수 인터랙션 ---------- */')
assert p_stone_start != -1 and p_stone_end != -1, "drawStone bounds not found"

new_draw_stone = '''  function drawStone(cx, cy, r, color, alpha) {
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;

    // 🌟 고양이, 우주, 흑백 다이아몬드 고화질 3D 스프라이트 렌더링
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
  }

'''

js = js[:p_stone_start] + new_draw_stone + js[p_stone_end:]

# 4. Safe guard btnToggleFree
old_toggle_start = js.find("  document.getElementById('btnToggleFree').addEventListener('click'")
old_toggle_end = js.find("  document.getElementById('btnFullscreen').addEventListener('click'")
assert old_toggle_start != -1 and old_toggle_end != -1, "btnToggleFree bounds not found"

new_toggle_code = '''  var btnToggleFree = document.getElementById('btnToggleFree');
  if (btnToggleFree) {
    btnToggleFree.addEventListener('click', function () {
      state.freeMode = !state.freeMode;
      if (freeModeStatus) freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
      this.classList.toggle('active', state.freeMode);
      toast(state.freeMode ? '✏️ 자유 시연 모드 켜짐' : '수업 문제 모드로 복귀');
    });
  }

'''

js = js[:old_toggle_start] + new_toggle_code + js[old_toggle_end:]

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated teacher/app.js cleanly!")
