@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required for local preview. Open the GitHub Pages link instead.
  pause
  exit /b 1
)
node server.mjs --open
pause
