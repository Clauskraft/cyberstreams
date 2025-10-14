# Copilot Instructions for Cyberstreams

## Project Overview

Cyberstreams is an advanced Dark Web Threat Intelligence Platform that provides real-time monitoring and analysis of cyber threats, dark web activities, and security incidents. The platform features a modern React-based frontend with comprehensive threat tracking, activity monitoring, and intelligence feeds.

## Technology Stack

### Frontend
- **Framework**: React 18.2.0 with TypeScript 5.0.2
- **Build Tool**: Vite 4.4.5
- **Styling**: Tailwind CSS 3.3.3
- **Icons**: Lucide React 0.263.1
- **Type Checking**: TypeScript with strict mode enabled

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL 15+ with pgvector extension
- **AI/ML**: OpenAI API integration for RAG (Retrieval-Augmented Generation)
- **Scraping**: Puppeteer for web scraping

### Infrastructure
- **Hosting**: Cloudflare Pages
- **Workers**: Cloudflare Workers for edge computing
- **CDN**: Global distribution via Cloudflare
- **HTTPS**: Automatic SSL/TLS

## Project Structure

```
cyberstreams/
├── src/                          # Frontend source code
│   ├── App.tsx                   # Main application component
│   ├── main.tsx                  # Application entry point
│   ├── modules/                  # Feature modules
│   │   ├── Dashboard/           # Dashboard module
│   │   ├── Threats/             # Threats tracking module
│   │   ├── Activity/            # Activity monitoring module
│   │   ├── DagensPuls/          # Daily pulse feed
│   │   └── ConsolidatedIntelligence/  # Intelligence aggregation
│   └── components/              # Reusable UI components
├── cyberstreams-enhanced/       # Enhanced backend version
│   ├── server.js                # Express server
│   ├── scripts/                 # Database and migration scripts
│   └── wrangler.toml            # Cloudflare Worker config
├── .github/                     # GitHub configuration
│   └── workflows/               # CI/CD workflows
└── dist/                        # Production build output
```

## Coding Standards

### File Naming Conventions

1. **React Components**: Use PascalCase with `.tsx` extension
   ```
   HomeContent.tsx
   DagensPuls.tsx
   ErrorBoundary.tsx
   ```

2. **TypeScript Utilities**: Use PascalCase or camelCase with `.ts` extension
   ```
   resolveTokens.ts
   apiHelpers.ts
   ```

3. **Configuration Files**: Use kebab-case
   ```
   vite.config.ts
   tailwind.config.js
   postcss.config.js
   ```

4. **Directories**: Use PascalCase for component/module directories, lowercase for utility directories
   ```
   src/modules/Dashboard/
   src/components/
   src/data/
   ```

### Import Order and Organization

Follow this consistent import order for all files:

1. **React imports** (first)
   ```typescript
   import { useState, useEffect } from 'react'
   ```

2. **External library imports**
   ```typescript
   import { Shield, Activity } from 'lucide-react'
   ```

3. **Internal module imports** (using path aliases)
   ```typescript
   import HomeContent from '@modules/HomeContent'
   import { Button } from '@/components/Button'
   ```

4. **Type-only imports** (if needed)
   ```typescript
   import type { ThreatData } from '@/types'
   ```

5. **CSS imports** (last)
   ```typescript
   import './styles.css'
   ```

### TypeScript Guidelines

1. **Strict Type Safety**: Always use TypeScript's strict mode. Avoid `any` types unless absolutely necessary.
   ```typescript
   // Good
   interface ThreatData {
     id: string;
     severity: 'critical' | 'high' | 'medium' | 'low';
     status: 'active' | 'mitigated' | 'investigating';
   }
   
   // Avoid
   const data: any = fetchData();
   ```

2. **Component Types**: Use proper React component typing
   ```typescript
   // Functional components
   interface ComponentProps {
     title: string;
     onAction?: () => void;
   }
   
   const Component: React.FC<ComponentProps> = ({ title, onAction }) => {
     // Component implementation
   };
   ```

