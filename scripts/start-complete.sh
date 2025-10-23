#!/bin/bash

# Cyberstreams Complete Startup Script
# Starts all services and loads the OSINT startkit

set -e

echo "🚀 Cyberstreams Complete Startup"
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_PORT=3001
DEV_PORT=5173
OLLAMA_PORT=11434

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    if check_port $port; then
        echo -e "${YELLOW}🔄 Stopping existing $name on port $port...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to start service
start_service() {
    local name=$1
    local command=$2
    local port=$3
    local url=$4
    
    echo -e "${BLUE}🚀 Starting $name...${NC}"
    
    # Kill existing process on port
    kill_port $port "$name"
    
    # Start service in background
    eval "$command" &
    local pid=$!
    
    # Wait for service to be ready
    echo -e "${YELLOW}⏳ Waiting for $name to be ready...${NC}"
    local attempts=0
    local max_attempts=30
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s --max-time 2 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready!${NC}"
            return 0
        fi
        
        attempts=$((attempts + 1))
        sleep 2
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Main startup sequence
main() {
    echo -e "${BLUE}Starting Cyberstreams platform...${NC}"
    echo ""
    
    # Check dependencies
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is required but not installed${NC}"
        exit 1
    fi
    
    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        echo -e "${RED}❌ Ollama is required but not installed${NC}"
        echo -e "${YELLOW}💡 Install Ollama from: https://ollama.ai${NC}"
        exit 1
    fi
    
    # Start Ollama service
    echo -e "${BLUE}🤖 Starting Ollama service...${NC}"
    if ! check_port $OLLAMA_PORT; then
        ollama serve &
        sleep 5
    fi
    
    # Verify Ollama is running
    if curl -s --max-time 5 "http://localhost:$OLLAMA_PORT/api/tags" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama is running${NC}"
    else
        echo -e "${RED}❌ Ollama failed to start${NC}"
        exit 1
    fi
    
    # Install Ollama models
    echo -e "${BLUE}📥 Installing Ollama models...${NC}"
    local models=("dolphin-llama3:8b" "llama3.1:8b" "llama3.1:latest" "nomic-embed-text")
    
    for model in "${models[@]}"; do
        echo -e "${YELLOW}  📦 Installing $model...${NC}"
        if ollama pull "$model" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ $model installed${NC}"
        else
            echo -e "${YELLOW}    ⚠️  $model installation failed (may already be installed)${NC}"
        fi
    done
    
    # Start API server
    start_service "API Server" "npm run server" $API_PORT "http://localhost:$API_PORT/healthz"
    echo ""
    
    # Start dev server
    start_service "Dev Server" "npm run dev -- --host --port $DEV_PORT" $DEV_PORT "http://localhost:$DEV_PORT"
    echo ""
    
    # Load startkit
    echo -e "${BLUE}📦 Loading OSINT startkit...${NC}"
    if [ -f "scripts/load-startkit.sh" ]; then
        chmod +x scripts/load-startkit.sh
        ./scripts/load-startkit.sh
    else
        echo -e "${RED}❌ Startkit loader not found${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Cyberstreams platform is ready!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "${BLUE}  Frontend: http://localhost:$DEV_PORT${NC}"
    echo -e "${BLUE}  API: http://localhost:$API_PORT${NC}"
    echo -e "${BLUE}  Ollama: http://localhost:$OLLAMA_PORT${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo -e "${YELLOW}  1. Navigate to OSINT Studio tab${NC}"
    echo -e "${YELLOW}  2. Check Dashboard for system status${NC}"
    echo -e "${YELLOW}  3. Review loaded sources and keywords${NC}"
    echo -e "${YELLOW}  4. Start OSINT analysis with dolphin-llama3:8b${NC}"
    echo ""
    echo -e "${BLUE}🛑 To stop all services: Ctrl+C${NC}"
    
    # Keep script running
    wait
}

# Handle Ctrl+C
trap 'echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"; kill_port $API_PORT "API Server"; kill_port $DEV_PORT "Dev Server"; kill_port $OLLAMA_PORT "Ollama"; exit 0' INT

# Run main function
main "$@"

