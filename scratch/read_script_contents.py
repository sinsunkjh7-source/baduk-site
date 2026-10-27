import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        idx = obj.get('step_index', 0)
        if idx in [21584, 21588, 21592, 21596, 21600, 21604, 21610, 21623]:
            for tc in obj.get('tool_calls', []):
                print(f"=== STEP {idx} ===")
                print(tc.get('args', {}).get('Content'))
