import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

catalog_path = r'C:\Users\sinsu\dev\baduk-site\teacher\data\catalog.json'
with open(catalog_path, 'r', encoding='utf-8') as f:
    cat = json.load(f)

for idx, sec in enumerate(cat):
    print(f"{idx+1}. {sec.get('title')} (권수: {len(sec.get('books', []))})")
    for b in sec.get('books', [])[:3]:
        print(f"   - {b.get('title')} (code: {b.get('code')})")
