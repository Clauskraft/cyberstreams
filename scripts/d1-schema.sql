-- Cloudflare D1 Database Schema for Cyberstreams
-- Note: D1 uses SQLite, so some PostgreSQL features are adapted

-- Keywords table
CREATE TABLE IF NOT EXISTS keywords (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL UNIQUE,
  category TEXT,
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring sources table
CREATE TABLE IF NOT EXISTS monitoring_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_type TEXT NOT NULL CHECK (source_type IN ('web', 'social', 'documents', 'darkweb')),
  url TEXT NOT NULL,
  scan_frequency INTEGER DEFAULT 3600,
  last_scanned DATETIME,
  active INTEGER DEFAULT 1,
  auth_config TEXT, -- JSON stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring results table
CREATE TABLE IF NOT EXISTS monitoring_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword_id INTEGER REFERENCES keywords(id) ON DELETE CASCADE,
  source_id INTEGER REFERENCES monitoring_sources(id) ON DELETE CASCADE,
  content TEXT,
  relevance_score REAL CHECK (relevance_score BETWEEN 0 AND 1),
  alert_sent INTEGER DEFAULT 0,
  metadata TEXT, -- JSON stored as text
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for monitoring_results
CREATE INDEX idx_monitoring_results_timestamp ON monitoring_results(timestamp);
CREATE INDEX idx_monitoring_results_relevance ON monitoring_results(relevance_score);
CREATE INDEX idx_monitoring_results_keyword ON monitoring_results(keyword_id);

-- RAG outputs table
CREATE TABLE IF NOT EXISTS rag_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  input_text TEXT,
  processed_output TEXT,
  keywords_matched TEXT, -- JSON array stored as text
  confidence_score REAL CHECK (confidence_score BETWEEN 0 AND 1),
  processing_time_ms INTEGER,
  model_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for rag_outputs
CREATE INDEX idx_rag_outputs_created ON rag_outputs(created_at);

-- RAG configuration table
CREATE TABLE IF NOT EXISTS rag_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key TEXT UNIQUE NOT NULL,
  config_value TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document metadata table (vector embeddings handled separately in Vectorize)
CREATE TABLE IF NOT EXISTS document_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id TEXT UNIQUE NOT NULL,
  content TEXT,
  metadata TEXT, -- JSON stored as text
  source_id INTEGER REFERENCES monitoring_sources(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for document lookups
CREATE INDEX idx_document_embeddings_doc_id ON document_embeddings(document_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source_id INTEGER REFERENCES monitoring_sources(id),
  keyword_id INTEGER REFERENCES keywords(id),
  result_id INTEGER REFERENCES monitoring_results(id),
  acknowledged INTEGER DEFAULT 0,
  acknowledged_by TEXT,
  acknowledged_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for alerts
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX idx_alerts_created ON alerts(created_at);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  old_value TEXT, -- JSON stored as text
  new_value TEXT, -- JSON stored as text
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit log
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Scraper jobs table
CREATE TABLE IF NOT EXISTS scraper_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at DATETIME,
  completed_at DATETIME,
  error_message TEXT,
  stats TEXT, -- JSON stored as text
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for job lookups
CREATE INDEX idx_scraper_jobs_job_id ON scraper_jobs(job_id);
CREATE INDEX idx_scraper_jobs_status ON scraper_jobs(status);

-- Insert default RAG configuration
INSERT OR IGNORE INTO rag_config (config_key, config_value, description) VALUES 
  ('model', 'gpt-4', 'LLM model for text generation'),
  ('temperature', '0.7', 'Temperature for response generation'),
  ('maxTokens', '2000', 'Maximum tokens for response'),
  ('vectorStoreProvider', 'cloudflare-vectorize', 'Vector database provider'),
  ('embeddingModel', '@cf/baai/bge-base-en-v1.5', 'Model for generating embeddings'),
  ('chunkSize', '500', 'Size of text chunks for processing'),
  ('chunkOverlap', '50', 'Overlap between text chunks');

-- Insert default monitoring sources
INSERT OR IGNORE INTO monitoring_sources (source_type, url, scan_frequency) VALUES 
  ('web', 'https://krebsonsecurity.com/feed/', 3600),
  ('web', 'https://www.darkreading.com/rss.xml', 3600),
  ('web', 'https://threatpost.com/feed/', 7200),
  ('web', 'https://www.bleepingcomputer.com/feed/', 3600),
  ('web', 'https://www.cisa.gov/uscert/ncas/current-activity.xml', 1800);

-- Insert sample keywords
INSERT OR IGNORE INTO keywords (keyword, category, priority) VALUES 
  ('ransomware', 'malware', 3),
  ('APT', 'threat-actor', 3),
  ('zero-day', 'vulnerability', 3),
  ('data breach', 'incident', 2),
  ('CVE-2024', 'vulnerability', 2),
  ('LockBit', 'ransomware', 3),
  ('Lazarus', 'threat-actor', 3),
  ('phishing', 'attack-vector', 2),
  ('supply chain', 'attack-vector', 2),
  ('critical infrastructure', 'target', 3);

-- Create view for active high-priority alerts
CREATE VIEW IF NOT EXISTS active_high_priority_alerts AS
SELECT 
  a.*,
  k.keyword,
  k.category,
  s.url as source_url
FROM alerts a
LEFT JOIN keywords k ON a.keyword_id = k.id
LEFT JOIN monitoring_sources s ON a.source_id = s.id
WHERE a.acknowledged = 0 
  AND a.severity IN ('high', 'critical')
ORDER BY a.created_at DESC;

-- Create view for keyword statistics
CREATE VIEW IF NOT EXISTS keyword_statistics AS
SELECT 
  k.id,
  k.keyword,
  k.category,
  k.priority,
  COUNT(mr.id) as match_count,
  AVG(mr.relevance_score) as avg_relevance,
  MAX(mr.timestamp) as last_match
FROM keywords k
LEFT JOIN monitoring_results mr ON k.id = mr.keyword_id
GROUP BY k.id, k.keyword, k.category, k.priority;

-- Create trigger to update updated_at timestamp (SQLite version)
CREATE TRIGGER update_document_embeddings_timestamp 
AFTER UPDATE ON document_embeddings 
BEGIN
  UPDATE document_embeddings 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;

CREATE TRIGGER update_rag_config_timestamp 
AFTER UPDATE ON rag_config 
BEGIN
  UPDATE rag_config 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE id = NEW.id;
END;
