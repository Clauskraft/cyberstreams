# Cyberstreams Unit Test Plan

## Repository Overview

Cyberstreams er en avanceret Dark Web Threat Intelligence Platform med følgende hovedfunktioner:

### Core Components

- **Backend API** (Express.js + SQLite)
- **Frontend** (React + TypeScript + Vite)
- **Agentic Workflows** (AI-driven automation)
- **Unified Search** (Multi-source intelligence search)
- **Source Discovery** (Intelligent source scanning)
- **Knowledge Base** (CIA methods, OSINT techniques)

## Unit Test Plan

### 1. Backend Services (lib/)

#### 1.1 Database Layer

```typescript
// lib/postgres.js (SQLite wrapper)
- ✅ Connection management
- ✅ Query execution
- ✅ Error handling
- ✅ Pool management

// lib/authorizedSourceRepository.js
- ✅ CRUD operations for sources
- ✅ Data validation
- ✅ JSON serialization/deserialization
- ✅ Boolean handling (SQLite compatibility)

// lib/integrationSettingsRepository.js
- ✅ API key management
- ✅ Settings persistence
- ✅ Encryption/decryption
```

#### 1.2 Core Services

```typescript
// lib/searchService.js
- ✅ Unified search functionality
- ✅ Knowledge base search
- ✅ Intelligence search
- ✅ Agent search
- ✅ Source search
- ✅ WiFi search
- ✅ Relevance scoring
- ✅ Search analytics

// lib/knowledgeRepository.js
- ✅ Knowledge base CRUD
- ✅ Category management
- ✅ Search functionality
- ✅ Statistics generation

// lib/agenticOrchestrator.js
- ✅ Workflow execution
- ✅ Step management
- ✅ Error handling
- ✅ State management
```

#### 1.3 External Integrations

```typescript
// lib/ollamaAdmin.js
- ✅ Model management
- ✅ API communication
- ✅ Health checks

// lib/intelScraperService.js
- ✅ Source scraping
- ✅ Data extraction
- ✅ Content parsing
- ✅ Rate limiting

// lib/wigleDataLoader.js
- ✅ WiFi data loading
- ✅ Geographic queries
- ✅ API integration
```

### 2. API Routes (routes/)

#### 2.1 Core APIs

```typescript
// routes/search.js
- ✅ Search endpoint validation
- ✅ Query processing
- ✅ Filter handling
- ✅ Response formatting
- ✅ Error responses

// routes/agentic.js
- ✅ Workflow management
- ✅ Run execution
- ✅ Step processing
- ✅ Status tracking

// routes/knowledge.js
- ✅ Knowledge CRUD
- ✅ Category endpoints
- ✅ Search functionality
- ✅ Statistics endpoints
```

### 3. Frontend Components (src/)

#### 3.1 Core Modules

```typescript
// src/modules/CyberstreamsAgent.tsx
- ✅ Component rendering
- ✅ State management
- ✅ API integration
- ✅ User interactions

// src/modules/AgenticStudio.tsx
- ✅ Workflow management UI
- ✅ Run monitoring
- ✅ Form handling
- ✅ Data visualization

// src/modules/ConsolidatedIntelligence.tsx
- ✅ Intelligence display
- ✅ Filtering
- ✅ Sorting
- ✅ Export functionality

// src/modules/HomeContent.tsx
- ✅ Dashboard rendering
- ✅ Statistics display
- ✅ Navigation
- ✅ Real-time updates
```

#### 3.2 Shared Components

```typescript
// src/components/UnifiedSearch.tsx
- ✅ Search input handling
- ✅ Results display
- ✅ Filter management
- ✅ Suggestions
- ✅ History tracking

// src/components/ (other components)
- ✅ Button components
- ✅ Form components
- ✅ Data display components
- ✅ Navigation components
```

### 4. Server Core (server.js)

#### 4.1 Server Configuration

