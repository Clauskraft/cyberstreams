# CYBERSTREAMS ONLINE TESTING GUIDE

## 🎯 Oversigt

Dette dokument beskriver hvordan online smoketest systemet er implementeret til at køre i produktionslignende miljøer. Systemet giver mulighed for at identificere og rette fejl tidligt i udviklingsprocessen, hvilket forbedrer systemets stabilitet og pålidelighed.

## 🌐 Online Testing Arkitektur

### Komponenter
1. **Online Smoketest** (`online-smoketest.js`) - Tester online systemer
2. **Online Monitor** (`monitor-online.js`) - Kontinuerlig monitoring
3. **CI/CD Pipeline** (`.github/workflows/online-smoketest.yml`) - Automatisk testing
4. **Docker Setup** - Containerized testing
5. **Deployment Scripts** - Automatisk deployment

### Test Miljøer
- **Production**: `https://cyberstreams.dk`
- **Staging**: `https://staging.cyberstreams.dk`
- **Local**: `http://localhost:3002`

## 🚀 Implementering

### 1. **Online Smoketest**
```bash
# Test production environment
npm run smoketest:online:production

# Test staging environment
npm run smoketest:online:staging

# Test both environments
npm run smoketest:online:both
```

### 2. **Kontinuerlig Monitoring**
```bash
# Start monitoring
npm run monitor:online

# Monitor with custom settings
MONITOR_INTERVAL=30000 ALERT_THRESHOLD=5 npm run monitor:online
```

### 3. **CI/CD Pipeline**
```yaml
# Automatisk kørsel hver time
on:
  schedule:
    - cron: '0 * * * *'

# Manual trigger
on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [production, staging, both]
```

## 📊 Test Coverage

### Online Tests
- ✅ **Connectivity**: Online system connectivity
- ✅ **API Endpoints**: Production API testing
- ✅ **Performance**: Response time monitoring
- ✅ **SSL/TLS**: Certificate validation
- ✅ **Availability**: Uptime monitoring
- ✅ **Error Handling**: Error response testing
- ✅ **Monitoring**: Health check endpoints

### Performance Metrics
- **Response Time**: < 10 sekunder (kritisk)
- **Availability**: > 95% uptime
- **SSL/TLS**: Valid certificates
- **Error Rate**: < 5% failures

## 🔧 Konfiguration

### Environment Variables
```bash
# Online testing
ONLINE_BASE_URL=https://cyberstreams.dk
STAGING_BASE_URL=https://staging.cyberstreams.dk
TIMEOUT=15000
CRITICAL_THRESHOLD=10000

# Monitoring
MONITOR_INTERVAL=60000
ALERT_THRESHOLD=3
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL=admin@cyberstreams.dk
```

### Docker Configuration
```yaml
# docker-compose.online-testing.yml
services:
  online-smoketest:
    environment:
      - ONLINE_BASE_URL=${ONLINE_BASE_URL}
      - STAGING_BASE_URL=${STAGING_BASE_URL}
    command: ["node", "online-smoketest.js"]
```

## 🚀 Deployment

### 1. **Automatisk Deployment**
```bash
# Deploy online testing
chmod +x deploy-online-testing.sh
./deploy-online-testing.sh
```

### 2. **Docker Deployment**
```bash
# Build and deploy
docker build -f Dockerfile.online-testing -t cyberstreams/online-testing .
docker-compose -f docker-compose.online-testing.yml up -d
```

### 3. **CI/CD Deployment**
```yaml
# GitHub Actions
- name: Deploy Online Testing
  run: |
    docker build -f Dockerfile.online-testing -t ${{ secrets.DOCKER_REGISTRY }}/online-testing .
    docker push ${{ secrets.DOCKER_REGISTRY }}/online-testing
```

## 📈 Monitoring og Alerting

### 1. **Real-time Monitoring**
```bash
# View monitoring logs
docker-compose -f docker-compose.online-testing.yml logs -f online-monitor

# Check service status
docker-compose -f docker-compose.online-testing.yml ps
```

