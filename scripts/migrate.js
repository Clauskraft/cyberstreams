// Database Migration Script for Cyberstreams
// Run this to set up the complete database schema

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'
})

async function migrate() {
  console.log('Starting database migration...')
  
  try {
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
        keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
        source_id INTEGER REFERENCES monitoring_sources(id) ON DELETE CASCADE,
        content TEXT,
        relevance_score FLOAT CHECK (relevance_score BETWEEN 0 AND 1),
        alert_sent BOOLEAN DEFAULT false,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_monitoring_results_timestamp (timestamp),
        INDEX idx_monitoring_results_relevance (relevance_score)
      )
    `)
    console.log('✓ Monitoring results table created')
    
    // RAG outputs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_outputs (
        id SERIAL PRIMARY KEY,
        input_text TEXT,
        processed_output TEXT,
        keywords_matched TEXT[],
        confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
        processing_time_ms INTEGER,
        model_used VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rag_outputs_created (created_at)
      )
    `)
    console.log('✓ RAG outputs table created')
    
    // RAG configuration table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rag_config (
        id SERIAL PRIMARY KEY,
        config_key VARCHAR(100) UNIQUE NOT NULL,
        config_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ RAG config table created')
    
    // Document embeddings table with vector column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS document_embeddings (
        id SERIAL PRIMARY KEY,
        document_id VARCHAR(255) UNIQUE NOT NULL,
        content TEXT,
        embedding vector(1536),
        metadata JSONB,
        source_id INTEGER REFERENCES monitoring_sources(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Document embeddings table created')
    
    // Create vector similarity index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
      ON document_embeddings 
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `)
    console.log('✓ Vector similarity index created')
    
    // Alerts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        source_id INTEGER REFERENCES monitoring_sources(id),
        keyword_id INTEGER REFERENCES keywords(id),
        result_id INTEGER REFERENCES monitoring_results(id),
        acknowledged BOOLEAN DEFAULT false,
        acknowledged_by VARCHAR(255),
        acknowledged_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Alerts table created')
    
    // Audit log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        old_value JSONB,
        new_value JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log('✓ Audit log table created')
    
    // Insert default RAG configuration
    await pool.query(`
      INSERT INTO rag_config (config_key, config_value, description) 
      VALUES 
        ('model', 'gpt-4', 'LLM model for text generation'),
        ('temperature', '0.7', 'Temperature for response generation'),
        ('maxTokens', '2000', 'Maximum tokens for response'),
        ('vectorStoreProvider', 'pgvector', 'Vector database provider'),
        ('embeddingModel', 'text-embedding-ada-002', 'Model for generating embeddings'),
        ('chunkSize', '500', 'Size of text chunks for processing'),
        ('chunkOverlap', '50', 'Overlap between text chunks')
      ON CONFLICT (config_key) DO NOTHING
    `)
    console.log('✓ Default RAG configuration inserted')
    
    // Insert sample data for testing
    if (process.env.INSERT_SAMPLE_DATA === 'true') {
      await insertSampleData()
    }
    
    // Create update triggers for updated_at columns
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `)
    
    const tables = ['keywords', 'monitoring_sources', 'document_embeddings']
    for (const table of tables) {
      await pool.query(`
        CREATE TRIGGER update_${table}_updated_at 
        BEFORE UPDATE ON ${table} 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column()
      `)
    }
    console.log('✓ Update triggers created')
    
    console.log('\n✅ Database migration completed successfully!')
    
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

async function insertSampleData() {
  console.log('Inserting sample data...')
  
  // Sample keywords
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
  
  // Sample sources
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
  
  console.log('✓ Sample data inserted')
}

// Run migration
migrate()
