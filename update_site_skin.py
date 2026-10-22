import re

# 1. Update baduk/index.html
with open('baduk/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

btn_target = '<button type="button" class="board-skin-btn" data-skin="sky" title="3. 맑은 하늘과 구름판">☁️ 하늘</button>'
btn_replacement = btn_target + '\n              <button type="button" class="board-skin-btn" data-skin="magma" title="4. 마그마 흙길 어드벤처">🌋 마그마</button>'

if btn_target in html and 'data-skin="magma"' not in html:
    html = html.replace(btn_target, btn_replacement, 1)
    with open('baduk/index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('1. Added magma button to index.html')
else:
    print('1. Magma button already exists or target not found')

# 2. Update baduk/style.css
with open('baduk/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

css_target = '.board-wrapper.skin-sky {'
css_addition = '''.board-wrapper.skin-magma {
  border: 3.5px solid #ea580c !important;
  box-shadow: 0 16px 45px rgba(234, 88, 12, 0.4), inset 0 0 25px rgba(220, 38, 38, 0.35) !important;
  background: #1a0802 !important;
}

.board-wrapper.skin-sky {'''

if css_target in css and 'skin-magma' not in css:
    css = css.replace(css_target, css_addition, 1)
    with open('baduk/style.css', 'w', encoding='utf-8') as f:
        f.write(css)
    print('2. Added skin-magma CSS to style.css')
else:
    print('2. skin-magma CSS already exists or target not found')

# 3. Update baduk/game.js
with open('baduk/game.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Update applyBoardSkin
js_skin_target = "this.boardSkin = (skin === 'green' || skin === 'sky') ? skin : 'wood';"
js_skin_replacement = "this.boardSkin = (skin === 'green' || skin === 'sky' || skin === 'magma') ? skin : 'wood';"

if js_skin_target in js:
    js = js.replace(js_skin_target, js_skin_replacement, 1)
    print('3a. Updated applyBoardSkin valid skins in game.js')

js_toggle_target = "wrapper.classList.toggle('skin-sky', this.boardSkin === 'sky');"
js_toggle_replacement = "wrapper.classList.toggle('skin-sky', this.boardSkin === 'sky');\n      wrapper.classList.toggle('skin-magma', this.boardSkin === 'magma');"

if js_toggle_target in js and "skin-magma" not in js:
    js = js.replace(js_toggle_target, js_toggle_replacement, 1)
    print('3b. Updated wrapper classList toggle in game.js')

with open('baduk/game.js', 'w', encoding='utf-8') as f:
    f.write(js)

print('Finished base updates!')
