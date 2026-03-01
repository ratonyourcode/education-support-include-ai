#!/bin/bash

# Quiz AI Creator - Stop Script

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "Stopping Quiz AI Creator..."
echo ""

# Read PIDs if available
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo -e "${GREEN}[OK]${NC} Backend server stopped (PID: $BACKEND_PID)"
    else
        echo -e "${BLUE}[INFO]${NC} Backend server not running"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo -e "${GREEN}[OK]${NC} Frontend server stopped (PID: $FRONTEND_PID)"
    else
        echo -e "${BLUE}[INFO]${NC} Frontend server not running"
    fi
    rm -f .frontend.pid
fi

# Also try to kill by port (fallback)
if command -v lsof &> /dev/null; then
    BACKEND_PORT_PID=$(lsof -ti:5000)
    if [ ! -z "$BACKEND_PORT_PID" ]; then
        kill $BACKEND_PORT_PID 2>/dev/null
        echo -e "${GREEN}[OK]${NC} Killed process on port 5000"
    fi
    
    FRONTEND_PORT_PID=$(lsof -ti:8080)
    if [ ! -z "$FRONTEND_PORT_PID" ]; then
        kill $FRONTEND_PORT_PID 2>/dev/null
        echo -e "${GREEN}[OK]${NC} Killed process on port 8080"
    fi
fi

echo ""
echo -e "${GREEN}All servers stopped!${NC}"
echo ""
