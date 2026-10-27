# -*- coding: utf-8 -*-

# 1. Update teacher/style.css
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace .prob-btn styles
old_prob_btn = '''.prob-btn {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 4px;
  font-size: 13px;
  font-weight: 700;
  color: #cbd5e1;
  cursor: pointer;
  transition: all .15s;
  text-align: center;
}
.prob-btn:hover { background: #334155; color: #fff; }
.prob-btn.active { background: #fbbf24; border-color: #f59e0b; color: #1e293b; font-weight: 800; box-shadow: 0 0 10px rgba(251, 191, 36, 0.4); }'''

new_prob_btn = '''/* 안 푼 문제 (기본) */
.prob-btn {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 7px 4px;
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition: all .15s;
  text-align: center;
}
.prob-btn:hover {
  background: #1e293b;
  color: #f8fafc;
  border-color: #475569;
}

/* 푼 문제 (초록색 완료 표시) */
.prob-btn.solved {
  background: rgba(16, 185, 129, 0.16);
  border-color: #059669;
  color: #34d399;
  font-weight: 800;
}
.prob-btn.solved:hover {
  background: rgba(16, 185, 129, 0.28);
  color: #6ee7b7;
}

/* 지금 푸는 문제 (골드 활성 표시) */
.prob-btn.active {
  background: #fbbf24 !important;
  border-color: #f59e0b !important;
  color: #0f172a !important;
  font-weight: 800;
  box-shadow: 0 0 14px rgba(251, 191, 36, 0.6);
}
.prob-btn.active.solved {
  background: #facc15 !important;
  border: 2px solid #059669 !important;
  box-shadow: 0 0 14px rgba(250, 204, 21, 0.65);
}'''

assert old_prob_btn in css, "old_prob_btn not found"
css = css.replace(old_prob_btn, new_prob_btn)

# Tighten teacher-stage & question-bar padding to make board bigger
old_stage = '''.teacher-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #090d16;
  padding: 14px 20px;
  overflow: hidden;
  position: relative;
}

/* 문제 지문 바 */
.question-bar {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 12px 18px;
  margin-bottom: 12px;
  flex: 0 0 auto;
}'''

new_stage = '''.teacher-stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #090d16;
  padding: 8px 14px;
  overflow: hidden;
  position: relative;
}

/* 문제 지문 바 */
.question-bar {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 8px 16px;
  margin-bottom: 8px;
  flex: 0 0 auto;
}'''

assert old_stage in css, "old_stage not found"
css = css.replace(old_stage, new_stage)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print("teacher/style.css updated successfully!")
