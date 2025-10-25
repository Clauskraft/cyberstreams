#!/bin/bash

# Cyberstreams OSINT Startkit Loader
# Loads comprehensive intelligence sources and configuration

set -e

echo "🚀 Cyberstreams OSINT Startkit Loader"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STARTKIT_FILE="data/startkit.json"
API_BASE="http://localhost:3001"
DEV_SERVER="http://localhost:5173"

# Check if startkit file exists
if [ ! -f "$STARTKIT_FILE" ]; then
    echo -e "${RED}❌ Startkit file not found: $STARTKIT_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Loading startkit from: $STARTKIT_FILE${NC}"

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not running${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $name...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if check_service "$url" "$name" > /dev/null 2>&1; then
            return 0
        fi
        
        echo -e "${YELLOW}   Attempt $attempt/$max_attempts${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to load sources
load_sources() {
    echo -e "${BLUE}📡 Loading intelligence sources...${NC}"
    
    # Extract sources from startkit
    local sources=$(jq -r '.sources.critical[], .sources.high[], .sources.european[], .sources.vendor[], .sources.research[] | @base64' "$STARTKIT_FILE")
    
    for source in $sources; do
        local decoded=$(echo "$source" | base64 -d)
        local name=$(echo "$decoded" | jq -r '.name')
        local domain=$(echo "$decoded" | jq -r '.domain')
        local rssUrl=$(echo "$decoded" | jq -r '.rssUrl // empty')
        local priority=$(echo "$decoded" | jq -r '.priority')
        
        echo -e "${YELLOW}  📍 Loading: $name ($domain)${NC}"
        
        # Map to admin API payload
        local payload=$(echo "$decoded" | jq -c '{
            sourceType: (if .rssUrl then "rss" else "website" end),
            url: (if .rssUrl then .rssUrl else ("https://" + .domain) end),
            scanFrequency: (.update_frequency // 3600)
        }')

        # Add source via Admin API (in-memory store)
        if curl -s -X POST "$API_BASE/api/admin/sources" \
            -H "Content-Type: application/json" \
            -d "$payload" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
}

# Function to load keywords
load_keywords() {
    echo -e "${BLUE}🔑 Loading threat keywords...${NC}"
    
    # Extract keywords from startkit
    local keywords=$(jq -r '.keywords.threats[], .keywords.vulnerabilities[], .keywords.infrastructure[], .keywords.actors[], .keywords.techniques[]' "$STARTKIT_FILE")
    
    for keyword in $keywords; do
        echo -e "${YELLOW}  🔍 Loading keyword: $keyword${NC}"
        
        # Add keyword via API (if endpoint exists)
        if curl -s -X POST "$API_BASE/api/config/keywords" \
            -H "Content-Type: application/json" \
            -d "{\"keyword\": \"$keyword\", \"category\": \"threat\", \"priority\": 1}" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
        else
            echo -e "${YELLOW}    ⚠️  Keyword endpoint not available${NC}"
        fi
    done
}

# Function to configure Ollama
configure_ollama() {
    echo -e "${BLUE}🤖 Configuring Ollama models...${NC}"
    
    # Skip if SKIP_OLLAMA is set
    if [ "${SKIP_OLLAMA}" = "true" ]; then
        echo -e "${YELLOW}⏭️  Skipping Ollama setup (SKIP_OLLAMA=true)${NC}"
        return 0
    fi
    
    # Check if Ollama is running
    if ! check_service "http://localhost:11434/api/tags" "Ollama"; then
        echo -e "${YELLOW}⚠️  Ollama is not running - skipping model setup${NC}"
        return 0
    fi
    
    # Get models from startkit
    local models=$(jq -r '.ollama.models[].name' "$STARTKIT_FILE")
    
    for model in $models; do
        echo -e "${YELLOW}  🧠 Checking model: $model${NC}"
        
        # Check if model is installed
        if curl -s "http://localhost:11434/api/tags" | jq -e ".models[] | select(.name == \"$model\")" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Model already installed${NC}"
        else
            echo -e "${YELLOW}    📥 Installing model: $model${NC}"
            if curl -s -X POST "http://localhost:11434/api/pull" \
                -H "Content-Type: application/json" \
                -d "{\"name\": \"$model\", \"stream\": false}" > /dev/null 2>&1; then
                echo -e "${GREEN}    ✅ Model installed successfully${NC}"
            else
                echo -e "${RED}    ❌ Failed to install model${NC}"
            fi
        fi
    done
}

# Function to standardize environment
standardize_environment() {
    echo -e "${BLUE}⚙️  Standardizing environment...${NC}"
    
    if curl -s -X POST "$API_BASE/api/bootstrap/standardize" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Environment standardized${NC}"
    else
        echo -e "${RED}❌ Failed to standardize environment${NC}"
    fi
}

# Function to seed sources
seed_sources() {
    echo -e "${BLUE}🌱 Seeding initial sources...${NC}"
    
    if curl -s -X POST "$API_BASE/api/bootstrap/seed-sources" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Sources seeded${NC}"
    else
        echo -e "${RED}❌ Failed to seed sources${NC}"
    fi
}

# Function to start Intel Scraper
start_intel_scraper() {
    echo -e "${BLUE}🔍 Starting Intel Scraper...${NC}"
    
    if curl -s -X POST "$API_BASE/api/intel-scraper/start" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Intel Scraper started${NC}"
    else
        echo -e "${RED}❌ Failed to start Intel Scraper${NC}"
    fi
}

# Function to display status
display_status() {
    echo -e "${BLUE}📊 Platform Status${NC}"
    echo "=================="
    
    # Check API server
    if check_service "$API_BASE/healthz" "API Server"; then
        # Get status
        local status=$(curl -s "$API_BASE/api/intel-scraper/status" 2>/dev/null | jq -r '.data.isRunning // "unknown"')
        echo -e "${YELLOW}Intel Scraper Status: $status${NC}"
        
        # Get sources count
        local sources_count=$(curl -s "$API_BASE/api/admin/sources" 2>/dev/null | jq -r '.data | length // 0')
        echo -e "${YELLOW}Sources loaded: $sources_count${NC}"
    fi
    
    # Check Ollama
    if check_service "http://localhost:11434/api/tags" "Ollama"; then
        local models_count=$(curl -s "http://localhost:11434/api/tags" 2>/dev/null | jq -r '.models | length // 0')
        echo -e "${YELLOW}Ollama models: $models_count${NC}"
    fi
    
    # Check dev server
    check_service "$DEV_SERVER" "Dev Server"
}

# Main execution
main() {
    echo -e "${BLUE}Starting Cyberstreams OSINT Startkit Loader...${NC}"
    echo ""
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq is required but not installed. Please install jq.${NC}"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is required but not installed. Please install curl.${NC}"
        exit 1
    fi
    
    # Wait for services
    echo -e "${BLUE}🔍 Checking services...${NC}"
    
    if ! wait_for_service "$API_BASE/healthz" "API Server"; then
        echo -e "${RED}❌ API Server is not running. Please start the server first.${NC}"
        echo -e "${YELLOW}💡 Run: npm run server${NC}"
        exit 1
    fi
    
    # Load startkit data
    echo ""
    echo -e "${BLUE}📦 Loading startkit data...${NC}"
    
    standardize_environment
    echo ""
    
    configure_ollama
    echo ""
    
    load_sources
    echo ""
    
    load_keywords
    echo ""
    
    seed_sources
    echo ""
    
    start_intel_scraper
    echo ""
    
    # Display final status
    display_status
    echo ""
    
    echo -e "${GREEN}🎉 Startkit loaded successfully!${NC}"
    echo -e "${BLUE}🌐 Access the platform at: $DEV_SERVER${NC}"
    echo -e "${BLUE}🔧 API available at: $API_BASE${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo -e "${YELLOW}  1. Navigate to OSINT Studio tab${NC}"
    echo -e "${YELLOW}  2. Check Dashboard for system status${NC}"
    echo -e "${YELLOW}  3. Review loaded sources and keywords${NC}"
    echo -e "${YELLOW}  4. Start OSINT analysis with dolphin-llama3:8b${NC}"
}

# Run main function
main "$@"
