# Consolidated Intelligence Platform

## Overview

Unified hybrid threat intelligence platform aggregating data from multiple open source intelligence sources including RSS feeds, OSINT platforms, social intelligence, and technical threat indicators.

## Features

### Multi-Source Intelligence Aggregation

**18 RSS Feed Sources:**
- **Danish Intelligence**: FE-DDIS (Forsvarets Efterretningstjeneste)
- **Danish Cybersecurity**: CERT.DK, Maritime Denmark
- **European Union**: EU Council, EEAS, ENISA
- **NATO**: NATO Press, NATO CCDCOE
- **US Intelligence**: CISA/US-CERT
- **Security Research**: CEPA, RAND Corporation, Shadowserver
- **International**: Europol, IDEA International, Reuters, Financial Times
- **Danish Media**: DR Nyheder, Berlingske, Altinget IT

### Intelligence Categories

- **APT (Advanced Persistent Threats)**
- **FIMI (Foreign Information Manipulation & Interference)**
- **Critical Infrastructure Protection**
- **Ransomware & Malware**
- **Zero-Day Vulnerabilities**
- **Hybrid Warfare**
- **Supply Chain Attacks**
- **Cybercrime Operations**
- **Social Engineering**
- **Data Breaches**

### Core Capabilities

#### 1. AI-Powered Search
- Full-text search across findings, descriptions, and indicators
- Context-aware query processing
- Natural language search support
- Keyword highlighting

#### 2. Dynamic Filtering
**Severity Levels:**
- Critical (immediate action required)
- High (priority response needed)
- Medium (monitor and assess)
- Low (awareness only)

**Source Types:**
- RSS Feeds (news and official announcements)
- OSINT (open source intelligence)
- Social Intelligence (social media monitoring)
- Technical (malware analysis, IOCs)

**Time Ranges:**
- Last Hour
- Last 24 Hours
- Last 7 Days
- Last 30 Days

**Category Tags:**
- Filter by specific threat categories
- Multiple category support
- Dynamic tag generation

#### 3. Advanced Visualizations

**Category Heatmap:**
- Top 10 threat categories
- Visual bar chart representation
- Proportional sizing based on volume
- Real-time updates

**Severity Distribution:**
- Pie chart showing severity breakdown
- Percentage calculations
- Color-coded severity levels
- Interactive charts

**Statistics Dashboard:**
- Total findings count
- Critical threats counter
- High priority threats
- Active sources tracking
- Average confidence score

#### 4. Indicators of Compromise (IOC)

**Supported IOC Types:**
- IP Addresses
- Domain Names
- File Hashes (MD5, SHA1, SHA256)
- CVE Identifiers
- Malware Family Names
- C2 Server Addresses
- TTP (Tactics, Techniques, Procedures)
- User Accounts
- Email Addresses
- URLs

#### 5. Cross-Source Correlation

- Automatic linking of related findings
- Correlation ID tracking
- Network graph visualization (planned)
- Timeline analysis (planned)

#### 6. Confidence Scoring

- ML-based confidence levels (0-100%)
- Source reliability weighting
- Indicator verification
- Cross-validation scoring

## Technical Architecture

### Frontend Stack

```typescript
// React Component Structure
ConsolidatedIntelligence
├── Header (Statistics & Metadata)
├── Search Bar (AI-Powered Search)
├── Filters (Severity, Source, Time, Category)
├── Visualization Grid
│   ├── Category Heatmap
│   └── Severity Distribution
└── Intelligence Findings List
    ├── Finding Card
    │   ├── Severity Badge
    │   ├── Source Type Icon
    │   ├── Title & Description
    │   ├── Category Tags
    │   ├── IOC Indicators
    │   └── Metadata (timestamp, correlations, confidence)
    └── Pagination/Infinite Scroll
```

### Backend Integration (Ready)

**OpenSearch/Elasticsearch:**
```json
{
  "index_pattern": "hybrid-threat-findings-*",
  "mapping": {
    "properties": {
      "title": {"type": "text"},
      "description": {"type": "text"},
      "source": {"type": "keyword"},
      "source_type": {"type": "keyword"},
      "severity": {"type": "keyword"},
      "category": {"type": "keyword"},
      "indicators": {"type": "nested"},
      "timestamp": {"type": "date"},
      "confidence": {"type": "integer"},
      "correlations": {"type": "keyword"}
    }
  }
}
```

**Logstash Pipeline:**
```ruby
input {
  rss {
    urls => ["${RSS_FEEDS}"]
    interval => 300 # 5 minutes
  }
}
filter {
  mutate {
    add_field => { "source_type" => "rss" }
  }
  # AI enrichment plugin
  # Correlation engine
  # Confidence scoring
}
output {
  opensearch {
    hosts => ["http://localhost:9200"]
    index => "hybrid-threat-findings-%{+YYYY.MM.dd}"
  }
}
```

