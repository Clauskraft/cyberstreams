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
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      })
  } else {
  console.log('No DATABASE_URL found - running in mock mode for local development')
}

// Vector database configuration
const VECTOR_DB_URL = process.env.VECTOR_DB_URL || process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'

// Helper function to check database availability
function checkDatabase(req, res, next) {
  if (!pool) {
    return res.status(503).json({ success: false, error: 'Database not available' })
  }
  next()
}

// Initialize database tables
async function initDB() {
  if (!pool) {
    console.log('Skipping database initialization - no database connection available')
    return
  }
  
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
        keyword_id INTEGER REFERENCES keywords(id),
        source_id INTEGER REFERENCES monitoring_sources(id),
        content TEXT,
        relevance_score FLOAT,
        url TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
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
    return res.json({ success: true, data: [] })
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
    return res.status(503).json({ success: false, error: 'Database not available' })
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

// Search endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body
    // This would implement semantic search using pgvector
    // For now, return a mock response
    res.json({
      success: true,
      data: { 
        results: [],
        query: query,
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
    
    // Create pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('✓ Vector extension created')
    
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

app.get('/api/intel-scraper/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      lastRun: new Date().toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString()
    },
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  })
})

app.get('/api/intel-scraper/approvals', checkDatabase, async (req, res) => {
  try {
    if (!pool) {
      return res.json({ success: true, data: [] })
    }
    const result = await pool.query('SELECT * FROM monitoring_results WHERE relevance_score > 0.8 ORDER BY timestamp DESC')
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approvals',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  }
})

app.get('/api/intel-scraper/candidates', checkDatabase, async (req, res) => {
  try {
    if (!pool) {
      return res.json({ success: true, data: [] })
    }
    const result = await pool.query('SELECT * FROM monitoring_results WHERE relevance_score BETWEEN 0.5 AND 0.8 ORDER BY timestamp DESC')
    res.json({
      success: true,
      data: result.rows,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching candidates:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch candidates',
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
    app.listen(PORT, () => {
      console.log(`Cyberstreams v2.0.0 server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

