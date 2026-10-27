# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update layoutBoard margins
old_layout = '''    var cell = Math.min((availW - 12) / (cols + 0.7), (availH - 12) / (rows + 0.7));
    cell = Math.max(32, Math.min(cell, 115));

    var dispW = Math.round((cols + 0.7) * cell);
    var dispH = Math.round((rows + 0.7) * cell);

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 0.75;
    metrics.startY = cell * 0.75;'''

new_layout = '''    var cell = Math.min((availW - 12) / (cols + 0.85), (availH - 12) / (rows + 0.85));
    cell = Math.max(32, Math.min(cell, 115));

    var dispW = Math.round((cols + 0.85) * cell);
    var dispH = Math.round((rows + 0.85) * cell);

    var dpr = window.devicePixelRatio || 1;
    metrics.cellSize = cell;
    metrics.startX = cell * 0.80;
    metrics.startY = cell * 0.80;'''

assert old_layout in js, "old_layout not found"
js = js.replace(old_layout, new_layout)

# 2. Update coordinate text positions to be centered in outer margin
old_coords = '''      // 상단 가로 좌표 (A, B, C, D...)
      var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      for (var cc = 0; cc < cols; cc++) {
        var lblX = startX + cell * cc;
        ctx.fillText(colLabels[cc] || (cc + 1), lblX, startY - overhang - 8);
      }

      // 좌측 세로 좌표 (1, 2, 3...)
      for (var rr = 0; rr < rows; rr++) {
        var lblY = startY + cell * rr;
        ctx.fillText(rows - rr, startX - overhang - 10, lblY);
      }'''

new_coords = '''      // 상단 가로 좌표 (A, B, C, D...)
      var colLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
      var topCoordY = Math.max(10, Math.round((startY - overhang) * 0.52));
      for (var cc = 0; cc < cols; cc++) {
        var lblX = startX + cell * cc;
        ctx.fillText(colLabels[cc] || (cc + 1), lblX, topCoordY);
      }

      // 좌측 세로 좌표 (1, 2, 3...)
      var leftCoordX = Math.max(10, Math.round((startX - overhang) * 0.52));
      for (var rr = 0; rr < rows; rr++) {
        var lblY = startY + cell * rr;
        ctx.fillText(rows - rr, leftCoordX, lblY);
      }'''

assert old_coords in js, "old_coords not found"
js = js.replace(old_coords, new_coords)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\app.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Coordinates placement perfected!")
