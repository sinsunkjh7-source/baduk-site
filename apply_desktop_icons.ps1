$wsh = New-Object -ComObject WScript.Shell
$ico = "C:\Users\sinsu\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\baduk\badukschool_mascot_clean.ico"

# Save multi-size ico from python first if needed
$desktopDirs = @(
    [System.IO.Path]::Combine($env:USERPROFILE, 'Desktop'),
    [System.IO.Path]::Combine($env:USERPROFILE, 'OneDrive', '바탕 화면')
)

foreach ($dir in $desktopDirs) {
    if ([System.IO.Directory]::Exists($dir)) {
        # 1. 바둑스쿨 (BadukSchool).lnk
        $sc1 = $wsh.CreateShortcut([System.IO.Path]::Combine($dir, '바둑스쿨 (BadukSchool).lnk'))
        $sc1.TargetPath = 'http://badukschool.com'
        $sc1.IconLocation = "$ico,0"
        $sc1.Save()

        # 2. 바둑스쿨.lnk
        $sc2 = $wsh.CreateShortcut([System.IO.Path]::Combine($dir, '바둑스쿨.lnk'))
        $sc2.TargetPath = 'http://badukschool.com'
        $sc2.IconLocation = "$ico,0"
        $sc2.Save()

        # 3. ★_바둑스쿨 (badukschool.com 바로가기).url
        $urlFile = [System.IO.Path]::Combine($dir, '★_바둑스쿨 (badukschool.com 바로가기).url')
        if ([System.IO.File]::Exists($urlFile)) {
            $content = "[InternetShortcut]`r`nURL=http://badukschool.com`r`nIconIndex=0`r`nIconFile=$ico`r`n"
            [System.IO.File]::WriteAllText($urlFile, $content, [System.Text.Encoding]::UTF8)
        }
    }
}

# Refresh Windows Icon Cache via SHChangeNotify
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
Write-Host "Desktop icons updated and shell refreshed!"
