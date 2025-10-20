# Cyberstreams - Dark Web Threat Intelligence Platform

![Version](https://img.shields.io/badge/version-1.4.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-3178c6)

Advanced threat intelligence platform for monitoring and analyzing dark web activities, cyber threats, and security incidents.

## 🚀 Live Demo

- **Production**: https://8b6c2bc3.cyberstreams.pages.dev
- **Custom Domain**: cyberstreams.dk (pending DNS configuration)

## ✨ Features

### 🎯 Dashboard
- Real-time threat statistics and metrics
- System health monitoring
- Quick access to critical information

### 🛡️ Threats Module
- Comprehensive threat database with 10+ threat types
- Advanced filtering by severity (critical, high, medium, low)
- Status tracking (active, mitigated, investigating)
- IOC (Indicators of Compromise) display
- Search functionality across threat names and descriptions
- Detailed metadata for each threat

### 📊 Activity Module
- Real-time activity timeline with 20+ log types
- Activity type filtering (scan, alert, threat, system, user, data)
- Severity indicators with visual icons
- Metadata display (affected systems, duration, results)
- Comprehensive stats dashboard

### 📡 Dagens Puls (Daily Feed)
- Real-time threat intelligence feed
- Curated security news and updates
- Severity-based color coding

### 🤖 Cyberstreams Agent (NEW)
- AI-powered threat analysis
- Automated finding collection
- Severity classification
- Source correlation and tracking
- Interactive threat exploration

### 🧠 Intelligence Services (NEW)
- Hourly ingestion pipeline consolidating RSS, HTML, API and dark-web feeds
- Automated STIX 2.1 normalization with distribution to MISP and OpenCTI
- GPT-powered summarisation API with CVE enrichment and [Unverified] tagging
- Semantic search powered by Qdrant/Weaviate vector embeddings
- JWT-protected API layer with rate limiting

### 🔍 Consolidated Intelligence (NEW)
- Multi-source intelligence aggregation
- 30+ European CERT/CSIRT sources
- Advanced filtering and search
- IOC extraction and correlation
- Confidence scoring
- Visual analytics and charts

### ⚙️ Admin Panel (NEW)
- Keyword management (CRUD operations)
- Source configuration
- RAG (Retrieval-Augmented Generation) settings
- LLM model selection
- Vector store configuration
- Scraper controls

### 🔒 Error Handling
- Professional ErrorBoundary component
- Graceful error recovery
- User-friendly error messages
- Stack trace for debugging

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 4.5.14
- **Styling**: Tailwind CSS 3.3.3
- **Icons**: Lucide React 0.263.1
- **Hosting**: Cloudflare Pages
- **Minification**: Terser

## 📦 Performance Optimizations

- **Lazy Loading**: All modules loaded on-demand with React.Suspense
- **Code Splitting**: Separate vendor chunks (React, icons)
- **Bundle Size**: 62% reduction (154KB → 59KB)
- **Minification**: Terser with console.log removal
- **Compression**: Gzip enabled
- **Build Time**: ~3-4 seconds

### Bundle Analysis
```
index.html                      0.64 KB │ gzip: 0.36 KB
assets/index.css               17.37 KB │ gzip: 3.97 KB
assets/DagensPuls.js            1.50 KB │ gzip: 0.83 KB
assets/HomeContent.js           2.48 KB │ gzip: 1.16 KB
assets/icons.js                 3.62 KB │ gzip: 1.63 KB
assets/ActivityModule.js        9.49 KB │ gzip: 2.70 KB
assets/ThreatsModule.js        10.12 KB │ gzip: 2.82 KB
assets/react-vendor.js        139.45 KB │ gzip: 44.76 KB
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Git

### Quick Start with GitHub Codespaces 🚀
The fastest way to get started! Click the button below to open in a cloud-based development environment:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Clauskraft/cyberstreams)

Everything is pre-configured:
- ✅ Node.js 20 environment
- ✅ All dependencies installed automatically
- ✅ VS Code extensions ready
- ✅ Development server ports forwarded
- ✅ GitHub Copilot enabled

See [`.devcontainer/README.md`](.devcontainer/README.md) for details.

### Local Development
```bash
# Clone repository
git clone https://github.com/Clauskraft/cyberstreams.git
cd cyberstreams

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend & Intelligence Services
```bash
# Configure environment
cp .env.example .env

# Start API with hourly ingestion scheduler
npm run server

# (Optional) Seed authorized sources into PostgreSQL
npx ts-node scripts/migrate-authorized-sources.ts
```

## 📁 Project Structure

```
cyberstreams/
├── src/
│   ├── components/
│   │   ├── ErrorBoundary.tsx    # Error boundary wrapper
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── NavBar.tsx
│   │   └── Text.tsx
│   ├── modules/
│   │   ├── ThreatsModule.tsx    # Threat management interface
│   │   ├── ActivityModule.tsx   # Activity logging interface
│   │   ├── DagensPuls.tsx       # Daily threat feed
│   │   └── HomeContent.tsx      # Dashboard content
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Intelligence.tsx
│   │   ├── About.tsx
│   │   └── Admin.tsx
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   └── resolveTokens.ts
│   ├── tokens/                   # Design tokens
│   ├── data/                     # Mock data and RSS feeds
│   ├── App.tsx                   # Main app component
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── public/
├── scripts/                      # Utility scripts
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind configuration
└── package.json
```

## 🚀 Deployment

### Cloudflare Pages (Recommended)

1. Build the project:
```bash
cd cyberstreams
npm run build
```

2. Create deployment ZIP:
```bash
cd dist
tar -czf ../../cyberstreams-deploy.zip .
```

3. Upload to Cloudflare Pages:
   - Go to: https://dash.cloudflare.com/pages/new/upload
   - Upload ZIP file
   - Project name: `cyberstreams`
   - Deploy

### Railway (Backend Deployment)

Automated deployment with full monitoring and health checks:

1. **GitHub Actions** automatically deploys to Railway on pushes to `main`/`master`
2. **Health monitoring** runs every 15 minutes to ensure service availability
3. **Automated alerts** via GitHub Issues when deployments fail or service is down
4. **Deployment tracking** maintains history of all deployments

For detailed setup and release management:
📚 **[Railway Release Management Guide](RAILWAY_RELEASE_MANAGEMENT.md)**

Quick commands:
```bash
# Check Railway service health
npm run railway:health

# Check deployment status
npm run railway:check

# View deployment report
npm run railway:report
```

### Environment Variables
No environment variables required for basic deployment. All data is currently mock data.

## 📝 Version History

### v1.4.0 (2025-10-20)
- 🚀 Add comprehensive Railway release management system
- 📊 Enhanced health endpoint with detailed service status
- 🔍 Automated deployment monitoring workflow
- 🚨 Automated GitHub issue creation for deployment failures
- 📈 Deployment history tracking and reporting
- 🛠️ Railway manager CLI tools (health, check, report)
- 📚 Complete release management documentation

### v1.1.0 (2025-10-13)
- ✨ Add ThreatsModule with comprehensive threat management
- ✨ Add ActivityModule with timeline and severity indicators
- ✨ Add ErrorBoundary for graceful error handling
- ⚡ Implement lazy loading with React.Suspense
- ⚡ Add code splitting with separate vendor chunks
- ⚡ Reduce bundle size by 62% (154KB → 59KB)
- 🔧 Add TypeScript path aliases (@modules, @components, @theme, @tokens, @data)
- 🧹 Clean up old compiled files
- 📦 Update all dependencies

### v1.0.0 (2025-10-12)
- 🎉 Initial release
- ✨ Dashboard with threat statistics
- ✨ Dagens Puls threat intelligence feed
- ✨ Basic navigation and layout

## 🤖 AI-Assisted Development

This repository uses Claude Code for AI-assisted development and automated code review:

### GitHub Actions Integration
- **Claude Code** (`@claude` trigger): Tag `@claude` in issues or PR comments to get AI assistance
- **Automated Code Review**: All pull requests are automatically reviewed for:
  - Code quality and best practices
  - Potential bugs and security issues
  - Performance considerations
  - Test coverage

For detailed information about the Claude integration, see [CLAUDE.md](CLAUDE.md).

### Setup
To use Claude integration, ensure you have set the `ANTHROPIC_API_KEY` secret in your repository settings.

## 🔐 Security

This is a demonstration platform with mock data. For production use:
- Implement proper authentication and authorization
- Connect to real threat intelligence APIs
- Enable rate limiting and CSRF protection
- Use environment variables for sensitive configuration
- Implement proper data validation and sanitization

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

- **Project**: https://github.com/Clauskraft/cyberstreams
- **Issues**: https://github.com/Clauskraft/cyberstreams/issues
- **Website**: https://cyberstreams.dk

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
- Developed with [Claude Code](https://claude.com/claude-code)

---

**Status**: ✅ Production Ready | 🚀 Deployed on Cloudflare Pages | 📦 Version 1.3.0

## 🆕 Recent Updates (v1.2.0 - 2025-10-19)

### ✨ New Admin Features

#### Intel Control Panel
- Real-time scraper monitoring and status dashboard
- System performance metrics (uptime, success rate, response time)
- Resource usage tracking (CPU, memory, pending approvals)
- Control actions (Start/Stop Scraper, Force Refresh, Emergency Bypass)
- Recent activity timeline with status indicators

#### Vector Database Management
- Advanced vector database table with 45K+ vectors
- Multi-column filtering (Source, Category, Tags)
- Powerful search across all vector attributes
- Sortable columns with visual indicators
- Statistics dashboard (Total Vectors, Storage, Performance, Last Indexed)
- Administrative actions (Rebuild Index, Test Search, Clear Database)

#### Link Validation System
- Single URL testing with detailed metrics
- Bulk link validation (up to 50 URLs simultaneously)
- Response time measurement
- SSL/HTTPS verification
- HTTP status code tracking
- Content-type detection
- Redirect following with final destination tracking
- Error handling with descriptive messages

### 🔧 Backend Enhancements

#### Intel Scraper API
Complete RESTful API for intelligence scraper management:
- `POST /api/intel-scraper/start` - Start intelligence scraper
- `POST /api/intel-scraper/stop` - Stop scraper safely
- `GET /api/intel-scraper/status` - Get current scraper status
- `POST /api/intel-scraper/emergency-bypass` - Enable compliance bypass (1-hour limit)
- `GET /api/intel-scraper/approvals` - Get pending source approvals
- `POST /api/intel-scraper/approvals/:id` - Process approval decision
- `GET /api/intel-scraper/candidates` - Get discovered source candidates
- `POST /api/intel-scraper/discover` - Run source discovery scan

#### Link Validation API
- `POST /api/validate-link` - Validate single URL with full metrics
- `POST /api/validate-links-bulk` - Batch validate up to 50 URLs

### 📊 Component Improvements
- Enhanced Admin Panel with 8 specialized tabs
- Improved navigation and visual hierarchy
- Real-time status updates and live monitoring
- Professional error handling across all new features
- Responsive design for all new components

### 🎯 Quality Assurance
- TypeScript type safety across all new components
- Full build verification (1265 modules, 3.1s build time)
- Browser testing with Playwright
- API endpoint verification
- Component integration testing

---


## 🆕 Recent Updates (v1.3.0 - 2025-10-19)

### 🎯 SignalStream Intelligence Module
Replaces Dagens Puls with advanced AI-powered intelligence aggregation:

#### Core Features
- **In-Memory Vector Store**: Real-time semantic search with custom embedding
- **Evidence Scoring**: Multi-dimensional ranking (Vector + BM25 + Freshness + Domain Authority)
- **Focus Lanes**: Categorized intelligence streams for targeted analysis
- **Session Tracing**: Interactive drill-down tracking for investigation workflows
- **Multi-Language Support**: Danish and English content generation

#### Intelligence Generation
- **Configurable Sources**: RSS, Atom, Web, API ingestion
- **Image Handling**: Generate, fetch, or hybrid mode with licensing
- **Citation Requirements**: Trust labels and verification for all sources
- **Article Synthesis**: AI-powered summaries with key points, analysis, and implications

#### User Experience
- **Interactive UI**: Expandable cards with drill-down capabilities
- **Real-Time Updates**: Live intelligence feed with freshness indicators
- **Filter & Search**: Category-based filtering with text search
- **Evidence Transparency**: Full source attribution and confidence scores

### 📦 Build Improvements
- **Optimized Bundle**: SignalStream module at 25.30 KB (7.25 KB gzipped)
- **Total Modules**: 1265 compiled successfully
- **Build Time**: 2.85s average

---

