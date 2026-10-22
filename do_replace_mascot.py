with open('baduk/index.html', 'r', encoding='utf-8') as fp:
    lines = fp.readlines()

start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if 'ck-mascot-crew-wrapper' in line:
        start_idx = i - 1 # include comment line if any
    if 'ck-cta-group' in line:
        end_idx = i - 1
        break

print('Replacing from', start_idx, 'to', end_idx)

new_block = '''        <!-- ★ 바둑스쿨 공식 마스코트 흑돌이 & 백돌이 (엄지척 듀오) ★ -->
        <div class="ck-mascot-crew-wrapper" style="height: auto; min-height: 250px; margin: 20px auto 30px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
          <!-- 귀여운 환영 말풍선 -->
          <div style="background: white; border: 2.5px solid #0284c7; padding: 10px 24px; border-radius: 24px; font-weight: 800; font-size: 1.15rem; color: #0369a1; box-shadow: 0 8px 24px rgba(2, 132, 199, 0.22); margin-bottom: 18px; display: inline-flex; align-items: center; gap: 8px;">
            <span>👋 안녕! 우리는 바둑스쿨 요정 흑돌이와 백돌이야! 함께 신나게 놀자! 👍</span>
          </div>
          
          <!-- 3D 흑돌이 & 백돌이 엄지척 캐릭터 (사용자 지정 공식 마스코트) -->
          <div style="position: relative; cursor: pointer; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);" onmouseover="this.style.transform='scale(1.06)'" onmouseout="this.style.transform='scale(1)'" onclick="location.href='characters.html'" title="클릭하면 7인의 캐릭터 도감으로 이동합니다!">
            <img src="app_icon_tile.png" alt="바둑스쿨 공식 마스코트 흑돌이와 백돌이" style="width: 230px; height: 230px; border-radius: 52px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.25); border: 4.5px solid #ffffff;">
            <div style="position: absolute; bottom: -12px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 6px 18px; border-radius: 14px; font-weight: 800; font-size: 0.95rem; box-shadow: 0 4px 14px rgba(0,0,0,0.25); white-space: nowrap;">
              ✨ 7인의 캐릭터 도감 보기 ✨
            </div>
          </div>
        </div>

'''

new_lines = lines[:start_idx] + [new_block] + lines[end_idx:]

with open('baduk/index.html', 'w', encoding='utf-8') as fp:
    fp.writelines(new_lines)

print('Success replacing mascot block!')
