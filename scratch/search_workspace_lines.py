import os, sys, re
sys.stdout.reconfigure(encoding='utf-8')

root_dir = r'c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작'

for root, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith(('.js', '.py', '.md', '.txt')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8') as fp:
                    content = fp.read()
                    if 'overhang' in content.lower() or '과선' in content or '열린 선' in content or '열린선' in content or '가로' in content:
                        for line in content.split('\n'):
                            if any(k in line for k in ['overhang', '과선', '열린', '가로', '세로']):
                                if any(b in line for b in ['선', '줄', '바둑판', 'grid', 'board']):
                                    print(f"{f}: {line.strip()[:100]}")
            except:
                pass
