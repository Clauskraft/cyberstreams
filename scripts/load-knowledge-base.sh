#!/bin/bash

# Cyberstreams Knowledge Base Loader
# Loads WikiLeaks sources and intelligence methods into the knowledge base

set -e

echo "🧠 Cyberstreams Knowledge Base Loader"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
KNOWLEDGE_BASE_FILE="data/knowledge-base.json"
API_BASE="http://localhost:3001"

# Check if knowledge base file exists
if [ ! -f "$KNOWLEDGE_BASE_FILE" ]; then
    echo -e "${RED}❌ Knowledge base file not found: $KNOWLEDGE_BASE_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📚 Loading knowledge base from: $KNOWLEDGE_BASE_FILE${NC}"

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

# Function to load knowledge documents
load_knowledge_documents() {
    echo -e "${BLUE}📖 Loading knowledge documents...${NC}"
    
    # Extract documents from knowledge base
    local total_docs=0
    
    # Load WikiLeaks sources
    local wikileaks_docs=$(jq -r '.knowledgeBase.wikileaks_sources.documents[] | @base64' "$KNOWLEDGE_BASE_FILE")
    for doc in $wikileaks_docs; do
        local decoded=$(echo "$doc" | base64 -d)
        local title=$(echo "$decoded" | jq -r '.title')
        local category=$(echo "$decoded" | jq -r '.category')
        
        echo -e "${YELLOW}  📄 Loading: $title ($category)${NC}"
        
        # Upload document via API
        if curl -s -X POST "$API_BASE/api/knowledge" \
            -H "Content-Type: application/json" \
            -d "$decoded" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
            total_docs=$((total_docs + 1))
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
    
    # Load Intelligence Methods
    local intel_methods=$(jq -r '.knowledgeBase.intelligence_methods.documents[] | @base64' "$KNOWLEDGE_BASE_FILE")
    for doc in $intel_methods; do
        local decoded=$(echo "$doc" | base64 -d)
        local title=$(echo "$decoded" | jq -r '.title')
        local category=$(echo "$decoded" | jq -r '.category')
        
        echo -e "${YELLOW}  📄 Loading: $title ($category)${NC}"
        
        if curl -s -X POST "$API_BASE/api/knowledge" \
            -H "Content-Type: application/json" \
            -d "$decoded" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
            total_docs=$((total_docs + 1))
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
    
    # Load OSINT Techniques
    local osint_techniques=$(jq -r '.knowledgeBase.osint_techniques.documents[] | @base64' "$KNOWLEDGE_BASE_FILE")
    for doc in $osint_techniques; do
        local decoded=$(echo "$doc" | base64 -d)
        local title=$(echo "$decoded" | jq -r '.title')
        local category=$(echo "$decoded" | jq -r '.category')
        
        echo -e "${YELLOW}  📄 Loading: $title ($category)${NC}"
        
        if curl -s -X POST "$API_BASE/api/knowledge" \
            -H "Content-Type: application/json" \
            -d "$decoded" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
            total_docs=$((total_docs + 1))
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
    
    # Load Analysis Frameworks
    local analysis_frameworks=$(jq -r '.knowledgeBase.analysis_frameworks.documents[] | @base64' "$KNOWLEDGE_BASE_FILE")
    for doc in $analysis_frameworks; do
        local decoded=$(echo "$doc" | base64 -d)
        local title=$(echo "$decoded" | jq -r '.title')
        local category=$(echo "$decoded" | jq -r '.category')
        
        echo -e "${YELLOW}  📄 Loading: $title ($category)${NC}"
        
        if curl -s -X POST "$API_BASE/api/knowledge" \
            -H "Content-Type: application/json" \
            -d "$decoded" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
            total_docs=$((total_docs + 1))
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
    
    # Load Intelligence Organizations
    local intel_orgs=$(jq -r '.knowledgeBase.intelligence_organizations.documents[] | @base64' "$KNOWLEDGE_BASE_FILE")
    for doc in $intel_orgs; do
        local decoded=$(echo "$doc" | base64 -d)
        local title=$(echo "$decoded" | jq -r '.title')
        local category=$(echo "$decoded" | jq -r '.category')
        
        echo -e "${YELLOW}  📄 Loading: $title ($category)${NC}"
        
        if curl -s -X POST "$API_BASE/api/knowledge" \
            -H "Content-Type: application/json" \
            -d "$decoded" > /dev/null 2>&1; then
            echo -e "${GREEN}    ✅ Added successfully${NC}"
            total_docs=$((total_docs + 1))
        else
            echo -e "${RED}    ❌ Failed to add${NC}"
        fi
    done
    
    echo -e "${GREEN}📊 Total documents loaded: $total_docs${NC}"
}