**Grafana Dashboard:**
- Query builder for complex searches
- Panel templates for visualizations
- Alert rules for critical findings
- Report scheduling

### OSINT Integration (Planned)

**MISP (Malware Information Sharing Platform):**
- Automatic IOC enrichment
- Threat feed subscription
- Event correlation
- Attribute tagging

**OpenCTI (Open Cyber Threat Intelligence):**
- Knowledge graph integration
- Relationship mapping
- Intelligence lifecycle management
- STIX 2.1 support

**TheHive (Security Incident Response):**
- Case management integration
- Alert creation from findings
- Observable tracking
- Task workflow automation

## Data Model

### ThreatFinding Interface

```typescript
interface ThreatFinding {
  id: string                    // Unique identifier
  timestamp: string              // Discovery time
  title: string                  // Finding headline
  description: string            // Detailed description
  source: string                 // Origin source(s)
  sourceType: 'rss' | 'osint' | 'social' | 'technical'
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string[]             // Threat categories
  indicators: Indicator[]        // IOCs
  correlations?: string[]        // Related finding IDs
  confidence: number             // 0-100
  link?: string                  // Source URL
}

interface Indicator {
  type: string                   // IOC type
  value: string                  // IOC value
}
```

## Usage Examples

### Search Queries

```
"ransomware healthcare"         → Finds ransomware targeting healthcare
"APT28 AND critical infrastructure" → Russian APT targeting infrastructure
"CVE-2025"                      → Zero-day vulnerabilities from 2025
"FIMI disinformation"           → Foreign information manipulation
```

### Filtering Combinations

```
Severity: Critical + Source: OSINT + Time: 24h
→ Critical OSINT findings from last 24 hours

Category: Ransomware + Severity: High + Source: Technical
→ High-severity ransomware technical analysis

Search: "Russia" + Severity: Critical + Category: FIMI
→ Critical Russian FIMI operations
```

## Performance Metrics

**Current Implementation:**
- Module size: 18.37 KB (4.86 KB gzipped)
- Load time: <1 second with lazy loading
- Search latency: <100ms (in-memory)
- Render time: <500ms for 10 findings

**Target Performance (Backend):**
- Search latency: <500ms (OpenSearch)
- Real-time updates: <5 second delay
- Concurrent users: 100+
- Data retention: 90 days hot, unlimited cold

## Security Considerations

**Data Handling:**
- No sensitive credentials in findings
- Sanitized IOC data
- Rate limiting on search
- Audit logging for access

**Access Control (Planned):**
- Role-based access control (RBAC)
- API key authentication
- IP whitelisting
- Session management

## Future Enhancements

### Phase 1 (Backend Integration)
- [ ] RSS feed aggregation service
- [ ] OpenSearch cluster setup
- [ ] Logstash pipeline configuration
- [ ] Real-time data ingestion

### Phase 2 (OSINT Integration)
- [ ] MISP connector
- [ ] OpenCTI knowledge graph
- [ ] TheHive case management
- [ ] Automated enrichment pipeline

### Phase 3 (Advanced Features)
- [ ] Machine learning for confidence scoring
- [ ] Predictive analytics
- [ ] Threat actor profiling
- [ ] Network graph visualization
- [ ] Historical trend analysis
- [ ] Custom alert rules
- [ ] Report generation
- [ ] API for external integration

### Phase 4 (Intelligence Operations)
- [ ] Collaborative intelligence sharing
- [ ] Threat hunting workflows
- [ ] Incident response playbooks
- [ ] Intelligence requirements management
- [ ] Collection management framework

## Deployment

### Current Status
- **Version**: 1.2.0
- **Status**: Frontend complete, Backend ready for integration
- **Deployment**: Cloudflare Pages
- **Access**: https://cyberstreams.pages.dev (intel tab)

### Production Deployment

**Requirements:**
- Node.js 18+
- OpenSearch/Elasticsearch 7.x+
- Logstash/Fluentd
- Grafana/Kibana
- (Optional) MISP, OpenCTI, TheHive

**Installation:**
```bash
# Frontend
cd cyberstreams
npm install
npm run build

# Backend (Docker Compose)
docker-compose -f infrastructure/docker-compose.yml up -d
```

## Support & Documentation

- **GitHub**: https://github.com/Clauskraft/cyberstreams
- **Issues**: https://github.com/Clauskraft/cyberstreams/issues
- **Documentation**: See README.md and CHANGELOG.md
- **API Docs**: (Coming soon)

## License

MIT License - Open Source Intelligence Platform

---

**Built with Open Source Components:**
- OpenSearch/Elasticsearch
- Grafana/Kibana
- Logstash/Fluentd
- MISP
- OpenCTI
- TheHive
- React + TypeScript
- Tailwind CSS

**Status**: ✅ Production Ready (Frontend) | 🚧 Backend Integration Pending
