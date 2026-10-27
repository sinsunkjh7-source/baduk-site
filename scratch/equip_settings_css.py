# -*- coding: utf-8 -*-

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Update #teachingBoard with wood frame
old_board_css = '''#teachingBoard {
  box-shadow: 0 12px 32px rgba(47, 74, 36, 0.22);
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
}'''

new_board_css = '''#teachingBoard {
  box-shadow: 0 14px 36px rgba(35, 55, 25, 0.35), 0 3px 8px rgba(0, 0, 0, 0.18);
  border: 4px solid #7c481e;
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
  transition: border-color .2s;
}'''

assert old_board_css in css, "old_board_css not found"
css = css.replace(old_board_css, new_board_css)

# Append Theme Variations & Settings Modal styles at the end
settings_css = '''
/* 🌟 바탕화면 테마 변형 🌟 */
.teacher-stage.theme-green { background: #eff7e4; }
.teacher-stage.theme-forest { background: #1c3617; }
.teacher-stage.theme-cream { background: #fef9ed; }
.teacher-stage.theme-slate { background: #1e293b; }

/* 🌟 환경설정 모달 스타일 🌟 */
.settings-modal[hidden] { display: none !important; }
.settings-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 48, 18, 0.65);
  backdrop-filter: blur(8px);
  z-index: 10001;
  padding: 16px;
}
.settings-dialog {
  background: #ffffff;
  border: 2px solid var(--border-medium);
  border-radius: 20px;
  max-width: 560px;
  width: 100%;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 92vh;
  animation: modalPop .2s ease-out;
}
@keyframes modalPop {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: var(--green);
  color: #ffffff;
  border-bottom: 2px solid var(--green-deep);
}
.settings-header h2 { font-size: 20px; font-weight: 800; margin: 0; }
.btn-modal-close {
  background: transparent;
  border: none;
  color: #ffffff;
  font-size: 20px;
  font-weight: 800;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  line-height: 1;
}
.btn-modal-close:hover { background: rgba(255, 255, 255, 0.2); }

.settings-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.settings-sec { display: flex; flex-direction: column; gap: 8px; }
.settings-sec h3 {
  font-size: 15px;
  font-weight: 800;
  color: var(--green-deep);
  display: flex;
  align-items: center;
  gap: 6px;
}
.settings-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
  gap: 8px;
}
.opt-card {
  background: #f8fbf4;
  border: 2px solid var(--border-light);
  border-radius: 10px;
  padding: 10px 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-align: center;
  transition: all .15s;
}
.opt-card:hover {
  background: #eff7e4;
  border-color: var(--green);
}
.opt-card.active {
  background: #ecfdf5;
  border-color: var(--green);
  color: var(--green-deep);
  font-weight: 800;
  box-shadow: 0 0 0 2px var(--green);
}
.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
}
.stone-icon-pair { font-size: 20px; }

/* 볼륨 슬라이더 박스 */
.volume-slider-box {
  background: #f8fbf4;
  border: 1.5px solid var(--border-light);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.vol-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.vol-range {
  width: 100%;
  accent-color: var(--green);
  cursor: pointer;
  height: 6px;
}

.settings-footer {
  padding: 14px 24px;
  background: #f8fbf4;
  border-top: 1.5px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
}
'''

css += '\n' + settings_css

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("Updated teacher/style.css with Settings Modal & Themes!")
