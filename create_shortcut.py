import os

candidates = [
    os.path.join(os.environ['USERPROFILE'], 'Desktop'),
    os.path.join(os.environ['USERPROFILE'], 'OneDrive', '바탕 화면'),
    os.path.join(os.environ['USERPROFILE'], 'OneDrive', 'Desktop'),
    os.path.join(os.environ['USERPROFILE'], '바탕 화면')
]

desktop_paths = [p for p in candidates if os.path.exists(p)]
if not desktop_paths:
    desktop_paths = [candidates[0]]

target_path = r"c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\baduk\index.html"
icon_path = r"c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\gomoku\app_icon.ico"
work_dir = r"c:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\baduk"

for dt in desktop_paths:
    shortcut_path = os.path.join(dt, "바둑 어드벤처 (1단원).lnk")
    vbs_content = f'''Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = "{shortcut_path}"
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = "{target_path}"
oLink.WorkingDirectory = "{work_dir}"
oLink.Description = "바둑 어드벤처 - 제1단원: 초원의 숨구멍과 단수"
oLink.IconLocation = "{icon_path},0"
oLink.Save
'''
    vbs_path = os.path.join(work_dir, "make_lnk.vbs")
    with open(vbs_path, "w", encoding="cp949") as f:
        f.write(vbs_content)

    os.system(f'cscript //nologo "{vbs_path}"')
    if os.path.exists(vbs_path):
        os.remove(vbs_path)
    print(f"Created shortcut at: {shortcut_path}")
