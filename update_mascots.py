import re

with open('baduk/index.html', 'r', encoding='utf-8') as fp:
    content = fp.read()

# 1. Replace brand logo
brand_pattern = re.compile(r'<div class="ck-brand"[\s\S]*?</button>', re.MULTILINE)
new_brand = '''<div class="ck-brand" onclick="window.showMainPortal();" title="바둑스쿨 메인 홈" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
            <img src="app_icon_tile.png" alt="바둑스쿨 마스코트" style="width: 38px; height: 38px; border-radius: 9px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); object-fit: cover;">
            <span class="ck-brand-title" style="white-space: nowrap; display: flex; align-items: center; gap: 6px;">바둑스쿨 <span class="ck-brand-badge" style="white-space: nowrap;">BadukKid</span></span>
          </div>

          <button type="button" class="ck-nav-item ck-avatar-btn" onclick="window.openAvatarStudio()" title="나만의 바둑이 캐릭터 만들기" style="white-space: nowrap; flex-shrink: 0;">
            <span class="ck-avatar-circle" id="navAvatarCircle">
              <span class="avatar-face" id="navAvatarFace">😊</span>
            </span>
            <span class="ck-nav-text" style="white-space: nowrap;">내 아바타</span>
          </button>'''

content = brand_pattern.sub(new_brand, content, count=1)

# 2. Replace mascot crew
mascot_pattern = re.compile(r'<div class="ck-mascot-crew-wrapper">[\s\S]*?</div>\s*</div>\s*(?=<div class="ck-cta-group")', re.MULTILINE)

new_mascot = '''<div class="ck-mascot-crew-wrapper" style="height: auto; min-height: 250px; margin: 15px auto 25px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
          <!-- 귀여운 환영 말풍선 -->
          <div style="background: white; border: 2.5px solid #0284c7; padding: 10px 22px; border-radius: 24px; font-weight: 800; font-size: 1.1rem; color: #0369a1; box-shadow: 0 8px 24px rgba(2, 132, 199, 0.22); margin-bottom: 16px; display: inline-flex; align-items: center; gap: 8px;">
            <span>👋 안녕! 우리는 바둑스쿨 요정 흑돌이와 백돌이야! 함께 신나게 놀자! 👍</span>
          </div>
          
          <!-- 3D 흑돌이 & 백돌이 엄지척 캐릭터 (공식 마스코트) -->
          <div style="position: relative; cursor: pointer; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'" onclick="location.href='characters.html'" title="클릭하면 7인의 캐릭터 도감으로 이동합니다!">
            <img src="app_icon_tile.png" alt="바둑스쿨 공식 마스코트 흑돌이와 백돌이" style="width: 220px; height: 220px; border-radius: 48px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25); border: 4px solid #ffffff;">
            <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 5px 16px; border-radius: 14px; font-weight: 800; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(0,0,0,0.25); white-space: nowrap;">
              ✨ 7인의 캐릭터 도감 보기 ✨
            </div>
          </div>
        </div>
'''

content = mascot_pattern.sub(new_mascot, content, count=1)

with open('baduk/index.html', 'w', encoding='utf-8') as fp:
    fp.write(content)

print('Updated baduk/index.html with mascot and fixed navbar!')
