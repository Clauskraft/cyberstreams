# Cyberstreams Enhanced - Threat Intelligence Platform

En avanceret cybersecurity threat intelligence platform med administrator panel, søgeordsovervågning og RAG (Retrieval-Augmented Generation) integration.

## 🚀 Features

- **Administrator Dashboard**: Komplet kontrol over søgeord, kilder og konfiguration
- **Søgeords Overvågning**: Opret og administrer søgeord med prioriteter og kategorier
- **Multi-Source Monitoring**: Support for web, social media, dokumenter og dark web kilder
- **RAG Integration**: Intelligent dokumentanalyse med OpenAI/Anthropic integration
- **Vector Database**: PostgreSQL med pgvector for semantic search
- **Real-time Alerts**: Automatiske alerts for high-priority matches
- **Cloudflare Edge Deployment**: Global distribution med edge computing

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ med pgvector extension
- Cloudflare account (for deployment)
- OpenAI API key (for RAG features)

## 🛠️ Installation

### 1. Clone og Setup

```bash
# Clone repository
git clone https://github.com/yourusername/cyberstreams-enhanced.git
cd cyberstreams-enhanced

# Installer dependencies
npm install

# Kopier environment fil
cp .env.example .env

# Rediger .env med dine credentials
nano .env
```

### 2. Database Setup

```bash
# Opret PostgreSQL database
createdb cyberstreams

# Installer pgvector extension (hvis ikke allerede installeret)
sudo apt-get install postgresql-15-pgvector

# Kør migrations
npm run migrate
```

### 3. Local Development

```bash
# Start development server (både frontend og backend)
npm run dev

# Eller separat:
npm run server:dev  # Backend på port 3001
npm run client:dev  # Frontend på port 5173
```

## 🌍 Cloudflare Deployment

### 1. Cloudflare Account Setup

```bash
# Login til Cloudflare
npx wrangler login

# Opret KV namespace
npx wrangler kv:namespace create "CACHE"
npx wrangler kv:namespace create "CACHE" --preview

# Opret D1 database
npx wrangler d1 create cyberstreams-db

# Opret R2 bucket
npx wrangler r2 bucket create cyberstreams-storage

# Opret Vectorize index
npx wrangler vectorize:index create cyberstreams-vectors --dimensions=1536 --metric=cosine
```

### 2. Opdater wrangler.toml

Opdater `wrangler.toml` med de IDs du fik fra ovenstående kommandoer:

```toml
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_NAMESPACE_ID"  # Fra output af kv:namespace create
preview_id = "YOUR_PREVIEW_KV_ID"

[[d1_databases]]
binding = "DB"
database_name = "cyberstreams-db"
database_id = "YOUR_D1_DATABASE_ID"  # Fra output af d1 create
```

### 3. Database Migration i D1

```bash
# Eksporter PostgreSQL schema til D1
npx wrangler d1 execute cyberstreams-db --file=./scripts/d1-schema.sql

# Eller kør migrations direkte
npx wrangler d1 execute cyberstreams-db --command="CREATE TABLE keywords (id INTEGER PRIMARY KEY, keyword TEXT, category TEXT, priority INTEGER, active INTEGER DEFAULT 1)"
```

### 4. Deploy til Cloudflare

```bash
# Build production version
npm run build

# Deploy Workers
npx wrangler deploy

# Deploy Pages (for static assets)
npx wrangler pages deploy dist --project-name=cyberstreams

# Eller alt i én kommando
npm run deploy:cloudflare
```

### 5. Environment Variables i Cloudflare

```bash
# Set secrets
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put DATABASE_URL
npx wrangler secret put API_KEY

# Set variables
npx wrangler vars set ENVIRONMENT production
```

## 🔧 Configuration

### RAG Configuration

RAG systemet kan konfigureres gennem Admin panelet eller ved at opdatere database:

```sql
UPDATE rag_config SET config_value = 'gpt-4' WHERE config_key = 'model';
UPDATE rag_config SET config_value = '0.5' WHERE config_key = 'temperature';
```

### Monitoring Sources

