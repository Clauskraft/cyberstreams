import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

/**
 * MCP Security Monitor
 * Real-time security monitoring and alerting system
 */

class SecurityMonitor {
  constructor() {
    this.suspiciousActivities = new Map();
    this.failedAttempts = new Map();
    this.blockedIPs = new Set();
    this.securityEvents = [];
    this.alertThresholds = {
      maxFailedAttempts: 5,
      maxSuspiciousRequests: 10,
      maxRequestsPerMinute: 100,
      blockDuration: 60 * 60 * 1000, // 1 hour
    };
    this.alertHandlers = [];
  }

  /**
   * Log security event
   */
  logSecurityEvent(event) {
    const securityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: event.type,
      severity: event.severity || 'medium',
      source: event.source || 'unknown',
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      riskScore: this.calculateRiskScore(event),
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events in memory
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Check for suspicious patterns
    this.analyzeSecurityEvent(securityEvent);

    // Trigger alerts if necessary
    this.checkAlertThresholds(securityEvent);

    console.log(`[Security Monitor] ${JSON.stringify(securityEvent)}`);
  }

  /**
   * Calculate risk score for security event
   */
  calculateRiskScore(event) {
    let score = 0;

    // Base score by event type
    const typeScores = {
      'failed_login': 10,
      'suspicious_request': 15,
      'rate_limit_exceeded': 20,
      'unauthorized_access': 25,
      'malicious_payload': 30,
      'sql_injection': 35,
      'xss_attempt': 35,
      'brute_force': 40,
      'ddos_attempt': 45,
    };

    score += typeScores[event.type] || 5;

    // Increase score for repeated attempts
    if (event.ip) {
      const ipEvents = this.securityEvents.filter(e => e.ip === event.ip);
      score += Math.min(ipEvents.length * 2, 20);
    }

    // Increase score for suspicious patterns
    if (event.details?.suspiciousPatterns) {
      score += event.details.suspiciousPatterns.length * 5;
    }

    return Math.min(score, 100);
  }

  /**
   * Analyze security event for suspicious patterns
   */
  analyzeSecurityEvent(event) {
    const suspiciousPatterns = [
      /script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /exec\s*\(/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
    ];

    const detectedPatterns = [];
    const eventData = JSON.stringify(event);

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(eventData)) {
        detectedPatterns.push(pattern.toString());
      }
    }

