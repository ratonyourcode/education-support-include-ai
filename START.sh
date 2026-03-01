#!/bin/bash

# Quiz AI Creator - Quick Start Script
# This script starts both backend and frontend servers

echo "╔═══════════════════════════════════════╗"
echo "║    Quiz AI Creator - Quick Start     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "Please create .env file and add your GEMINI_API_KEY"
    echo "Example:"
    echo "  GEMINI_API_KEY=your-api-key-here"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Activate virtual environment and install dependencies
echo "📦 Installing backend dependencies..."
cd backend
source venv/bin/activate
pip install -q -r requirements.txt

# Start backend in background
echo "🚀 Starting backend server..."
python server.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "🌐 Starting frontend server..."
cd frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started successfully!"
echo ""
echo "📍 Backend:  http://127.0.0.1:5000"
echo "📍 Frontend: http://localhost:8080"
echo ""
echo "🌐 Open your browser and go to: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '✅ Servers stopped'; exit 0" INT

# Keep script running
wait
