# -*- coding: utf-8 -*-

# 1. Update teacher/index.html
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_board_to_footer = '''      <!-- 대형 수업 바둑판 캔버스 -->
      <div class="board-container" id="boardContainer">
        <canvas id="teachingBoard"></canvas>
      </div>

      <!-- 하단 수업 내비게이션 바 -->'''

new_board_to_footer = '''      <!-- 대형 수업 바둑판 캔버스 -->
      <div class="board-container" id="boardContainer">
        <canvas id="teachingBoard"></canvas>
      </div>

      <!-- 🌟 강사용 수업 특수 툴바 (놓아보기 / 착수모드 / 무르기 / 단수링 / 땀방울 / 좌표 / 수순) 🌟 -->
      <div class="teaching-toolbar" id="teachingToolbar">
        <div class="tool-group">
          <button type="button" class="tool-btn btn-trial" id="btnToggleTrial" title="놓아보기 모드 토글">
            <span>✍️</span> 놓아보기
          </button>
        </div>
        <div class="tool-group placement-group">
          <button type="button" class="tool-btn active" data-place-mode="alternate" title="흑·백 교차 착수">⚫⚪ 교차</button>
          <button type="button" class="tool-btn" data-place-mode="blackOnly" title="흑돌만 연속 착수">⚫ 흑만</button>
          <button type="button" class="tool-btn" data-place-mode="whiteOnly" title="백돌만 연속 착수">⚪ 백만</button>
        </div>
        <div class="tool-group nav-group">
          <button type="button" class="tool-btn" id="btnNavFirst" title="처음으로">|◀</button>
          <button type="button" class="tool-btn" id="btnNavPrev" title="한 수 무르기(뒤로)">◀</button>
          <button type="button" class="tool-btn" id="btnNavNext" title="한 수 앞으로">▶</button>
          <button type="button" class="tool-btn" id="btnNavLast" title="끝으로">▶|</button>
          <button type="button" class="tool-btn" id="btnClearBoard" title="놓아본 돌 비우기">🗑️</button>
        </div>
        <div class="tool-group assist-group">
          <button type="button" class="tool-btn" id="btnToggleAtari" title="단수 맞은 돌 빨간 링 표시">🚨 단수</button>
          <button type="button" class="tool-btn" id="btnToggleSweat" title="단수 돌 3D 땀방울 연출">💦 땀방울</button>
          <button type="button" class="tool-btn" id="btnToggleCoords" title="바둑판 좌표 표시">🔤 좌표</button>
          <button type="button" class="tool-btn" id="btnToggleNumbers" title="착수 수순 번호 표시">🔢 수순</button>
        </div>
      </div>

      <!-- 하단 수업 내비게이션 바 -->'''

assert old_board_to_footer in html, "old_board_to_footer not found"
html = html.replace(old_board_to_footer, new_board_to_footer)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated teacher/index.html")

# 2. Update teacher/style.css
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

toolbar_css = '''
/* 🌟 강사용 수업 특수 툴바 스타일 🌟 */
.teaching-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 5px 12px;
  margin-top: 6px;
  flex: 0 0 auto;
  flex-wrap: wrap;
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #0f172a;
  padding: 3px 6px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.tool-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 9px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tool-btn:hover {
  background: #334155;
  color: #fff;
}
.tool-btn.active {
  background: #fbbf24;
  color: #0f172a;
  border-color: #f59e0b;
  font-weight: 800;
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}
.tool-btn.btn-trial.active {
  background: #10b981;
  color: #fff;
  border-color: #059669;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}
'''

if '.teaching-toolbar' not in css:
    css = css + toolbar_css
    with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print("Updated teacher/style.css")
