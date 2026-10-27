import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\sinsu\.gemini\antigravity\brain\ea5dea20-0869-4b33-9b5e-98aa7963ed2e\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            obj = json.loads(line)
            c = obj.get('content', '')
            if any(w in c for w in ['열린', '가로 세로', '선이 밖으로', '과선', '다이어그램', '열린 선', '바둑판 줄 수']):
                if obj.get('source') == 'USER_EXPLICIT':
                    print(f"USER Step {obj.get('step_index')}: {c}")
        except:
            pass