### 2. **Alerting**
- **Slack Integration**: Automatisk alerts til Slack
- **Email Alerts**: Email notifications ved fejl
- **Webhook Alerts**: Custom webhook integration
- **Rate Limiting**: Max 1 alert per 5 minutter

### 3. **Metrics Tracking**
```json
{
  "totalChecks": 1440,
  "successfulChecks": 1435,
  "failedChecks": 5,
  "averageResponseTime": 1250.45,
  "uptime": 99.65,
  "startTime": "2025-01-23T10:00:00Z",
  "lastCheck": "2025-01-23T11:00:00Z"
}
```

## 🔍 Troubleshooting

### Almindelige Problemer

#### 1. **Connection Timeouts**
```bash
# Fejl: Connection timeout
# Løsning: Check network connectivity
ping cyberstreams.dk
curl -I https://cyberstreams.dk/healthz
```

#### 2. **SSL Certificate Issues**
```bash
# Fejl: SSL certificate problems
# Løsning: Check certificate validity
openssl s_client -connect cyberstreams.dk:443 -servername cyberstreams.dk
```

#### 3. **High Response Times**
```bash
# Fejl: Slow response times
# Løsning: Check server performance
npm run smoketest:online:production -- --verbose
```

### Debug Mode
```bash
# Kør med debug output
DEBUG=true npm run smoketest:online:production

# Kør med verbose output
VERBOSE=true npm run monitor:online
```

## 📊 Rapportering

### 1. **Test Reports**
- **Console Output**: Real-time test results
- **JSON Reports**: Structured test data
- **Log Files**: Detailed execution logs
- **Metrics Files**: Performance metrics

### 2. **Status Dashboard**
```bash
# View current status
docker-compose -f docker-compose.online-testing.yml logs online-monitor | tail -20

# Generate status report
npm run monitor:online -- --report
```

### 3. **Historical Data**
```bash
# View historical metrics
cat metrics.json

# View monitoring logs
tail -f monitoring.log
```

## 🎯 Best Practices

### 1. **Test Environment Management**
- Brug separate miljøer for testing
- Valider test data før deployment
- Monitor test performance regelmæssigt

### 2. **Alert Management**
- Set realistic alert thresholds
- Use multiple alert channels
- Review alert history regelmæssigt

### 3. **Performance Optimization**
- Monitor response times
- Optimize test execution
- Use appropriate timeouts

### 4. **Security Considerations**
- Use secure connections (HTTPS)
- Validate SSL certificates
- Monitor for security issues

## 🔄 CI/CD Integration

### 1. **GitHub Actions**
```yaml
name: Online Smoketest
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:
jobs:
  online-smoketest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run online smoketest
        run: npm run smoketest:online:production
```

### 2. **Docker Integration**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY online-smoketest.js .
CMD ["node", "online-smoketest.js"]
```

## 📚 Documentation

### Tilgængelige Dokumenter
- `ONLINE_TESTING_GUIDE.md` - Denne guide
- `online-smoketest.js` - Online test script
- `monitor-online.js` - Monitoring script
- `.github/workflows/online-smoketest.yml` - CI/CD pipeline

### Inline Documentation
- Detaljerede comments i alle scripts
- Error messages og troubleshooting guides
- Performance metrics og tærskler
- Best practices og guidelines

## 🎉 Konklusion

Online smoketest systemet er nu **fuldt implementeret og produktionsklar**. Systemet giver:

- ✅ **Kontinuerlig monitoring** af online systemer
- ✅ **Automatisk alerting** ved fejl
- ✅ **Performance tracking** over tid
- ✅ **CI/CD integration** med GitHub Actions
- ✅ **Docker support** for containerized testing
- ✅ **Comprehensive reporting** og metrics
- ✅ **Production-ready** monitoring og alerting

Systemet er klar til brug i production miljøer og vil hjælpe med at sikre en stabil og pålidelig online præsence.

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: 2025-01-23  
**Maintainer**: Cyberstreams Development Team  
**Online Testing**: Ready 🌐


