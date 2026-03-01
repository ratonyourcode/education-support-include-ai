@echo off
REM Quiz AI Creator - Quick Start Script (Windows)
REM This script starts both backend and frontend servers

echo ╔═══════════════════════════════════════╗
echo ║    Quiz AI Creator - Quick Start     ║
echo ╚═══════════════════════════════════════╝
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found!
    echo Please create .env file and add your GEMINI_API_KEY
    echo Example:
    echo   GEMINI_API_KEY=your-api-key-here
    pause
    exit /b 1
)

REM Check if virtual environment exists
if not exist backend\venv (
    echo 📦 Creating virtual environment...
    cd backend
    python -m venv venv
    cd ..
)

REM Activate virtual environment and install dependencies
echo 📦 Installing backend dependencies...
cd backend
call venv\Scripts\activate.bat
pip install -q -r requirements.txt

REM Start backend in new window
echo 🚀 Starting backend server...
start "Quiz AI Backend" cmd /k "venv\Scripts\activate.bat && python server.py"
cd ..

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo 🌐 Starting frontend server...
cd frontend
start "Quiz AI Frontend" cmd /k "python -m http.server 8080"
cd ..

echo.
echo ✅ Servers started in new windows!
echo.
echo 📍 Backend:  http://127.0.0.1:5000
echo 📍 Frontend: http://localhost:8080
echo.
echo 🌐 Open your browser and go to: http://localhost:8080
echo.
echo Press any key to exit (servers will keep running)
pause > nul
