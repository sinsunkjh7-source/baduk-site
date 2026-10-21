@echo off
chcp 65001 > nul
title 바둑 어드벤처 - 브라우저 직접 실행기
cls
echo ========================================================
echo   [바둑 어드벤처] 브라우저 직접 실행기 (비상용)
echo ========================================================
echo.
echo 웹 브라우저를 직접 엽니다...
set "TARGET=%~dp0baduk\index.html"
if not exist "%TARGET%" set "TARGET=%~dp0index.html"
start "" "%TARGET%"
exit
