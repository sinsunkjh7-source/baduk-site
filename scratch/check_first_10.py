import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\data\books\book_116.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for idx, p in enumerate(d['chapters'][0]['problems'][:10]):
    all_sgf = (p.get('data', '') or '') + (p.get('answer1', '') or '')
    pts = re.findall(r';[BW]\[([a-s]{2})\]', all_sgf, re.I)
    xs = [ord(pt[0].lower()) - 97 for pt in pts]
    ys = [ord(pt[1].lower()) - 97 for pt in pts]
    minX, maxX = min(xs), max(xs)
    minY, maxY = min(ys), max(ys)
    spanX = maxX - minX + 1
    spanY = maxY - minY + 1
    dist_right = 18 - maxX # distance to right edge (1-indexed 19)
    dist_bottom = 18 - maxY # distance to bottom edge
    print(f"Prob {idx+1} (code {p.get('code')}):")
    print(f"  Q: {p.get('question').splitlines()[0]}")
    print(f"  X: [{minX}..{maxX}] (span {spanX}), Y: [{minY}..{maxY}] (span {spanY})")
    print(f"  Dist from bottom-right (18,18): right={dist_right}, bottom={dist_bottom}")
    print(f"  size: {p.get('size')}, data: {p.get('data')}, ans: {p.get('answer1')}")
    print()