```typescript
// server.js
- ✅ Express app setup
- ✅ Middleware configuration
- ✅ Route registration
- ✅ Error handling
- ✅ Graceful shutdown
- ✅ Health checks
```

### 5. Test Implementation Strategy

#### 5.1 Test Structure

```
tests/
├── unit/
│   ├── lib/
│   │   ├── database.test.js
│   │   ├── searchService.test.js
│   │   ├── knowledgeRepository.test.js
│   │   └── agenticOrchestrator.test.js
│   ├── routes/
│   │   ├── search.test.js
│   │   ├── agentic.test.js
│   │   └── knowledge.test.js
│   └── server/
│       └── server.test.js
├── integration/
│   ├── api.test.js
│   ├── database.test.js
│   └── workflows.test.js
└── e2e/
    ├── user-journey.test.js
    └── platform.test.js
```

#### 5.2 Test Tools

- **Vitest** - Unit testing framework
- **@testing-library/react** - React component testing
- **Supertest** - API testing
- **jsdom** - DOM simulation
- **Playwright** - E2E testing

#### 5.3 Test Coverage Goals

- **Backend Services**: 90%+ coverage
- **API Routes**: 85%+ coverage
- **Frontend Components**: 80%+ coverage
- **Critical Paths**: 95%+ coverage

### 6. Priority Test Cases

#### 6.1 High Priority (Critical Paths)

1. **Database Operations** - All CRUD operations
2. **Search Functionality** - All search types
3. **Agent Workflows** - Workflow execution
4. **Source Discovery** - Source scanning
5. **API Endpoints** - All public endpoints

#### 6.2 Medium Priority

1. **Component Rendering** - All React components
2. **User Interactions** - Form handling, navigation
3. **Error Handling** - Error scenarios
4. **Data Validation** - Input validation

#### 6.3 Low Priority

1. **UI Styling** - Visual components
2. **Performance** - Load testing
3. **Accessibility** - A11y compliance

### 7. Test Execution Commands

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/unit/lib/searchService.test.js

# Run with coverage
npx vitest run --coverage

# Run E2E tests
npx playwright test
```

### 8. Mock Strategy

#### 8.1 External Services

- **Ollama API** - Mock responses
- **WiGLE API** - Mock data
- **External APIs** - Mock endpoints

#### 8.2 Database

- **SQLite** - In-memory test database
- **Data** - Test fixtures

#### 8.3 Frontend

- **API Calls** - Mock fetch responses
- **Local Storage** - Mock storage
- **Router** - Mock navigation

### 9. Continuous Integration

#### 9.1 Pre-commit Hooks

- **Linting** - ESLint + Prettier
- **Type Checking** - TypeScript
- **Unit Tests** - Vitest
- **Commit Messages** - Commitlint

#### 9.2 CI Pipeline

1. **Install Dependencies**
2. **Lint Code**
3. **Type Check**
4. **Run Unit Tests**
5. **Run Integration Tests**
6. **Run E2E Tests**
7. **Generate Coverage Report**

### 10. Test Data Management

#### 10.1 Test Fixtures

```javascript
// tests/fixtures/sources.json
// tests/fixtures/knowledge.json
// tests/fixtures/workflows.json
```

#### 10.2 Test Database

```javascript
// tests/setup/test-db.js
// In-memory SQLite for testing
```

## Implementation Timeline

### Phase 1 (Week 1)

- ✅ Database layer tests
- ✅ Core service tests
- ✅ API route tests

### Phase 2 (Week 2)

- ✅ Frontend component tests
- ✅ Integration tests
- ✅ E2E tests

### Phase 3 (Week 3)

- ✅ Performance tests
- ✅ Security tests
- ✅ Documentation

## Success Criteria

- **Code Coverage**: >85% overall
- **Test Reliability**: >95% pass rate
- **Performance**: <2s test execution time
- **Maintainability**: Clear test structure
- **Documentation**: Complete test documentation

---

_This test plan ensures comprehensive coverage of all Cyberstreams functionality while maintaining high code quality and reliability._
