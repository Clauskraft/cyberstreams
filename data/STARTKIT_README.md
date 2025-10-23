# Cyberstreams OSINT Startkit

## 📦 Comprehensive Intelligence Sources & Configuration Package

This startkit contains a complete set of OSINT sources, threat intelligence data, and configuration for the Cyberstreams platform.

### 🎯 What's Included

#### **50+ Intelligence Sources**

- **Critical Sources**: CFCS, CERT.dk, ENISA, CISA
- **High Priority**: CERT-EU, NVD, NCSC UK, BSI CERT
- **European CERTs**: All major EU member state CERTs
- **Vendor PSIRTs**: Microsoft, Cisco, and other major vendors
- **Research**: MITRE CVE, academic sources

#### **25+ Threat Keywords**

- **Threats**: ransomware, APT, zero-day, phishing, malware
- **Vulnerabilities**: CVE-2024, CVE-2025, critical vulnerabilities
- **Infrastructure**: critical infrastructure, energy, healthcare, finance
- **Actors**: APT28, APT29, Lazarus, FIN7, REvil, LockBit
- **Techniques**: spear phishing, lateral movement, persistence

#### **15+ Threat Categories**

- APT (Advanced Persistent Threats)
- FIMI (Foreign Information Manipulation)
- Critical Infrastructure Protection
- Ransomware & Malware
- Zero-Day Vulnerabilities
- Hybrid Warfare
- Supply Chain Attacks
- Cybercrime Operations
- Social Engineering
- Data Breaches

#### **Ollama Models Configuration**

- **dolphin-llama3:8b**: Uncensored model for OSINT analysis
- **llama3.1:8b**: General purpose analysis
- **llama3.1:latest**: Latest features
- **nomic-embed-text**: Semantic search embeddings

### 🚀 Quick Start

#### **1. Load Startkit**

```bash
# Make sure API server is running
npm run server

# In another terminal, load the startkit
./scripts/load-startkit.sh
```

#### **2. Verify Installation**

- Navigate to **OSINT Studio** tab
- Check **Dashboard** for system status
- Review **OSINT Sources** tab for loaded sources
- Test **AI Models** tab for Ollama configuration

#### **3. Start Analysis**

- Use **Agent Runs** to create OSINT analysis tasks
- Leverage **dolphin-llama3:8b** for unrestricted analysis
- Monitor **Intel Scraper** status for real-time data

### 📊 Geographic Coverage

- **Denmark**: CFCS, CERT.dk (Critical)
- **Nordic**: Sweden, Norway, Finland, Iceland
- **EU**: All 27 member states + UK
- **US**: CISA, NVD, vendor sources
- **Global**: International CERTs, research institutions

### 🔧 Configuration

#### **Environment Variables**

```bash
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
AUTO_START_INTEL_SCRAPER=true
AUTO_SEED_SOURCES=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=dolphin-llama3:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
```

#### **Database Schema**

- PostgreSQL with pgvector extension
- Sources, keywords, findings tables
- Vector embeddings for semantic search
- MISP/OpenCTI integration ready

### 📡 RSS Feed Sources

#### **Critical Sources**

- `https://cfcs.dk/da/nyheder/rss` - Danish CFCS
- `https://cert.dk/rss` - Danish CERT
- `https://www.enisa.europa.eu/news/rss` - ENISA
- `https://www.cisa.gov/cybersecurity-advisories/rss.xml` - CISA

#### **European CERTs**

- `https://cert.europa.eu/publications/rss` - CERT-EU
- `https://cert-bund.de/rss` - German BSI CERT
- `https://ncsc.gov.uk/api/1/services/v1/report-rss-feed.xml` - UK NCSC
- `https://cert.at/rss` - Austrian CERT
- `https://www.cert.se/rss` - Swedish CERT
- `https://cert.fi/rss` - Finnish CERT

#### **Vendor Sources**

- `https://msrc.microsoft.com/update-guide/rss` - Microsoft PSIRT
- `https://sec.cloudapps.cisco.com/security/center/` - Cisco PSIRT

### 🤖 AI Models

#### **dolphin-llama3:8b** (Primary)

- **Size**: 4.7GB
- **Capabilities**: Unrestricted OSINT analysis, threat intelligence
- **Use Case**: Deep analysis without content filtering
- **Perfect for**: Sensitive threat analysis, uncensored research

#### **llama3.1:8b** (General)

- **Size**: 4.7GB
- **Capabilities**: General analysis, summarization, classification
- **Use Case**: Standard threat analysis and reporting
- **Perfect for**: Routine analysis, documentation

#### **nomic-embed-text** (Embeddings)

- **Size**: 274MB
- **Capabilities**: Semantic search, similarity matching, clustering
- **Use Case**: Knowledge base search, document similarity
- **Perfect for**: Finding related threats, pattern matching

### 🔍 Intelligence Categories

#### **Threat Types**

- APT (Advanced Persistent Threats)
- FIMI (Foreign Information Manipulation)
- Critical Infrastructure Protection
- Ransomware & Malware
- Zero-Day Vulnerabilities
- Hybrid Warfare
- Supply Chain Attacks
- Cybercrime Operations
- Social Engineering
- Data Breaches

#### **Severity Levels**

- **Critical**: Immediate action required
- **High**: Priority response needed
- **Medium**: Monitor and assess
- **Low**: Awareness only

#### **Source Types**

