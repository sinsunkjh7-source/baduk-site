import json, os, glob, sys, re
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

books_dir = r'C:\Users\sinsu\dev\baduk-site\teacher\data\books'

def analyze_book(fpath):
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    title = data.get('book', os.path.basename(fpath))
    span_counts = Counter()
    size_field_counts = Counter()
    total = 0
    
    for ch in data.get('chapters', []):
        for p in ch.get('problems', []):
            total += 1
            s_field = str(p.get('size', 'NONE'))
            size_field_counts[s_field] += 1
            
            all_sgf = (p.get('data', '') or '') + (p.get('answer1', '') or '')
            pts = []
            for m in re.finditer(r';[BW]\[([a-s]{2})\]', all_sgf, re.I):
                pts.append((ord(m.group(1)[0].lower()) - 97, ord(m.group(1)[1].lower()) - 97))
            if pts:
                xs = [pt[0] for pt in pts]
                ys = [pt[1] for pt in pts]
                span_x = max(xs) - min(xs) + 1
                span_y = max(ys) - min(ys) + 1
                span = max(span_x, span_y)
                
                # Check bounding box from edge if corner
                # e.g., if bottom-right: 19 - min(xs), 19 - min(ys)
                needed_br = max(19 - min(xs), 19 - min(ys))
                needed_tl = max(max(xs) + 1, max(ys) + 1)
                span_counts[(span, needed_br)] += 1
            else:
                span_counts[('EMPTY', 0)] += 1
                
    return title, total, size_field_counts, span_counts

target_books = [
    'book_116.json', # 씽크탱크 1
    'book_117.json', # 씽크탱크 2
    'book_144.json', # 논리바둑 1
    'book_155.json', # 정통바둑 입문1
    'book_174.json', # 바둑나라 A1
    'book_231.json', # 알파바둑 1
]

for b in target_books:
    p = os.path.join(books_dir, b)
    if os.path.exists(p):
        t, tot, s_fields, spans = analyze_book(p)
        print(f"=== {t} ({b}) 총 {tot}제 ===")
        print(f"  size 필드: {dict(s_fields)}")
        print(f"  주요 (스팬, 우하귀 필요줄수): {spans.most_common(5)}")
        print()
