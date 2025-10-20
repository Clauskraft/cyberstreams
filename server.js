import express from 'express'
import { execFile } from 'child_process'
import path from 'path'
import { Pool } from 'pg'
import cors from 'cors'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'
import IntelScraperService from './lib/intelScraperService.js'
import createMispClient from './lib/mispClient.js'
import createOpenCtiClient from './lib/openCtiClient.js'
import { getAuthorizedSources } from './lib/authorizedSourceRepository.js'
import logger from './lib/logger.js'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Trust proxy for Railway deployment
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS with configurable origin
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))

// Rate limiting
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
}))

// Request processing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Correlation ID middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4()
  req.correlationId = correlationId
  res.set('X-Correlation-ID', correlationId)
  next()
})

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.correlationId || 'no-id'}`)
  
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.correlationId || 'no-id'}`)
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
})

// Database connection
let pool = null

function buildDatabaseConfig() {
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSL === 'require' || process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: process.env.PGSSLMODE === 'verify-full' }
          : false,
    }
  }

  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DB
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD

  if (host && database && user && password) {
    return {
      host,
      port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
      database,
      user,
      password,
      ssl:
        process.env.PGSSL === 'require' || process.env.POSTGRES_SSL === 'true'
          ? { rejectUnauthorized: process.env.PGSSLMODE === 'verify-full' }
          : false,
    }
  }

  return null
}

const databaseConfig = buildDatabaseConfig()

if (databaseConfig) {
  console.log('Database configuration detected, initializing connection pool...')
  pool = new Pool(databaseConfig)
  pool.on('error', (error) => {
    console.error('Unexpected database error:', error)
  })
  console.log('Database pool created successfully')
} else {
  console.warn(
    'No database configuration found. Set DATABASE_URL or explicit Postgres connection environment variables.'
  )
}

// Vector database configuration
const VECTOR_DB_URL = process.env.VECTOR_DB_URL || process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'

// Helper function to check database availability
function checkDatabase(req, res, next) {
  if (!pool) {
    return res.status(503).json({ success: false, error: 'Database not configured' })
  }
  next()
}

const INTEL_SCRAPER_INTERVAL_MS = parseInt(
  process.env.INTEL_SCRAPER_INTERVAL_MS || String(15 * 60 * 1000),
  10
)

async function loadAuthorizedSources() {
  try {
    return await getAuthorizedSources()
  } catch (error) {
    logger.error({ err: error }, 'Failed to load authorized sources for Intel Scraper')
    return []
  }
}

async function persistMonitoringResults(documents = []) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return
  }

  if (!pool) {
    throw new Error('Database not configured for Intel Scraper persistence')
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const doc of documents) {
      const externalId = doc.id || doc.url || uuidv4()
      const title = doc.title || 'Intel Finding'
      const content = doc.description || doc.summary || null
      const url = doc.url || null
      const rawSeverity = typeof doc.severity === 'string' ? doc.severity.toLowerCase() : ''
      const severity = ['low', 'medium', 'high', 'critical'].includes(rawSeverity) ? rawSeverity : 'medium'
      const category = Array.isArray(doc.category)
        ? doc.category[0] || null
        : doc.category || null
      const keywords = Array.isArray(doc.tags) ? doc.tags : []
      const timestamp = doc.timestamp ? new Date(doc.timestamp) : new Date()
      const relevanceScore = typeof doc.confidence === 'number'
        ? Math.max(0, Math.min(doc.confidence / 100, 1))
        : null

      const metadata = {
        source: doc.source || null,
        sourceDomain: doc.sourceDomain || null,
        origin: doc.origin || null,
        iocs: Array.isArray(doc.iocs) ? doc.iocs : [],
        cves: Array.isArray(doc.cves) ? doc.cves : [],
        verified: doc.verified ?? true,
        evidence: doc.evidence || null
      }

      await client.query(
        `INSERT INTO monitoring_results (
            external_id,
            source_id,
            title,
            content,
            url,
            severity,
            category,
            keywords,
            metadata,
            timestamp,
            relevance_score
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (external_id) DO UPDATE SET
            source_id = EXCLUDED.source_id,
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            url = EXCLUDED.url,
            severity = EXCLUDED.severity,
            category = EXCLUDED.category,
            keywords = EXCLUDED.keywords,
            metadata = EXCLUDED.metadata,
            timestamp = EXCLUDED.timestamp,
            relevance_score = EXCLUDED.relevance_score,
            updated_at = CURRENT_TIMESTAMP`,
        [
          externalId,
          null,
          title,
          content,
          url,
          severity,
          category,
          keywords,
          metadata,
          timestamp,
          relevanceScore
        ]
      )
    }

    await client.query('COMMIT')
    logger.info({ count: documents.length }, 'Intel Scraper findings persisted')
  } catch (error) {
    await client.query('ROLLBACK')
    logger.error({ err: error }, 'Failed to persist Intel Scraper findings')
    throw error
  } finally {
    client.release()
  }
}

