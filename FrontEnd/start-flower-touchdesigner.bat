@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the LTS version from https://nodejs.org/
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing website files...
  call npm install
  if errorlevel 1 goto :error
)

echo Building Flower Journey...
call npm run build
if errorlevel 1 goto :error

echo.
echo Keep this window open while the website and TouchDesigner are running.
echo Press Ctrl+C to stop.
echo.
node touchdesigner-server.mjs
exit /b %errorlevel%

:error
echo.
echo The website could not be started.
pause
exit /b 1
