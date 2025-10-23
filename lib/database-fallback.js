// Database fallback for Windows compatibility issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'cyberstreams.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  const initialData = {
    authorizedSources: [],
    mcpServers: [],
    threatIndicators: [],
    wifiNetworks: [],
    healthLogs: [],
    performanceMetrics: [],
    alerts: [],
    metadata: {
      created: new Date().toISOString(),
      version: '1.7.0'
    }
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
}

// Database operations
export const database = {
  // Read all data
  read() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading database:', error);
      return { authorizedSources: [], mcpServers: [], threatIndicators: [], wifiNetworks: [], healthLogs: [], performanceMetrics: [], alerts: [] };
    }
  },

  // Write all data
  write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing database:', error);
      return false;
    }
  },

  // Get authorized sources
  getAuthorizedSources() {
    const data = this.read();
    return data.authorizedSources || [];
  },

  // Add authorized source
  addAuthorizedSource(source) {
    const data = this.read();
    if (!data.authorizedSources) data.authorizedSources = [];
    data.authorizedSources.push(source);
    return this.write(data);
  },

  // Get MCP servers
  getMcpServers() {
    const data = this.read();
    return data.mcpServers || [];
  },

  // Add MCP server
  addMcpServer(server) {
    const data = this.read();
    if (!data.mcpServers) data.mcpServers = [];
    data.mcpServers.push(server);
    return this.write(data);
  },

  // Get threat indicators
  getThreatIndicators() {
    const data = this.read();
    return data.threatIndicators || [];
  },

  // Add threat indicator
  addThreatIndicator(indicator) {
    const data = this.read();
    if (!data.threatIndicators) data.threatIndicators = [];
    data.threatIndicators.push(indicator);
    return this.write(data);
  },

  // Get WiFi networks
  getWifiNetworks() {
    const data = this.read();
    return data.wifiNetworks || [];
  },

  // Add WiFi network
  addWifiNetwork(network) {
    const data = this.read();
    if (!data.wifiNetworks) data.wifiNetworks = [];
    data.wifiNetworks.push(network);
    return this.write(data);
  },

  // Get health logs
  getHealthLogs() {
    const data = this.read();
    return data.healthLogs || [];
  },

  // Add health log
  addHealthLog(log) {
    const data = this.read();
    if (!data.healthLogs) data.healthLogs = [];
    data.healthLogs.push(log);
    return this.write(data);
  },

  // Get performance metrics
  getPerformanceMetrics() {
    const data = this.read();
    return data.performanceMetrics || [];
  },

  // Add performance metric
  addPerformanceMetric(metric) {
    const data = this.read();
    if (!data.performanceMetrics) data.performanceMetrics = [];
    data.performanceMetrics.push(metric);
    return this.write(data);
  },

  // Get alerts
  getAlerts() {
    const data = this.read();
    return data.alerts || [];
  },

  // Add alert
  addAlert(alert) {
    const data = this.read();
    if (!data.alerts) data.alerts = [];
    data.alerts.push(alert);
    return this.write(data);
  },

  // Update alert
  updateAlert(alertId, updates) {
    const data = this.read();
    if (!data.alerts) data.alerts = [];
    const alertIndex = data.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      data.alerts[alertIndex] = { ...data.alerts[alertIndex], ...updates };
      return this.write(data);
    }
    return false;
  },

  // Clear old data (keep last 1000 entries)
  cleanup() {
    const data = this.read();
    
    // Keep only last 1000 entries for each array
    const maxEntries = 1000;
    
    if (data.healthLogs && data.healthLogs.length > maxEntries) {
      data.healthLogs = data.healthLogs.slice(-maxEntries);
    }
    
    if (data.performanceMetrics && data.performanceMetrics.length > maxEntries) {
      data.performanceMetrics = data.performanceMetrics.slice(-maxEntries);
    }
    
    if (data.alerts && data.alerts.length > maxEntries) {
      data.alerts = data.alerts.slice(-maxEntries);
    }
    
    return this.write(data);
  },

  exec(sql) {
    console.warn('exec called on fallback database; ignoring SQL:', sql);
    return undefined;
  },

  query() {
    console.warn('query called on fallback database; returning empty result');
    return { rows: [], rowCount: 0 };
  },

  prepare() {
    throw new Error('prepare is not supported by fallback database');
  }
};

export default database;
