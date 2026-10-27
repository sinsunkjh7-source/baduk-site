# -*- coding: utf-8 -*-

# 1. Update teacher/index.html
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add btnOpenSettings into header-right before btnFullscreen
old_header_right = '<div class="header-right">'
new_header_right = '''<div class="header-right">
        <button type="button" id="btnOpenSettings" class="btn-tool" title="환경설정 (바탕화면, 바둑판, 바둑알, 음량)">
          <span>⚙️</span> 환경설정
        </button>'''

assert old_header_right in html, "old_header_right not found"
html = html.replace(old_header_right, new_header_right, 1)

# Add Settings Modal markup before </body>
settings_modal_markup = '''
<!-- 🌟 환경설정 모달 (바탕화면, 바둑판, 바둑알, 음량) 🌟 -->
<div id="settingsModal" class="settings-modal" hidden>
  <div class="settings-dialog">
    <div class="settings-header">
      <h2>⚙️ 환경설정</h2>
      <button type="button" id="btnCloseSettings" class="btn-modal-close" title="닫기">✕</button>
    </div>
    <div class="settings-body">
      <!-- 1. 바탕화면 테마 -->
      <section class="settings-sec">
        <h3>🖼️ 바탕화면 테마</h3>
        <div class="settings-options" data-setting="theme">
          <button type="button" class="opt-card active" data-val="theme-green">
            <span class="color-dot" style="background:#eff7e4;border:2px solid #4a8a3a;"></span>
            <span>싱그러운 연초록</span>
          </button>
          <button type="button" class="opt-card" data-val="theme-forest">
            <span class="color-dot" style="background:#274720;border:2px solid #142710;"></span>
            <span>깊은 대국실 딥그린</span>
          </button>
          <button type="button" class="opt-card" data-val="theme-cream">
            <span class="color-dot" style="background:#fef9ed;border:2px solid #f5a623;"></span>
            <span>따뜻한 웜크림</span>
          </button>
          <button type="button" class="opt-card" data-val="theme-slate">
            <span class="color-dot" style="background:#334155;border:2px solid #0f172a;"></span>
            <span>차분한 슬레이트</span>
          </button>
        </div>
      </section>

      <!-- 2. 바둑판 스킨 -->
      <section class="settings-sec">
        <h3>🪵 바둑판 스킨</h3>
        <div class="settings-options" data-setting="boardSkin">
          <button type="button" class="opt-card active" data-val="wood">
            <span class="color-dot" style="background:#f6ebd6;border:2px solid #7c481e;"></span>
            <span>정통 비자목 원목판</span>
          </button>
          <button type="button" class="opt-card" data-val="green">
            <span class="color-dot" style="background:#274720;border:2px solid #142710;"></span>
            <span>소프트 그린판</span>
          </button>
          <button type="button" class="opt-card" data-val="sky">
            <span class="color-dot" style="background:#dbeafe;border:2px solid #2563eb;"></span>
            <span>시원한 스카이판</span>
          </button>
        </div>
      </section>

      <!-- 3. 바둑알 스타일 -->
      <section class="settings-sec">
        <h3>⚪ 바둑알 스타일</h3>
        <div class="settings-options" data-setting="stoneStyle">
          <button type="button" class="opt-card active" data-val="classic">
            <span class="stone-icon-pair">⚫⚪</span>
            <span>정통 명품돌</span>
          </button>
          <button type="button" class="opt-card" data-val="gem">
            <span class="stone-icon-pair">💎💖</span>
            <span>영롱한 보석돌</span>
          </button>
          <button type="button" class="opt-card" data-val="cute">
            <span class="stone-icon-pair">🐱✨</span>
            <span>앙증 요정돌</span>
          </button>
        </div>
      </section>

      <!-- 4. 음량 & 착수음 -->
      <section class="settings-sec">
        <h3>🔊 음량 및 착수 효과음</h3>
        <div class="volume-slider-box">
          <div class="vol-label-row">
            <span>마스터 볼륨</span>
            <b id="volValLabel">100%</b>
          </div>
          <input type="range" id="volRange" min="0" max="150" value="100" class="vol-range">
        </div>
        <div class="settings-options sound-options" data-setting="soundType">
          <button type="button" class="opt-card active" data-val="classic">
            <span>🎵 명품 바둑돌</span>
          </button>
          <button type="button" class="opt-card" data-val="deep">
            <span>🪵 묵직한 통나무</span>
          </button>
          <button type="button" class="opt-card" data-val="crisp">
            <span>⚡ 경쾌한 딱!</span>
          </button>
          <button type="button" class="opt-card" data-val="pop">
            <span>🫧 귀여운 퐁퐁</span>
          </button>
        </div>
      </section>
    </div>
    <div class="settings-footer">
      <button type="button" id="btnSaveSettings" class="btn-primary">확인 및 닫기</button>
    </div>
  </div>
</div>
'''

html = html.replace('<!-- 정답 / 오답 알림 토스트 -->', settings_modal_markup + '\n<!-- 정답 / 오답 알림 토스트 -->')
html = html.replace('teacher-green-v7', 'teacher-settings-v8')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated teacher/index.html with Settings Modal and v8 cache buster!")