3. **Path Aliases**: Use configured path aliases for cleaner imports
   ```typescript
   // Use
   import { Component } from '@/components/Component';
   import { Module } from '@modules/Module';
   
   // Instead of
   import { Component } from '../../components/Component';
   ```

### React Best Practices

1. **Component Organization**: Keep components focused and single-purpose
2. **State Management**: Use React hooks (useState, useEffect, useContext)
3. **Error Handling**: Implement ErrorBoundary for graceful error recovery
4. **Performance**: Use React.memo() for expensive components when appropriate

### Error Handling Patterns

1. **API Calls**: Always use try-catch with proper error states
   ```typescript
   const [error, setError] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)
   
   const fetchData = async () => {
     setLoading(true)
     setError(null)
     try {
       const response = await fetch('/api/endpoint')
       if (!response.ok) throw new Error('Failed to fetch data')
       const data = await response.json()
       setData(data)
     } catch (err) {
       setError(err instanceof Error ? err.message : 'An error occurred')
       console.error('Fetch error:', err)
     } finally {
       setLoading(false)
     }
   }
   ```

2. **Component-Level Error Boundaries**: Wrap major sections
   ```typescript
   <ErrorBoundary>
     <ModuleContent />
   </ErrorBoundary>
   ```

3. **User-Friendly Messages**: Always provide clear error messages
   ```typescript
   {error && (
     <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
       <p className="text-red-400">{error}</p>
     </div>
   )}
   ```

### Styling with Tailwind CSS

1. **Utility-First**: Use Tailwind utility classes for styling
2. **Responsive Design**: Always consider mobile-first design
3. **Dark Theme**: The platform uses a dark theme (cyber aesthetic)
4. **Custom Colors**: Follow the established color palette:
   - Background: `bg-gray-900`
   - Cards: `bg-gray-800`
   - Text: `text-gray-100`, `text-gray-300`
   - Accents: `text-cyan-400`, `text-blue-400`

### Preferred Libraries and Dependencies

**Current Stack (DO NOT change without discussion):**
- **React**: 18.2.0 - UI framework
- **TypeScript**: 5.0.2 - Type safety
- **Vite**: 4.4.5 - Build tool
- **Tailwind CSS**: 3.3.3 - Styling
- **Lucide React**: 0.263.1 - Icons

**When Adding New Dependencies:**
1. Check if existing libraries can solve the problem
2. Prefer lightweight, well-maintained packages
3. Avoid adding packages that duplicate existing functionality
4. Consider bundle size impact
5. Discuss major dependency additions with the team

**Discouraged:**
- ❌ Do not add alternative UI frameworks (Material-UI, Chakra, etc.)
- ❌ Do not add CSS-in-JS libraries (styled-components, emotion)
- ❌ Do not add alternative icon libraries
- ❌ Do not add jQuery or similar legacy libraries

## Architecture Principles

### Frontend Architecture

1. **Module-Based Structure**: Features are organized into self-contained modules
2. **Component Reusability**: Common UI elements are extracted into reusable components
3. **Theme System**: Centralized theming for consistent styling
4. **Type Safety**: Full TypeScript coverage for type safety

### Backend Architecture

1. **RESTful API Design**: Clear, RESTful endpoints for all operations
2. **Database Layer**: PostgreSQL with pgvector for semantic search
3. **RAG Integration**: OpenAI-powered document analysis and embeddings
4. **Edge Computing**: Cloudflare Workers for global performance

### Key API Endpoints

```
GET    /api/admin/keywords          - List all monitoring keywords
POST   /api/admin/keywords          - Create new keyword
DELETE /api/admin/keywords/:id      - Delete keyword
PUT    /api/admin/keywords/:id/toggle - Toggle keyword status

GET    /api/admin/sources           - List all monitoring sources
POST   /api/admin/sources           - Add new source
DELETE /api/admin/sources/:id       - Delete source

GET    /api/admin/rag-config        - Get RAG configuration
PUT    /api/admin/rag-config        - Update RAG configuration
POST   /api/admin/run-rag-analysis  - Run RAG analysis

POST   /api/run-scraper             - Start data collection
POST   /api/search                  - Semantic search in documents
```