const mispClient = createMispClient()
const openCtiClient = createOpenCtiClient()

const intelScraper = new IntelScraperService({
  mispClient,
  openCtiClient,
  loadAuthorizedSources,
  pollIntervalMs: INTEL_SCRAPER_INTERVAL_MS,
  persistFindings: persistMonitoringResults
})

let intelScraperReady = Promise.resolve()

async function bootstrapIntelScraper() {
  await intelScraper.init()
  logger.info('Intel Scraper initialized')

  if (process.env.INTEL_SCRAPER_AUTO_START === 'true') {
    try {
      await intelScraper.start()
      logger.info('Intel Scraper auto-started via INTEL_SCRAPER_AUTO_START flag')
    } catch (error) {
      logger.error({ err: error }, 'Failed to auto-start Intel Scraper')
    }
  }
}

// Initialize database tables
async function initDB() {
  if (!pool) {
    const message = 'Database connection is not configured. Initialization aborted.'
    console.error(message)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(message)
    }
    return
  }
  
  console.log('Starting database initialization...')
  
  try {
    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS keywords (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        priority INTEGER DEFAULT 1,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(keyword)
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_sources (
        id SERIAL PRIMARY KEY,
        source_type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        scan_frequency INTEGER DEFAULT 3600,
        last_scanned TIMESTAMP,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_results (
        id SERIAL PRIMARY KEY,
        external_id TEXT UNIQUE NOT NULL,
        source_id INTEGER REFERENCES monitoring_sources(id),
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        category VARCHAR(100),
        keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
        metadata JSONB DEFAULT '{}'::JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        relevance_score FLOAT CHECK (relevance_score BETWEEN 0 AND 1),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await pool.query('CREATE INDEX IF NOT EXISTS idx_monitoring_results_timestamp ON monitoring_results (timestamp)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_monitoring_results_relevance ON monitoring_results (relevance_score)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_monitoring_results_category ON monitoring_results (category)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_monitoring_results_severity ON monitoring_results (severity)')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT,
        content TEXT,
        source_url TEXT,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Insert default RAG config
    await pool.query(`
      INSERT INTO rag_config (config_key, config_value) 
      VALUES 
        ('model', 'gpt-4'),
        ('temperature', '0.7'),
        ('max_tokens', '2000'),
        ('vector_store_provider', 'pgvector'),
        ('embedding_model', 'text-embedding-ada-002')
      ON CONFLICT (config_key) DO NOTHING
    `)
    
    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}

// Ready endpoint for deployment readiness checks
app.get('/ready', (req, res) => {
  res.json({
    ready: true,
    timestamp: new Date().toISOString()
  })
})

// This 404 handler will be added at the end after all API routes are defined

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error - ${req.correlationId || 'no-id'}:`, err)
  
  let statusCode = 500
  let message = 'Internal Server Error'
  
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = 'Forbidden'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = 'Not Found'
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  })
})

// API Routes

// Keywords Management
app.get('/api/admin/keywords', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ success: false, error: 'Database not configured' })
  }

  try {
    const result = await pool.query('SELECT * FROM keywords ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching keywords:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/keywords', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ success: false, error: 'Database not configured' })
  }

  try {
    const { keyword, category, priority } = req.body
    const result = await pool.query(
      'INSERT INTO keywords (keyword, category, priority) VALUES ($1, $2, $3) RETURNING *',
      [keyword, category, priority]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating keyword:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/admin/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM keywords WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting keyword:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/admin/keywords/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(
      'UPDATE keywords SET active = NOT active WHERE id = $1 RETURNING *',
      [id]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error toggling keyword:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Sources Management
app.get('/api/admin/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM monitoring_sources ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching sources:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/sources', async (req, res) => {
  try {
    const { sourceType, url, scanFrequency } = req.body
    const result = await pool.query(
      'INSERT INTO monitoring_sources (source_type, url, scan_frequency) VALUES ($1, $2, $3) RETURNING *',
      [sourceType, url, scanFrequency]
    )
    res.json({ success: true, data: result.rows[0] })
  } catch (error) {
    console.error('Error creating source:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.delete('/api/admin/sources/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM monitoring_sources WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting source:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// RAG Configuration
app.get('/api/admin/rag-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rag_config')
    const config = {}
    result.rows.forEach(row => {
      config[row.config_key] = row.config_value
    })
    res.json({ success: true, data: config })
  } catch (error) {
    console.error('Error fetching RAG config:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.put('/api/admin/rag-config', async (req, res) => {
  try {
    const config = req.body
    for (const [key, value] of Object.entries(config)) {
      await pool.query(
        'INSERT INTO rag_config (config_key, config_value) VALUES ($1, $2) ON CONFLICT (config_key) DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP',
        [key, value]
      )
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating RAG config:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// RAG Analysis
app.post('/api/admin/run-rag-analysis', async (req, res) => {
  try {
    // This would integrate with OpenAI API for RAG analysis
    // For now, return a mock response
    res.json({
      success: true,
      data: { 
        analysis: 'RAG analysis completed successfully',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error running RAG analysis:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

function mapRowToSearchResult(row) {
  const summary = row.content
    ? `${row.content.slice(0, 220)}${row.content.length > 220 ? '…' : ''}`
    : 'Ingen beskrivelse tilgængelig.'

  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {}

  return {
    id: row.id ? String(row.id) : `search-${uuidv4()}`,
    title: row.title || metadata.title || 'Monitoring Resultat',
    summary,
    url: row.url || metadata.url || null,
    severity: row.severity || metadata.severity || 'medium',
    category: row.category || metadata.category || 'intel',
    source: metadata.source || metadata.source_name || 'monitoring_results',
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    score: typeof row.relevance_score === 'number'
      ? Number(row.relevance_score.toFixed(2))
      : metadata.score || null,
    keywords: Array.isArray(row.keywords) ? row.keywords : []
  }
}

// Search endpoint
app.post('/api/search', async (req, res) => {
  const startedAt = Date.now()

  try {
    if (!pool) {
      return res.status(503).json({ success: false, error: 'Database not configured' })
    }

    const { query, limit = 8 } = req.body || {}
    const trimmedQuery = typeof query === 'string' ? query.trim() : ''

    if (!trimmedQuery) {
      return res.status(400).json({ success: false, error: 'Query parameter is required' })
    }

    const normalizedLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 25)

    const searchTerm = `%${trimmedQuery}%`
    const dbResults = await pool.query(
      `SELECT id, title, content, url, severity, category, keywords, relevance_score, metadata, timestamp
         FROM monitoring_results
         WHERE title ILIKE $1
            OR content ILIKE $1
            OR url ILIKE $1
            OR EXISTS (
              SELECT 1 FROM unnest(COALESCE(keywords, ARRAY[]::text[])) keyword(term)
              WHERE keyword ILIKE $1
            )
         ORDER BY timestamp DESC
         LIMIT $2`,
      [searchTerm, normalizedLimit]
    )

    const results = dbResults.rows.map(mapRowToSearchResult)

    res.json({
      success: true,
      data: {
        query: trimmedQuery,
        results,
        tookMs: Date.now() - startedAt,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error searching:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({
    status: 'operational', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
})

// Migration endpoint
app.post('/api/migrate', async (req, res) => {
  try {
    console.log('Starting database migration...')
    
    // Create pgvector extension (skip if not available)
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
      console.log('✓ Vector extension created')
    } catch (error) {
      console.log('⚠ Vector extension not available, skipping...')
    }
    
    // Keywords table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS keywords (
        id SERIAL PRIMARY KEY,
        keyword VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(keyword)
      )
    `)
    console.log('✓ Keywords table created')
    
    // Monitoring sources table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_sources (
        id SERIAL PRIMARY KEY,
        source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('web', 'social', 'documents', 'darkweb')),
        url TEXT NOT NULL,
        scan_frequency INTEGER DEFAULT 3600,
        last_scanned TIMESTAMP,
        active BOOLEAN DEFAULT true,
        auth_config JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Monitoring sources table created')
    
    // Monitoring results table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monitoring_results (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES monitoring_sources(id),
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        category VARCHAR(100),
        keywords TEXT[],
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Monitoring results table created')
    
    // Insert sample data
    await pool.query(`
      INSERT INTO keywords (keyword, category, priority) 
      VALUES 
        ('ransomware', 'malware', 3),
        ('APT', 'threat-actor', 3),
        ('zero-day', 'vulnerability', 3),
        ('data breach', 'incident', 2),
        ('CVE-2024', 'vulnerability', 2),
        ('LockBit', 'ransomware', 3),
        ('Lazarus', 'threat-actor', 3),
        ('phishing', 'attack-vector', 2),
        ('supply chain', 'attack-vector', 2),
        ('critical infrastructure', 'target', 3)
      ON CONFLICT (keyword) DO NOTHING
    `)
    console.log('✓ Sample keywords inserted')
    
    // Insert sample sources
    await pool.query(`
      INSERT INTO monitoring_sources (source_type, url, scan_frequency) 
      VALUES 
        ('web', 'https://krebsonsecurity.com/feed/', 3600),
        ('web', 'https://www.darkreading.com/rss.xml', 3600),
        ('web', 'https://threatpost.com/feed/', 7200),
        ('web', 'https://www.bleepingcomputer.com/feed/', 3600),
        ('web', 'https://www.cisa.gov/uscert/ncas/current-activity.xml', 1800)
      ON CONFLICT DO NOTHING
    `)
    console.log('✓ Sample sources inserted')
    
    // Insert sample monitoring results
    await pool.query(`
      INSERT INTO monitoring_results (title, content, url, severity, category, keywords, metadata) 
      VALUES 
        ('New Ransomware Campaign Targets Healthcare', 'A new ransomware campaign has been identified targeting healthcare organizations...', 'https://example.com/ransomware-healthcare', 'high', 'malware', ARRAY['ransomware', 'healthcare'], '{"source": "krebsonsecurity", "tags": ["healthcare", "ransomware"]}'),
        ('APT Group Exploits Zero-Day Vulnerability', 'Advanced Persistent Threat group has been exploiting a zero-day vulnerability...', 'https://example.com/apt-zero-day', 'critical', 'vulnerability', ARRAY['APT', 'zero-day'], '{"source": "darkreading", "tags": ["APT", "zero-day"]}'),
        ('Data Breach Affects 1M Users', 'A major data breach has been reported affecting over 1 million users...', 'https://example.com/data-breach', 'high', 'incident', ARRAY['data breach'], '{"source": "threatpost", "tags": ["data-breach"]}')
      ON CONFLICT DO NOTHING
    `)
    console.log('✓ Sample monitoring results inserted')
    
    console.log('✅ Database migration completed successfully!')
    
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Core API endpoints
app.get('/api/pulse', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM monitoring_results ORDER BY timestamp DESC LIMIT 10')
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching pulse data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pulse data',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/daily-pulse', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM monitoring_results 
      WHERE DATE(timestamp) = CURRENT_DATE 
      ORDER BY timestamp DESC
    `)
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching daily pulse:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily pulse',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/stats', checkDatabase, async (req, res) => {
  try {
    const [keywordCount, sourceCount, resultCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM keywords'),
      pool.query('SELECT COUNT(*) as count FROM monitoring_sources'),
      pool.query('SELECT COUNT(*) as count FROM monitoring_results')
    ])
    
    res.json({
      success: true,
      data: {
        keywords: parseInt(keywordCount.rows[0].count),
        sources: parseInt(sourceCount.rows[0].count),
        results: parseInt(resultCount.rows[0].count)
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/intel-scraper/status', async (req, res) => {
  try {
    await intelScraperReady
    const status = intelScraper.getStatus()
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch Intel Scraper status')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/start', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      })
    }

    await intelScraperReady
    const status = await intelScraper.start()
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to start Intel Scraper')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/stop', async (req, res) => {
  try {
    await intelScraperReady
    const status = await intelScraper.stop()
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to stop Intel Scraper')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/run', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        error: 'Database not configured',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      })
    }

    await intelScraperReady
    const status = await intelScraper.runNow('manual-run')
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to run Intel Scraper manually')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/emergency-bypass', async (req, res) => {
  const { action = 'enable', reason, durationMs } = req.body || {}

  try {
    await intelScraperReady

    if (action === 'disable') {
      const status = intelScraper.disableEmergencyBypass(
        reason || 'Emergency bypass disabled by operator'
      )
      return res.json({
        success: true,
        data: status,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      })
    }

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Reason is required to enable emergency bypass',
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      })
    }

    const parsedDuration = Number.isFinite(durationMs)
      ? Math.max(5 * 60 * 1000, Number(durationMs))
      : 60 * 60 * 1000

    const status = await intelScraper.enableEmergencyBypass({
      reason,
      durationMs: parsedDuration
    })

    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update Intel Scraper emergency bypass state')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/intel-scraper/approvals', async (req, res) => {
  try {
    await intelScraperReady
    const approvals = intelScraper.getPendingApprovals()
    res.json({
      success: true,
      data: approvals,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch Intel Scraper approvals')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/approvals/:id/resolve', async (req, res) => {
  const { decision, reason } = req.body || {}

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({
      success: false,
      error: 'Decision must be "approve" or "reject"',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }

  try {
    await intelScraperReady
    const result = await intelScraper.resolveApproval(req.params.id, decision, reason)
    res.json({
      success: true,
      data: result,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to resolve Intel Scraper approval')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/intel-scraper/candidates', async (req, res) => {
  try {
    await intelScraperReady
    const candidates = intelScraper.getCandidates()
    res.json({
      success: true,
      data: candidates,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch Intel Scraper candidates')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/candidates/discover', async (req, res) => {
  const { urls = [], keywords = [] } = req.body || {}

  if (!Array.isArray(urls) || !Array.isArray(keywords)) {
    return res.status(400).json({
      success: false,
      error: 'urls and keywords must be arrays',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }

  try {
    await intelScraperReady
    const candidates = await intelScraper.discover({ urls, keywords })
    res.json({
      success: true,
      data: candidates,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to run Intel Scraper discovery')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/candidates/:id/accept', async (req, res) => {
  const { autoApprove = false } = req.body || {}

  try {
    await intelScraperReady
    const status = await intelScraper.acceptCandidate(req.params.id, { autoApprove })
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to accept Intel Scraper candidate')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.post('/api/intel-scraper/candidates/:id/dismiss', async (req, res) => {
  try {
    await intelScraperReady
    const status = intelScraper.dismissCandidate(req.params.id)
    res.json({
      success: true,
      data: status,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to dismiss Intel Scraper candidate')
    res.status(500).json({
      success: false,
      error: error.message,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/intel', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM monitoring_results ORDER BY timestamp DESC LIMIT 20')
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching intel:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch intel',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/activity', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        'monitoring_result' as type,
        content as description,
        timestamp as created_at
      FROM monitoring_results
      ORDER BY timestamp DESC
      LIMIT 20
    `)
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/signal-stream', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        content as title,
        content as description,
        url,
        timestamp as published_at,
        timestamp as created_at
      FROM monitoring_results
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `)
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching signal stream:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signal stream',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/threats', checkDatabase, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        content as indicator,
        'threat' as type,
        CASE 
          WHEN relevance_score > 0.8 THEN 'high'
          WHEN relevance_score > 0.6 THEN 'medium'
          ELSE 'low'
        END as severity,
        url as source,
        timestamp as created_at
      FROM monitoring_results
      WHERE relevance_score > 0.6
      ORDER BY timestamp DESC
      LIMIT 20
    `)
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching threats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch threats',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})


// Vector database status
app.get('/api/vector-status', (req, res) => {
  const hasVectorDb = !!(process.env.VECTOR_DB_URL || process.env.DATABASE_URL)
  res.json({
    configured: hasVectorDb,
    url: hasVectorDb ? (process.env.VECTOR_DB_URL || process.env.DATABASE_URL) : null,
    message: hasVectorDb ? 'Vector database configured' : 'Vector database not configured. Set VECTOR_DB_URL or DATABASE_URL in environment.'
  })
})

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')))

// 404 handler for API routes (after all API endpoints are defined)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  })
})

// Serve React app for all other routes (must be last)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Initialize database and start server
const PORT = process.env.PORT || 3000

async function startServer() {
  try {
    await initDB()
    intelScraperReady = bootstrapIntelScraper()
    await intelScraperReady
    app.listen(PORT, () => {
      console.log(`Cyberstreams v2.0.0 server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

