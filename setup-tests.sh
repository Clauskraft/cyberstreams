#!/bin/bash

# Cyberstreams Unit Test Setup Script
# This script sets up the testing environment and runs unit tests

set -e

echo "🧪 Cyberstreams Unit Test Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Setting up test environment...${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Create test database directory
mkdir -p data
mkdir -p tests/fixtures
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e

# Create test database
echo -e "${BLUE}🗄️  Creating test database...${NC}"
if [ -f "data/cyberstreams-test.db" ]; then
    rm data/cyberstreams-test.db
fi

# Create test database schema
sqlite3 data/cyberstreams-test.db <<EOF
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    source_type TEXT NOT NULL,
    credibility_score INTEGER DEFAULT 50,
    timeliness_score INTEGER DEFAULT 50,
    accuracy_score INTEGER DEFAULT 50,
    context_score INTEGER DEFAULT 50,
    relevance_score INTEGER DEFAULT 50,
    rss_url TEXT,
    api_url TEXT,
    formats TEXT DEFAULT '[]',
    update_frequency INTEGER DEFAULT 60,
    logo_url TEXT,
    verified INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'medium',
    geography TEXT DEFAULT '[]',
    sectors TEXT DEFAULT '[]',
    languages TEXT DEFAULT '[]',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS findings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    category TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    verified INTEGER DEFAULT 0,
    quality_score INTEGER DEFAULT 50,
    geography TEXT DEFAULT '[]',
    affected_sectors TEXT DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    inputs TEXT DEFAULT '{}',
    results TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS wifi_networks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ssid TEXT NOT NULL,
    bssid TEXT NOT NULL,
    lat REAL,
    lon REAL,
    channel INTEGER,
    encryption TEXT,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    country TEXT,
    region TEXT
);

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    service TEXT NOT NULL,
    key_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
EOF

echo -e "${GREEN}✅ Test database created${NC}"

# Create test fixtures
echo -e "${BLUE}📄 Creating test fixtures...${NC}"

cat > tests/fixtures/sources.json <<EOF
[
  {
    "id": "test-source-1",
    "name": "Test Government Source",
    "domain": "test.gov.dk",
    "type": "government",
    "credibilityScore": 95,
    "geography": ["DK"],
    "sectors": ["government", "cybersecurity"],
    "verified": true
  },
  {
    "id": "test-source-2",
    "name": "Test Media Source",
    "domain": "test-news.dk",
    "type": "media",
    "credibilityScore": 85,
    "geography": ["DK"],
    "sectors": ["media", "news"],
    "verified": true
  }
]
EOF

cat > tests/fixtures/knowledge.json <<EOF
[
  {
    "id": "test-knowledge-1",
    "category": "cia_methods",
    "title": "Test CIA HUMINT Techniques",
    "content": "This is test content about CIA Human Intelligence collection methods.",
    "tags": ["CIA", "HUMINT", "intelligence"],
    "source": "Test Source",
    "author": "Test Author",
    "date": "2025-01-27T10:00:00Z"
  },
  {
    "id": "test-knowledge-2",
    "category": "osint_techniques",
    "title": "Test OSINT Social Media Intelligence",
    "content": "This is test content about Open Source Intelligence techniques for social media.",
    "tags": ["OSINT", "SOCMINT", "social media"],
    "source": "Test Source",
    "author": "Test Author",
    "date": "2025-01-27T10:00:00Z"
  }
]
EOF

cat > tests/fixtures/workflows.json <<EOF
[
  {
    "id": "test-workflow-1",
    "name": "Test Email Warning Generation",
    "description": "Test workflow for generating email warnings",
    "category": "communication",
    "steps": [
      {
        "id": "test-step-1",
        "name": "Test Threat Assessment",
        "type": "analysis",
        "description": "Test threat analysis step"
      }
    ],
    "triggers": ["test_trigger"],
    "estimated_duration": "5-10 minutes",
    "success_criteria": ["test_success"]
  }
]
EOF

echo -e "${GREEN}✅ Test fixtures created${NC}"

# Create test environment file
echo -e "${BLUE}🔧 Creating test environment...${NC}"

cat > .env.test <<EOF
NODE_ENV=test
SQLITE_DB_PATH=data/cyberstreams-test.db
API_PORT=3002
DEV_PORT=5174
OLLAMA_PORT=11435
LOG_LEVEL=error
PORT=3002
EOF

echo -e "${GREEN}✅ Test environment created${NC}"

# Run unit tests
echo -e "${BLUE}🧪 Running unit tests...${NC}"
echo ""

# Check if vitest is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Run tests with coverage
echo -e "${YELLOW}Running comprehensive unit tests...${NC}"
npx vitest run --reporter=verbose

echo ""
echo -e "${GREEN}🎉 Unit test setup completed!${NC}"
echo ""
echo -e "${BLUE}📊 Test Results Summary:${NC}"
echo "  • Test database: data/cyberstreams-test.db"
echo "  • Test fixtures: tests/fixtures/"
echo "  • Test environment: .env.test"
echo "  • Coverage report: coverage/"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "  1. Review test results above"
echo "  2. Check coverage report in coverage/ directory"
echo "  3. Run specific tests: npx vitest run tests/unit/[test-file]"
echo "  4. Run tests in watch mode: npm run test:watch"
echo "  5. Run E2E tests: npx playwright test"
echo ""
echo -e "${GREEN}✅ All done!${NC}"
