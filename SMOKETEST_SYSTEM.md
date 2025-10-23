# CYBERSTREAMS SMOKETEST SYSTEM

## 🎯 System Oversigt

Cyberstreams smoketest system er et omfattende test framework der verificerer at alle kritiske funktioner i platformen fungerer korrekt. Systemet er designet portfolio til at identificere alvorlige fejl tidligt i testprocessen og sikre en stabil og pålidelig softwareudviklingsproces.

## 📁 Test Struktur

```
smoketest-system/
├── smoketest.js              # Backend API tests
├── frontend-smoketest.js     # Frontend UI tests  
├── integration-smoketest.js  # External service tests
├── quick-smoketest.js        # Quick health checks
├── run-smoketest.js          # Complete test runner
├── SMOKETEST_README.md       # User documentation
└── SMOKETEST_SYSTEM.md       # This system overview
```

## 🧪 Test Kategorier

### 1. Backend API Smoketest (`smoketest.js`)

**Formål**: Verificer backend API funktionalitet og server health

**Test Områder**:
- ✅ Server health og readiness checks
- ✅ API endpoints functionality (14+ endpoints)
- ✅ Database connectivity og fallback
- ✅ External service integrations
- ✅ Intel Scraper functionality
- ✅ Admin endpoints
- ✅ Performance metrics
- ✅ Error handling

**Kritiske Endpoints**:
- `/healthz` - Server health check
- `/readyz` - Server readiness check
- `/api/health` - API health status
- `/api/stats` - System statistics
- `/api/threats` - Threat data
- `/api/pulse` - Pulse data
- `/api/intel-scraper/status` - Intel Scraper status

### 2. Frontend UI Smoketest (`frontend-smoketest.js`)

**Formål**: Verificer frontend komponenter og UI funktionalitet

**Test Områder**:
- ✅ Page load performance
- ✅ Main component rendering
- ✅ Navigation functionality
- ✅ Dashboard module
- ✅ Threats module
- ✅ Activity module
- ✅ Responsive design
- ✅ Error boundary handling

**Kritiske Komponenter**:
- Main header og navigation
- Dashboard stats og overview
- Threat list og filters
- Activity timeline
- Responsive design på forskellige skærmstørrelser

### 3. Integration Smoketest (`integration-smoketest.js`)

**Formål**: Verificer integrationer med eksterne services

**Test Områder**:
- ✅ MISP integration
- ✅ OpenCTI integration
- ✅ Wigle Maps integration
- ✅ Database connectivity
- ✅ Intel Scraper integration
- ✅ External API connectivity
- ✅ Data flow integration
- ✅ Performance under load

**External Services**:
- MISP (Malware Information Sharing Platform)
- OpenCTI (Open Cyber Threat Intelligence)
- Wigle Maps (WiFi location data)
- Database connectivity
- Intel Scraper functionality

### 4. Quick Smoketest (`quick-smoketest.js`)

**Formål**: Hurtig health check på under 30 sekunder

**Test Områder**:
- ✅ Critical health checks
- ✅ Essential API endpoints
- ✅ Database connectivity
- ✅ Intel Scraper status
- ✅ External services (optional)

**Perfekt til**:
- CI/CD pipelines
- Hurtige health checks
- Development workflow
- Production monitoring

## 🚀 Brug og Kørsel

### Installation
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
npm run smoketest:frontend

# Integration tests
npm run smoketest:integration

# Quick health check
npm run smoketest:quick
```

### Kør alle tests
```bash
# Kør alle smoketests
npm run smoketest:all

# Med custom URL
BASE_URL=http://localhost:3001 npm run smoketest:all
```

## 📊 Test Resultater og Rapportering

### Status Koder
- ✅ **PASS** - Test bestået
- ❌ **FAIL** - Test fejlet (kritisk)
- ⚠️ **WARN** - Test bestået med advarsler

### Success Rate Tærskler
- 🟢 **90%+** - Excellent (produktionsklar)
- 🟡 **80-89%** - Good (mindre problemer)
- 🟠 **60-79%** - Fair (nogle problemer)
- 🔴 **<60%** - Poor (kritiske problemer)

### Rapportering
- **Console Output**: Farvekodet output for nem læsning
- **JSON Reports**: Automatisk generering af detaljerede rapporter
- **Performance Metrics**: Detaljerede performance analyser
- **System Health Assessment**: Omfattende system status

## ⚙️ Konfiguration

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
- **Quick tests**: 5 sekunder per test
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
- Performance trends over tid
- Optimization recommendations

## 🛠️ Fejlfinding og Troubleshooting

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
DEBUG=true npm run smoketest

# Kør med verbose output
VERBOSE=true npm run smoketest:all
```

## 🔧 Customization og Udvidelse

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

## 🎯 Test Coverage Matrix

| Test Type | Backend | Frontend | Integration | Quick |
|-----------|---------|----------|-------------|-------|
| Health Checks | ✅ | ✅ | ✅ | ✅ |
| API Endpoints | ✅ | ❌ | ✅ | ✅ |
| UI Components | ❌ | ✅ | ❌ | ❌ |
| Navigation | ❌ | ✅ | ❌ | ❌ |
| Database | ✅ | ❌ | ✅ | ✅ |
| External Services | ✅ | ❌ | ✅ | ✅ |
| Performance | ✅ | ✅ | ✅ | ❌ |
| Error Handling | ✅ | ✅ | ✅ | ❌ |

## 📊 System Health Assessment

### Excellent (90%+)
- 🟢 Alle kritiske funktioner fungerer perfekt
- 🟢 Performance er optimal
- 🟢 Ingen kritiske problemer
- 🟢 System er produktionsklar

### Good (80-89%)
- 🟡 De fleste funktioner fungerer
- 🟡 Mindre performance problemer
- 🟡 Nogle warnings men ingen kritiske fejl
- 🟡 System er funktionelt

### Fair (60-79%)
- 🟠 Nogle funktioner har problemer
- 🟠 Performance issues
- 🟠 Nogle kritiske fejl
- 🟠 System behøver opmærksomhed

### Poor (<60%)
- 🔴 Mange funktioner fejler
- 🔴 Kritiske performance problemer
- 🔴 System er ikke stabilt
- 🔴 Umiddelbar opmærksomhed påkrævet

## 🔍 Monitoring og Alerting

### Automated Monitoring
- Kør tests automatisk efter deployment
- Send alerts ved fejlende tests
- Track performance trends over tid
- Generate reports for stakeholders

### Manual Testing
- Kør tests manuelt ved større changes
- Use quick tests for hurtige checks
- Review test results regelmæssigt
- Update tests ved nye features

## 📞 Support og Vedligeholdelse

### Documentation
- `SMOKETEST_README.md` - User documentation
- `SMOKETEST_SYSTEM.md` - System overview (dette dokument)
- Inline comments i test scripts
- Error messages og troubleshooting guides

### Maintenance
- Update tests ved API changes
- Review test performance regelmæssigt
- Optimize langsomme tests
- Tilføj nye tests for nye features

### Support
- Check documentation først
- Review test output og error messages
- Check server logs for detaljerede fejl
- Verify system configuration

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-23  
**Maintainer**: Cyberstreams Development Team  
**Status**: Production Ready ✅

