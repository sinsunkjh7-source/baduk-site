import os
import subprocess

ico_path = os.path.abspath('baduk/app_icon_tile.ico')

# Targets on Desktop
desktops = [
    os.path.join(os.environ['USERPROFILE'], 'OneDrive', '바탕 화면'),
    os.path.join(os.environ['USERPROFILE'], 'Desktop')
]

for d in desktops:
    if os.path.exists(d):
        lnk_path = os.path.join(d, '바둑스쿨 (BadukSchool).lnk')
        # Use powershell to create shortcut with icon
        ps_cmd = f'''
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut('{lnk_path}')
$Shortcut.TargetPath = 'http://badukschool.com'
$Shortcut.IconLocation = '{ico_path}, 0'
$Shortcut.Description = '바둑스쿨 공식 사이트 (badukschool.com)'
$Shortcut.Save()
'''
        subprocess.run(['powershell', '-NoProfile', '-Command', ps_cmd], check=True)
        print('Created shortcut:', lnk_path)
