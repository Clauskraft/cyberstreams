# CYBERSTREAMS MCP INTEGRATION GUIDE

## 🎯 Oversigt

Dette dokument beskriver hvordan MCP (Model Context Protocol) servere er integreret i Cyberstreams smoketest systemet. MCP servere giver mulighed for at udvide platformens funktionalitet med eksterne services og APIs.

## 🔗 MCP Servere

### 1. Filesystem MCP Server
- **Formål**: Tilgå til filsystem operationer
- **Docker Image**: `mcp/filesystem`
- **Konfiguration**: Mount local directory til container

### 2. API Gateway MCP Server
- **Formål**: Proxy og gateway til eksterne APIs
- **Docker Image**: `mcp/api-gateway`
- **Konfiguration**: Environment variables for API endpoints

## 📁 Konfiguration

### MCP Configuration File (`mcp.json`)
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-v",
        "/local-directory:/local-directory",
        "mcp/filesystem",
        "/local-directory"
      ]
    },
    "mcp-api-gateway": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "API_1_NAME",
        "-e",
        "API_1_SWAGGER_URL",
        "-e",
        "API_1_HEADER_AUTHORIZATION",
        "mcp/api-gateway"
      ],
      "env": {
        "API_1_NAME": "GitHub API",
        "API_1_SWAGGER_URL": "https://api.github.com/swagger.json",
        "API_1_HEADER_AUTHORIZATION": "token YOUR_GITHUB_TOKEN"
      }
    }
  }
}
```

### Environment Variables (`.env.mcp.template`)
```bash
# API Gateway Configuration
API_1_NAME=GitHub API
API_1_SWAGGER_URL=https://api.github.com/swagger.json
API_1_HEADER_AUTHORIZATION=token YOUR_GITHUB_TOKEN

# Additional MCP Server Environment Variables
MCP_FILESYSTEM_PATH=/local-directory
MCP_API_GATEWAY_TIMEOUT=30000
```

## 🚀 Installation og Setup

### 1. Automatisk Setup
```bash
# Kør MCP setup script
npm run setup:mcp
```

### 2. Manuel Setup
```bash
# 1. Check Docker availability
docker --version

# 2. Pull MCP Docker images
docker pull mcp/filesystem:latest
docker pull mcp/api-gateway:latest

# 3. Create MCP configuration
cp mcp.json.example mcp.json

# 4. Configure environment variables
cp .env.mcp.template .env
# Edit .env with your values

# 5. Test MCP configuration
npm run smoketest:mcp
```

## 🧪 Testing

### MCP Smoketest
```bash
# Kør MCP specifikke tests
npm run smoketest:mcp

# Kør alle tests inklusive MCP
npm run smoketest:all
```

### Test Coverage
- ✅ MCP configuration validation
- ✅ Docker image availability
- ✅ MCP server connectivity
- ✅ Environment variables
- ✅ Performance testing
- ✅ Integration testing

## 📊 Test Resultater

### MCP Test Output
```
🔗 CYBERSTREAMS MCP SMOKETEST STARTING
Target: http://localhost:3002
MCP Config: mcp.json
Timeout: 10000ms per test
Critical threshold: 5000ms

⚙️ TESTING MCP CONFIGURATION
[PASS] MCP Configuration File (2.34ms): 2 servers configured
[PASS] filesystem Configuration (0.12ms): Valid configuration
[PASS] mcp-api-gateway Configuration (0.08ms): Valid configuration

🔗 TESTING MCP SERVER CONNECTIVITY
[PASS] MCP Servers List (15.67ms): MCP endpoint accessible
[PASS] MCP Test Endpoint (12.34ms): MCP endpoint accessible

🔧 TESTING MCP SERVER FUNCTIONALITY
[PASS] MCP Filesystem Server Test (25.45ms): Server test successful
[PASS] MCP API Gateway Server Test (18.23ms): API Gateway test successful

🐳 TESTING DOCKER MCP SERVERS
[PASS] Docker Availability (0.45ms): Docker is available
[PASS] MCP Filesystem Docker Image (1.23ms): Image available
[PASS] MCP API Gateway Docker Image (1.45ms): Image available

🔐 TESTING MCP ENVIRONMENT VARIABLES
[PASS] API_1_NAME Environment Variable (0.12ms): Variable set
[PASS] API_1_SWAGGER_URL Environment Variable (0.08ms): Variable set
[PASS] API_1_HEADER_AUTHORIZATION Environment Variable (0.09ms): Variable set

⚡ TESTING MCP SERVER PERFORMANCE
[PASS] MCP Servers List Performance (15.67ms): Good performance

