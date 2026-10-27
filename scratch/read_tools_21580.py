import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        obj = json.loads(line)
        idx = obj.get('step_index', 0)
        if 21580 <= idx <= 21630:
            if obj.get('tool_calls'):
                for tc in obj.get('tool_calls'):
                    print(f"Step {idx} TOOL: {tc.get('name')} {str(tc.get('args'))[:120]}")
            if obj.get('source') == 'USER_EXPLICIT':
                print(f"Step {idx} USER: {obj.get('content')}")
