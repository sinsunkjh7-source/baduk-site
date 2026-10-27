# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
replacement = '''<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">'''

html = html.replace(target, replacement)
html = html.replace('style.css?v=teacher-20261027v1', 'style.css?v=teacher-tools-v5')
html = html.replace('audio.js?v=teacher-20261027v1', 'audio.js?v=teacher-tools-v5')
html = html.replace('app.js?v=teacher-20261027v1', 'app.js?v=teacher-tools-v5')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Bumped teacher/index.html to v5")
