import os, sys
sys.stdout.reconfigure(encoding='utf-8')

brain = r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e'

for root, dirs, files in os.walk(brain):
    for f in files:
        if f.endswith(('.md', '.js', '.txt')):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fp:
                    c = fp.read()
                    if 'BdkCanvas' in c or 'BdkContent' in c:
                        print(f"Found in: {p}")
            except:
                pass
