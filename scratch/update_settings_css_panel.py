# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

target_start = "/* 🌟 환경설정 모달 스타일 🌟 */"
idx = css.find(target_start)
assert idx != -1, "Target start comment not found"

new_css_block = '''/* 🌟 환경설정 우측 슬림 플로팅 패널 (메인 화면 실시간 관찰 가능) 🌟 */
.settings-modal[hidden] { display: none !important; }
.settings-modal {
  position: fixed;
  top: 56px;
  right: 18px;
  z-index: 10001;
  pointer-events: none; /* 메인 화면/바둑판 시야 및 상호작용 차단 없음 */
}
.settings-dialog {
  pointer-events: auto;
  background: #ffffff;
  border: 2px solid var(--green);
  border-radius: 14px;
  width: 310px;
  max-width: 92vw;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.22), 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(100vh - 74px);
  animation: panelSlideRight .2s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes panelSlideRight {
  from { opacity: 0; transform: translateX(20px) scale(0.97); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 14px;
  background: var(--green);
  color: #ffffff;
  border-bottom: 2px solid var(--green-deep);
}
.settings-header h2 {
  font-size: 14px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}
.btn-modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #ffffff;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background .15s;
}
.btn-modal-close:hover { background: rgba(255, 255, 255, 0.35); }

.settings-body {
  padding: 10px 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.settings-sec { display: flex; flex-direction: column; gap: 5px; }
.settings-sec h3 {
  font-size: 12px;
  font-weight: 800;
  color: var(--green-deep);
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
}
.settings-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}
[data-setting="boardSkin"].settings-options,
[data-setting="stoneStyle"].settings-options {
  grid-template-columns: repeat(3, 1fr);
}
.opt-card {
  background: #f8fbf4;
  border: 1.5px solid var(--border-light);
  border-radius: 7px;
  padding: 6px 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  text-align: center;
  transition: all .15s;
  line-height: 1.15;
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
  box-shadow: 0 0 0 1.5px var(--green);
}
.color-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.stone-icon-pair { font-size: 14px; line-height: 1; }

/* 볼륨 슬라이더 박스 */
.volume-slider-box {
  background: #f8fbf4;
  border: 1.5px solid var(--border-light);
  border-radius: 7px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.vol-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink);
}
.vol-range {
  width: 100%;
  accent-color: var(--green);
  cursor: pointer;
  height: 4px;
}
.sound-options.settings-options {
  grid-template-columns: repeat(2, 1fr);
}
.sound-options .opt-card {
  padding: 5px 3px;
  font-size: 10.5px;
}

.settings-footer {
  padding: 7px 12px;
  background: #f8fbf4;
  border-top: 1.5px solid var(--border-light);
  display: flex;
  justify-content: flex-end;
}
.settings-footer .btn-primary {
  padding: 5px 12px;
  font-size: 11.5px;
  border-radius: 6px;
}
'''

updated_css = css[:idx] + new_css_block
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(updated_css)

print("Updated teacher/style.css successfully!")
