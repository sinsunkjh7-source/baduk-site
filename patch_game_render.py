with open('baduk/game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update skin flags
old_flags = "const isGreen = this.boardSkin === 'green';\n    const isSky = this.boardSkin === 'sky';"
new_flags = "const isGreen = this.boardSkin === 'green';\n    const isSky = this.boardSkin === 'sky';\n    const isMagma = this.boardSkin === 'magma';"

if old_flags in code:
    code = code.replace(old_flags, new_flags, 1)
    print('1. Updated skin flags')

# 2. Add magma background drawing before if (isSky)
magma_block = '''    if (isMagma) {
      // 🌋 [마그마 어드벤처 흙길 바둑판 - 대표님 특화 1안 스킨]
      // 1. 깊이감 있는 붉은 화산암 대지 베이스
      const cx = size / 2;
      const cy = size / 2;
      const baseGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, size * 0.72);
      baseGrad.addColorStop(0, '#3a1705');
      baseGrad.addColorStop(0.45, '#220c02');
      baseGrad.addColorStop(1, '#0e0501');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. 바둑판 사각의 정중앙(천원)으로 깊어지는 입체 분화구 마그마 균열 효과
      const totalCells = this.size - 1;
      for (let r = 0; r < totalCells; r++) {
        for (let c = 0; c < totalCells; c++) {
          const cellX = cellSize * (c + 1.5);
          const cellY = cellSize * (r + 1.5);

          // 중앙으로 갈수록 깊어지는 원근감 팩터 (천원에 가까울수록 더 깊고 뜨겁게 이글거림)
          const distToCenter = Math.hypot(cellX - cx, cellY - cy) / (size * 0.52);
          const depthFactor = Math.max(0.35, 1.25 - distToCenter * 0.95);
          const crackRadius = (cellSize * 0.34) * (0.8 + depthFactor * 0.35);

          ctx.save();
          ctx.beginPath();
          ctx.arc(cellX, cellY, crackRadius, 0, Math.PI * 2);

          const magmaGrad = ctx.createRadialGradient(cellX, cellY, 2, cellX, cellY, crackRadius);
          magmaGrad.addColorStop(0, `rgba(254, 240, 138, ${0.92 * depthFactor})`);
          magmaGrad.addColorStop(0.32, `rgba(249, 115, 22, ${0.85 * depthFactor})`);
          magmaGrad.addColorStop(0.75, `rgba(220, 38, 38, ${0.65 * depthFactor})`);
          magmaGrad.addColorStop(1, 'rgba(45, 12, 3, 0)');

          ctx.fillStyle = magmaGrad;
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. 중앙 집중형 깊이감 섀도우 (Caldera Depression - 분화구처럼 중앙이 쑥 들어간 입체 착시)
      ctx.save();
      const centerDepression = ctx.createRadialGradient(cx, cy, 25, cx, cy, size * 0.55);
      centerDepression.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
      centerDepression.addColorStop(0.3, 'rgba(234, 88, 12, 0.18)');
      centerDepression.addColorStop(0.7, 'rgba(0, 0, 0, 0.2)');
      centerDepression.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerDepression;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 4. 굵고 자연스러운 흙길 격자선 (Path Grid)
      const pathWidth = Math.max(6, cellSize * 0.2);

      // 가로 흙길
      for (let i = 0; i < this.size; i++) {
        const y = cellSize * (i + 1);
        const startX = cellSize;
        const endX = cellSize * this.size;

        // 흙길 밑그림자
        ctx.beginPath();
        ctx.moveTo(startX, y + 2);
        ctx.lineTo(endX, y + 2);
        ctx.strokeStyle = '#180a03';
        ctx.lineWidth = pathWidth + 3.5;
        ctx.stroke();

        // 황토 흙길 본체
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = pathWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 흙길 상단 밝은 디딤면 하이라이트
        ctx.beginPath();
        ctx.moveTo(startX, y - 1);
        ctx.lineTo(endX, y - 1);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = pathWidth * 0.55;
        ctx.stroke();
      }

      // 세로 흙길
      for (let j = 0; j < this.size; j++) {
        const x = cellSize * (j + 1);
        const startY = cellSize;
        const endY = cellSize * this.size;

        ctx.beginPath();
        ctx.moveTo(x, startY + 2);
        ctx.lineTo(x, endY + 2);
        ctx.strokeStyle = '#180a03';
        ctx.lineWidth = pathWidth + 3.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = pathWidth;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x - 1, startY);
        ctx.lineTo(x - 1, endY);
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = pathWidth * 0.55;
        ctx.stroke();
      }

      // 5. 안전한 교차로 돌 발판 (돌이 얹히는 안전 구역)
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const px = cellSize * (j + 1);
          const py = cellSize * (i + 1);
          ctx.beginPath();
          ctx.arc(px, py, pathWidth * 0.65, 0, Math.PI * 2);
          ctx.fillStyle = '#a16207';
          ctx.fill();
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      }
    } else if (isSky) {'''

target_sky_branch = "if (isSky) {"
if target_sky_branch in code and "isMagma) {" not in code:
    code = code.replace(target_sky_branch, magma_block, 1)
    print('2. Added magma rendering block to game.js')

# 3. Update star points & coordinate text colors for magma
star_target = "ctx.fillStyle = isSky ? '#1e3a8a' : (isGreen ? '#14532d' : '#5a3d1c');"
star_replacement = "ctx.fillStyle = isMagma ? '#f59e0b' : (isSky ? '#1e3a8a' : (isGreen ? '#14532d' : '#5a3d1c'));"
if star_target in code:
    code = code.replace(star_target, star_replacement, 1)
    print('3. Updated star points color for magma')

coord_target = "ctx.fillStyle = isSky ? '#1e3a8a' : (isGreen ? '#14532d' : 'rgba(70, 45, 20, 0.85)');"
coord_replacement = "ctx.fillStyle = isMagma ? '#fb923c' : (isSky ? '#1e3a8a' : (isGreen ? '#14532d' : 'rgba(70, 45, 20, 0.85)'));"
if coord_target in code:
    code = code.replace(coord_target, coord_replacement, 1)
    print('4. Updated coordinates text color for magma')

with open('baduk/game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('Successfully patched baduk/game.js!')
