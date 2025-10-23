# CYBERSTREAMS SMOKETEST SYSTEM

## 🎯 Oversigt

Dette smoketest system er designet til at verificere at alle kritiske funktioner i Cyberstreams platformen fungerer korrekt efter deployment eller ændringer. Systemet består af flere specialiserede test scripts der dækker forskellige aspekter af platformen.

## 📋 Test Komponenter

### 1. **Backend API Smoketest** (`smoketest.js`)
- ✅ Server health og readiness checks
- ✅ API endpoints functionality
- ✅ Database connectivity
- ✅ External service integrations (MISP, OpenCTI, Wigle)
- ✅ Intel Scraper functionality
- ✅ Admin endpoints
- ✅ Performance metrics
- ✅ Error handling

### 2. **Frontend UI Smoketest** (`frontend-smoketest.js`)
- ✅ Page load performance
- ✅ Main component rendering
- ✅ Navigation functionality
- ✅ Dashboard module
- ✅ Threats module
- ✅ Activity module
- ✅ Responsive design
- ✅ Error boundary handling

### 3. **Integration Smoketest** (`integration-smoketest.js`)
- ✅ MISP integration
- ✅ OpenCTI integration
- ✅ Wigle Maps integration
- ✅ Database connectivity
- ✅ Intel Scraper integration
- ✅ External API connectivity
- ✅ Data flow integration
- ✅ Performance under load

### 4. **Complete Smoketest Runner** (`run-smoketest.js`)
- ✅ Kører alle test suites i rækkefølge
- ✅ Genererer samlet rapport
- ✅ Performance analysis
- ✅ System health assessment

## 🚀 Brug

### Prerequisites
```bash
# Installer dependencies
npm install

# Sørg for at serveren kører
npm run server
```

### Kør individuelle tests

```bash
# Backend API tests
npm run smoketest

# Frontend UI tests
node frontend-smoketest.js

# Integration tests
node integration-smoketest.js
```

### Kør alle tests

```bash
# Kør alle smoketests
node run-smoketest.js

# Med custom URL
BASE_URL=http://localhost:3001 node run-smoketest.js
```

### Med package.json scripts

```bash
# Tilføj til package.json scripts:
"smoketest": "node smoketest.js",
"smoketest:frontend": "node frontend-smoketest.js",
"smoketest:integration": "node integration-smoketest.js",
"smoketest:all": "node run-smoketest.js"
```

## 📊 Test Resultater

### Status Koder
- ✅ **PASS** - Test bestået
- ❌ **FAIL** - Test fejlet (kritisk)
- ⚠️ **WARN** - Test bestået med advarsler

### Success Rate Tærskler
- 🟢 **90%+** - Excellent (produktionsklar)
- 🟡 **80-89%** - Good (mindre problemer)
- 🟠 **60-79%** - Fair (nogle problemer)
- 🔴 **<60%** - Poor (kritiske problemer)

## 🎛️ Konfiguration

### Environment Variables
```bash
BASE_URL=http://localhost:3002  # Base URL for application
TIMEOUT=10000                   # Timeout per test (ms)
CRITICAL_THRESHOLD=5000         # Critical performance threshold (ms)
```

### Test Timeouts
- **Backend tests**: 10 sekunder per test
- **Frontend tests**: 15 sekunder per test
- **Integration tests**: 15 sekunder per test
- **Total timeout**: 60 sekunder per test suite

## 📈 Performance Metrics

### Kritiske Tærskler
- **Page load**: < 3 sekunder
- **API response**: < 5 sekunder
- **Database queries**: < 2 sekunder
- **External API calls**: < 5 sekunder

### Performance Analysis
- Gennemsnitlig test duration
- Hurtigste/langsomste test
- Performance trends
- Optimization recommendations

## 🛠️ Fejlfinding

### Almindelige Problemer

#### 1. Server ikke tilgængelig
```bash
# Fejl: Server is not accessible
# Løsning: Start serveren
npm run server
```

