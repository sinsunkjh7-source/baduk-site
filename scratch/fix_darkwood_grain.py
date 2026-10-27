# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_darkwood_block = '''    if (state.boardSkin === 'darkwood') {
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
    }'''

new_darkwood_block = '''    if (state.boardSkin === 'darkwood') {
      // 🌟 [원장님 지침] 1번보다 진한 바둑판 & 어색한 굵은 띠 없이 자연스러운 고운 세로 정목(柾目) 결
      ctx.fillStyle = '#deb06c';
      ctx.fillRect(0, 0, dispW, dispH);

      ctx.save();
      // 자연스럽고 고운 균일 세로 정목 결 (굵은 띠/인위적인 경계선 완전히 제거)
      for (var gx = 1; gx < dispW; gx += 2) {
        var wave = Math.sin(gx * 0.18 + (gx % 5));
        var grainAlpha = 0.035 + 0.04 * (wave * 0.5 + 0.5);
        ctx.strokeStyle = 'rgba(95, 48, 14, ' + grainAlpha + ')';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, dispH);
        ctx.stroke();
      }
      ctx.restore();
      boardBorderColor = '#5c300c';
    }'''

assert old_darkwood_block in js, "old_darkwood_block not found"
js = js.replace(old_darkwood_block, new_darkwood_block)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated teacher/app.js removing deepRibbons and applying fine natural grain!")