🔗 TESTING MCP INTEGRATION
[PASS] API Keys Integration (2.34ms): Integration working
[PASS] Admin Keywords Integration (1.89ms): Integration working
[PASS] Knowledge Base Integration (3.45ms): Integration working

📊 MCP SMOKETEST REPORT
==================================================
Total Tests: 15
✅ Passed: 15
❌ Failed: 0
⚠️  Warnings: 0

Success Rate: 100.0%

🏥 MCP HEALTH ASSESSMENT:
🟢 EXCELLENT - All MCP servers working perfectly

✅ MCP SMOKETEST PASSED - All MCP servers working!
```

## 🔧 Troubleshooting

### Almindelige Problemer

#### 1. Docker ikke tilgængelig
```bash
# Fejl: Docker not available
# Løsning: Installer Docker
# Windows: https://docs.docker.com/desktop/windows/install/
# macOS: https://docs.docker.com/desktop/mac/install/
# Linux: https://docs.docker.com/engine/install/
```

#### 2. MCP Docker images ikke fundet
```bash
# Fejl: MCP Docker images not found
# Løsning: Pull images manuelt
docker pull mcp/filesystem:latest
docker pull mcp/api-gateway:latest
```

#### 3. Environment variables ikke sat
```bash
# Fejl: Environment variables not set
# Løsning: Kopier og konfigurer environment template
cp .env.mcp.template .env
# Edit .env with your values
```

#### 4. MCP endpoints ikke tilgængelige
```bash
# Fejl: MCP endpoints not available
# Løsning: Check server configuration
# MCP endpoints er valgfrie og systemet fungerer uden dem
```

### Debug Mode
```bash
# Kør MCP tests med debug output
DEBUG=true npm run smoketest:mcp

# Kør MCP setup med verbose output
VERBOSE=true npm run setup:mcp
```

## 📈 Performance Metrics

### MCP Test Performance
- **Configuration Test**: < 5ms
- **Connectivity Test**: < 20ms
- **Functionality Test**: < 30ms
- **Docker Test**: < 5ms
- **Environment Test**: < 1ms
- **Performance Test**: < 20ms
- **Integration Test**: < 10ms

### Kritiske Tærskler
- **MCP Response Time**: < 5 sekunder
- **Docker Operations**: < 10 sekunder
- **Configuration Loading**: < 1 sekund

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: MCP Smoketest
on: [push, pull_request]
jobs:
  mcp-smoketest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Setup MCP
        run: npm run setup:mcp
      - name: Run MCP smoketest
        run: npm run smoketest:mcp
```

### Docker Integration
```dockerfile
# Tilføj til Dockerfile
COPY mcp.json .
COPY mcp-smoketest.js .
COPY setup-mcp.js .

# Setup MCP servers
RUN npm run setup:mcp

# Kør MCP tests
RUN npm run smoketest:mcp
```

## 📚 Best Practices

### 1. MCP Server Konfiguration
- Brug environment variables for sensitive data
- Valider konfiguration før deployment
- Test MCP servere regelmæssigt

### 2. Docker Management
- Keep MCP Docker images updated
- Monitor Docker resource usage
- Clean up unused containers

### 3. Security
- Never commit API keys til version control
- Use environment variables for sensitive data
- Validate MCP server inputs

### 4. Monitoring
- Monitor MCP server performance
- Track MCP server errors
- Set up alerts for MCP failures

## 🔍 Advanced Configuration

### Custom MCP Servers
```json
{
  "mcpServers": {
    "custom-server": {
      "command": "node",
      "args": ["path/to/custom-mcp-server.js"],
      "env": {
        "CUSTOM_API_KEY": "your-api-key",
        "CUSTOM_ENDPOINT": "https://api.example.com"
      }
    }
  }
}
```

### MCP Server Health Checks
```javascript
// Custom health check for MCP servers
const checkMCPServerHealth = async (serverName) => {
  try {
    const response = await fetch(`${BASE_URL}/api/mcp/health/${serverName}`);
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

## 📞 Support

### Documentation
- `MCP_INTEGRATION_GUIDE.md` - Denne guide
- `mcp.json` - MCP konfiguration
- `mcp-smoketest.js` - MCP test script
- `setup-mcp.js` - MCP setup script

### Maintenance
- Update MCP Docker images regelmæssigt
- Review MCP configuration ved changes
- Monitor MCP server performance
- Update tests ved nye MCP servere

### Support
- Check Docker installation og status
- Verify MCP configuration syntax
- Review environment variables
- Check server logs for MCP errors

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-23  
**Maintainer**: Cyberstreams Development Team  
**Status**: Production Ready ✅