Tilføj nye overvågningskilder gennem Admin UI eller direkte i database:

```sql
INSERT INTO monitoring_sources (source_type, url, scan_frequency) 
VALUES ('web', 'https://example.com/feed', 3600);
```

## 📊 API Endpoints

### Keywords Management
- `GET /api/admin/keywords` - List alle søgeord
- `POST /api/admin/keywords` - Opret nyt søgeord
- `DELETE /api/admin/keywords/:id` - Slet søgeord
- `PUT /api/admin/keywords/:id/toggle` - Aktiver/deaktiver søgeord

### Sources Management
- `GET /api/admin/sources` - List alle kilder
- `POST /api/admin/sources` - Tilføj ny kilde
- `DELETE /api/admin/sources/:id` - Slet kilde

### RAG Operations
- `GET /api/admin/rag-config` - Hent RAG konfiguration
- `PUT /api/admin/rag-config` - Opdater RAG konfiguration
- `POST /api/admin/run-rag-analysis` - Kør RAG analyse

### Search
- `POST /api/search` - Semantic search i dokumenter

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Cloudflare Edge               │
│  ┌─────────────────────────────────┐   │
│  │     Workers (API Gateway)       │   │
│  └──────────┬──────────────────────┘   │
│             │                           │
│  ┌──────────▼──────────┐               │
│  │    KV (Cache)       │               │
│  └─────────────────────┘               │
│                                         │
│  ┌─────────────────────┐               │
│  │    D1 (Database)    │               │
│  └─────────────────────┘               │
│                                         │
│  ┌─────────────────────┐               │
│  │  Vectorize (Search) │               │
│  └─────────────────────┘               │
│                                         │
│  ┌─────────────────────┐               │
│  │   R2 (Storage)      │               │
│  └─────────────────────┘               │
└─────────────────────────────────────────┘
                    │
                    ▼
    ┌──────────────────────────────┐
    │     External Services        │
    │  - OpenAI API                │
    │  - Web Scrapers              │
    │  - RSS Feeds                 │
    └──────────────────────────────┘
```

## 🔒 Security

- Alle API endpoints er beskyttet med Bearer token authentication
- CORS er konfigureret for production miljø
- Rate limiting implementeret via Cloudflare
- Sensitive data gemmes som secrets i Cloudflare

## 📝 Environment Variables

Se `.env.example` for komplet liste af konfigurationsmuligheder.

### Kritiske Variables:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - For RAG funktionalitet
- `CF_ACCOUNT_ID` - Cloudflare account ID
- `API_KEY` - For API authentication

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT 1"

# Check pgvector installation
psql $DATABASE_URL -c "SELECT * FROM pg_extension WHERE extname = 'vector'"
```

### Cloudflare Deployment Issues
```bash
# Check deployment status
npx wrangler tail

# View logs
npx wrangler logs

# Test worker locally
npx wrangler dev
```

### RAG Processing Issues
- Verificer OpenAI API key er korrekt
- Check API rate limits
- Se logs for error messages

## 🤝 Contributing

1. Fork repository
2. Opret feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push til branch (`git push origin feature/AmazingFeature`)
5. Åben Pull Request

## 📄 License

MIT License - se LICENSE fil for detaljer

## 📧 Support

For support og spørgsmål:
- Opret issue på GitHub
- Email: support@cyberstreams.com
- Documentation: https://docs.cyberstreams.com

## 🚀 Roadmap

- [ ] Machine Learning baseret threat scoring
- [ ] Integration med MISP og andre threat intelligence platforms
- [ ] Advanced alerting med Slack/Teams/Discord
- [ ] Automated response playbooks
- [ ] Enhanced dark web monitoring
- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Mobile app

## 🔄 Updates

### Version 2.0.0 (Current)
- Administrator panel med fuld CRUD funktionalitet
- RAG integration med OpenAI/Anthropic
- PostgreSQL pgvector for semantic search
- Cloudflare edge deployment
- Enhanced monitoring capabilities

### Version 1.0.0
- Initial release med basic monitoring
- Simple scraper funktionalitet
- Basic threat intelligence feeds