#### 2. Database connectivity issues
```bash
# Fejl: Database connection failed
# Løsning: Check database configuration
# Systemet bruger fallback mode hvis database ikke er tilgængelig
```

#### 3. External service timeouts
```bash
# Fejl: MISP/OpenCTI/Wigle timeout
# Løsning: Check service configuration
# Services er valgfrie og systemet fungerer uden dem
```

#### 4. Frontend test failures
```bash
# Fejl: Browser tests failing
# Løsning: Install Playwright browsers
npx playwright install chromium
```

### Debug Mode
```bash
# Kør med debug output
DEBUG=true node smoketest.js

# Kør med verbose output
VERBOSE=true node run-smoketest.js
```

## 📋 Test Coverage

### Backend Coverage
- ✅ Health endpoints (`/healthz`, `/readyz`)
- ✅ API endpoints (14+ endpoints)
- ✅ Database operations
- ✅ External integrations
- ✅ Error handling
- ✅ Performance metrics

### Frontend Coverage
- ✅ Page loading
- ✅ Component rendering
- ✅ Navigation
- ✅ Module functionality
- ✅ Responsive design
- ✅ Error boundaries

### Integration Coverage
- ✅ MISP integration
- ✅ OpenCTI integration
- ✅ Wigle Maps integration
- ✅ Database connectivity
- ✅ Intel Scraper
- ✅ Data flow
- ✅ Performance under load

## 🔧 Customization

### Tilføj nye tests
1. Opret ny test fil (f.eks. `custom-smoketest.js`)
2. Følg samme struktur som eksisterende tests
3. Tilføj til `run-smoketest.js` hvis ønsket

### Modificer test parametre
```javascript
// I test filen
const TIMEOUT = 20000; // 20 sekunder
const CRITICAL_THRESHOLD = 3000; // 3 sekunder
```

### Tilføj nye endpoints
```javascript
// I smoketest.js
const endpoints = [
  { path: '/api/new-endpoint', method: 'GET', critical: true },
  // ... eksisterende endpoints
];
```

## 📊 Rapportering

### Console Output
- Farvekodet output for nem læsning
- Detaljerede test resultater
- Performance metrics
- System health assessment

### JSON Reports
- Automatisk generering af JSON rapporter
- Timestamped filnavne
- Detaljerede test data
- Performance metrics

### Exit Codes
- `0` - Alle tests bestået
- `1` - En eller flere tests fejlet
- `-1` - Test crashed

## 🚀 CI/CD Integration

### GitHub Actions
```yaml
name: Smoketest
on: [push, pull_request]
jobs:
  smoketest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run smoketest
        run: npm run smoketest:all
```

### Docker Integration
```dockerfile
# Tilføj til Dockerfile
COPY smoketest.js .
COPY frontend-smoketest.js .
COPY integration-smoketest.js .
COPY run-smoketest.js .

# Kør tests
RUN npm run smoketest:all
```

## 📚 Best Practices

### 1. Kør tests regelmæssigt
- Efter hver deployment
- Før production releases
- Ved større code changes

### 2. Monitor performance trends
- Track test duration over tid
- Identificer performance regression
- Optimize langsomme tests

### 3. Maintain test coverage
- Tilføj tests for nye features
- Update tests ved API changes
- Review test results regelmæssigt

### 4. Use appropriate timeouts
- Set realistic timeouts
- Consider network conditions
- Balance speed vs reliability

## 🔍 Troubleshooting Guide

### Test fejler men system virker
- Check timeout settings
- Verify network connectivity
- Review test expectations

### Performance issues
- Check server resources
- Review database performance
- Optimize slow queries

### Integration failures
- Verify external service status
- Check API keys/configuration
- Review network connectivity

## 📞 Support

For spørgsmål eller problemer med smoketest systemet:

1. Check denne dokumentation
2. Review test output og error messages
3. Check server logs for detaljerede fejl
4. Verify system configuration

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-23  
**Maintainer**: Cyberstreams Development Team