    if (detectedPatterns.length > 0) {
      this.logSecurityEvent({
        type: 'suspicious_pattern_detected',
        severity: 'high',
        ip: event.ip,
        details: {
          detectedPatterns,
          originalEvent: event,
        },
      });
    }
  }

  /**
   * Check alert thresholds and trigger alerts
   */
  checkAlertThresholds(event) {
    if (!event.ip) return;

    // Check failed attempts
    const failedAttempts = this.getFailedAttempts(event.ip);
    if (failedAttempts >= this.alertThresholds.maxFailedAttempts) {
      this.triggerAlert({
        type: 'high_failed_attempts',
        severity: 'high',
        ip: event.ip,
        details: {
          failedAttempts,
          threshold: this.alertThresholds.maxFailedAttempts,
        },
      });
      this.blockIP(event.ip);
    }

    // Check suspicious requests
    const suspiciousRequests = this.getSuspiciousRequests(event.ip);
    if (suspiciousRequests >= this.alertThresholds.maxSuspiciousRequests) {
      this.triggerAlert({
        type: 'high_suspicious_requests',
        severity: 'critical',
        ip: event.ip,
        details: {
          suspiciousRequests,
          threshold: this.alertThresholds.maxSuspiciousRequests,
        },
      });
      this.blockIP(event.ip);
    }

    // Check rate limiting
    const requestsPerMinute = this.getRequestsPerMinute(event.ip);
    if (requestsPerMinute >= this.alertThresholds.maxRequestsPerMinute) {
      this.triggerAlert({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        ip: event.ip,
        details: {
          requestsPerMinute,
          threshold: this.alertThresholds.maxRequestsPerMinute,
        },
      });
    }
  }

  /**
   * Get failed attempts for IP
   */
  getFailedAttempts(ip) {
    const recentEvents = this.securityEvents.filter(
      e => e.ip === ip && 
      e.timestamp > new Date(Date.now() - 15 * 60 * 1000).toISOString() &&
      e.type === 'failed_login'
    );
    return recentEvents.length;
  }

  /**
   * Get suspicious requests for IP
   */
  getSuspiciousRequests(ip) {
    const recentEvents = this.securityEvents.filter(
      e => e.ip === ip && 
      e.timestamp > new Date(Date.now() - 60 * 60 * 1000).toISOString() &&
      e.type === 'suspicious_request'
    );
    return recentEvents.length;
  }

  /**
   * Get requests per minute for IP
   */
  getRequestsPerMinute(ip) {
    const recentEvents = this.securityEvents.filter(
      e => e.ip === ip && 
      e.timestamp > new Date(Date.now() - 60 * 1000).toISOString()
    );
    return recentEvents.length;
  }

  /**
   * Block IP address
   */
  blockIP(ip) {
    this.blockedIPs.add(ip);
    console.log(`[Security Monitor] Blocked IP: ${ip}`);

    // Auto-unblock after block duration
    setTimeout(() => {
      this.blockedIPs.delete(ip);
      console.log(`[Security Monitor] Unblocked IP: ${ip}`);
    }, this.alertThresholds.blockDuration);
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  /**
   * Trigger security alert
   */
  triggerAlert(alert) {
    const securityAlert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...alert,
    };

    console.log(`[Security Alert] ${JSON.stringify(securityAlert)}`);

    // Notify alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(securityAlert);
      } catch (error) {
        console.error(`[Security Monitor] Alert handler error:`, error);
      }
    });
  }

  /**
   * Add alert handler
   */
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics() {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentEvents = this.securityEvents.filter(
      e => new Date(e.timestamp) > last24Hours
    );

    const metrics = {
      totalEvents: this.securityEvents.length,
      eventsLast24Hours: recentEvents.length,
      blockedIPs: this.blockedIPs.size,
      topThreatTypes: this.getTopThreatTypes(recentEvents),
      topSourceIPs: this.getTopSourceIPs(recentEvents),
      riskDistribution: this.getRiskDistribution(recentEvents),
      alertSummary: this.getAlertSummary(recentEvents),
    };

    return metrics;
  }

  /**
   * Get top threat types
   */
  getTopThreatTypes(events) {
    const threatTypes = {};
    events.forEach(event => {
      threatTypes[event.type] = (threatTypes[event.type] || 0) + 1;
    });

    return Object.entries(threatTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([type, count]) => ({ type, count }));
  }

  /**
   * Get top source IPs
   */
  getTopSourceIPs(events) {
    const sourceIPs = {};
    events.forEach(event => {
      if (event.ip) {
        sourceIPs[event.ip] = (sourceIPs[event.ip] || 0) + 1;
      }
    });

    return Object.entries(sourceIPs)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }

  /**
   * Get risk distribution
   */
  getRiskDistribution(events) {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    events.forEach(event => {
      if (event.riskScore < 25) distribution.low++;
      else if (event.riskScore < 50) distribution.medium++;
      else if (event.riskScore < 75) distribution.high++;
      else distribution.critical++;
    });
    return distribution;
  }

  /**
   * Get alert summary
   */
  getAlertSummary(events) {
    const alerts = events.filter(e => e.severity === 'high' || e.severity === 'critical');
    return {
      totalAlerts: alerts.length,
      highSeverity: alerts.filter(e => e.severity === 'high').length,
      criticalSeverity: alerts.filter(e => e.severity === 'critical').length,
    };
  }

  /**
   * Export security events to file
   */
  async exportSecurityEvents(filename) {
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        totalEvents: this.securityEvents.length,
        events: this.securityEvents,
        metrics: this.getSecurityMetrics(),
      };

      await fs.writeFile(filename, JSON.stringify(exportData, null, 2));
      console.log(`[Security Monitor] Exported security events to ${filename}`);
    } catch (error) {
      console.error(`[Security Monitor] Export error:`, error);
    }
  }

  /**
   * Clear old security events
   */
  clearOldEvents(olderThanDays = 30) {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    const initialCount = this.securityEvents.length;
    
    this.securityEvents = this.securityEvents.filter(
      event => new Date(event.timestamp) > cutoffDate
    );

    const removedCount = initialCount - this.securityEvents.length;
    console.log(`[Security Monitor] Cleared ${removedCount} old security events`);
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

export default securityMonitor;


