-- CYBERSTREAMS MCP DATABASE SCHEMA
-- Database schema for MCP servers and metrics

-- MCP Servers Table
CREATE TABLE IF NOT EXISTS mcp_servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'registered',
    config JSONB,
    url VARCHAR(500),
    last_check TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- MCP Requests Table
CREATE TABLE IF NOT EXISTS mcp_requests (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    method VARCHAR(255) NOT NULL,
    params JSONB,
    response JSONB,
    status VARCHAR(50) NOT NULL,
    duration_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- MCP Metrics Table
CREATE TABLE IF NOT EXISTS mcp_metrics (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50),
    tags JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- MCP Server Health Table
CREATE TABLE IF NOT EXISTS mcp_server_health (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    health_status VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    last_success TIMESTAMP,
    last_error TIMESTAMP,
    details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- MCP Server Logs Table
CREATE TABLE IF NOT EXISTS mcp_server_logs (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Threat Intelligence Data Table
CREATE TABLE IF NOT EXISTS mcp_threat_intel (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    threat_id VARCHAR(255) NOT NULL,
    threat_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    source VARCHAR(100) NOT NULL,
    iocs JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- WiFi Network Data Table
CREATE TABLE IF NOT EXISTS mcp_wifi_networks (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    network_id VARCHAR(255) NOT NULL,
    ssid VARCHAR(255),
    bssid VARCHAR(17) NOT NULL,
    encryption VARCHAR(50),
    signal_strength INTEGER,
    frequency INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- System Monitoring Data Table
CREATE TABLE IF NOT EXISTS mcp_system_monitoring (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    component VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DECIMAL(10,4),
    metric_unit VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Analytics Data Table
CREATE TABLE IF NOT EXISTS mcp_analytics (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    analysis_result JSONB,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Code Analysis Data Table
CREATE TABLE IF NOT EXISTS mcp_code_analysis (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    analysis_type VARCHAR(100) NOT NULL,
    findings JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Experience Data Table
CREATE TABLE IF NOT EXISTS mcp_user_experience (
    id SERIAL PRIMARY KEY,
    server_id INTEGER REFERENCES mcp_servers(id) ON DELETE CASCADE,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mcp_servers_name ON mcp_servers(name);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_type ON mcp_servers(type);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_status ON mcp_servers(status);

CREATE INDEX IF NOT EXISTS idx_mcp_requests_server_id ON mcp_requests(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_requests_method ON mcp_requests(method);
CREATE INDEX IF NOT EXISTS idx_mcp_requests_status ON mcp_requests(status);
CREATE INDEX IF NOT EXISTS idx_mcp_requests_created_at ON mcp_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_metrics_server_id ON mcp_metrics(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_metrics_name ON mcp_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_mcp_metrics_timestamp ON mcp_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_mcp_server_health_server_id ON mcp_server_health(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_health_status ON mcp_server_health(health_status);
CREATE INDEX IF NOT EXISTS idx_mcp_server_health_timestamp ON mcp_server_health(timestamp);

CREATE INDEX IF NOT EXISTS idx_mcp_server_logs_server_id ON mcp_server_logs(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_server_logs_level ON mcp_server_logs(level);
CREATE INDEX IF NOT EXISTS idx_mcp_server_logs_timestamp ON mcp_server_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_mcp_threat_intel_server_id ON mcp_threat_intel(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_threat_intel_threat_id ON mcp_threat_intel(threat_id);
CREATE INDEX IF NOT EXISTS idx_mcp_threat_intel_type ON mcp_threat_intel(threat_type);
CREATE INDEX IF NOT EXISTS idx_mcp_threat_intel_severity ON mcp_threat_intel(severity);

CREATE INDEX IF NOT EXISTS idx_mcp_wifi_networks_server_id ON mcp_wifi_networks(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_wifi_networks_bssid ON mcp_wifi_networks(bssid);
CREATE INDEX IF NOT EXISTS idx_mcp_wifi_networks_ssid ON mcp_wifi_networks(ssid);

CREATE INDEX IF NOT EXISTS idx_mcp_system_monitoring_server_id ON mcp_system_monitoring(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_system_monitoring_component ON mcp_system_monitoring(component);
CREATE INDEX IF NOT EXISTS idx_mcp_system_monitoring_timestamp ON mcp_system_monitoring(timestamp);

CREATE INDEX IF NOT EXISTS idx_mcp_analytics_server_id ON mcp_analytics(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_analytics_type ON mcp_analytics(analysis_type);
CREATE INDEX IF NOT EXISTS idx_mcp_analytics_created_at ON mcp_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_mcp_code_analysis_server_id ON mcp_code_analysis(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_code_analysis_file_path ON mcp_code_analysis(file_path);
CREATE INDEX IF NOT EXISTS idx_mcp_code_analysis_type ON mcp_code_analysis(analysis_type);

CREATE INDEX IF NOT EXISTS idx_mcp_user_experience_server_id ON mcp_user_experience(server_id);
CREATE INDEX IF NOT EXISTS idx_mcp_user_experience_user_id ON mcp_user_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_mcp_user_experience_event_type ON mcp_user_experience(event_type);
CREATE INDEX IF NOT EXISTS idx_mcp_user_experience_timestamp ON mcp_user_experience(timestamp);

-- Views for common queries
CREATE OR REPLACE VIEW mcp_server_status AS
SELECT 
    s.id,
    s.name,
    s.type,
    s.status,
    s.last_check,
    h.health_status,
    h.response_time_ms,
    h.error_count,
    h.last_success,
    h.last_error
FROM mcp_servers s
LEFT JOIN mcp_server_health h ON s.id = h.server_id
WHERE h.timestamp = (
    SELECT MAX(timestamp) 
    FROM mcp_server_health 
    WHERE server_id = s.id
);

CREATE OR REPLACE VIEW mcp_server_metrics_summary AS
SELECT 
    s.id,
    s.name,
    s.type,
    COUNT(r.id) as total_requests,
    COUNT(CASE WHEN r.status = 'success' THEN 1 END) as successful_requests,
    COUNT(CASE WHEN r.status = 'error' THEN 1 END) as failed_requests,
    AVG(r.duration_ms) as avg_response_time,
    MAX(r.created_at) as last_request
FROM mcp_servers s
LEFT JOIN mcp_requests r ON s.id = r.server_id
GROUP BY s.id, s.name, s.type;

CREATE OR REPLACE VIEW mcp_threat_intel_summary AS
SELECT 
    s.name as server_name,
    ti.threat_type,
    ti.severity,
    ti.source,
    COUNT(*) as threat_count,
    MAX(ti.created_at) as latest_threat
FROM mcp_threat_intel ti
JOIN mcp_servers s ON ti.server_id = s.id
GROUP BY s.name, ti.threat_type, ti.severity, ti.source;

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_mcp_server_status(
    server_name VARCHAR(255),
    new_status VARCHAR(50),
    response_time INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE mcp_servers 
    SET status = new_status, 
        last_check = NOW(),
        updated_at = NOW()
    WHERE name = server_name;
    
    INSERT INTO mcp_server_health (server_id, health_status, response_time_ms, timestamp)
    SELECT id, new_status, response_time, NOW()
    FROM mcp_servers 
    WHERE name = server_name;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_mcp_request(
    server_name VARCHAR(255),
    method_name VARCHAR(255),
    request_params JSONB,
    response_data JSONB,
    request_status VARCHAR(50),
    duration_ms INTEGER
) RETURNS VOID AS $$
DECLARE
    server_id INTEGER;
BEGIN
    SELECT id INTO server_id FROM mcp_servers WHERE name = server_name;
    
    INSERT INTO mcp_requests (server_id, method, params, response, status, duration_ms)
    VALUES (server_id, method_name, request_params, response_data, request_status, duration_ms);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_mcp_data(retention_days INTEGER DEFAULT 30) RETURNS VOID AS $$
BEGIN
    DELETE FROM mcp_requests WHERE created_at < NOW() - INTERVAL '1 day' * retention_days;
    DELETE FROM mcp_metrics WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
    DELETE FROM mcp_server_health WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
    DELETE FROM mcp_server_logs WHERE timestamp < NOW() - INTERVAL '1 day' * retention_days;
END;
$$ LANGUAGE plpgsql;

-- Insert default MCP servers
INSERT INTO mcp_servers (name, type, status, config) VALUES
('cyberstreams-core', 'core', 'registered', '{"port": 3003, "description": "Core MCP server"}'),
('cyberstreams-threat-intel', 'threat-intelligence', 'registered', '{"port": 3004, "description": "Threat Intelligence MCP server"}'),
('cyberstreams-wifi-analysis', 'wifi-analysis', 'registered', '{"port": 3005, "description": "WiFi Analysis MCP server"}'),
('cyberstreams-system-monitor', 'system-monitoring', 'registered', '{"port": 3006, "description": "System Monitoring MCP server"}'),
('cyberstreams-analytics', 'analytics', 'registered', '{"port": 3007, "description": "Analytics MCP server"}'),
('cyberstreams-code-assistant', 'code-assistant', 'registered', '{"port": 3008, "description": "Code Assistant MCP server"}'),
('cyberstreams-ux', 'user-experience', 'registered', '{"port": 3009, "description": "User Experience MCP server"}')
ON CONFLICT (name) DO NOTHING;



