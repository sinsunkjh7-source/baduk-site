import os
import subprocess

ico = os.path.abspath('baduk/app_icon_tile.ico')
script = """
$wsh = New-Object -ComObject WScript.Shell
$d1 = [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop', '바둑스쿨 (BadukSchool).lnk')
$d2 = [System.IO.Path]::Combine($env:USERPROFILE, 'OneDrive', '바탕 화면', '바둑스쿨 (BadukSchool).lnk')
$ico = '""" + ico + """'

foreach ($p in @($d1, $d2)) {
    $parent = [System.IO.Path]::GetDirectoryName($p)
    if ([System.IO.Directory]::Exists($parent)) {
        $sc = $wsh.CreateShortcut($p)
        $sc.TargetPath = 'http://badukschool.com'
        $sc.IconLocation = "$ico,0"
        $sc.Save()
        Write-Host "Updated: $p"
    }
}
"""
subprocess.run(['powershell', '-Command', script])
