# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace btnToggleFree block
p1 = js.find("document.getElementById('btnToggleFree')")
p2 = js.find("document.getElementById('btnFullscreen')")
assert p1 != -1 and p2 != -1, "p1 or p2 not found"

new_toggle_free = '''var btnToggleFree = document.getElementById('btnToggleFree');
  if (btnToggleFree) {
    btnToggleFree.addEventListener('click', function () {
      state.freeMode = !state.freeMode;
      if (freeModeStatus) freeModeStatus.textContent = state.freeMode ? 'ON' : 'OFF';
      this.classList.toggle('active', state.freeMode);
      toast(state.freeMode ? '✏️ 자유 시연 모드 켜짐' : '학습 문제 모드 복귀');
    });
  }

  '''

js = js[:p1] + new_toggle_free + js[p2:]

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

# drawStone replacement
draw_stone_start = js.find('function drawStone(cx, cy, r, color, alpha) {')
assert draw_stone_start != -1, "drawStone start not found"
# find end of drawStone (before /* ---------- 바둑판 본체 그리기 ---------- */ or function drawBoard)
draw_board_start = js.find('function drawBoard() {')
assert draw_board_start != -1, "drawBoard start not found"

new_draw_stone = '''function drawStone(cx, cy, r, color, alpha) {
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
  }

  '''

# Find the end of drawStone by finding the comment before drawBoard
comment_idx = js.rfind('/* ----------', draw_stone_start, draw_board_start)
if comment_idx == -1:
    comment_idx = draw_board_start

js = js[:draw_stone_start] + new_draw_stone + js[comment_idx:]

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated teacher/app.js successfully!")
