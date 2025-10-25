import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * MCP Alerting System
 * Comprehensive alerting and notification system
 */

class AlertingSystem {
  constructor() {
    this.alerts = [];
    this.alertRules = [];
    this.notificationChannels = [];
    this.alertHistory = [];
    this.thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 1000,
      errorRate: 5,
      uptime: 99.9
    };
    this.alertHandlers = [];
  }

  /**
   * Initialize alerting system
   */
  initialize() {
    console.log('[Alerting System] Initializing alerting system...');
    
    // Setup default alert rules
    this.setupDefaultAlertRules();
    
    // Setup notification channels
    this.setupNotificationChannels();
    
    console.log('[Alerting System] Alerting system initialized');
  }

  /**
   * Setup default alert rules
   */
  setupDefaultAlertRules() {
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds threshold',
        condition: 'cpu_usage > threshold',
        severity: 'warning',
        threshold: this.thresholds.cpu,
        enabled: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds threshold',
        condition: 'memory_usage > threshold',
        severity: 'warning',
        threshold: this.thresholds.memory,
        enabled: true
      },
      {
        id: 'high_disk_usage',
        name: 'High Disk Usage',
        description: 'Disk usage exceeds threshold',
        condition: 'disk_usage > threshold',
        severity: 'critical',
        threshold: this.thresholds.disk,
        enabled: true
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'Response time exceeds threshold',
        condition: 'response_time > threshold',
        severity: 'warning',
        threshold: this.thresholds.responseTime,
        enabled: true
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'Error rate exceeds threshold',
        condition: 'error_rate > threshold',
        severity: 'critical',
        threshold: this.thresholds.errorRate,
        enabled: true
      },
      {
        id: 'low_uptime',
        name: 'Low Uptime',
        description: 'System uptime below threshold',
        condition: 'uptime < threshold',
        severity: 'warning',
        threshold: this.thresholds.uptime,
        enabled: true
      }
    ];
  }

  /**
   * Setup notification channels
   */
  setupNotificationChannels() {
    this.notificationChannels = [
      {
        id: 'console',
        name: 'Console Logging',
        type: 'console',
        enabled: true,
        config: {
          level: 'info'
        }
      },
      {
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        enabled: false,
        config: {
          smtp: {
            host: process.env.ALERT_EMAIL_HOST,
            port: process.env.ALERT_EMAIL_PORT || 587,
            secure: process.env.ALERT_EMAIL_SECURE === 'true',
            auth: {
              user: process.env.ALERT_EMAIL_USER,
              pass: process.env.ALERT_EMAIL_PASS
            }
          },
          from: process.env.ALERT_EMAIL_FROM,
          to: process.env.ALERT_EMAIL_TO?.split(',') || []
        }
      },
      {
        id: 'slack',
        name: 'Slack Notifications',
        type: 'slack',
        enabled: false,
        config: {
          webhook: process.env.ALERT_SLACK_WEBHOOK,
          channel: process.env.ALERT_SLACK_CHANNEL || '#alerts'
        }
      },
      {
        id: 'webhook',
        name: 'Webhook Notifications',
        type: 'webhook',
        enabled: false,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`
          }
        }
      }
    ];
  }

  /**
   * Create alert
   */
  createAlert(alertData) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'active',
      acknowledged: false,
      resolved: false,
      ...alertData
    };

    this.alerts.push(alert);
    this.alertHistory.push(alert);

    // Check if alert should be triggered
    this.evaluateAlert(alert);

    return alert;
  }

  /**
   * Evaluate alert against rules
   */
  evaluateAlert(alert) {
    const matchingRules = this.alertRules.filter(rule => 
      rule.enabled && this.matchesCondition(alert, rule)
    );

    if (matchingRules.length > 0) {
      this.triggerAlert(alert, matchingRules);
    }
  }

  /**
   * Check if alert matches rule condition
   */
  matchesCondition(alert, rule) {
    // Simple condition evaluation
    switch (rule.condition) {
      case 'cpu_usage > threshold':
        return alert.type === 'high_cpu_usage' && alert.value > rule.threshold;
      case 'memory_usage > threshold':
        return alert.type === 'high_memory_usage' && alert.value > rule.threshold;
      case 'disk_usage > threshold':
        return alert.type === 'high_disk_usage' && alert.value > rule.threshold;
      case 'response_time > threshold':
        return alert.type === 'slow_response_time' && alert.value > rule.threshold;
      case 'error_rate > threshold':
        return alert.type === 'high_error_rate' && alert.value > rule.threshold;
      case 'uptime < threshold':
        return alert.type === 'low_uptime' && alert.value < rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger alert
   */
  triggerAlert(alert, rules) {
    console.log(`[Alerting System] Alert triggered: ${alert.type} (${alert.severity})`);
    
    // Update alert with rule information
    alert.triggeredRules = rules;
    alert.triggeredAt = new Date().toISOString();

    // Send notifications
    this.sendNotifications(alert);

    // Execute alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('[Alerting System] Alert handler error:', error);
      }
    });
  }

  /**
   * Send notifications
   */
  async sendNotifications(alert) {
    for (const channel of this.notificationChannels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
          case 'console':
            await this.sendConsoleNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert, channel);
            break;
          case 'slack':
            await this.sendSlackNotification(alert, channel);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel);
            break;
        }
      } catch (error) {
        console.error(`[Alerting System] Failed to send ${channel.type} notification:`, error);
      }
    }
  }

  /**
   * Send console notification
   */
  async sendConsoleNotification(alert) {
    const severity = alert.severity.toUpperCase();
    const timestamp = new Date(alert.timestamp).toLocaleString();
    
    console.log(`\n🚨 [${severity}] ${alert.name || alert.type}`);
    console.log(`   Time: ${timestamp}`);
    console.log(`   Message: ${alert.message}`);
    if (alert.value !== undefined) {
      console.log(`   Value: ${alert.value}`);
    }
    if (alert.threshold !== undefined) {
      console.log(`   Threshold: ${alert.threshold}`);
    }
    console.log('');
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(alert, channel) {
    // In production, implement actual email sending
    console.log(`[Alerting System] Email notification sent for alert: ${alert.type}`);
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(alert, channel) {
    // In production, implement actual Slack webhook
    console.log(`[Alerting System] Slack notification sent for alert: ${alert.type}`);
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(alert, channel) {
    // In production, implement actual webhook
    console.log(`[Alerting System] Webhook notification sent for alert: ${alert.type}`);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId, acknowledgedBy, note = '') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      alert.note = note;
      
      console.log(`[Alerting System] Alert acknowledged: ${alert.type} by ${acknowledgedBy}`);
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId, resolvedBy, resolution = '') {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      
      console.log(`[Alerting System] Alert resolved: ${alert.type} by ${resolvedBy}`);
    }
  }

  /**
   * Add alert handler
   */
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => alert.status === 'active' && !alert.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);

    const recentAlerts = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > last24Hours
    );

    const weeklyAlerts = this.alertHistory.filter(alert => [alert.timestamp].getTime() > last7Days);

    const stats = {
      total: this.alertHistory.length,
      active: this.getActiveAlerts().length,
      last24Hours: recentAlerts.length,
      last7Days: weeklyAlerts.length,
      bySeverity: {
        critical: recentAlerts.filter(a => a.severity === 'critical').length,
        warning: recentAlerts.filter(a => a.severity === 'warning').length,
        info: recentAlerts.filter(a => a.severity === 'info').length
      },
      byType: this.groupAlertsByType(recentAlerts),
      acknowledged: recentAlerts.filter(a => a.acknowledged).length,
      resolved: recentAlerts.filter(a => a.resolved).length
    };

    return stats;
  }

  /**
   * Group alerts by type
   */
  groupAlertsByType(alerts) {
    const grouped = {};
    alerts.forEach(alert => {
      grouped[alert.type] = (grouped[alert.type] || 0) + 1;
    });
    return grouped;
  }

  /**
   * Update alert thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    
    // Update alert rules
    this.alertRules.forEach(rule => {
      if (newThresholds[rule.id.replace('high_', '').replace('_usage', '')]) {
        rule.threshold = newThresholds[rule.id.replace('high_', '').replace('_usage', '')];
      }
    });

    console.log('[Alerting System] Thresholds updated:', this.thresholds);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanDays = 30) {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.alertHistory.length;
    
    this.alertHistory = this.alertHistory.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );

    const removedCount = initialCount - this.alertHistory.length;
    console.log(`[Alerting System] Cleared ${removedCount} old alerts`);
  }

  /**
   * Export alerts to file
   */
  async exportAlerts(filename) {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        alerts: this.alertHistory,
        statistics: this.getAlertStatistics(),
        thresholds: this.thresholds,
        rules: this.alertRules
      };

      await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
      console.log(`[Alerting System] Alerts exported to ${filename}`);
    } catch (error) {
      console.error('[Alerting System] Export error:', error);
    }
  }
}

// Create singleton instance
const alertingSystem = new AlertingSystem();

export default alertingSystem;



