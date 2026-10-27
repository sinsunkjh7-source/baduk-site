# Test drawing 9 horizontal lines and 10 vertical lines with open line ends (열린 선)
import json, re

# Let's inspect problem 1 and 7 and 9 of 씽크탱크 1 with:
# cols = 10 (세로선 10개, x = 0..9)
# rows = 9  (가로선 9개, y = 0..8)
# shiftX = 9  (maps SGF x 9..18 to 0..9)
# shiftY = 10 (maps SGF y 10..18 to 0..8)

with open(r'C:\Users\sinsu\dev\baduk-site\teacher\data\books\book_116.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for idx in [0, 1, 4, 6, 8, 9]:
    p = d['chapters'][0]['problems'][idx]
    all_sgf = (p.get('data', '') or '') + (p.get('answer1', '') or '')
    pts = re.findall(r';([BW])\[([a-s]{2})\]', all_sgf, re.I)
    
    mapped_pts = []
    for col, coord in pts:
        x_19 = ord(coord[0].lower()) - 97
        y_19 = ord(coord[1].lower()) - 97
        x_mapped = x_19 - 9
        y_mapped = y_19 - 10
        mapped_pts.append((col, x_mapped, y_mapped, (0 <= x_mapped < 10 and 0 <= y_mapped < 9)))
        
    print(f"Prob {idx+1} (code {p.get('code')}): all fit? {all(mp[3] for mp in mapped_pts)}")
    for mp in mapped_pts:
        print(f"  {mp[0]}: mapped=({mp[1]}, {mp[2]}), valid={mp[3]}")
