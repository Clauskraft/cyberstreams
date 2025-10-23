# Cyberstreams Production Deployment Guide

## 🚀 Complete Platform Deployment

### ⚡ One-Command Setup (Recommended)

The fastest way to deploy a fully functional OSINT platform:

```bash
# 1. Clone and install
git clone <repository-url>
cd Cyberstreams_dk
npm install

# 2. Complete platform startup (includes everything!)
./scripts/start-complete.sh

# 3. Load intelligence data
./scripts/load-startkit.sh        # 50+ OSINT sources
./scripts/load-knowledge-base.sh  # CIA methods & techniques

# 4. Access your platform:
# Frontend: http://localhost:5173
# API: http://localhost:3001
# AI Models: http://localhost:11434
```

### 📋 Prerequisites

#### **Minimum Requirements**
- **Node.js**: >=18.0.0
- **npm**: >=8.0.0
- **RAM**: >=8GB (16GB recommended)
- **Storage**: >=20GB (50GB recommended)

#### **Optional Components**
- **PostgreSQL**: >=13.0 (with pgvector extension)
- **Ollama**: >=0.1.0 (for AI models)
- **MISP**: For threat intelligence sharing
- **OpenCTI**: For STIX 2.1 integration

### 🛠️ Step-by-Step Installation

#### **1. Basic Setup**
```bash
# Clone repository
git clone <repository-url>
cd Cyberstreams_dk

# Install dependencies
npm install

# Build frontend for production
npm run build
```

#### **2. Environment Configuration**
```bash
# Copy environment template
cp .env.example .env

# Configure basic settings
cat >> .env << EOF
NODE_ENV=production
PORT=3001

# Database (optional - uses SQLite by default)
DATABASE_URL=postgresql://user:pass@localhost:5432/cyberstreams

# AI Models (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=dolphin-llama3:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
EOF
```

#### **3. Database Setup (Optional)**
```bash
# Create PostgreSQL database
createdb cyberstreams

# Enable vector extension for semantic search
psql cyberstreams -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npx ts-node scripts/migrate-authorized-sources.ts
```

#### **4. Start Services**
```bash
# Method 1: Complete startup (recommended)
./scripts/start-complete.sh

# Method 2: Manual startup
npm run server    # API server (port 3001)
npm run dev       # Frontend (port 5173) - development only

# Method 3: Production with PM2
pm2 start server.js --name cyberstreams
pm2 save
```

#### **5. Load Intelligence Data**
```bash
# Load OSINT startkit (50+ sources)
./scripts/load-startkit.sh

# Load knowledge base (CIA methods & techniques)
./scripts/load-knowledge-base.sh

# Start RSS ingestion (optional)
npx ts-node scripts/cron/ingest.ts
```

#### **6. Verify Deployment**
```bash
# Check platform health
curl http://localhost:3001/api/health

# Verify Intel Scraper status
curl http://localhost:3001/api/intel-scraper/status

# Check loaded intelligence sources
curl http://localhost:3001/api/config/sources | jq '.data | length'

# Verify knowledge base
curl http://localhost:3001/api/knowledge/stats

# Test AI models (if Ollama is configured)
curl http://localhost:11434/api/tags
```

#### **Expected Results After Setup**
- ✅ **50+ Intelligence Sources** configured and ready
- ✅ **25+ Threat Keywords** loaded for automated detection
- ✅ **4 AI Models** installed (dolphin-llama3:8b, llama3.1:8b, nomic-embed-text)
- ✅ **RSS Ingestion Pipeline** active with PostgreSQL storage
- ✅ **Knowledge Base** with 50+ intelligence documents
- ✅ **Vector Search** capabilities operational

## 📦 Data Loading Scripts Reference

### **`scripts/start-complete.sh`**
**Complete platform initialization** - Use this for one-command setup:

- ✅ Starts Ollama service and installs AI models (~9GB download)
- ✅ Starts API server (port 3001) and dev server (port 5173)
- ✅ Automatically loads OSINT startkit with 50+ intelligence sources
- ✅ Configures Intel Scraper for real-time data ingestion
- ✅ Handles service dependencies and health checks

### **`scripts/load-startkit.sh`**
**OSINT intelligence data loader**:

- ✅ **50+ Intelligence Sources**: CFCS, CERT.dk, ENISA, CISA, European CERTs
- ✅ **25+ Threat Keywords**: Automated threat detection rules
- ✅ **RSS Feed Integration**: Real-time updates with credibility scoring
- ✅ **Multi-language Support**: DA, EN, DE, FR, ES, IT, NL, SV, NO, FI
- ✅ **Ollama Model Configuration**: Validates and configures AI models

### **`scripts/load-knowledge-base.sh`**
**Intelligence knowledge base loader**:

- ✅ **CIA Declassified Methods**: HUMINT, SIGINT, IMINT, MASINT, CYBERINT
- ✅ **OSINT Techniques**: SOCMINT, technical methods, analysis frameworks
- ✅ **Intelligence Organizations**: CIA, NSA methods and structures
- ✅ **Analysis Frameworks**: Intelligence cycle, threat modeling, correlation

