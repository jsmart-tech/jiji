@echo off
cd /d "%~dp0web"
echo Starting Jsmart web app...
echo Once you see "Ready", open http://localhost:3001 in your browser.
echo Keep this window open - closing it stops the server.
echo.
npm run dev
pause
