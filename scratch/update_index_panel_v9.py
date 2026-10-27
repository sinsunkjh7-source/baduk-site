# -*- coding: utf-8 -*-
with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace('v=teacher-settings-v8', 'v=teacher-panel-v9')
html = html.replace('확인 및 닫기', '✕ 닫기')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated teacher/index.html version query and button text!")
