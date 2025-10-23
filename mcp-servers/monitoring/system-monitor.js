import os from 'os';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * MCP System Monitor
 * Comprehensive system monitoring and performance tracking
 */

class SystemMonitor {
  constructor() {
    this.metrics = {
      system: {},
      performance: {},
      memory: {},
      network: {},
      disk: {},
      processes: {}
    };
    this.alerts = [];
    this.thresholds = {
      cpu: 80, // 80% CPU usage
      memory: 85, // 85% memory usage
      disk: 90, // 90% disk usage
      responseTime: 1000, // 1 second response time
      errorRate: 5, // 5% error rate
      uptime: 99.9 // 99.9% uptime
    };
    this.monitoringInterval = null;
    this.alertHandlers = [];
  }

  /**
   * Start system monitoring
   */
  startMonitoring(intervalMs = 30000) {
    console.log('[System Monitor] Starting system monitoring...');
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkThresholds();
      this.generateAlerts();
    }, intervalMs);

    // Initial metrics collection
    this.collectMetrics();
    
    console.log('[System Monitor] System monitoring started');
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[System Monitor] System monitoring stopped');
    }
  }

  /**
   * Collect system metrics
   */
  collectMetrics() {
    try {
      // System information
      this.metrics.system = {
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        timestamp: new Date().toISOString()
      };

      // CPU metrics
      this.metrics.performance = {
        cpuUsage: this.getCPUUsage(),
        cpuCount: os.cpus().length,
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        timestamp: new Date().toISOString()
      };

      // Memory metrics
      this.metrics.memory = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
        timestamp: new Date().toISOString()
      };

      // Network metrics
      this.metrics.network = {
        interfaces: this.getNetworkInterfaces(),
        timestamp: new Date().toISOString()
      };

      // Disk metrics
      this.metrics.disk = {
        usage: this.getDiskUsage(),
        timestamp: new Date().toISOString()
      };

      // Process metrics
      this.metrics.processes = {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[System Monitor] Error collecting metrics:', error);
    }
  }

  /**
   * Get CPU usage
   */
  getCPUUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length,
      usage: 100 - (totalIdle / totalTick) * 100
    };
  }

  /**
   * Get network interfaces
   */
  getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result = {};

    for (const [name, nets] of Object.entries(interfaces)) {
      result[name] = nets.map(net => ({
        address: net.address,
        family: net.family,
        internal: net.internal,
        mac: net.mac
      }));
    }

    return result;
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const stats = await fs.statfs('/');
      return {
        total: stats.bavail * stats.bsize,
        free: stats.bavail * stats.bsize,
        used: (stats.blocks - stats.bavail) * stats.bsize,
        usage: ((stats.blocks - stats.bavail) / stats.blocks) * 100
      };
    } catch (error) {
      // Fallback for Windows or when statfs is not available
      return {
        total: 0,
        free: 0,
        used: 0,
        usage: 0,
        error: 'Disk usage not available on this platform'
      };
    }
  }

  /**
   * Check metric thresholds
   */
  checkThresholds() {
    const alerts = [];

    // CPU usage check
    if (this.metrics.performance.cpuUsage.usage > this.thresholds.cpu) {
      alerts.push({
        type: 'high_cpu_usage',
        severity: 'warning',
        value: this.metrics.performance.cpuUsage.usage,
        threshold: this.thresholds.cpu,
        message: `CPU usage is ${this.metrics.performance.cpuUsage.usage.toFixed(2)}%, above threshold of ${this.thresholds.cpu}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Memory usage check
    if (this.metrics.memory.usage > this.thresholds.memory) {
      alerts.push({
        type: 'high_memory_usage',
        severity: 'warning',
        value: this.metrics.memory.usage,
        threshold: this.thresholds.memory,
        message: `Memory usage is ${this.metrics.memory.usage.toFixed(2)}%, above threshold of ${this.thresholds.memory}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Disk usage check
    if (this.metrics.disk.usage > this.thresholds.disk) {
      alerts.push({
        type: 'high_disk_usage',
        severity: 'critical',
        value: this.metrics.disk.usage,
        threshold: this.thresholds.disk,
        message: `Disk usage is ${this.metrics.disk.usage.toFixed(2)}%, above threshold of ${this.thresholds.disk}%`,
        timestamp: new Date().toISOString()
      });
    }

    // Add new alerts
    this.alerts.push(...alerts);
  }

  /**
   * Generate alerts
   */
  generateAlerts() {
    const newAlerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > new Date(Date.now() - 60000) // Last minute
    );

    if (newAlerts.length > 0) {
      console.log(`[System Monitor] Generated ${newAlerts.length} alerts`);
      
      // Notify alert handlers
      this.alertHandlers.forEach(handler => {
        try {
          handler(newAlerts);
        } catch (error) {
          console.error('[System Monitor] Alert handler error:', error);
        }
      });
    }
  }

  /**
   * Add alert handler
   */
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get system metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      alerts: this.alerts.slice(-100), // Last 100 alerts
      thresholds: this.thresholds,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const status = {
      overall: 'healthy',
      checks: {
        cpu: 'healthy',
        memory: 'healthy',
        disk: 'healthy',
        uptime: 'healthy'
      },
      timestamp: new Date().toISOString()
    };

    // Check CPU
    if (this.metrics.performance.cpuUsage.usage > this.thresholds.cpu) {
      status.checks.cpu = 'warning';
      status.overall = 'warning';
    }

    // Check memory
    if (this.metrics.memory.usage > this.thresholds.memory) {
      status.checks.memory = 'warning';
      status.overall = 'warning';
    }

    // Check disk
    if (this.metrics.disk.usage > this.thresholds.disk) {
      status.checks.disk = 'critical';
      status.overall = 'critical';
    }

    // Check uptime
    const uptime = this.metrics.system.uptime;
    const uptimeHours = uptime / 3600;
    if (uptimeHours < 1) {
      status.checks.uptime = 'warning';
      if (status.overall === 'healthy') status.overall = 'warning';
    }

    return status;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      cpu: {
        usage: this.metrics.performance.cpuUsage.usage,
        cores: this.metrics.performance.cpuCount,
        model: this.metrics.performance.cpuModel
      },
      memory: {
        total: this.metrics.memory.total,
        used: this.metrics.memory.used,
        free: this.metrics.memory.free,
        usage: this.metrics.memory.usage
      },
      disk: {
        total: this.metrics.disk.total,
        used: this.metrics.disk.used,
        free: this.metrics.disk.free,
        usage: this.metrics.disk.usage
      },
      uptime: {
        system: this.metrics.system.uptime,
        process: this.metrics.processes.uptime
      },
      alerts: this.alerts.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('[System Monitor] Thresholds updated:', this.thresholds);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );

    const removedCount = initialCount - this.alerts.length;
    console.log(`[System Monitor] Cleared ${removedCount} old alerts`);
  }

  /**
   * Export metrics to file
   */
  async exportMetrics(filename) {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        metrics: this.metrics,
        alerts: this.alerts,
        thresholds: this.thresholds,
        healthStatus: this.getHealthStatus(),
        performanceSummary: this.getPerformanceSummary()
      };

      await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
      console.log(`[System Monitor] Metrics exported to ${filename}`);
    } catch (error) {
      console.error('[System Monitor] Export error:', error);
    }
  }

  /**
   * Get system information
   */
  getSystemInfo() {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      npmVersion: process.env.npm_version || 'Unknown',
      timestamp: new Date().toISOString()
    };
  }
}

// Create singleton instance
const systemMonitor = new SystemMonitor();

export default systemMonitor;


