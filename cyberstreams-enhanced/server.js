const express = require('express')
const { execFile } = require('child_process')
const path = require('path')
const { Pool } = require('pg')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

// Initialize database tables
async function initDB() {
  try {
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
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_outputs (
        id SERIAL PRIMARY KEY,
        input_text TEXT,
        processed_output TEXT,
        keywords_matched TEXT[],
        confidence_score FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE,
        config_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Insert default RAG config if not exists
    await pool.query(`
      INSERT INTO rag_config (config_key, config_value) 
      VALUES 
        ('model', 'gpt-4'),
        ('temperature', '0.7'),
        ('maxTokens', '2000'),
        ('vectorStoreProvider', 'pgvector'),
        ('embeddingModel', 'text-embedding-ada-002')
      ON CONFLICT (config_key) DO NOTHING
    `)
    
    // Create vector extension for PostgreSQL
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
    
    // Create embeddings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id SERIAL PRIMARY KEY,
        document_id VARCHAR(255) UNIQUE,
        content TEXT,
        embedding vector(1536),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    console.log('Database initialized successfully')
  } catch (err) {
    console.error('Database initialization error:', err)
  }
}

// Keywords endpoints
app.get('/api/admin/keywords', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM keywords ORDER BY priority DESC, created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch keywords' })
  }
})

app.post('/api/admin/keywords', async (req, res) => {
  const { keyword, category, priority } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO keywords (keyword, category, priority) VALUES ($1, $2, $3) RETURNING *',
      [keyword, category, priority || 1]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add keyword' })
  }
})

app.delete('/api/admin/keywords/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM keywords WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete keyword' })
  }
})

app.put('/api/admin/keywords/:id/toggle', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE keywords SET active = NOT active WHERE id = $1 RETURNING *',
      [req.params.id]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to toggle keyword' })
  }
})

// Monitoring sources endpoints
app.get('/api/admin/sources', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM monitoring_sources ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch sources' })
  }
})

app.post('/api/admin/sources', async (req, res) => {
  const { sourceType, url, scanFrequency } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO monitoring_sources (source_type, url, scan_frequency) VALUES ($1, $2, $3) RETURNING *',
      [sourceType, url, scanFrequency || 3600]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to add source' })
  }
})

app.delete('/api/admin/sources/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM monitoring_sources WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete source' })
  }
})

// RAG Configuration endpoints
app.get('/api/admin/rag-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT config_key, config_value FROM rag_config')
    const config = {}
    result.rows.forEach(row => {
      config[row.config_key] = row.config_value
    })
    res.json(config)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch RAG config' })
  }
})

app.put('/api/admin/rag-config', async (req, res) => {
  const configs = req.body
  try {
    for (const [key, value] of Object.entries(configs)) {
      await pool.query(
        `INSERT INTO rag_config (config_key, config_value) 
         VALUES ($1, $2) 
         ON CONFLICT (config_key) 
         DO UPDATE SET config_value = $2, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      )
    }
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update RAG config' })
  }
})

// RAG Analysis endpoint
app.post('/api/admin/run-rag-analysis', async (req, res) => {
  try {
    // Get active keywords
    const keywordsResult = await pool.query('SELECT * FROM keywords WHERE active = true')
    const keywords = keywordsResult.rows
    
    // Get recent monitoring results
    const resultsQuery = await pool.query(
      `SELECT mr.*, k.keyword, k.category 
       FROM monitoring_results mr 
       JOIN keywords k ON mr.keyword_id = k.id 
       WHERE mr.timestamp > NOW() - INTERVAL '24 hours'
       ORDER BY mr.timestamp DESC 
       LIMIT 100`
    )
    
    // Process through RAG pipeline
    const scriptPath = path.join(__dirname, 'scripts', 'ragProcessor.js')
    
    const ragInput = {
      keywords: keywords,
      documents: resultsQuery.rows,
      config: await getRagConfig()
    }
    
    await new Promise((resolve, reject) => {
      execFile('node', [scriptPath, JSON.stringify(ragInput)], { cwd: __dirname }, (err, stdout, stderr) => {
        if (err) {
          console.error(stderr)
          return reject(err)
        }
        resolve(stdout)
      })
    })
    
    res.json({ 
      message: 'RAG analysis completed', 
      processed: resultsQuery.rows.length 
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to run RAG analysis' })
  }
})

async function getRagConfig() {
  const result = await pool.query('SELECT config_key, config_value FROM rag_config')
  const config = {}
  result.rows.forEach(row => {
    config[row.config_key] = row.config_value
  })
  return config
}

// Original scraper endpoint enhanced with keyword matching
app.post('/api/run-scraper', async (req, res) => {
  try {
    // Get active keywords for matching
    const keywordsResult = await pool.query('SELECT * FROM keywords WHERE active = true')
    const keywords = keywordsResult.rows
    
    // Get active sources
    const sourcesResult = await pool.query('SELECT * FROM monitoring_sources WHERE active = true')
    const sources = sourcesResult.rows
    
    const scriptPath = path.join(__dirname, 'scripts', 'enhancedScraper.js')
    
    const scraperInput = {
      keywords: keywords.map(k => k.keyword),
      sources: sources,
      outputPath: path.join(__dirname, 'data', 'scraped_data.json')
    }
    
    execFile('node', [scriptPath, JSON.stringify(scraperInput)], { cwd: __dirname }, async (err, stdout, stderr) => {
      if (err) {
        console.error(stderr)
        return res.status(500).json({ message: 'Scraper failed', error: stderr })
      }
      
      // Update last_scanned timestamp for sources
      for (const source of sources) {
        await pool.query(
          'UPDATE monitoring_sources SET last_scanned = CURRENT_TIMESTAMP WHERE id = $1',
          [source.id]
        )
      }
      
      res.json({ message: 'Scraper completed successfully', details: stdout.trim() })
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to run scraper' })
  }
})

// Search endpoint using vector similarity
app.post('/api/search', async (req, res) => {
  const { query, limit = 10 } = req.body
  try {
    // This would normally call your embedding service to get the query vector
    // For now, returning a placeholder
    const results = await pool.query(
      `SELECT content, metadata 
       FROM document_embeddings 
       ORDER BY embedding <-> $1 
       LIMIT $2`,
      [query, limit]
    )
    res.json(results.rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Static file serving for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'))
  })
}

// Initialize database and start server
initDB().then(() => {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Cyberstreams API server running at http://localhost:${PORT}`)
  })
})

module.exports = app
