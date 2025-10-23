/**
 * CYBERSTREAMS MCP CLIENT
 * 
 * MCP client der håndterer kommunikation med MCP servere
 * og integrerer MCP funktionalitet i Cyberstreams backend.
 */

import fetch from 'node-fetch';
import { EventEmitter } from 'events';

class CyberstreamsMCPClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      coreServerUrl: config.coreServerUrl || 'http://localhost:3003',
      timeout: config.timeout || 10000,
      retries: config.retries || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };
    
    this.servers = new Map();
    this.connected = false;
    this.metrics = {
      requests: 0,
      errors: 0,
      startTime: Date.now()
    };
  }

  async connect() {
    try {
      console.log('🔗 Connecting to MCP Core Server...');
      
      // Test connection to core server
      const response = await this.makeRequest('health-check', { component: 'all' });
      
      if (response.success) {
        this.connected = true;
        console.log('✅ Connected to MCP Core Server successfully');
        
        // Load registered servers
        await this.loadRegisteredServers();
        
        this.emit('connected');
        return true;
      } else {
        throw new Error('Failed to connect to MCP Core Server');
      }
    } catch (error) {
      console.error('❌ Failed to connect to MCP Core Server:', error.message);
      this.connected = false;
      this.emit('error', error);
      return false;
    }
  }

  async makeRequest(method, params = {}, options = {}) {
    const url = `${this.config.coreServerUrl}/mcp/${method}`;
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cyberstreams-MCP-Client/1.0',
        ...options.headers
      },
      body: JSON.stringify(params),
      timeout: this.config.timeout
    };

    let lastError;
    
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await fetch(url, requestOptions);
        const duration = Date.now() - startTime;
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        this.metrics.requests++;
        this.emit('request', { method, params, duration, success: true });
        
        return data;
      } catch (error) {
        lastError = error;
        this.metrics.errors++;
        
        if (attempt < this.config.retries) {
          console.warn(`⚠️ MCP request failed (attempt ${attempt + 1}/${this.config.retries + 1}):`, error.message);
          await this.delay(this.config.retryDelay * (attempt + 1));
        } else {
          this.emit('request', { method, params, error, success: false });
          throw error;
        }
      }
    }
    
    throw lastError;
  }

  async loadRegisteredServers() {
    try {
      const response = await this.makeRequest('mcp-server-list', { includeStatus: true });
      
      if (response.success) {
        this.servers.clear();
        
        for (const server of response.data.servers) {
          this.servers.set(server.name, {
            ...server,
            lastUpdate: new Date().toISOString()
          });
        }
        
        console.log(`📋 Loaded ${this.servers.size} registered MCP servers`);
        this.emit('servers-loaded', Array.from(this.servers.values()));
      }
    } catch (error) {
      console.error('❌ Failed to load registered servers:', error.message);
    }
  }

  async registerServer(name, type, config = {}) {
    try {
      const response = await this.makeRequest('mcp-server-register', {
        name,
        type,
        config
      });
      
      if (response.success) {
        // Reload servers to get updated list
        await this.loadRegisteredServers();
        
        console.log(`✅ Registered MCP server: ${name}`);
        this.emit('server-registered', { name, type, config });
        
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to register server');
      }
    } catch (error) {
      console.error(`❌ Failed to register MCP server ${name}:`, error.message);
      throw error;
    }
  }

  async getSystemStatus(includeMetrics = true) {
    try {
      const response = await this.makeRequest('system-status', { includeMetrics });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get system status');
      }
    } catch (error) {
      console.error('❌ Failed to get system status:', error.message);
      throw error;
    }
  }

  async performHealthCheck(component = 'all') {
    try {
      const response = await this.makeRequest('health-check', { component });
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Health check failed');
      }
    } catch (error) {
      console.error(`❌ Health check failed for ${component}:`, error.message);
      throw error;
    }
  }

  async sendToServer(serverName, method, params = {}) {
    if (!this.servers.has(serverName)) {
      throw new Error(`Server '${serverName}' not found`);
    }
    
    const server = this.servers.get(serverName);
    const serverUrl = server.config.url || `${this.config.coreServerUrl}/servers/${serverName}`;
    
    try {
      const response = await fetch(`${serverUrl}/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Cyberstreams-MCP-Client/1.0'
        },
        body: JSON.stringify(params),
        timeout: this.config.timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      this.metrics.requests++;
      
      return data;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    const errorRate = this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%';
    
    return {
      connected: this.connected,
      uptime,
      requests: this.metrics.requests,
      errors: this.metrics.errors,
      errorRate,
      servers: this.servers.size,
      timestamp: new Date().toISOString()
    };
  }

  async disconnect() {
    console.log('🔌 Disconnecting from MCP Core Server...');
    
    this.connected = false;
    this.servers.clear();
    
    this.emit('disconnected');
    console.log('✅ Disconnected from MCP Core Server');
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let mcpClientInstance = null;

export function getMCPClient(config = {}) {
  if (!mcpClientInstance) {
    mcpClientInstance = new CyberstreamsMCPClient(config);
  }
  return mcpClientInstance;
}

export default CyberstreamsMCPClient;


