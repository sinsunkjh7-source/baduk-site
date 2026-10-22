@echo off
chcp 65001 > nul
title 바둑스쿨 인터넷 자동 배포기
cls
echo ========================================================
echo   [바둑스쿨] badukschool.com 인터넷 최신 자동 업데이트
echo ========================================================
echo.
echo 1. 내 컴퓨터의 최신 파일들을 동기화하는 중입니다...

set "SRC=%USERPROFILE%\OneDrive\문서\#4.프로젝트\7. 바둑 사이트 제작\baduk"
set "DEST=C:\Users\sinsu\dev\baduk-site"

robocopy "%SRC%" "%DEST%" /MIR /XD node_modules .git /XF .git* /NFL /NDL /NJH /NJS > nul

echo 2. badukschool.com 서버로 전송(배포) 중입니다...
cd /d "%DEST%"
git add .
git commit -m "배포: 최신 업데이트 반영" > nul 2>&1
git push origin gh-pages

echo.
echo ========================================================
echo   ★ 성공! badukschool.com 에 최신 내용이 배포되었습니다!
echo   (전 세계 어디서든 badukschool.com 으로 접속하시면 됩니다)
echo ========================================================
echo.
echo 3초 후 브라우저로 사이트를 엽니다...
timeout /t 3 > nul
start http://badukschool.com
