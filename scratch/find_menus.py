import sys, re
sys.stdout.reconfigure(encoding='utf-8')

files = [
    r'c:\Users\sinsu\dev\baduk-site\index.html',
    r'c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\badukschool-preview-v4.html',
    r'c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\baduk\index.html'
]

for fpath in files:
    try:
        with open(fpath, 'r', encoding='utf-8') as fp:
            c = fp.read()
        print(f"=== {fpath} ===")
        # Find navigation links or buttons
        navs = re.findall(r'<nav[^>]*>(.*?)</nav>', c, re.DOTALL)
        for n in navs:
            clean = ' | '.join(re.findall(r'<a[^>]*>(.*?)</a>', n, re.DOTALL))
            print("  NAV:", re.sub(r'<[^>]+>', ' ', clean))
        # Find header items
        headers = re.findall(r'<(?:div|ul)[^>]*class=[\'"][^\'"]*(?:menu|nav|toolbar|gnb)[^\'"]*[\'"][^>]*>(.*?)</(?:div|ul)>', c, re.DOTALL)
        for h in headers[:5]:
            links = re.findall(r'<a[^>]*>(.*?)</a>', h, re.DOTALL)
            if links:
                print("  MENU/NAV:", [re.sub(r'<[^>]+>', '', l).strip() for l in links if l.strip()])
    except Exception as e:
        print(f"Error {fpath}: {e}")
