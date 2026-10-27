import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            idx = obj.get('step_index', 0)
            if 19405 <= idx <= 19440:
                print(f"Step {idx} [{obj.get('source')}]: {str(obj.get('content'))[:200]}")
        except:
            pass
