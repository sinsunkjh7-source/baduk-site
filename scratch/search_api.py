import os, sys
sys.stdout.reconfigure(encoding='utf-8')

root_dir = r'c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작'

for root, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith(('.js', '.py', '.php', '.html', '.md')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fp:
                    c = fp.read()
                    if 'asoosoft' in c or 'badukstudy' in c:
                        for l in c.split('\n'):
                            if any(k in l for k in ['http', 'api', 'url', 'fetch', 'ajax', 'asoosoft']):
                                print(f"{f}: {l.strip()[:100]}")
            except:
                pass
