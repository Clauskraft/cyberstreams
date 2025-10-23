-- Cyberstreams Database Schema
-- This file contains the complete database schema for migrations

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(keyword)
);

-- Monitoring sources table
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
);

-- Monitoring results table
CREATE TABLE IF NOT EXISTS monitoring_results (
  id SERIAL PRIMARY KEY,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES monitoring_sources(id) ON DELETE CASCADE,
  content TEXT,
  relevance_score FLOAT CHECK (relevance_score BETWEEN 0 AND 1),
  alert_sent BOOLEAN DEFAULT false,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monitoring_results_timestamp ON monitoring_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_monitoring_results_relevance ON monitoring_results(relevance_score);

-- RAG outputs table
CREATE TABLE IF NOT EXISTS rag_outputs (
  id SERIAL PRIMARY KEY,
  input_text TEXT,
  processed_output TEXT,
  keywords_matched TEXT[],
  confidence_score FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  processing_time_ms INTEGER,
  model_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_outputs_created ON rag_outputs(created_at);

-- RAG configuration table
CREATE TABLE IF NOT EXISTS rag_config (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document embeddings table with vector column
CREATE TABLE IF NOT EXISTS document_embeddings (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) UNIQUE NOT NULL,
  content TEXT,
  embedding vector(1536),
  metadata JSONB,
  source_id INTEGER REFERENCES monitoring_sources(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create vector similarity index
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector 
ON document_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Alerts table
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
);

-- Audit log table
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
);

-- Insert default RAG configuration
INSERT INTO rag_config (config_key, config_value, description) 
VALUES 
  ('model', 'gpt-4', 'LLM model for text generation'),
  ('temperature', '0.7', 'Temperature for response generation'),
  ('maxTokens', '2000', 'Maximum tokens for response'),
  ('vectorStoreProvider', 'pgvector', 'Vector database provider'),
  ('embeddingModel', 'text-embedding-ada-002', 'Model for generating embeddings'),
  ('chunkSize', '500', 'Size of text chunks for processing'),
  ('chunkOverlap', '50', 'Overlap between text chunks')
ON CONFLICT (config_key) DO NOTHING;

-- Create update triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_keywords_updated_at') THEN
    CREATE TRIGGER update_keywords_updated_at 
    BEFORE UPDATE ON keywords 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monitoring_sources_updated_at') THEN
    CREATE TRIGGER update_monitoring_sources_updated_at 
    BEFORE UPDATE ON monitoring_sources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_document_embeddings_updated_at') THEN
    CREATE TRIGGER update_document_embeddings_updated_at 
    BEFORE UPDATE ON document_embeddings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
