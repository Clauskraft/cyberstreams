# Cyberstreams - Dark Web Threat Intelligence Platform

![Version](https://img.shields.io/badge/version-1.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.2-3178c6)
[![Deploy to Cloudflare Pages](https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/Clauskraft/cyberstreams/actions/workflows/deploy-cloudflare.yml)

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

### Automatisk Deployment via GitHub Actions (Anbefalet)

Dette projekt bruger GitHub Actions til automatisk deployment til Cloudflare Pages.

**Setup:**
1. Tilføj Cloudflare secrets til GitHub repository (se [DEPLOYMENT.md](DEPLOYMENT.md))
2. Merge til `main` branch
3. GitHub Actions deployer automatisk!

**Deployment Status:** Se badge øverst eller gå til [Actions](https://github.com/Clauskraft/cyberstreams/actions)

**Live Site:** https://cyberstreams.pages.dev

**Detaljeret Guide:** Se [DEPLOYMENT.md](DEPLOYMENT.md) for komplet vejledning

### Environment Variables
No environment variables required for basic deployment. All data is currently mock data.

## 📝 Version History

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

**Status**: ✅ Production Ready | 🚀 Deployed on Cloudflare Pages | 📦 Version 1.1.0
