import json, os, sys
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

books_dir = r'C:\Users\sinsu\dev\baduk-site\teacher\data\books'

series_sample = {
    '씽크탱크 1': 'book_116.json',
    '씽크탱크 2': 'book_117.json',
    '논리바둑 1': 'book_144.json',
    '정통바둑 입문1': 'book_155.json',
    '바둑나라 A1': 'book_174.json',
    '알파바둑 1': 'book_231.json',
    '파워씽크 1': 'book_242.json',
}

for name, fname in series_sample.items():
    fpath = os.path.join(books_dir, fname)
    if not os.path.exists(fpath):
        continue
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    sizes = Counter()
    total_probs = 0
    samples = []
    
    chapters = data.get('chapters', [])
    for ch in chapters:
        probs = ch.get('problems', [])
        total_probs += len(probs)
        for p in probs:
            s = str(p.get('size', 'NONE'))
            sizes[s] += 1
            if len(samples) < 2:
                samples.append((ch.get('title', ''), p.get('question', ''), s, p.get('data', '')))
                
    print(f"=== {name} ({fname}) ===")
    print(f"  총 단원수: {len(chapters)}, 총 문제수: {total_probs}")
    print(f"  size 필드 분포: {dict(sizes)}")
    for sp in samples:
        print(f"    단원: {sp[0]} | q: {sp[1][:25]}... | size: {sp[2]} | data: {sp[3]}")
    print()
