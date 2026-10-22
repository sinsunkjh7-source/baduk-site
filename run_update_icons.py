import os
import base64
import subprocess

desktop_onedrive = os.path.join(os.environ['USERPROFILE'], 'OneDrive', '바탕 화면')
desktop_local = os.path.join(os.environ['USERPROFILE'], 'Desktop')
ico = os.path.abspath('baduk/badukschool_mascot_clean.ico')

ps_template = """
$wsh = New-Object -ComObject WScript.Shell
$ico = "__ICO__"

$dirs = @("__DIR1__", "__DIR2__")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        $targets = @(
            '바둑스쿨.lnk',
            '바둑스쿨 (BadukSchool).lnk'
        )
        foreach ($t in $targets) {
            $scPath = Join-Path $dir $t
            $sc = $wsh.CreateShortcut($scPath)
            $sc.TargetPath = 'http://badukschool.com'
            $sc.IconLocation = "$ico,0"
            $sc.Save()
            Write-Host "Created: $scPath"
        }
        
        $urlFile = Join-Path $dir '★_바둑스쿨 (badukschool.com 바로가기).url'
        $content = "[InternetShortcut]`r`nURL=http://badukschool.com`r`nIconIndex=0`r`nIconFile=$ico`r`n"
        [System.IO.File]::WriteAllText($urlFile, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Updated: $urlFile"
    }
}

$code = @'
using System;
using System.Runtime.InteropServices;
public class ShellRefresh {
    [DllImport("shell32.dll")]
    public static extern void SHChangeNotify(int wEventId, int uFlags, IntPtr dwItem1, IntPtr dwItem2);
    public static void Refresh() {
        SHChangeNotify(0x08000000, 0x0000, IntPtr.Zero, IntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[ShellRefresh]::Refresh()
"""

ps_code = ps_template.replace("__ICO__", ico).replace("__DIR1__", desktop_onedrive).replace("__DIR2__", desktop_local)
encoded = base64.b64encode(ps_code.encode('utf-16le')).decode('ascii')
res = subprocess.run(['powershell', '-NoProfile', '-EncodedCommand', encoded], capture_output=True, text=True)
print(res.stdout)
print(res.stderr)
