# 🚀 GitHub Codespaces - Quick Start Guide

## Åbn Codespace med Alle Nye Funktioner

Dette dokument forklarer hvordan du åbner et GitHub Codespace med alle de seneste funktioner i Cyberstreams.

### Hvad er GitHub Codespaces?

GitHub Codespaces er et cloud-baseret udviklingsmiljø, der giver dig:
- ✅ Komplet udviklingsmiljø i skyen
- ✅ Ingen lokal installation nødvendig
- ✅ Alt er pre-konfigureret og klar til brug
- ✅ Adgang fra enhver computer med en browser

### Hurtig Start

**1. Gå til repositoryet på GitHub:**
```
https://github.com/Clauskraft/cyberstreams
```

**2. Klik på den grønne "Code" knap**

**3. Vælg "Codespaces" fanen**

**4. Klik "Create codespace on [branch]"**

Alternativt, klik direkte her:
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Clauskraft/cyberstreams)

### Hvad Sker Der?

GitHub vil automatisk:
1. ✅ Oprette et cloud-baseret udviklingsmiljø
2. ✅ Installere Node.js 20
3. ✅ Installere alle dependencies (`npm install`)
4. ✅ Sætte up VS Code med alle extensions
5. ✅ Forwarde development ports (5173, 3000)
6. ✅ Aktivere GitHub Copilot

**Klar til brug på under 2 minutter!**

### Nye Funktioner Inkluderet

Codespace'et inkluderer alle de seneste features:

#### 🤖 Cyberstreams Agent
- AI-drevet trusselanalyse
- Automatisk finding collection
- Severity klassificering
- Source correlation

#### 🔍 Consolidated Intelligence
- Multi-source intelligence aggregering
- 30+ Europæiske CERT/CSIRT kilder
- Avanceret filtering og søgning
- IOC extraction og correlation
- Confidence scoring
- Visual analytics

#### ⚙️ Admin Panel
- Keywords management (CRUD)
- Source konfiguration
- RAG (Retrieval-Augmented Generation) indstillinger
- LLM model valg
- Vector store konfiguration
- Scraper controls

#### 📡 Dagens Puls
- Real-time threat intelligence feed
- Kuraterede security news
- Severity-baseret color coding

#### 🛡️ Threats Module
- 10+ threat types
- Advanced filtering
- IOC display

#### 📊 Activity Module
- 20+ log types
- Activity filtering
- Severity indicators

### Start Udvikling

Når Codespace'et er klar:

```bash
# Start development server
npm run dev

# Byg til produktion
npm run build

# Preview production build
npm run preview

# Start Express server (backend)
npm run server
```

### Adgang til Applikationen

1. **Vite Dev Server**: 
   - Klik på port 5173 notification
   - Eller gå til "Ports" tab og klik på URL

2. **Express Server**: 
   - Klik på port 3000 notification
   - Eller gå til "Ports" tab og klik på URL

### Pre-installerede VS Code Extensions

- ✅ **ESLint** - Code linting
- ✅ **Prettier** - Code formatting
- ✅ **Tailwind CSS IntelliSense** - Tailwind autocomplete
- ✅ **TypeScript** - Enhanced TypeScript support
- ✅ **GitLens** - Git superkræfter
- ✅ **GitHub Copilot** - AI par-programmør
- ✅ **GitHub Copilot Chat** - AI assistent
- ✅ **Code Spell Checker** - Stavekontrol
- ✅ **Error Lens** - Inline fejl visning
- ✅ **Path Intellisense** - File path autocomplete
- ✅ **React Snippets** - React code snippets

### Automatiske Indstillinger

- ✅ **Format on save** aktiveret
- ✅ **ESLint auto-fix** ved gem
- ✅ **Tailwind CSS** IntelliSense konfigureret
- ✅ **TypeScript** workspace SDK konfigureret

### Teknologi Stack

- **Node.js**: 20.x (LTS)
- **TypeScript**: 5.0.2
- **React**: 18.2.0
- **Vite**: 4.5.14
- **Tailwind CSS**: 3.3.3

### Projekstruktur i Codespace

```
cyberstreams/
├── .devcontainer/          # Codespaces konfiguration
│   ├── devcontainer.json   # Container setup
│   └── README.md           # Detaljeret dokumentation
├── cyberstreams/src/       # Hovedkildekode
│   ├── modules/            # Feature modules
│   │   ├── ConsolidatedIntelligence.tsx  # NEW
│   │   ├── CyberstreamsAgent.tsx         # NEW
│   │   ├── ThreatsModule.tsx
│   │   ├── ActivityModule.tsx
│   │   ├── DagensPuls.tsx
│   │   └── HomeContent.tsx
│   ├── pages/              # Page components
│   │   └── Admin.tsx       # NEW - Admin panel
│   ├── components/         # Reusable UI components
│   │   └── IntelControlPanel.tsx  # NEW
│   ├── theme/              # Theme system
│   └── App.tsx             # Main app
├── dist/                   # Production build
├── package.json            # Dependencies
└── vite.config.ts          # Vite configuration
```

### Fejlsøgning

#### Problem: Port forwarding virker ikke
**Løsning**: 
- Tjek "Ports" tab i VS Code
- Manuel tilføj ports hvis nødvendigt

#### Problem: Dependencies installeres ikke
**Løsning**: 
```bash
npm install
```

#### Problem: Extensions loader ikke
**Løsning**: 
- Reload window: `Cmd/Ctrl + Shift + P` → "Developer: Reload Window"

### Tips & Tricks

1. **Gem automatisk**: VS Code gemmer automatisk og formatterer din kode
2. **GitHub Copilot**: Tryk `Ctrl/Cmd + I` for inline chat
3. **Terminal**: `Ctrl/Cmd + ` ` for at åbne integrated terminal
4. **Split Editor**: Drag files til siden for split view
5. **Ports**: Tjek "Ports" tab for alle forwardede ports

### Stop Codespace

**Vigtig**: Husk at stoppe dit Codespace når du er færdig for at spare ressourcer:

1. Gå til https://github.com/codespaces
2. Find dit aktive Codespace
3. Klik "..." → "Stop codespace"

Eller brug GitHub CLI:
```bash
gh codespace stop
```

### Ressourcer

- 📚 [Detaljeret Codespaces Dokumentation](.devcontainer/README.md)
- 📚 [GitHub Codespaces Docs](https://docs.github.com/en/codespaces)
- 📚 [Projekt README](README.md)
- 📚 [Funktionsliste](FUNCTION_LIST.md)

### Support

Spørgsmål eller problemer?
1. Tjek [repository issues](https://github.com/Clauskraft/cyberstreams/issues)
2. Opret ny issue med `codespaces` label
3. Inkluder creation log og fejl detaljer

---

**Status**: ✅ Klar til Brug
**Senest Opdateret**: 2025-10-15
**Node.js Version**: 20.x
**Alle Nye Features**: ✅ Inkluderet

**God kodning! 🚀**