### **`scripts/cron/ingest.ts`**
**Automated RSS ingestion pipeline**:

- ✅ **Parses RSS feeds** from all authorized intelligence sources
- ✅ **Stores in PostgreSQL** with vector embeddings for semantic search
- ✅ **Distributes to MISP** (Malware Information Sharing Platform)
- ✅ **Publishes to OpenCTI** (Open Cyber Threat Intelligence)
- ✅ **Generates STIX 2.1** indicators for threat intelligence sharing
- ✅ **Runs as cron job** for continuous real-time updates

## Production Checklist

### ✅ Environment Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure `DATABASE_URL` for persistent storage
- [ ] Generate strong `SESSION_SECRET`
- [ ] Set appropriate `LOG_LEVEL` (info or warn)

### ✅ Security

- [ ] Enable HTTPS (use reverse proxy like Nginx/Caddy)
- [ ] Set up firewall rules
- [ ] Configure CORS if needed
- [ ] Rotate API keys regularly
- [ ] Never expose `.env` files

### ✅ Performance

- [ ] Frontend is pre-built (`npm run build`)
- [ ] PostgreSQL connection pooling configured
- [ ] Monitor memory usage
- [ ] Set up log rotation

### ✅ Monitoring

- [ ] Health checks configured (`/healthz`, `/readyz`)
- [ ] Error tracking (e.g., Sentry)
- [ ] Performance monitoring
- [ ] Database backups

## Deployment Options

### Option 1: Traditional Server (VPS/Dedicated)

```bash
# Using PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start server.js --name cyberstreams

# Save PM2 config
pm2 save
pm2 startup
```

### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["node", "server.js"]
```

```bash
# Build and run
docker build -t cyberstreams .
docker run -d -p 3001:3001 --env-file .env cyberstreams
```

### Option 3: Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/cyberstreams
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_DB=cyberstreams
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  postgres_data:
  ollama_data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d
```

### Option 4: Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cyberstreams
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cyberstreams
  template:
    metadata:
      labels:
        app: cyberstreams
    spec:
      containers:
        - name: cyberstreams
          image: cyberstreams:latest
          ports:
            - containerPort: 3001
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: cyberstreams-secrets
                  key: database-url
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3001
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /readyz
              port: 3001
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: cyberstreams
spec:
  selector:
    app: cyberstreams
  ports:
    - port: 80
      targetPort: 3001
  type: LoadBalancer
```

## Reverse Proxy Setup

### Nginx

```nginx
server {
    listen 80;
    server_name cyberstreams.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy (with automatic HTTPS)

```
cyberstreams.yourdomain.com {
    reverse_proxy localhost:3001
}
```

## Monitoring & Logs

### View Logs (PM2)

```bash
pm2 logs cyberstreams
pm2 monit
```

### View Logs (Docker)

```bash
docker logs -f <container-id>
```

### Log Files

- Application logs: `logs/` directory (auto-created)
- Configure log rotation in production

## Backup Strategy

### Database Backups

```bash
# Automated daily backup
0 2 * * * pg_dump cyberstreams > /backups/cyberstreams-$(date +\%Y\%m\%d).sql
```

### Configuration Backups

- Back up `.env` file (encrypted!)
- Version control configuration files
- Document custom modifications

## Troubleshooting

### Server won't start

1. Check logs: `tail -100 logs/combined.log`
2. Verify environment variables
3. Check port availability: `lsof -i :3001`
4. Verify database connection

### High memory usage

1. Check PostgreSQL queries
2. Monitor Ollama usage
3. Review Intel Scraper frequency
4. Implement caching

### Database connection issues

1. Verify DATABASE_URL format
2. Check PostgreSQL is running
3. Verify network connectivity
4. Check connection pool settings

## Scaling

### Horizontal Scaling

- Run multiple instances behind load balancer
- Use shared PostgreSQL database
- Consider Redis for session storage
- Separate Ollama instance for AI workload

### Vertical Scaling

- Increase server resources
- Optimize PostgreSQL settings
- Tune Node.js heap size: `--max-old-space-size=4096`

## Security Hardening

1. **Network Security**

   - Use firewall (ufw/iptables)
   - Only expose necessary ports
   - Use VPN for admin access

2. **Application Security**

   - Keep dependencies updated
   - Run security audits: `npm audit`
   - Implement rate limiting
   - Use HTTPS only

3. **Database Security**
   - Strong passwords
   - Encrypted connections
   - Regular backups
   - Access control lists

## Support

For issues, questions, or contributions:

- Check existing documentation
- Review GitHub issues
- Contact system administrator

## Maintenance

### Regular Tasks

- [ ] Weekly: Check logs for errors
- [ ] Weekly: Review security updates
- [ ] Monthly: Database optimization
- [ ] Monthly: Backup verification
- [ ] Quarterly: Security audit
- [ ] Yearly: Dependency major updates