## Development Workflow

### Workspace Setup

For the best development experience:

1. **Required VS Code Extensions** (recommended):
   - ESLint - For linting
   - Prettier - For code formatting
   - Tailwind CSS IntelliSense - For Tailwind class autocomplete
   - TypeScript + JavaScript - Built-in TypeScript support

2. **Editor Settings**:
   ```json
   {
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     },
     "typescript.tsdk": "node_modules/typescript/lib"
   }
   ```

3. **Node.js Version**: Use Node.js 18+ or 20+ (as specified in workflows)

### CI/CD and Automation

The repository includes automated workflows in `.github/workflows/`:

1. **Cloudflare Pages Deployment** (`deploy-cloudflare.yml`)
   - Automatically deploys to Cloudflare Pages on push to `main`
   - Triggers on changes to source files, configs, or dependencies
   - Manual deployment available via workflow_dispatch
   - **Secrets required**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

2. **Claude Code Review** (`claude-code-review.yml`)
   - Automatically reviews all pull requests
   - Provides feedback on code quality, security, and best practices
   - **Secret required**: `ANTHROPIC_API_KEY`

3. **Claude Assistant** (`claude.yml`)
   - Interactive AI assistant triggered by `@claude` mentions
   - Works in issues, PR comments, and reviews
   - Can read CI results and provide contextual help
   - **Secret required**: `ANTHROPIC_API_KEY`

### Local Development

1. **Install Dependencies**:
   ```bash
   cd cyberstreams
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   # Server runs on http://localhost:5173
   ```

3. **Build for Production**:
   ```bash
   npm run build
   # Output in dist/ directory
   ```

4. **Type Checking**:
   ```bash
   tsc --noEmit
   ```

### Git Workflow

1. **Branches**: Create feature branches from `master`
2. **Commits**: Write clear, descriptive commit messages
3. **Pull Requests**: 
   - Include description of changes
   - Reference related issues
   - Ensure build passes

## Testing Guidelines

### Current State
- The project currently uses demonstration/mock data
- Testing infrastructure is planned but not yet implemented

### When Implementing Tests
- Use consistent testing patterns with the ecosystem
- Focus on critical business logic
- Test component rendering and user interactions
- Validate API endpoints and data transformations

## Security Guidelines

### Important Security Considerations

1. **Authentication**: Implement proper authentication and authorization for production
2. **API Keys**: Never commit API keys or secrets to the repository
   - Use environment variables for sensitive configuration
   - Store secrets in Cloudflare Workers secrets

3. **Data Validation**: Implement proper data validation and sanitization
4. **CSRF Protection**: Enable CSRF protection for production deployments
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **HTTPS Only**: Always use HTTPS in production

### Mock Data Notice
The current implementation uses mock data for demonstration purposes. When connecting to real threat intelligence APIs:
- Implement proper authentication mechanisms
- Validate all external data sources
- Sanitize user inputs
- Use parameterized queries for database operations

## Deployment

### Cloudflare Pages Deployment

1. **Build the Project**:
   ```bash
   cd cyberstreams
   npm run build
   ```

2. **Deploy to Cloudflare Pages**:
   - Manual upload via Cloudflare dashboard
   - Or use automated deployment scripts
   - Configure custom domains in Cloudflare settings

### Environment Variables

For basic deployment, no environment variables are required (mock data mode).

For production with real APIs:
- `OPENAI_API_KEY` - OpenAI API key for RAG features
- `ANTHROPIC_API_KEY` - Anthropic API key (optional)
- `JWT_SECRET` - Secret for JWT token generation
- `API_KEY` - API key for external services
- `DATABASE_URL` - PostgreSQL connection string

### Cloudflare Workers

