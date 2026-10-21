@echo off
chcp 65001 > nul
title 바둑 어드벤처 - 오프라인 수업 실행기
cls
echo ========================================================
echo   [바둑 어드벤처] 오프라인 수업 전용 실행기
echo   - 인터넷 연결이나 학교 보안 차단과 무관하게 작동합니다.
echo ========================================================
echo.
echo 프로그램을 준비하는 중입니다. 잠시만 기다려 주세요...

set "APP_DIR=%~dp0"
if exist "%~dp0baduk\index.html" (
    set "APP_DIR=%~dp0baduk"
)
if exist "%~dp0index.html" (
    set "APP_DIR=%~dp0"
)

:: 1. 먼저 내장 경량 서버 구동 시도
powershell -WindowStyle Hidden -Command "$p=8080; Set-Location '%APP_DIR%'; $l=New-Object System.Net.HttpListener; $l.Prefixes.Add('http://127.0.0.1:' + $p + '/'); try { $l.Start() } catch { $p=8089; $l=New-Object System.Net.HttpListener; $l.Prefixes.Add('http://127.0.0.1:' + $p + '/'); try { $l.Start() } catch { exit 1 } }; Start-Process ('http://127.0.0.1:' + $p + '/index.html'); while($l.IsListening){ $ctx=$l.GetContext(); $path=$ctx.Request.Url.LocalPath.TrimStart('/'); if([string]::IsNullOrEmpty($path)){$path='index.html'}; if(Test-Path $path){ $bytes=[System.IO.File]::ReadAllBytes($path); $ext=[System.IO.Path]::GetExtension($path).ToLower(); $mime='application/octet-stream'; switch($ext){'.html'{$mime='text/html; charset=utf-8'} '.js'{$mime='application/javascript; charset=utf-8'} '.css'{$mime='text/css; charset=utf-8'} '.json'{$mime='application/json; charset=utf-8'} '.png'{$mime='image/png'} '.jpg'{$mime='image/jpeg'} '.webp'{$mime='image/webp'} '.mp3'{$mime='audio/mpeg'}}; $ctx.Response.ContentType=$mime; $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length) } else { $ctx.Response.StatusCode=404 }; $ctx.Response.Close() }"

:: 2. 만약 학교 PC 보안으로 파워셸 서버가 차단된 경우 -> 즉시 브라우저로 직접 실행!
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [안내] 학교 보안 환경에 맞춰 직접 실행 모드로 전환합니다...
    start "" "%APP_DIR%\index.html"
)

echo.
echo [성공] 웹 브라우저가 실행되었습니다!
echo (수업이 끝난 후 이 검은 창을 닫아주시면 됩니다.)
echo.
pause
