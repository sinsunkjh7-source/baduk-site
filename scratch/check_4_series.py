import json, os, sys, re
from collections import Counter
sys.stdout.reconfigure(encoding='utf-8')

books_dir = r'C:\Users\sinsu\dev\baduk-site\teacher\data\books'

# 4대 시리즈:
# 1. 씽크탱크 (116 ~ 129, etc)
# 2. 논리바둑 (144 ~ etc)
# 3. 정통바둑 (155 ~ etc)
# 4. 알파바둑 (231 ~ etc)

series_files = {
    '씽크탱크': [f for f in os.listdir(books_dir) if f.startswith('book_11') or f.startswith('book_12')],
    '논리바둑': [f for f in os.listdir(books_dir) if f.startswith('book_14')],
    '정통바둑': [f for f in os.listdir(books_dir) if f.startswith('book_15')],
    '알파바둑': [f for f in os.listdir(books_dir) if f.startswith('book_23')],
}

for sname, flist in series_files.items():
    raw_sizes = Counter()
    max_coords = Counter()
    total_probs = 0
    for fname in flist:
        fpath = os.path.join(books_dir, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            d = json.load(f)
        for ch in d.get('chapters', []):
            for p in ch.get('problems', []):
                total_probs += 1
                raw_sizes[str(p.get('size', 'NONE'))] += 1
                
                # Check actual SGF points
                all_sgf = (p.get('data', '') or '') + (p.get('answer1', '') or '')
                pts = re.findall(r';[BW]\[([a-s]{2})\]', all_sgf, re.I)
                if pts:
                    xs = [ord(pt[0].lower()) - 97 for pt in pts]
                    ys = [ord(pt[1].lower()) - 97 for pt in pts]
                    # Since standard corner is BR:
                    needed_br = max(19 - min(xs), 19 - min(ys))
                    max_coords[needed_br] += 1

    print(f"=== {sname} (총 {total_probs}제) ===")
    print(f"  size 필드 값: {dict(raw_sizes)}")
    print(f"  우하귀 기준 필요 줄수 분포: {sorted(max_coords.items())[:12]}")
    print()
