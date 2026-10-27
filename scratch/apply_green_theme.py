# -*- coding: utf-8 -*-

css_content = '''/* ============================================================
   바둑스쿨 강사 전용 수업 사령탑 스타일시트
   - 바둑스쿨 시그니처: 자연 초록(Green) & 화사한 크림/화이트 테마
   - 12종 시리즈 / 166권 교재 완벽 호환
   ============================================================ */

:root {
  --green: #4a8a3a;
  --green-deep: #2f4a24;
  --green-soft: #eff7e4;
  --paper: #ffffff;
  --ink: #24381a;
  --muted: #4a5d3a;
  --orange: #f5a623;
  --border-light: #dcebd1;
  --border-medium: #cfe0c0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  font-family: "Malgun Gothic", "Apple SD Gothic Neo", system-ui, -apple-system, sans-serif;
  background: var(--green-soft);
  color: var(--ink);
  overflow: hidden;
}

/* ---------- 비밀번호 게이트 (PIN Modal) ---------- */
.pin-gate-modal[hidden] { display: none !important; }
.teacher-app[hidden] { display: none !important; }

.pin-gate-modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(36, 56, 26, 0.7);
  backdrop-filter: blur(8px);
  z-index: 9999;
  padding: 20px;
}
.pin-gate-card {
  background: #ffffff;
  border: 2px solid var(--border-medium);
  border-radius: 20px;
  padding: 38px 34px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 50px rgba(24, 59, 26, 0.25);
}
.pin-gate-icon { font-size: 48px; margin-bottom: 12px; }
.pin-gate-card h2 { font-size: 24px; color: var(--green-deep); margin-bottom: 10px; font-weight: 800; }
.pin-gate-card p { font-size: 14px; color: var(--muted); line-height: 1.6; margin-bottom: 24px; }
.pin-input-wrap { margin-bottom: 20px; }
.pin-input-wrap input {
  width: 100%;
  padding: 14px;
  font-size: 22px;
  text-align: center;
  letter-spacing: 6px;
  background: #f8fbf4;
  border: 2px solid var(--border-medium);
  border-radius: 12px;
  color: var(--ink);
  outline: none;
  font-weight: 800;
  transition: border-color .2s, box-shadow .2s;
}
.pin-input-wrap input:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 4px rgba(74, 138, 58, 0.2);
}
.pin-gate-actions { display: flex; gap: 12px; }
.btn-primary, .btn-secondary {
  flex: 1;
  padding: 13px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.btn-primary { background: var(--green); color: #ffffff; }
.btn-primary:hover { background: var(--green-deep); }
.btn-secondary { background: #e2e8f0; color: #475569; }
.btn-secondary:hover { background: #cbd5e1; }
.pin-error { color: #dc2626; font-size: 13px; margin-top: 12px; font-weight: 700; }

/* ---------- 강사 모드 메인 레이아웃 ---------- */
.teacher-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--green-soft);
}

/* 🌟 상단 시그니처 초록 헤더 (글자 흰색) 🌟 */
.teacher-header {
  height: 56px;
  background: var(--green);
  border-bottom: 1.5px solid var(--green-deep);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex: 0 0 56px;
  box-shadow: 0 2px 8px rgba(24, 59, 26, 0.18);
  color: #ffffff;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.badge-teacher {
  background: #fbbf24;
  color: var(--green-deep);
  font-size: 12px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 999px;
  letter-spacing: .5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.teacher-header h1 { font-size: 17px; font-weight: 800; color: #ffffff; margin: 0; }
.chapter-title-tag { color: #e5f3d8; font-size: 14px; font-weight: 600; }
.header-right { display: flex; align-items: center; gap: 8px; }
.btn-tool {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all .15s;
}
.btn-tool:hover { background: rgba(255, 255, 255, 0.3); color: #ffffff; }
.btn-tool.danger:hover { background: #ef4444; border-color: #dc2626; color: #fff; }
.btn-tool.home { background: var(--orange); border-color: #e09618; color: #fff; font-weight: 800; }
.btn-tool.home:hover { background: #ffb43a; }

/* 메인 본문 바디 */
.teacher-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  background: var(--green-soft);
}

/* 🌟 좌측 사이드바 (화이트 & 그린 악센트) 🌟 */
.teacher-sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 1.5px solid var(--border-light);
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 14px;
  overflow-y: auto;
  flex: 0 0 320px;
  box-shadow: 2px 0 10px rgba(47, 74, 36, 0.05);
}
.sidebar-section { display: flex; flex-direction: column; gap: 6px; }
.sidebar-label { font-size: 12px; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; }
.form-select {
  background: #f8fbf4;
  border: 1.5px solid var(--border-medium);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--ink);
  font-weight: 700;
  outline: none;
  cursor: pointer;
  transition: border-color .15s;
}
.form-select:focus {
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(74, 138, 58, 0.18);
}

.problem-list-section { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.problem-progress { font-size: 13px; font-weight: 800; color: var(--green-deep); }
.problem-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  overflow-y: auto;
  padding-right: 4px;
  max-height: 380px;
}

/* 안 푼 문제 (기본) */
.prob-btn {
  background: #ffffff;
  border: 1.5px solid var(--border-medium);
  border-radius: 8px;
  padding: 7px 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
  text-align: center;
}
.prob-btn:hover {
  background: var(--green-soft);
  color: var(--green-deep);
  border-color: var(--green);
}

/* 푼 문제 (초록색 완료 표시) */
.prob-btn.solved {
  background: #ecfdf5;
  border-color: #10b981;
  color: #047857;
  font-weight: 800;
}
.prob-btn.solved:hover {
  background: #d1fae5;
  color: #065f46;
}

/* 지금 푸는 문제 (골드 활성 표시) */
.prob-btn.active {
  background: linear-gradient(180deg, #ffc65a 0%, #f4a62a 100%) !important;
  border-color: #d98a12 !important;
  color: #ffffff !important;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  box-shadow: 0 2px 8px rgba(244, 166, 42, 0.5);
}
.prob-btn.active.solved {
  background: linear-gradient(180deg, #facc15 0%, #eab308 100%) !important;
  border: 2px solid #059669 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.5);
}

/* 🌟 중앙 메인 수업 스테이지 (화사하고 편안한 미색 초록 바탕) 🌟 */
.teacher-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--green-soft);
  padding: 8px 14px;
  overflow: hidden;
  position: relative;
}

/* 🌟 문제 지문 바 (깔끔한 화이트 카드) 🌟 */
.question-bar {
  background: #ffffff;
  border: 1.5px solid var(--border-light);
  border-radius: 12px;
  padding: 10px 16px;
  margin-bottom: 8px;
  flex: 0 0 auto;
  box-shadow: 0 3px 12px rgba(47, 74, 36, 0.06);
}
.question-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; flex-wrap: wrap; }
.q-num { background: var(--green); color: #fff; font-size: 12px; font-weight: 800; padding: 4px 9px; border-radius: 6px; }
.q-turn { background: var(--orange); color: #fff; font-size: 12px; font-weight: 800; padding: 4px 9px; border-radius: 6px; }
.btn-hint, .btn-answer, .btn-reset {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 11px;
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  transition: all .15s;
}
.btn-hint:hover { background: #e2e8f0; color: var(--ink); }
.btn-answer { background: var(--green); border-color: var(--green-deep); color: #ffffff; margin-left: auto; font-weight: 800; }
.btn-answer:hover { background: var(--green-deep); }
.btn-reset { background: #fff1f2; border-color: #fecdd3; color: #be123c; }
.btn-reset:hover { background: #ffe4e6; }

.question-text {
  font-size: 16px;
  font-weight: 800;
  color: var(--ink);
  line-height: 1.5;
  white-space: pre-line;
}
.hint-box {
  background: #fffbeb;
  border-left: 4px solid var(--orange);
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  margin-top: 8px;
  font-size: 13px;
  color: #92400e;
  font-weight: 700;
}

/* 바둑판 컨테이너 */
.board-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
}
#teachingBoard {
  box-shadow: 0 12px 32px rgba(47, 74, 36, 0.22);
  border-radius: 8px;
  cursor: pointer;
  touch-action: manipulation;
}

/* 🌟 강사용 수업 특수 툴바 (화이트 플레이트 & 그린/골드 버튼) 🌟 */
.teaching-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #ffffff;
  border: 1.5px solid var(--border-medium);
  border-radius: 12px;
  padding: 6px 14px;
  margin-top: 6px;
  flex: 0 0 auto;
  flex-wrap: wrap;
  box-shadow: 0 3px 12px rgba(47, 74, 36, 0.08);
}

.tool-group {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #f4faee;
  padding: 3px 6px;
  border-radius: 8px;
  border: 1px solid var(--border-light);
}

.tool-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #36502f;
  font-size: 13px;
  font-weight: 700;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.tool-btn:hover {
  background: #e2f0d9;
  color: var(--green-deep);
}
.tool-btn.active {
  background: var(--green);
  color: #ffffff;
  border-color: var(--green-deep);
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(74, 138, 58, 0.35);
}
.tool-btn.btn-trial.active {
  background: #10b981;
  color: #ffffff;
  border-color: #059669;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}

/* 🌟 하단 내비게이션 바 (이전 문제 / 다음 문제) 🌟 */
.teaching-controls {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  flex: 0 0 44px;
  padding-top: 6px;
}
.btn-nav {
  background: #ffffff;
  border: 1.5px solid var(--border-medium);
  border-radius: 10px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 800;
  color: var(--green-deep);
  cursor: pointer;
  transition: all .15s;
  box-shadow: 0 2px 6px rgba(47, 74, 36, 0.08);
}
.btn-nav:hover {
  background: #f4faee;
  border-color: var(--green);
}
.btn-nav.primary {
  background: var(--orange);
  color: #ffffff;
  border-color: #d98a12;
  box-shadow: 0 2px 8px rgba(245, 166, 35, 0.4);
}
.btn-nav.primary:hover {
  background: #ffb43a;
}
.problem-nav-indicator {
  font-size: 16px;
  font-weight: 800;
  color: var(--green-deep);
}

/* 토스트 */
.teacher-toast {
  position: fixed;
  left: 50%;
  bottom: 80px;
  transform: translateX(-50%);
  background: rgba(36, 56, 26, 0.95);
  color: #ffffff;
  border: 1.5px solid #fbbf24;
  padding: 12px 24px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  z-index: 10000;
  pointer-events: none;
}
.teacher-toast[hidden] { display: none; }

/* 반응형 */
@media (max-width: 900px) {
  .teacher-app { overflow-y: auto; height: auto; min-height: 100vh; }
  .teacher-body { flex-direction: column; height: auto; }
  .teacher-sidebar { width: 100%; flex: 0 0 auto; max-height: 360px; }
  .teacher-stage { min-height: 80vh; padding: 10px; }
  .board-container { min-height: 60vh; }
}
'''

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(css_content)

print("teacher/style.css rewritten with BadukSchool signature Green theme!")
