#!/bin/bash

# Cyberstreams Comprehensive System Test
# Tests data loading, API functionality, and agent search capabilities

set -e

echo "🧪 Cyberstreams Comprehensive System Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    echo -e "${BLUE}🔍 Testing: $test_name${NC}"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint="$1"
    local expected_field="$2"
    local test_name="$3"
    
    echo -e "${BLUE}🔍 Testing API: $test_name${NC}"
    
    local response=$(curl -s "http://localhost:3001$endpoint" 2>/dev/null)
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        echo -e "${YELLOW}Response: $response${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test database content
test_database() {
    local query="$1"
    local expected_count="$2"
    local test_name="$3"
    
    echo -e "${BLUE}🔍 Testing Database: $test_name${NC}"
    
    local count=$(sqlite3 data/cyberstreams.db "$query" 2>/dev/null)
    if [ "$count" -eq "$expected_count" ]; then
        echo -e "${GREEN}✅ PASSED: $test_name (Found $count records)${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name (Expected $expected_count, found $count)${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}📋 Starting System Tests...${NC}"
echo ""

# Test 1: Server Health
echo -e "${YELLOW}🏥 Server Health Tests${NC}"
echo "-------------------"
run_test "API Server Health" "curl -s http://localhost:3001/healthz | grep -q 'ok'"
run_test "Frontend Server Health" "curl -s http://localhost:5173 | grep -q 'Cyberstreams'"
run_test "Ollama Service Health" "curl -s http://localhost:11434/api/tags | grep -q 'models'"
echo ""

# Test 2: Database Tests
echo -e "${YELLOW}🗄️  Database Tests${NC}"
echo "-------------------"
test_database "SELECT COUNT(*) FROM monitoring_sources;" 5 "Monitoring Sources Count"
test_database "SELECT COUNT(*) FROM keywords;" 10 "Keywords Count"
test_database "SELECT COUNT(*) FROM rag_config;" 7 "RAG Configuration Count"
echo ""

# Test 3: API Endpoint Tests
echo -e "${YELLOW}🌐 API Endpoint Tests${NC}"
echo "-------------------"
test_api "/api/config/sources" "success.*true" "Sources API"
test_api "/api/stats" "success.*true" "Stats API"
test_api "/api/pulse" "success.*true" "Pulse API"
test_api "/api/threats" "success.*true" "Threats API"
test_api "/api/keys" "success.*true" "API Keys"
echo ""

# Test 4: Data Quality Tests
echo -e "${YELLOW}📊 Data Quality Tests${NC}"
echo "-------------------"

# Test sources have required fields
echo -e "${BLUE}🔍 Testing: Sources Data Quality${NC}"
sources_response=$(curl -s http://localhost:3001/api/config/sources)
if echo "$sources_response" | jq -e '.data[] | select(.name and .domain and .credibilityScore)' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Sources have required fields${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Sources missing required fields${NC}"
    ((TESTS_FAILED++))
fi

# Test keywords are loaded
echo -e "${BLUE}🔍 Testing: Keywords Data Quality${NC}"
keywords_count=$(sqlite3 data/cyberstreams.db "SELECT COUNT(*) FROM keywords WHERE keyword IS NOT NULL AND keyword != '';")
if [ "$keywords_count" -gt 5 ]; then
    echo -e "${GREEN}✅ PASSED: Keywords loaded ($keywords_count keywords)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Insufficient keywords loaded ($keywords_count)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 5: Agent Search Capability Tests
echo -e "${YELLOW}🤖 Agent Search Tests${NC}"
echo "-------------------"

# Test if Ollama models are available
echo -e "${BLUE}🔍 Testing: Ollama Models Available${NC}"
models_response=$(curl -s http://localhost:11434/api/tags)
if echo "$models_response" | jq -e '.models | length > 0' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Ollama models available${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: No Ollama models available${NC}"
    ((TESTS_FAILED++))
fi

# Test specific model availability
echo -e "${BLUE}🔍 Testing: dolphin-llama3:8b Model${NC}"
if echo "$models_response" | jq -e '.models[] | select(.name | contains("dolphin-llama3:8b"))' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: dolphin-llama3:8b model available${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: dolphin-llama3:8b model not available${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 6: Integration Tests
echo -e "${YELLOW}🔗 Integration Tests${NC}"
echo "-------------------"

# Test dashboard API
echo -e "${BLUE}🔍 Testing: Dashboard Recent Activity${NC}"
dashboard_response=$(curl -s http://localhost:3001/api/dashboard/recent-activity)
if echo "$dashboard_response" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Dashboard recent activity API${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Dashboard recent activity API${NC}"
    ((TESTS_FAILED++))
fi

# Test threat categories
echo -e "${BLUE}🔍 Testing: Threat Categories API${NC}"
threats_response=$(curl -s http://localhost:3001/api/dashboard/threat-categories)
if echo "$threats_response" | jq -e '.success == true' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASSED: Threat categories API${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Threat categories API${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 7: Performance Tests
echo -e "${YELLOW}⚡ Performance Tests${NC}"
echo "-------------------"

# Test API response times
echo -e "${BLUE}🔍 Testing: API Response Time${NC}"
response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3001/api/config/sources)
if (( $(echo "$response_time < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ PASSED: API response time acceptable (${response_time}s)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: API response time too slow (${response_time}s)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 8: Data Consistency Tests
echo -e "${YELLOW}🔄 Data Consistency Tests${NC}"
echo "-------------------"

# Test sources consistency
echo -e "${BLUE}🔍 Testing: Sources Data Consistency${NC}"
sources_count_api=$(echo "$sources_response" | jq '.count')
sources_count_db=$(sqlite3 data/cyberstreams.db "SELECT COUNT(*) FROM monitoring_sources;")
if [ "$sources_count_api" -eq "$sources_count_db" ]; then
    echo -e "${GREEN}✅ PASSED: Sources count consistent (API: $sources_count_api, DB: $sources_count_db)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAILED: Sources count inconsistent (API: $sources_count_api, DB: $sources_count_db)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Final Results
echo -e "${YELLOW}📊 Test Results Summary${NC}"
echo "========================"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo ""

total_tests=$((TESTS_PASSED + TESTS_FAILED))
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is fully functional.${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "${BLUE}  Frontend: http://localhost:5173${NC}"
    echo -e "${BLUE}  API: http://localhost:3001${NC}"
    echo -e "${BLUE}  Ollama: http://localhost:11434${NC}"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "${YELLOW}  1. Navigate to OSINT Studio tab${NC}"
    echo -e "${YELLOW}  2. Test agent search functionality${NC}"
    echo -e "${YELLOW}  3. Review loaded sources and keywords${NC}"
    echo -e "${YELLOW}  4. Start OSINT analysis${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