The enhanced version includes Cloudflare Workers for edge computing:
- `wrangler.toml` - Worker configuration
- KV namespace for caching
- D1 database for edge data storage
- R2 bucket for file storage

## Code Generation Guidelines

When generating or modifying code:

1. **Follow Existing Patterns**: Match the style and structure of existing code
2. **Type Everything**: Provide complete TypeScript types for all new code
3. **Component Structure**: Follow the module-based organization
4. **Styling Consistency**: Use Tailwind classes matching the dark theme
5. **Error Handling**: Always implement proper error handling
6. **Documentation**: Add JSDoc comments for complex functions
7. **Imports**: Use path aliases (@/, @modules/, @components/)

### Common Patterns to Follow

1. **State Initialization**:
   ```typescript
   const [data, setData] = useState<DataType[]>([])
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState<string | null>(null)
   ```

2. **Effect Cleanup**:
   ```typescript
   useEffect(() => {
     let mounted = true
     
     const fetchData = async () => {
       const result = await api.getData()
       if (mounted) setData(result)
     }
     
     fetchData()
     return () => { mounted = false }
   }, [])
   ```

3. **Conditional Rendering**:
   ```typescript
   {loading ? <LoadingSpinner /> : error ? <ErrorMessage error={error} /> : <DataDisplay data={data} />}
   ```

### Anti-Patterns to Avoid

1. ❌ **Don't use inline styles** - Use Tailwind classes
   ```typescript
   // Bad
   <div style={{ backgroundColor: 'red' }}>
   
   // Good
   <div className="bg-red-500">
   ```

2. ❌ **Don't mutate state directly** - Use setState functions
   ```typescript
   // Bad
   data.push(newItem)
   
   // Good
   setData([...data, newItem])
   ```

3. ❌ **Don't ignore TypeScript errors** - Fix them properly
   ```typescript
   // Bad
   const data: any = fetchData()
   
   // Good
   const data: DataType = fetchData()
   ```

4. ❌ **Don't create unnecessary components** - Keep it simple
   ```typescript
   // Bad - creating a component for a simple div
   const Wrapper = () => <div className="container"></div>
   
   // Good - use it directly
   <div className="container"></div>
   ```

5. ❌ **Don't skip error handling** - Always handle errors gracefully
   ```typescript
   // Bad
   const data = await fetch(url).then(r => r.json())
   
   // Good
   try {
     const response = await fetch(url)
     if (!response.ok) throw new Error('Failed')
     const data = await response.json()
   } catch (error) {
     setError(error.message)
   }
   ```

## Common Tasks

### Adding a New Module

1. Create module directory in `src/modules/NewModule/`
2. Implement main component with TypeScript types
3. Add to main navigation in `App.tsx`
4. Follow existing module patterns (Dashboard, Threats, Activity)

### Adding a New Component

1. Create component file in `src/components/`
2. Define proper TypeScript interfaces for props
3. Use Tailwind CSS for styling
4. Export component for use in modules

### Adding API Endpoints

1. Define endpoint in Express server
2. Implement proper error handling
3. Add TypeScript types for request/response
4. Document in API endpoints section above

## Performance Considerations

1. **Code Splitting**: Vite handles automatic code splitting
2. **Bundle Size**: Monitor bundle size (current: ~50KB gzipped)
3. **Lazy Loading**: Consider lazy loading for large modules
4. **Caching**: Leverage Cloudflare CDN caching
5. **Edge Computing**: Use Cloudflare Workers for performance-critical operations

## Documentation References

- **README.md** - Main project documentation
- **FUNCTION_LIST.md** - Complete function reference (English)
- **FUNKTIONS_LISTE.md** - Complete function reference (Danish)
- **QUICK_REFERENCE.md** - Quick reference guide
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions
- **CONSOLIDATED_INTELLIGENCE.md** - Intelligence sources documentation

## Support and Contributing

- **Issues**: Report issues at https://github.com/Clauskraft/cyberstreams/issues
- **Website**: https://cyberstreams.dk
- **License**: MIT License

When contributing:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
