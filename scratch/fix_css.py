with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('height: 52px;', 'height: 44px;')
text = text.replace('flex: 0 0 52px;', 'flex: 0 0 44px;')
text = text.replace('padding-top: 10px;', 'padding-top: 6px;')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\style.css', 'w', encoding='utf-8') as f:
    f.write(text)

print("Updated style.css")