- **RSS Feeds**: News and official announcements
- **OSINT**: Open source intelligence
- **Social Intelligence**: Social media monitoring
- **Technical**: Malware analysis, IOCs
- **Government**: Official government sources
- **CERT**: Computer Emergency Response Teams
- **Vendor**: Product security teams
- **Research**: Academic and research institutions

### 📈 Sample Intelligence Findings

#### **Critical Finding**

```json
{
  "id": "INTEL-001",
  "title": "Russian APT28 Campaign Targeting Nordic Critical Infrastructure",
  "description": "Multiple indicators suggest coordinated cyber espionage campaign targeting energy and maritime sectors across Nordic countries.",
  "source": "FE-DDIS + CERT.DK + NATO",
  "sourceType": "osint",
  "severity": "critical",
  "category": ["APT", "Critical Infrastructure", "Espionage", "Russia"],
  "indicators": [
    { "type": "IP", "value": "185.220.101.45" },
    { "type": "Domain", "value": "maritime-update[.]com" },
    { "type": "Hash", "value": "a3f8b9c2d1e4f5a6b7c8d9e0f1a2b3c4" }
  ],
  "confidence": 95
}
```

#### **High Priority Finding**

```json
{
  "id": "INTEL-002",
  "title": "EU FIMI Detection: Coordinated Disinformation on Energy Crisis",
  "description": "Foreign Information Manipulation campaign detected across social media platforms spreading false narratives about EU energy security.",
  "source": "EEAS + ENISA",
  "sourceType": "social",
  "severity": "high",
  "category": ["FIMI", "Disinformation", "Energy", "Influence Operations"],
  "indicators": [
    { "type": "Account", "value": "@energy_truth_eu" },
    { "type": "Hashtag", "value": "#EUEnergyCrisis" },
    { "type": "Domain", "value": "eu-energy-facts[.]info" }
  ],
  "confidence": 87
}
```

### 🛠️ API Endpoints

#### **Intel Scraper**

- `GET /api/intel-scraper/status` - Get scraper status
- `POST /api/intel-scraper/start` - Start scraper
- `POST /api/intel-scraper/stop` - Stop scraper
- `POST /api/intel-scraper/run` - Run immediate scan
- `GET /api/intel-scraper/approvals` - Get pending approvals
- `GET /api/intel-scraper/candidates` - Get candidate sources
- `POST /api/intel-scraper/discover` - Discover new sources

#### **Agentic Orchestration**

- `GET /api/agentic/tools` - List available tools
- `POST /api/agentic/discover` - Discover new tools
- `POST /api/agentic/runs` - Create agent run
- `GET /api/agentic/runs` - List agent runs
- `GET /api/agentic/runs/:id` - Get specific run
- `POST /api/agentic/runs/:id/steps` - Add step to run
- `POST /api/agentic/runs/:id/status` - Update run status

#### **Bootstrap**

- `POST /api/bootstrap/standardize` - Standardize environment
- `GET /api/bootstrap/defaults` - Get default configuration
- `POST /api/bootstrap/ollama` - Configure Ollama models
- `POST /api/bootstrap/seed-sources` - Seed initial sources

#### **Knowledge & AI**

- `POST /api/knowledge` - Upload knowledge document
- `GET /api/knowledge/search` - Search knowledge base
- `POST /api/agent/chat` - Chat with AI agent

### 🔧 System Requirements

#### **Minimum Requirements**

- **Node.js**: >=18.0.0
- **npm**: >=8.0.0
- **Ollama**: >=0.1.0
- **PostgreSQL**: >=13.0
- **RAM**: >=8GB
- **Storage**: >=20GB

#### **Recommended**

- **RAM**: >=16GB (for multiple Ollama models)
- **Storage**: >=50GB (for vector embeddings)
- **CPU**: >=4 cores (for concurrent processing)

### 🚀 Startup Sequence

1. **Start PostgreSQL database**
2. **Start Ollama service**
3. **Install Ollama models** (dolphin-llama3:8b, llama3.1:8b, nomic-embed-text)
4. **Start Cyberstreams API server** (`npm run server`)
5. **Start Vite dev server** (`npm run dev`)
6. **Load startkit** (`./scripts/load-startkit.sh`)
7. **Verify platform** (navigate to OSINT Studio)

### 📋 Troubleshooting

#### **Common Issues**

**Ollama not responding**

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
ollama serve
```

**Models not installing**

```bash
# Check available space
df -h

# Install models manually
ollama pull dolphin-llama3:8b
ollama pull llama3.1:8b
ollama pull nomic-embed-text
```

**API server not starting**

```bash
# Check port availability
lsof -i :3001

# Check logs
npm run server
```

**Database connection issues**

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U postgres -d cyberstreams
```

### 📞 Support

For issues with the startkit:

1. Check the logs in the terminal
2. Verify all services are running
3. Check system requirements
4. Review the troubleshooting section

### 🎯 Next Steps

After loading the startkit:

1. **Explore OSINT Studio** - Centralized intelligence management
2. **Configure Sources** - Add custom RSS feeds and APIs
3. **Run Analysis** - Use AI models for threat analysis
4. **Monitor Intel Scraper** - Real-time threat intelligence
5. **Build Knowledge Base** - Upload documents and reports
6. **Create Agent Runs** - Automated OSINT workflows

---

**🎉 You now have a fully configured OSINT platform with 50+ intelligence sources, uncensored AI models, and comprehensive threat intelligence capabilities!**

