
 = New-Object -ComObject WScript.Shell
 = .CreateShortcut('C:\Users\sinsu\Desktop\바둑스쿨.lnk')
Write-Output .TargetPath
Write-Output .IconLocation
