import json, sys
sys.stdout.reconfigure(encoding='utf-8')
with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        if obj.get('step_index') > 19400:
            if obj.get('source') == 'USER_EXPLICIT' and obj.get('content'):
                print(f"Step {obj.get('step_index')} [USER]: {str(obj.get('content'))[:100]}")
