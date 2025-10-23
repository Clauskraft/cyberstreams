# Cyberstreams Environment Configuration

This document describes all environment variables used by Cyberstreams.

## Required Variables

### Server Configuration

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

## 🚀 Platform Startup Scripts

### Complete Platform Setup
```bash
# One-command platform initialization
./scripts/start-complete.sh

# This script automatically:
# - Starts Ollama service (port 11434)
# - Installs AI models (dolphin-llama3:8b, llama3.1:8b, nomic-embed-text)
# - Starts API server (port 3001) and dev server (port 5173)
# - Loads OSINT startkit with 50+ intelligence sources
# - Configures Intel Scraper for real-time data ingestion
```

### Intelligence Data Loading
```bash
# Load OSINT startkit (50+ sources + keywords)
./scripts/load-startkit.sh

# Load intelligence knowledge base
./scripts/load-knowledge-base.sh

# Start RSS ingestion pipeline
npx ts-node scripts/cron/ingest.ts
```

### Manual Configuration Options

#### Basic Server
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment mode (development/production)

#### Data Loading Scripts
```bash
# Load complete OSINT platform (recommended)
./scripts/start-complete.sh

# Load intelligence sources only
./scripts/load-startkit.sh

# Load knowledge base only
./scripts/load-knowledge-base.sh

# Run RSS ingestion manually
npx ts-node scripts/cron/ingest.ts
```

#### Intel Scraper Configuration
- `AUTO_START_INTEL_SCRAPER`: Auto-start scraper on boot (default: true)
- `AUTO_SEED_SOURCES`: Auto-seed default sources (default: true)

#### Advanced Features
- `SKIP_OLLAMA`: Skip AI model installation in startkit loader (default: false)
- `LOG_LEVEL`: Logging level (debug, info, warn, error) (default: info)

## Optional Variables

### Database

- `DATABASE_URL`: Full PostgreSQL connection string
- OR individual connection params:
  - `POSTGRES_HOST`: Database host
  - `POSTGRES_PORT`: Database port
  - `POSTGRES_DB`: Database name
  - `POSTGRES_USER`: Database user
  - `POSTGRES_PASSWORD`: Database password

**Note**: If not provided, system uses SQLite (sufficient for development and small deployments). PostgreSQL with pgvector extension is recommended for production with vector search capabilities.

### Ollama AI

- `OLLAMA_BASE_URL`: Ollama server URL (default: http://localhost:11434)
- `OLLAMA_CHAT_MODEL`: Chat model name (default: llama3.1:latest)
- `OLLAMA_EMBEDDING_MODEL`: Embedding model (default: nomic-embed-text)

### Intel Scraper

- `AUTO_START_INTEL_SCRAPER`: Auto-start scraper on boot (default: true)
- `AUTO_SEED_SOURCES`: Auto-seed default sources (default: true)

### External Services

- `MISP_BASE_URL`: MISP threat intelligence platform URL
- `MISP_API_KEY`: MISP API key
- `OPENCTI_API_URL`: OpenCTI platform URL
- `OPENCTI_TOKEN`: OpenCTI authentication token
- `VECTOR_DB_URL`: Vector database connection URL

### Geolocation

- `WIGLE_API_KEY`: Wigle WiFi API key for network mapping
- `GOOGLE_MAPS_API_KEY`: Google Maps API key for geocoding

### AI/RAG

- `OPENAI_API_KEY`: OpenAI API key for GPT models and embeddings

### Security

- `SESSION_SECRET`: Secret for session encryption (change in production!)
- `LOG_LEVEL`: Logging level (debug/info/warn/error)

## Production Deployment

### Minimum Required Setup

```bash
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SESSION_SECRET=<generate-strong-random-secret>
```

### Full Production Setup

```bash
# Copy all variables above and provide values
# Especially important:
# - DATABASE_URL (persistent storage)
# - SESSION_SECRET (security)
# - MISP/OpenCTI credentials (threat intel)
# - OLLAMA_BASE_URL (if using separate Ollama instance)
```

## Docker Deployment

When deploying with Docker, mount environment variables via:

- Docker Compose `.env` file
- Kubernetes ConfigMaps/Secrets
- Cloud provider secret managers (AWS Secrets Manager, GCP Secret Manager, etc.)

## Healthcheck Endpoints

- `GET /healthz`: Basic health check (no dependencies)
- `GET /readyz`: Ready check (server initialized)
- `GET /api/intel-scraper/status`: Intel scraper status

## Security Notes

1. **Never commit `.env` files to git**
2. **Rotate `SESSION_SECRET` regularly**
3. **Use strong, unique API keys**
4. **Enable HTTPS in production**
5. **Restrict API access with firewall rules**

