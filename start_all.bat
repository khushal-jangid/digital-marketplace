@echo off
title ApexMarket Full-Stack Launcher
color 0A

echo ========================================================
echo        APEXMARKET - FULL STACK LOCAL LAUNCHER
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Verifying MongoDB Atlas Connection...
cd backend
call node scripts\testDb.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] MongoDB Atlas connection failed. Please check your internet or .env settings.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Starting Backend API Server on http://localhost:5000...
start "ApexMarket Backend (Port 5000)" cmd /k "cd /d %~dp0backend && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend App on http://localhost:5173...
start "ApexMarket Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo    🎉 ApexMarket is Running!
echo.
echo    Backend API:  http://localhost:5000
echo    Frontend Web: http://localhost:5173
echo    Admin Desk:   http://localhost:5173/admin
echo ========================================================
echo.
pause
