# Cyberstreams - Prioritized Action Plan

**Generated**: October 18, 2025
**Quality Score**: 68/100
**Target Score**: 92/100 (within 2 months)

---

## 🔴 CRITICAL - Week 1 (12-19 hours)

### 1. Fix API Fetch Failure - DagensPuls Module ⚡
**Severity**: CRITICAL | **Effort**: 2-4 hours | **Impact**: HIGH

**Problem**: DagensPuls shows "Fejl ved indlæsning" - API returns HTML instead of JSON

**Root Cause**: Server routing issue - catch-all route intercepts API calls

**Solution Option A** (Recommended - Server-side):
```javascript
// server.js - Reorder routes
// API routes MUST come before static file serving

// 1. API routes first
app.get('/api/health', (req, res) => { /* ... */ })
app.get('/api/pulse', (req, res) => { /* ... */ })
app.get('/api/threats', (req, res) => { /* ... */ })
app.get('/api/stats', (req, res) => { /* ... */ })

// 2. Then static files
app.use(express.static(path.join(__dirname, 'dist')))

// 3. Finally catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})
```

**Solution Option B** (Client-side):
```typescript
// src/hooks/useDataFetching.ts
const apiUrl = import.meta.env.PROD
  ? `${window.location.origin}${url}`
  : url

const response = await fetch(apiUrl)
```

**Verification**:
1. Navigate to https://cyberstreams-production.up.railway.app
2. DagensPuls section should load data without errors
3. Console should be error-free
4. Counters should show > 0

---

### 2. Implement Error Boundaries 🛡️
**Severity**: HIGH | **Effort**: 1-2 hours | **Impact**: HIGH

**Problem**: Any component error crashes entire application

**Solution**:
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // TODO: Send to error tracking service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-400 mb-2">Application Error</h2>
            <p className="text-gray-300 mb-4">Something went wrong. Please refresh the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyber-blue hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                  Error details
                </summary>
                <pre className="text-xs text-red-300 mt-2 overflow-auto p-2 bg-black/20 rounded">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Usage in App.tsx**:
```typescript
import { ErrorBoundary } from '@components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-cyber-dark to-cyber-darker text-white">
        {/* existing app content */}
      </div>
    </ErrorBoundary>
  )
}
```

---

### 3. Setup Test Infrastructure - Vitest 🧪
**Severity**: CRITICAL | **Effort**: 4-6 hours | **Impact**: HIGH

**Install Dependencies**:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/ui
```

**Create vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/', '**/*.test.{ts,tsx}'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@components': path.resolve(__dirname, './src/components'),
      '@types': path.resolve(__dirname, './src/types'),
      '@data': path.resolve(__dirname, './src/data'),
      '@modules': path.resolve(__dirname, './src/modules')
    }
  }
})
```

**Create src/test/setup.ts**:
```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

**Update package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:run": "vitest run"
  }
}
```

---

### 4. Write Tests for useDataFetching Hook 📝
**Severity**: HIGH | **Effort**: 2-3 hours | **Impact**: HIGH

**Create src/hooks/useDataFetching.test.ts**:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDataFetching } from './useDataFetching'

describe('useDataFetching', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  it('returns loading state initially', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test' })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches data successfully', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    } as Response)

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('handles HTTP errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response)

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test', fallbackData: [] })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.error?.message).toContain('404')
  })

  it('handles network errors', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test', fallbackData: [] })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.message).toBe('Network error')
  })

  it('uses fallback data on error', async () => {
    const fallbackData = [{ id: 1, name: 'Fallback' }]
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test', fallbackData })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(fallbackData)
  })

  it('calls onError callback on failure', async () => {
    const onError = vi.fn()
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Test error'))

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test', onError })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Test error'
    }))
  })

  it('refetch works correctly', async () => {
    const mockData = [{ id: 1, name: 'Test' }]
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    } as Response)

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Refetch
    await result.current.refetch()

    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('applies transform function to data', async () => {
    const mockData = [{ id: 1 }, { id: 2 }]
    const transform = (data: any[]) => data.map(item => ({ ...item, transformed: true }))

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    } as Response)

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test', transform })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([
      { id: 1, transformed: true },
      { id: 2, transformed: true }
    ])
  })

  it('handles API error response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'API Error Message' })
    } as Response)

    const { result } = renderHook(() =>
      useDataFetching({ url: '/api/test' })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.message).toBe('API Error Message')
  })
})
```

**Run tests**:
```bash
npm run test
```

---

### 5. Add API Input Validation 🔒
**Severity**: HIGH | **Effort**: 3-4 hours | **Impact**: HIGH

**Install Dependencies**:
```bash
npm install express-validator express-rate-limit
```

**Update server.js**:
```javascript
import { query, validationResult } from 'express-validator'
import rateLimit from 'express-rate-limit'

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply to all API routes
app.use('/api/', apiLimiter)

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request parameters',
      details: errors.array()
    })
  }
  next()
}

// Updated API routes with validation
app.get('/api/pulse',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('severity').optional().isIn(['critical', 'high', 'medium', 'low']),
    query('category').optional().isString().trim().escape(),
  ],
  validateRequest,
  (req, res) => {
    const { limit, severity, category } = req.query

    let filteredData = mockPulseData

    if (severity) {
      filteredData = filteredData.filter(item => item.severity === severity)
    }

    if (category) {
      filteredData = filteredData.filter(item =>
        item.category.toLowerCase() === category.toLowerCase()
      )
    }

    if (limit) {
      filteredData = filteredData.slice(0, parseInt(limit))
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: filteredData,
      count: filteredData.length,
    })
  }
)

