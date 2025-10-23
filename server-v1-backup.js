import express from 'express'
import { execFile } from 'child_process'
import path from 'path'
import { Pool } from 'pg'
import cors from 'cors'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(cors())

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Vector database configuration
const VECTOR_DB_URL = process.env.VECTOR_DB_URL || process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'

// Initialize database tables
async function initDB() {
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

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')))

// API Routes

// Keywords Management
app.get('/api/admin/keywords', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM keywords ORDER BY created_at DESC')
    res.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Error fetching keywords:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

app.post('/api/admin/keywords', async (req, res) => {
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

// Vector database status
app.get('/api/vector-status', (req, res) => {
  const hasVectorDb = !!(process.env.VECTOR_DB_URL || process.env.DATABASE_URL)
  res.json({
    configured: hasVectorDb,
    url: hasVectorDb ? (process.env.VECTOR_DB_URL || process.env.DATABASE_URL) : null,
    message: hasVectorDb ? 'Vector database configured' : 'Vector database not configured. Set VECTOR_DB_URL or DATABASE_URL in environment.'
  })
})

// Serve React app for all other routes
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
