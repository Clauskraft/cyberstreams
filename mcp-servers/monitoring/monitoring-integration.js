import express from 'express';
import systemMonitor from './system-monitor.js';
import performanceMonitor from './performance-monitor.js';
import alertingSystem from './alerting-system.js';

/**
 * MCP Monitoring Integration
 * Comprehensive monitoring and alerting integration
 */

class MonitoringIntegration {
  constructor() {
    this.app = express();
    this.setupMonitoring();
    this.setupRoutes();
  }

  /**
   * Setup monitoring systems
   */
  setupMonitoring() {
    console.log('[Monitoring Integration] Setting up monitoring systems...');

    // Initialize alerting system
    alertingSystem.initialize();

    // Start system monitoring
    systemMonitor.startMonitoring(30000); // 30 seconds

    // Start performance monitoring
    performanceMonitor.startMonitoring();

    // Setup alert handlers
    this.setupAlertHandlers();

    console.log('[Monitoring Integration] Monitoring systems setup complete');
  }

  /**
   * Setup alert handlers
   */
  setupAlertHandlers() {
    // System monitor alert handler
    systemMonitor.addAlertHandler((alerts) => {
      alerts.forEach(alert => {
        alertingSystem.createAlert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          source: 'system_monitor'
        });
      });
    });

    // Performance monitor alert handler
    performanceMonitor.addAlertHandler((alerts) => {
      alerts.forEach(alert => {
        alertingSystem.createAlert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          value: alert.value,
          threshold: alert.threshold,
          source: 'performance_monitor'
        });
      });
    });

    // Security monitor alert handler (if available)
    if (typeof securityMonitor !== 'undefined') {
      securityMonitor.addAlertHandler((alert) => {
        alertingSystem.createAlert({
          type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          source: 'security_monitor'
        });
      });
    }
  }

  /**
   * Setup monitoring routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const healthStatus = systemMonitor.getHealthStatus();
      res.json(healthStatus);
    });

    // System metrics endpoint
    this.app.get('/metrics/system', (req, res) => {
      const metrics = systemMonitor.getMetrics();
      res.json(metrics);
    });

    // Performance metrics endpoint
    this.app.get('/metrics/performance', (req, res) => {
      const metrics = performanceMonitor.getMetrics();
      res.json(metrics);
    });

    // Combined metrics endpoint
    this.app.get('/metrics', (req, res) => {
      const combinedMetrics = {
        system: systemMonitor.getMetrics(),
        performance: performanceMonitor.getMetrics(),
        health: systemMonitor.getHealthStatus(),
        timestamp: new Date().toISOString()
      };
      res.json(combinedMetrics);
    });

    // Alert endpoints
    this.app.get('/alerts', (req, res) => {
      const alerts = alertingSystem.getActiveAlerts();
      res.json(alerts);
    });

    this.app.get('/alerts/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const history = alertingSystem.getAlertHistory(limit);
      res.json(history);
    });

    this.app.get('/alerts/statistics', (req, res) => {
      const stats = alertingSystem.getAlertStatistics();
      res.json(stats);
    });

    // Alert management endpoints
    this.app.post('/alerts/:id/acknowledge', (req, res) => {
      const { id } = req.params;
      const { acknowledgedBy, note } = req.body;
      
      alertingSystem.acknowledgeAlert(id, acknowledgedBy, note);
      res.json({ success: true, message: 'Alert acknowledged' });
    });

    this.app.post('/alerts/:id/resolve', (req, res) => {
      const { id } = req.params;
      const { resolvedBy, resolution } = req.body;
      
      alertingSystem.resolveAlert(id, resolvedBy, resolution);
      res.json({ success: true, message: 'Alert resolved' });
    });

    // Configuration endpoints
    this.app.get('/config/thresholds', (req, res) => {
      const thresholds = {
        system: systemMonitor.thresholds,
        performance: performanceMonitor.thresholds,
        alerting: alertingSystem.thresholds
      };
      res.json(thresholds);
    });

    this.app.post('/config/thresholds', (req, res) => {
      const { system, performance, alerting } = req.body;
      
      if (system) systemMonitor.updateThresholds(system);
      if (performance) performanceMonitor.updateThresholds(performance);
      if (alerting) alertingSystem.updateThresholds(alerting);
      
      res.json({ success: true, message: 'Thresholds updated' });
    });

    // Dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      const dashboard = {
        system: {
          health: systemMonitor.getHealthStatus(),
          performance: systemMonitor.getPerformanceSummary(),
          info: systemMonitor.getSystemInfo()
        },
        performance: {
          metrics: performanceMonitor.getMetrics(),
          trends: performanceMonitor.getMetrics().potential.trends,
          bottlenecks: performanceMonitor.getMetrics().potential.bottlenecks,
          recommendations: performanceMonitor.getMetrics().potential.recommendations
        },
        alerts: {
          active: alertingSystem.getActiveAlerts(),
          statistics: alertingSystem.getAlertStatistics()
        },
        timestamp: new Date().toISOString()
      };
      res.json(dashboard);
    });

    // Export endpoints
    this.app.get('/export/metrics', async (req, res) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `metrics-export-${timestamp}.json`;
        
        await systemMonitor.exportMetrics(filename);
        res.json({ success: true, filename });
      } catch (error) {
        res.status(500).json({ error: 'Export failed', details: error.message });
      }
    });

    this.app.get('/export/alerts', async (req, res) => {
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `alerts-export-${timestamp}.json`;
        
        await alertingSystem.exportAlerts(filename);
        res.json({ success: true, filename });
      } catch (error) {
        res.status(500).json({ error: 'Export failed', details: error.message });
      }
    });

    // Performance monitoring middleware
    this.app.use((req, res, next) => {
      const requestId = crypto.randomUUID();
      const startTime = performanceMonitor.startTiming(requestId, req.path, req.method);
      
      res.on('finish', () => {
        performanceMonitor.endTiming(requestId, res.statusCode, res.get('content-length') || 0);
      });
      
      res.on('error', (error) => {
        performanceMonitor.recordError(requestId, error, res.statusCode);
      });
      
      next();
    });
  }

  /**
   * Get Express app
   */
  getApp() {
    return this.app;
  }

  /**
   * Start monitoring integration
   */
  start(port = 3006) {
    this.app.listen(port, () => {
      console.log(`[Monitoring Integration] Monitoring server started on port ${port}`);
      console.log(`[Monitoring Integration] Health check: http://localhost:${port}/health`);
      console.log(`[Monitoring Integration] Metrics: http://localhost:${port}/metrics`);
      console.log(`[Monitoring Integration] Dashboard: http://localhost:${port}/dashboard`);
      console.log(`[Monitoring Integration] Alerts: http://localhost:${port}/alerts`);
    });
  }

  /**
   * Stop monitoring integration
   */
  stop() {
    systemMonitor.stopMonitoring();
    console.log('[Monitoring Integration] Monitoring integration stopped');
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      system: {
        monitoring: systemMonitor.monitoringInterval ? 'running' : 'stopped',
        health: systemMonitor.getHealthStatus(),
        uptime: systemMonitor.getMetrics().system.uptime
      },
      performance: {
        monitoring: 'running',
        metrics: performanceMonitor.getMetrics()
      },
      alerting: {
        system: 'running',
        activeAlerts: alertingSystem.getActiveAlerts().length,
        statistics: alertingSystem.getAlertStatistics()
      },
      timestamp: new Date().toISOString()
    };
  }
}

export default MonitoringIntegration;