app.get('/api/threats',
  [
    query('severity').optional().isIn(['critical', 'high', 'medium', 'low']),
  ],
  validateRequest,
  (req, res) => {
    // ... implementation
  }
)

app.get('/api/stats',
  validateRequest,
  (req, res) => {
    // ... implementation
  }
)
```

---

## 🟡 HIGH PRIORITY - Week 2 (13-20 hours)

### 6. Implement Component Tests
**Effort**: 4-6 hours

Test files to create:
- `src/components/ui/StatCard.test.tsx`
- `src/components/ui/LoadingSpinner.test.tsx`
- `src/components/ui/Badge.test.tsx`
- `src/components/ui/EmptyState.test.tsx`

See comprehensive test report for example implementations.

---

### 7. Add Loading States for Navigation
**Effort**: 2-3 hours

```typescript
// App.tsx - Add React.lazy and Suspense
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'

const HomeContent = lazy(() => import('@modules/HomeContent'))
const ThreatsModule = lazy(() => import('@modules/Threats'))

// In render:
<Suspense fallback={<LoadingSpinner fullScreen message="Loading module..." />}>
  {activeTab === 'dashboard' && <HomeContent />}
  {activeTab === 'threats' && <ThreatsModule />}
</Suspense>
```

---

### 8. Enable TypeScript Strict Mode
**Effort**: 2-4 hours

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Then fix TypeScript errors throughout codebase.

---

### 9. Create Integration Tests for DagensPuls
**Effort**: 3-4 hours

```typescript
// src/modules/DagensPuls.integration.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DagensPuls } from './DagensPuls'

describe('DagensPuls Integration', () => {
  it('loads and displays pulse data', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            title: 'Test Threat',
            category: 'Ransomware',
            severity: 'critical',
            source: 'Test Source',
            timestamp: new Date().toISOString(),
            description: 'Test description'
          }
        ]
      })
    })

    render(<DagensPuls />)

    // Should show loading first
    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Then data should appear
    await waitFor(() => {
      expect(screen.getByText('Test Threat')).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('API Error'))

    render(<DagensPuls />)

    await waitFor(() => {
      expect(screen.getByText(/fejl ved indlæsning/i)).toBeInTheDocument()
    })
  })
})
```

---

### 10. Add Security Headers with Helmet
**Effort**: 1-2 hours

```bash
npm install helmet
```

```javascript
// server.js
import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}))
```

---

## 🟠 MEDIUM PRIORITY - Week 3-4 (18-26 hours)

### 11. Replace Hardcoded Stats with API
**Effort**: 3-4 hours

Create API endpoint and update HomeContent to fetch real data.

---

### 12. Add E2E Test Suite
**Effort**: 4-6 hours

Create Playwright tests for:
- Navigation flow
- Dashboard loading
- API integration
- Error scenarios

---

### 13. Implement Code Splitting
**Effort**: 3-4 hours

Split bundles by route and vendor libraries.

---

### 14. Accessibility Improvements
**Effort**: 4-6 hours

Add ARIA labels, keyboard navigation improvements, skip links.

---

### 15. Setup CI/CD Pipeline
**Effort**: 4-6 hours

GitHub Actions workflow for automated testing on PR/push.

---

## 🟢 LOW PRIORITY - Future Sprints (20-29 hours)

- Internationalization (i18n)
- Analytics integration
- Service worker for offline
- Cross-browser testing
- Mobile responsiveness testing

---

## Success Metrics

### Week 1 Completion Criteria
- [ ] DagensPuls loads data without errors
- [ ] Error boundaries prevent app crashes
- [ ] Test infrastructure operational
- [ ] useDataFetching hook has >90% coverage
- [ ] API endpoints have validation and rate limiting
- [ ] Quality score: 75/100

### Week 2 Completion Criteria
- [ ] Component test coverage >70%
- [ ] TypeScript strict mode enabled
- [ ] Loading states implemented
- [ ] Integration tests for critical features
- [ ] Quality score: 80/100

### Month 1 Completion Criteria
- [ ] Overall test coverage >80%
- [ ] E2E tests for critical flows
- [ ] CI/CD pipeline operational
- [ ] All CRITICAL and HIGH issues resolved
- [ ] Quality score: 85/100

### Month 2 Completion Criteria
- [ ] Test coverage >90%
- [ ] All MEDIUM issues resolved
- [ ] Performance optimized
- [ ] Full accessibility compliance
- [ ] Quality score: 92/100

---

## Quick Start Commands

```bash
# Week 1 Setup
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom @vitest/ui
npm install express-validator express-rate-limit helmet

# Create test configuration
# (Copy vitest.config.ts and setup.ts from this document)

# Run tests
npm run test

# Check coverage
npm run test:coverage

# View test UI
npm run test:ui
```

---

## Notes

- Prioritize fixes in order listed
- Each item includes effort estimates
- Code examples provided for quick implementation
- Verification steps included for each fix
- Quality score targets defined

**Next Steps**: Start with #1 (API fetch failure) as it's blocking core functionality.
