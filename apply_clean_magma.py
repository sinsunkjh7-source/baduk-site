with open('baduk/game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace the isMagma block inside render()
import re

old_magma_pattern = r'if \(isMagma\) \{.*?\}(?=\s*else if \(isSky\))'

new_magma_block = '''if (isMagma) {
      // 🌋 [마그마 어드벤처 흙길 바둑판 - 대표님 지침 완전 반영]
      // 1. 바둑판 사각의 정중앙(천원)으로 깊어지는 화산암 대지와 은은한 마그마 열기
      const cx = size / 2;
      const cy = size / 2;

      // 베이스: 중앙으로 갈수록 깊어지는 화산암 및 마그마 심층빛
      const baseGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.65);
      baseGrad.addColorStop(0, '#2e1004'); // 중앙 마그마 심층 온기
      baseGrad.addColorStop(0.45, '#190802');
      baseGrad.addColorStop(1, '#0c0401'); // 외곽 단단한 암석
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. 칸마다 대지 블록 (동그란 마그마 덩어리 전면 제거! 어지러움 없이 평온한 바둑판)
      const totalCells = this.size - 1;
      for (let r = 0; r < totalCells; r++) {
        for (let c = 0; c < totalCells; c++) {
          const x1 = cellSize * (c + 1) + 2.5;
          const y1 = cellSize * (r + 1) + 2.5;
          const w = cellSize - 5;
          const h = cellSize - 5;

          const cellCx = x1 + w / 2;
          const cellCy = y1 + h / 2;
          const distToCenter = Math.hypot(cellCx - cx, cellCy - cy) / (size * 0.5);

          // 화산암 블록 채색 (중앙으로 갈수록 자연스러운 원근 깊이감)
          const rockDark = Math.max(16, Math.min(35, Math.floor(18 + distToCenter * 14)));
          ctx.fillStyle = `rgb(${rockDark + 8}, ${rockDark + 2}, ${rockDark})`;
          ctx.fillRect(x1, y1, w, h);
        }
      }

      // 3. 중앙 집중형 깊이감 섀도우 (Caldera Depression - 분화구 원근감)
      ctx.save();
      const centerDepth = ctx.createRadialGradient(cx, cy, 20, cx, cy, size * 0.52);
      centerDepth.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      centerDepth.addColorStop(0.35, 'rgba(234, 88, 12, 0.15)');
      centerDepth.addColorStop(0.75, 'rgba(0, 0, 0, 0.25)');
      centerDepth.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = centerDepth;
      ctx.fillRect(0, 0, size, size);
      ctx.restore();

      // 4. 심플하고 자연스러운 단일 흙길 격자선 (가운데 선 없음! 교차점 원/십자 전면 제거!)
      const pathWidth = this.size === 19 ? 3.0 : 4.0;
      const dirtColor = '#b45309'; // 따뜻한 황토 흙길 단일선
      const dirtShadow = '#180a03'; // 대지 접지면 그림자

      for (let i = 0; i < this.size; i++) {
        const y = cellSize * (i + 1);
        const startX = cellSize;
        const endX = cellSize * this.size;

        // 밑그림자
        ctx.beginPath();
        ctx.moveTo(startX, y + 1);
        ctx.lineTo(endX, y + 1);
        ctx.strokeStyle = dirtShadow;
        ctx.lineWidth = pathWidth + 1.5;
        ctx.stroke();

        // 흙길 본체 단일선
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.strokeStyle = dirtColor;
        ctx.lineWidth = pathWidth;
        ctx.stroke();
      }

      for (let j = 0; j < this.size; j++) {
        const x = cellSize * (j + 1);
        const startY = cellSize;
        const endY = cellSize * this.size;

        ctx.beginPath();
        ctx.moveTo(x, startY + 1);
        ctx.lineTo(x, endY + 1);
        ctx.strokeStyle = dirtShadow;
        ctx.lineWidth = pathWidth + 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
        ctx.strokeStyle = dirtColor;
        ctx.lineWidth = pathWidth;
        ctx.stroke();
      }

      // 외곽 1선 테두리 마감
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = pathWidth + 0.5;
      ctx.strokeRect(cellSize, cellSize, cellSize * (this.size - 1), cellSize * (this.size - 1));
    }'''

code_new = re.sub(old_magma_pattern, new_magma_block, code, flags=re.DOTALL)

with open('baduk/game.js', 'w', encoding='utf-8') as f:
    f.write(code_new)

print('Updated game.js with clean magma design!')
