@echo off
TITLE AutoDash AI - Startup Script
echo ==========================================
echo    AutoDash AI: Orchestrator Startup
echo ==========================================
echo.

:: Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python and add it to your PATH.
    pause
    exit /b
)

:: Check for Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js to run the frontend.
    pause
    exit /b
)

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "AutoDash Backend" cmd /k "python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend on http://localhost:3000...
cd frontend
start "AutoDash Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo    All services are starting up!
echo ==========================================
echo.
echo Dashboard: http://localhost:3000
echo API Docs:  http://127.0.0.1:8000/docs
echo.
echo Press any key to exit this launcher (services will keep running).
pause >nul
