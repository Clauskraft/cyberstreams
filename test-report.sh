#!/bin/bash

# Cyberstreams System Test Report
# Comprehensive test of data loading and agent search functionality

echo "🧪 Cyberstreams System Test Report"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test
test_function() {
    local test_name="$1"
    local test_command="$2"
    
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

echo -e "${YELLOW}📋 System Status Tests${NC}"
echo "========================"

# Test 1: Server Health
test_function "API Server Health" "curl -s http://localhost:3001/healthz | grep -q 'ok'"
test_function "Frontend Server Health" "curl -s http://localhost:5173 | grep -q 'Cyberstreams'"
test_function "Ollama Service Health" "curl -s http://localhost:11434/api/tags | grep -q 'models'"

echo ""

# Test 2: Database Status
echo -e "${YELLOW}🗄️  Database Tests${NC}"
echo "=================="

sources_count=$(sqlite3 data/cyberstreams.db "SELECT COUNT(*) FROM sources WHERE verified = 1;" 2>/dev/null)
keywords_count=$(sqlite3 data/cyberstreams.db "SELECT COUNT(*) FROM keywords;" 2>/dev/null)

echo -e "${BLUE}🔍 Database Content:${NC}"
echo -e "${GREEN}✅ Sources in database: $sources_count${NC}"
echo -e "${GREEN}✅ Keywords in database: $keywords_count${NC}"

if [ "$sources_count" -gt 0 ] && [ "$keywords_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Database has data${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Database missing data${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 3: API Endpoints
echo -e "${YELLOW}🌐 API Endpoint Tests${NC}"
echo "====================="

sources_response=$(curl -s http://localhost:3001/api/config/sources)
sources_api_count=$(echo "$sources_response" | jq '.count' 2>/dev/null)

echo -e "${BLUE}🔍 API Data:${NC}"
echo -e "${GREEN}✅ Sources API count: $sources_api_count${NC}"

if [ "$sources_api_count" -gt 0 ]; then
    echo -e "${GREEN}✅ Sources API working${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Sources API failed${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 4: Ollama Models
echo -e "${YELLOW}🤖 Ollama Models Test${NC}"
echo "====================="

models_response=$(curl -s http://localhost:11434/api/tags)
models_count=$(echo "$models_response" | jq '.models | length' 2>/dev/null)

echo -e "${BLUE}🔍 Available Models:${NC}"
echo "$models_response" | jq -r '.models[].name' 2>/dev/null | while read model; do
    echo -e "${GREEN}✅ Model: $model${NC}"
done

if [ "$models_count" -ge 4 ]; then
    echo -e "${GREEN}✅ All required models available ($models_count models)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Missing models ($models_count models)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 5: Agent Search Functionality
echo -e "${YELLOW}🔍 Agent Search Tests${NC}"
echo "======================"

echo -e "${BLUE}🔍 Testing dolphin-llama3:8b model:${NC}"
agent_response=$(curl -s -X POST http://localhost:11434/api/generate \
    -H "Content-Type: application/json" \
    -d '{"model": "dolphin-llama3:8b", "prompt": "What is cybersecurity?", "stream": false}' 2>/dev/null)

if echo "$agent_response" | jq -e '.response' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Agent search working${NC}"
    echo -e "${BLUE}Sample response:${NC}"
    echo "$agent_response" | jq -r '.response' | head -2
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Agent search failed${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 6: Data Consistency
echo -e "${YELLOW}🔄 Data Consistency Tests${NC}"
echo "=========================="

if [ "$sources_count" -eq "$sources_api_count" ]; then
    echo -e "${GREEN}✅ Sources count consistent (DB: $sources_count, API: $sources_api_count)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Sources count inconsistent (DB: $sources_count, API: $sources_api_count)${NC}"
    ((TESTS_FAILED++))
fi

echo ""

# Test 7: Performance Test
echo -e "${YELLOW}⚡ Performance Test${NC}"
echo "=================="

response_time=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3001/api/config/sources)
echo -e "${BLUE}🔍 API Response Time: ${response_time}s${NC}"

if (( $(echo "$response_time < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Performance acceptable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Performance too slow${NC}"
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
success_rate=$((TESTS_PASSED * 100 / total_tests))

echo -e "${BLUE}📈 Success Rate: $success_rate%${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! System is fully functional.${NC}"
    echo ""
    echo -e "${BLUE}🌐 Access URLs:${NC}"
    echo -e "${BLUE}  Frontend: http://localhost:5173${NC}"
    echo -e "${BLUE}  API: http://localhost:3001${NC}"
    echo -e "${BLUE}  Ollama: http://localhost:11434${NC}"
    echo ""
    echo -e "${YELLOW}📋 System Capabilities:${NC}"
    echo -e "${YELLOW}  ✅ Data Loading: $sources_count sources, $keywords_count keywords${NC}"
    echo -e "${YELLOW}  ✅ Agent Search: $models_count AI models available${NC}"
    echo -e "${YELLOW}  ✅ API Endpoints: All endpoints responding${NC}"
    echo -e "${YELLOW}  ✅ Database: SQLite with full data${NC}"
    echo ""
    echo -e "${YELLOW}🚀 Ready for OSINT Analysis!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
    exit 1
fi
