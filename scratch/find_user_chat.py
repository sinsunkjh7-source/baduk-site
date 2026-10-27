import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get('source') == 'USER_EXPLICIT' and 'content' in obj:
                c = obj['content']
                if any(k in c for k in ['바둑판', '줄 수', '교재', '형태', '줄']):
                    print(f"Step {obj.get('step_index')}: {c}")
        except:
            pass
