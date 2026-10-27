import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\data\books\book_116.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

p0 = d['chapters'][0]['problems'][0]
print("Problem 0 keys:", list(p0.keys()))
for k, v in p0.items():
    print(f"  {k}: {repr(v)}")