# Function to test knowledge base search
test_knowledge_search() {
    echo -e "${BLUE}🔍 Testing knowledge base search...${NC}"
    
    local test_queries=(
        "WikiLeaks"
        "CIA methods"
        "OSINT techniques"
        "intelligence analysis"
        "threat modeling"
    )
    
    for query in "${test_queries[@]}"; do
        echo -e "${YELLOW}  🔍 Testing query: $query${NC}"
        
        local response=$(curl -s -X POST "$API_BASE/api/knowledge/search" \
            -H "Content-Type: application/json" \
            -d "{\"query\": \"$query\", \"limit\": 5}")
        
        if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
            local count=$(echo "$response" | jq -r '.data | length')
            echo -e "${GREEN}    ✅ Found $count results${NC}"
        else
            echo -e "${RED}    ❌ Search failed${NC}"
        fi
    done
}

# Function to display knowledge base status
display_status() {
    echo -e "${BLUE}📊 Knowledge Base Status${NC}"
    echo "=========================="
    
    # Check API server
    if check_service "$API_BASE/healthz" "API Server"; then
        # Get knowledge base stats
        local stats=$(curl -s "$API_BASE/api/knowledge/stats" 2>/dev/null || echo '{"success": false}')
        if echo "$stats" | jq -e '.success' > /dev/null 2>&1; then
            local total_docs=$(echo "$stats" | jq -r '.data.totalDocuments // 0')
            local categories=$(echo "$stats" | jq -r '.data.categories // 0')
            echo -e "${YELLOW}Total Documents: $total_docs${NC}"
            echo -e "${YELLOW}Categories: $categories${NC}"
        else
            echo -e "${YELLOW}Knowledge base stats not available${NC}"
        fi
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting Cyberstreams Knowledge Base Loader...${NC}"
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
    
    # Load knowledge base data
    echo ""
    echo -e "${BLUE}📚 Loading knowledge base data...${NC}"
    
    load_knowledge_documents
    echo ""
    
    test_knowledge_search
    echo ""
    
    # Display final status
    display_status
    echo ""
    
    echo -e "${GREEN}🎉 Knowledge base loaded successfully!${NC}"
    echo -e "${BLUE}🧠 Access the knowledge base via the AI Agent tab${NC}"
    echo -e "${BLUE}🔧 API available at: $API_BASE/api/knowledge${NC}"
    echo ""
    echo -e "${YELLOW}📋 Available knowledge categories:${NC}"
    echo -e "${YELLOW}  • WikiLeaks Sources (Cablegate, Vault 7, Sony Hack)${NC}"
    echo -e "${YELLOW}  • Intelligence Methods (OSINT, HUMINT, SIGINT)${NC}"
    echo -e "${YELLOW}  • OSINT Techniques (SOCMINT, Technical OSINT)${NC}"
    echo -e "${YELLOW}  • Analysis Frameworks (Intelligence Cycle, Threat Modeling)${NC}"
    echo -e "${YELLOW}  • Intelligence Organizations (CIA, NSA methods)${NC}"
    echo ""
    echo -e "${YELLOW}🔍 Test queries:${NC}"
    echo -e "${YELLOW}  • \"WikiLeaks CIA methods\"${NC}"
    echo -e "${YELLOW}  • \"OSINT social media intelligence\"${NC}"
    echo -e "${YELLOW}  • \"threat modeling framework\"${NC}"
    echo -e "${YELLOW}  • \"intelligence analysis cycle\"${NC}"
}

# Run main function
main "$@"

