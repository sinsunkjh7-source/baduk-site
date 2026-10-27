import json, os, sys, re

books_dir = r'C:\Users\sinsu\dev\baduk-site\teacher\data\books'

def check_books(prefix, name):
    files = [f for f in os.listdir(books_dir) if f.startswith(prefix)]
    under_9 = 0
    under_11 = 0
    under_13 = 0
    over_13 = 0
    total = 0
    
    for f in files:
        with open(os.path.join(books_dir, f), 'r', encoding='utf-8') as fp:
            d = json.load(fp)
        for ch in d.get('chapters', []):
            for p in ch.get('problems', []):
                total += 1
                sgf = (p.get('data', '') or '') + (p.get('answer1', '') or '')
                pts = re.findall(r';[BW]\[([a-s]{2})\]', sgf, re.I)
                if not pts:
                    under_9 += 1
                    continue
                xs = [ord(pt[0].lower()) - 97 for pt in pts]
                ys = [ord(pt[1].lower()) - 97 for pt in pts]
                
                # Check BR, BL, TR, TL
                span_x = max(xs) - min(xs) + 1
                span_y = max(ys) - min(ys) + 1
                
                # if raw size is 1 or 2: full 19
                if str(p.get('size')) in ['1', '2']:
                    over_13 += 1
                    continue
                    
                needed_br = max(19 - min(xs), 19 - min(ys))
                needed_bl = max(max(xs) + 1, 19 - min(ys))
                
                if str(p.get('size')) == '7':
                    needed = needed_bl
                else:
                    needed = needed_br
                    
                if needed <= 9:
                    under_9 += 1
                elif needed <= 11:
                    under_11 += 1
                elif needed <= 13:
                    under_13 += 1
                else:
                    over_13 += 1
                    
    print(f"{name}: 총 {total}제")
    print(f"  9줄 이내: {under_9} ({under_9/total*100:.1f}%)")
    print(f"  11줄 이내: {under_11} ({under_11/total*100:.1f}%)")
    print(f"  13줄 이내: {under_13} ({under_13/total*100:.1f}%)")
    print(f"  19줄 (전판/대형): {over_13} ({over_13/total*100:.1f}%)")
    print()

check_books('book_11', '씽크탱크 (11x)')
check_books('book_12', '씽크탱크 (12x)')
check_books('book_14', '논리바둑')
check_books('book_15', '정통바둑')
check_books('book_23', '알파바둑')
