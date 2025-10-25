#!/usr/bin/env node

/**
 * CYBERSTREAMS MCP SERVER MANAGER
 * 
 * Manager der håndterer alle MCP servere og koordinerer
 * kommunikation mellem dem.
 */

import { spawn, exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

class MCPServerManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      serversDir: config.serversDir || './mcp-servers',
      ports: {
        core: 3003,
        threatIntel: 3004,
        wifiAnalysis: 3005,
        systemMonitor: 3006,
        analytics: 3007,
        codeAssistant: 3008,
        ux: 3009,
        ...config.ports
      },
      healthCheckInterval: config.healthCheckInterval || 30000,
      restartDelay: config.restartDelay || 5000,
      ...config
    };
    
    this.servers = new Map();
    this.serverProcesses = new Map();
    this.healthStatus = new Map();
    this.metrics = {
      totalRestarts: 0,
      totalErrors: 0,
      startTime: Date.now()
    };
  }

  async initialize() {
    console.log('🚀 Initializing MCP Server Manager...');
    
    // Load server configurations
    await this.loadServerConfigurations();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Handle graceful shutdown
    this.setupGracefulShutdown();
    
    console.log('✅ MCP Server Manager initialized successfully');
    this.emit('initialized');
  }

  async loadServerConfigurations() {
    const serverFiles = [
      'core-server.js',
      'threat-intel-server.js',
      'wifi-analysis-server.js'
    ];

    for (const serverFile of serverFiles) {
      const serverPath = path.join(this.config.serversDir, serverFile);
      
      try {
        await fs.access(serverPath);
        
        const serverName = serverFile.replace('-server.js', '');
        const serverConfig = this.getServerConfig(serverName);
        
        this.servers.set(serverName, {
          name: serverName,
          file: serverFile,
          path: serverPath,
          config: serverConfig,
          status: 'stopped',
          lastStart: null,
          restartCount: 0
        });
        
        console.log(`📋 Loaded server configuration: ${serverName}`);
      } catch (error) {
        console.warn(`⚠️ Server file not found: ${serverFile}`);
      }
    }
  }

  getServerConfig(serverName) {
    const portMap = {
      'core': this.config.ports.core,
      'threat-intel': this.config.ports.threatIntel,
      'wifi-analysis': this.config.ports.wifiAnalysis,
      'system-monitor': this.config.ports.systemMonitor,
      'analytics': this.config.ports.analytics,
      'code-assistant': this.config.ports.codeAssistant,
      'ux': this.config.ports.ux
    };

    return {
      port: portMap[serverName] || 3000,
      name: serverName,
      autoStart: true,
      restartOnFailure: true
    };
  }

  async startServer(serverName) {
    const server = this.servers.get(serverName);
    
    if (!server) {
      throw new Error(`Server '${serverName}' not found`);
    }

    if (server.status === 'running') {
      console.log(`⚠️ Server '${serverName}' is already running`);
      return;
    }

    try {
      console.log(`🚀 Starting server: ${serverName}...`);
      
      const process = spawn('node', [server.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          MCP_SERVER_PORT: server.config.port,
          MCP_SERVER_NAME: server.name
        }
      });

      this.serverProcesses.set(serverName, process);

      // Handle process events
      process.on('exit', (code, signal) => {
        this.handleServerExit(serverName, code, signal);
      });

      process.on('error', (error) => {
        this.handleServerError(serverName, error);
      });

      // Handle stdout
      process.stdout.on('data', (data) => {
        console.log(`[${serverName}] ${data.toString().trim()}`);
      });

      // Handle stderr
      process.stderr.on('data', (data) => {
        console.error(`[${serverName}] ${data.toString().trim()}`);
      });

      // Wait for server to start
      await this.waitForServerStart(serverName, server.config.port);

      server.status = 'running';
      server.lastStart = new Date();
      
      console.log(`✅ Server '${serverName}' started successfully on port ${server.config.port}`);
      this.emit('server-started', { serverName, port: server.config.port });
      
    } catch (error) {
      server.status = 'error';
      this.metrics.totalErrors++;
      
      console.error(`❌ Failed to start server '${serverName}':`, error.message);
      this.emit('server-error', { serverName, error });
      
      throw error;
    }
  }

  async stopServer(serverName) {
    const server = this.servers.get(serverName);
    const process = this.serverProcesses.get(serverName);
    
    if (!server) {
      throw new Error(`Server '${serverName}' not found`);
    }

    if (!process) {
      console.log(`⚠️ Server '${serverName}' is not running`);
      return;
    }

    try {
      console.log(`🛑 Stopping server: ${serverName}...`);
      
      process.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          process.kill('SIGKILL');
          reject(new Error('Server did not stop gracefully'));
        }, 10000);

        process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      this.serverProcesses.delete(serverName);
      server.status = 'stopped';
      
      console.log(`✅ Server '${serverName}' stopped successfully`);
      this.emit('server-stopped', { serverName });
      
    } catch (error) {
      console.error(`❌ Failed to stop server '${serverName}':`, error.message);
      throw error;
    }
  }

  async restartServer(serverName) {
    const server = this.servers.get(serverName);
    
    if (!server) {
      throw new Error(`Server '${serverName}' not found`);
    }

    try {
      console.log(`🔄 Restarting server: ${serverName}...`);
      
      if (server.status === 'running') {
        await this.stopServer(serverName);
        await this.delay(this.config.restartDelay);
      }
      
      await this.startServer(serverName);
      
      server.restartCount++;
      this.metrics.totalRestarts++;
      
      console.log(`✅ Server '${serverName}' restarted successfully`);
      this.emit('server-restarted', { serverName });
      
    } catch (error) {
      console.error(`❌ Failed to restart server '${serverName}':`, error.message);
      throw error;
    }
  }

  async startAllServers() {
    console.log('🚀 Starting all MCP servers...');
    
    const startPromises = Array.from(this.servers.keys()).map(async (serverName) => {
      try {
        await this.startServer(serverName);
      } catch (error) {
        console.error(`Failed to start ${serverName}:`, error.message);
      }
    });

    await Promise.allSettled(startPromises);
    
    console.log('✅ All MCP servers startup completed');
    this.emit('all-servers-started');
  }

  async stopAllServers() {
    console.log('🛑 Stopping all MCP servers...');
    
    const stopPromises = Array.from(this.servers.keys()).map(async (serverName) => {
      try {
        await this.stopServer(serverName);
      } catch (error) {
        console.error(`Failed to stop ${serverName}:`, error.message);
      }
    });

    await Promise.allSettled(stopPromises);
    
    console.log('✅ All MCP servers stopped');
    this.emit('all-servers-stopped');
  }

  async waitForServerStart(serverName, port, timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await this.delay(1000);
    }
    
    throw new Error(`Server '${serverName}' failed to start within ${timeout}ms`);
  }

  handleServerExit(serverName, code, signal) {
    const server = this.servers.get(serverName);
    
    if (server) {
      server.status = 'stopped';
      
      console.log(`📋 Server '${serverName}' exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
      
      this.emit('server-exited', { serverName, code, signal });
      
      // Auto-restart if configured
      if (server.config.restartOnFailure && code !== 0) {
        console.log(`🔄 Auto-restarting server '${serverName}'...`);
        setTimeout(() => {
          this.restartServer(serverName).catch(error => {
            console.error(`Failed to auto-restart ${serverName}:`, error.message);
          });
        }, this.config.restartDelay);
      }
    }
  }

  handleServerError(serverName, error) {
    const server = this.servers.get(serverName);
    
    if (server) {
      server.status = 'error';
      this.metrics.totalErrors++;
      
      console.error(`❌ Server '${serverName}' error:`, error.message);
      this.emit('server-error', { serverName, error });
    }
  }

  startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.healthCheckInterval);
    
    console.log('📊 Health monitoring started');
  }

  async performHealthChecks() {
    for (const [serverName, server] of this.servers) {
      try {
        const health = await this.checkServerHealth(serverName);
        this.healthStatus.set(serverName, health);
        
        if (health.status === 'unhealthy' && server.status === 'running') {
          console.warn(`⚠️ Server '${serverName}' health check failed`);
          this.emit('server-unhealthy', { serverName, health });
        }
      } catch (error) {
        console.error(`Health check failed for ${serverName}:`, error.message);
      }
    }
  }

  async checkServerHealth(serverName) {
    const server = this.servers.get(serverName);
    
    if (!server || server.status !== 'running') {
      return { status: 'unhealthy', message: 'Server not running' };
    }

    try {
      const response = await fetch(`http://localhost:${server.config.port}/health`, {
        timeout: 5000
      });
      
      if (response.ok) {
        const data = await response.json();
        return { status: 'healthy', data };
      } else {
        return { status: 'unhealthy', message: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }

  getServerStatus() {
    const status = {};
    
    for (const [serverName, server] of this.servers) {
      status[serverName] = {
        name: server.name,
        status: server.status,
        port: server.config.port,
        lastStart: server.lastStart,
        restartCount: server.restartCount,
        health: this.healthStatus.get(serverName)
      };
    }
    
    return status;
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.startTime;
    
    return {
      uptime,
      totalServers: this.servers.size,
      runningServers: Array.from(this.servers.values()).filter(s => s.status === 'running').length,
      totalRestarts: this.metrics.totalRestarts,
      totalErrors: this.metrics.totalErrors,
      timestamp: new Date().toISOString()
    };
  }

  setupGracefulShutdown() {
    process.on('SIGINT', async () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      await this.shutdown();
      process.exit(0);
    });
  }

  async shutdown() {
    console.log('🛑 Shutting down MCP Server Manager...');
    
    try {
      await this.stopAllServers();
      console.log('✅ MCP Server Manager shut down successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start manager if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new MCPServerManager();
  
  // Initialize and start all servers
  manager.initialize().then(async () => {
    await manager.startAllServers();
    
    // Log status every 30 seconds
    setInterval(() => {
      const status = manager.getServerStatus();
      const metrics = manager.getMetrics();
      console.log('📊 Server Status:', status);
      console.log('📈 Metrics:', metrics);
    }, 30000);
  }).catch(error => {
    console.error('💥 Failed to start MCP Server Manager:', error);
    process.exit(1);
  });
}

export default MCPServerManager;



