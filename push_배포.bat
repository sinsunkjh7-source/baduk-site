@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 업로드 중입니다. 로그인 창이 뜨면 GitHub 로그인을 완료하세요.
git push origin gh-pages
echo.
if %ERRORLEVEL%==0 (echo [완료] 1~2분 뒤 사이트에 반영됩니다.) else (echo [실패] 위 메시지를 확인하세요.)
pause
