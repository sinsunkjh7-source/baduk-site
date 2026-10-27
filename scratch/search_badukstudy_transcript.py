import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            c = obj.get('content', '')
            if 'badukstudy' in c and any(w in c for w in ['줄', '바둑판', '규격', '다이어그램', '크기', '9줄', '11줄', '13줄']):
                print(f"Step {obj.get('step_index')}: {c[:300]}\n---")
        except:
            pass
