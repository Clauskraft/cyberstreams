import { performance } from 'perf_hooks';
import crypto from 'crypto';

/**
 * MCP Performance Monitor
 * Advanced performance monitoring and optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      responses: new Map(),
      errors: new Map(),
      performance: new Map(),
      memory: new Map(),
      cpu: new Map()
    };
    this.thresholds = {
      responseTime: 1000, // 1 second
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cpuUsage: 80, // 80%
      errorRate: 5, // 5%
      throughput: 100 // 100 requests per second
    };
    this.performanceData = [];
    this.alertHandlers = [];
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    console.log('[Performance Monitor] Starting performance monitoring...');
    
    // Monitor memory usage
    setInterval(() => {
      this.collectMemoryMetrics();
    }, 5000); // Every 5 seconds

    // Monitor CPU usage
    setInterval(() => {
      this.collectCPUMetrics();
    }, 1000); // Every second

    // Monitor performance data
    setInterval(() => {
      this.analyzePerformance();
    }, 30000); // Every 30 seconds

    console.log('[Performance Monitor] Performance monitoring started');
  }

  /**
   * Start timing a request
   */
  startTiming(requestId, endpoint, method) {
    const startTime = performance.now();
    const timestamp = Date.now();

    this.metrics.requests.set(requestId, {
      endpoint,
      method,
      startTime,
      timestamp,
      status: 'pending'
    });

    return requestId;
  }

  /**
   * End timing a request
   */
  endTiming(requestId, statusCode, responseSize = 0) {
    const request = this.metrics.requests.get(requestId);
    if (!request) return;

    const endTime = performance.now();
    const duration = endTime - request.startTime;

    const response = {
      requestId,
      endpoint: request.endpoint,
      method: request.method,
      statusCode,
      duration,
      responseSize,
      timestamp: Date.now()
    };

    this.metrics.responses.set(requestId, response);
    this.metrics.requests.delete(requestId);

    // Check performance thresholds
    this.checkPerformanceThresholds(response);

    return response;
  }

  /**
   * Record an error
   */
  recordError(requestId, error, statusCode = 500) {
    const request = this.metrics.requests.get(requestId);
    const endpoint = request ? request.endpoint : 'unknown';

    const errorData = {
      requestId,
      endpoint,
      error: error.message,
      statusCode,
      timestamp: Date.now()
    };

    this.metrics.errors.set(requestId, errorData);
    this.metrics.requests.delete(requestId);

    // Check error rate thresholds
    this.checkErrorRateThresholds();
  }

  /**
   * Collect memory metrics
   */
  collectMemoryMetrics() {
    const memoryUsage = process.memoryUsage();
    const timestamp = Date.now();

    this.metrics.memory.set(timestamp, {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers,
      timestamp
    });

    // Keep only last 100 memory measurements
    if (this.metrics.memory.size > 100) {
      const oldestKey = this.metrics.memory.keys().next().value;
      this.metrics.memory.delete(oldestKey);
    }
  }

  /**
   * Collect CPU metrics
   */
  collectCPUMetrics() {
    const cpuUsage = process.cpuUsage();
    const timestamp = Date.now();

    this.metrics.cpu.set(timestamp, {
      user: cpuUsage.user,
      system: cpuUsage.system,
      timestamp
    });

    // Keep only last 100 CPU measurements
    if (this.metrics.cpu.size > 100) {
      const oldestKey = this.metrics.cpu.keys().next().value;
      this.metrics.cpu.delete(oldestKey);
    }
  }

  /**
   * Check performance thresholds
   */
  checkPerformanceThresholds(response) {
    const alerts = [];

    // Response time threshold
    if (response.duration > this.thresholds.responseTime) {
      alerts.push({
        type: 'slow_response',
        severity: 'warning',
        endpoint: response.endpoint,
        duration: response.duration,
        threshold: this.thresholds.responseTime,
        message: `Slow response detected: ${response.endpoint} took ${response.duration.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }

    // Response size threshold
    if (response.responseSize > 10 * 1024 * 1024) { // 10MB
      alerts.push({
        type: 'large_response',
        severity: 'info',
        endpoint: response.endpoint,
        size: response.responseSize,
        message: `Large response detected: ${response.endpoint} returned ${(response.responseSize / 1024 / 1024).toFixed(2)}MB`,
        timestamp: new Date().toISOString()
      });
    }

    // Notify alert handlers
    if (alerts.length > 0) {
      this.alertHandlers.forEach(handler => {
        try {
          handler(alerts);
        } catch (error) {
          console.error('[Performance Monitor] Alert handler error:', error);
        }
      });
    }
  }

  /**
   * Check error rate thresholds
   */
  checkErrorRateThresholds() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Count errors in last minute
    const recentErrors = Array.from(this.metrics.errors.values())
      .filter(error => error.timestamp > oneMinuteAgo);

    // Count total requests in last minute
    const recentResponses = Array.from(this.metrics.responses.values())
      .filter(response => response.timestamp > oneMinuteAgo);

    const totalRequests = recentErrors.length + recentResponses.length;
    const errorRate = totalRequests > 0 ? (recentErrors.length / totalRequests) * 100 : 0;

    if (errorRate > this.thresholds.errorRate) {
      const alerts = [{
        type: 'high_error_rate',
        severity: 'critical',
        errorRate: errorRate,
        threshold: this.thresholds.errorRate,
        message: `High error rate detected: ${errorRate.toFixed(2)}% errors in the last minute`,
        timestamp: new Date().toISOString()
      }];

      this.alertHandlers.forEach(handler => {
        try {
          handler(alerts);
        } catch (error) {
          console.error('[Performance Monitor] Alert handler error:', error);
        }
      });
    }
  }

  /**
   * Analyze performance data
   */
  analyzePerformance() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;

    // Get recent performance data
    const recentResponses = Array.from(this.metrics.responses.values())
      .filter(response => response.timestamp > fiveMinutesAgo);

    if (recentResponses.length === 0) return;

    // Calculate performance metrics
    const avgResponseTime = recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length;
    const maxResponseTime = Math.max(...recentResponses.map(r => r.duration));
    const minResponseTime = Math.min(...recentResponses.map(r => r.duration));
    const throughput = recentResponses.length / 5; // requests per second

    const performanceData = {
      timestamp: now,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      throughput,
      totalRequests: recentResponses.length,
      errorRate: this.calculateErrorRate(recentResponses)
    };

    this.performanceData.push(performanceData);

    // Keep only last 100 performance measurements
    if (this.performanceData.length > 100) {
      this.performanceData = this.performanceData.slice(-100);
    }

    // Check throughput threshold
    if (throughput > this.thresholds.throughput) {
      const alerts = [{
        type: 'high_throughput',
        severity: 'info',
        throughput: throughput,
        threshold: this.thresholds.throughput,
        message: `High throughput detected: ${throughput.toFixed(2)} requests per second`,
        timestamp: new Date().toISOString()
      }];

      this.alertHandlers.forEach(handler => {
        try {
          handler(alerts);
        } catch (error) {
          console.error('[Performance Monitor] Alert handler error:', error);
        }
      });
    }
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate(responses) {
    const errors = responses.filter(r => r.statusCode >= 400).length;
    return responses.length > 0 ? (errors / responses.length) * 100 : 0;
  }

  /**
   * Add alert handler
   */
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 300000;

    // Recent data
    const recentResponses = Array.from(this.metrics.responses.values())
      .filter(r => r.timestamp > oneMinuteAgo);
    const recentErrors = Array.from(this.metrics.errors.values())
      .filter(e => e.timestamp > oneMinuteAgo);

    // Calculate current metrics
    const currentMetrics = {
      requests: {
        total: recentResponses.length + recentErrors.length,
        successful: recentResponses.filter(r => r.statusCode < 400).length,
        failed: recentErrors.length + recentResponses.filter(r => r.statusCode >= 400).length,
        errorRate: this.calculateErrorRate(recentResponses)
      },
      performance: {
        avgResponseTime: recentResponses.length > 0 ? 
          recentResponses.reduce((sum, r) => sum + r.duration, 0) / recentResponses.length : 0,
        maxResponseTime: recentResponses.length > 0 ? 
          Math.max(...recentResponses.map(r => r.duration)) : 0,
        minResponseTime: recentResponses.length > 0 ? 
          Math.min(...recentResponses.map(r => r.duration)) : 0,
        throughput: (recentResponses.length + recentErrors.length) / 60 // requests per second
      },
      memory: this.getCurrentMemoryUsage(),
      potential: {
        trends: this.analyzeTrends(),
        bottlenecks: this.identifyBottlenecks(),
        recommendations: this.generateRecommendations()
      }
    };

    return {
      current: currentMetrics,
      historical: this.performanceData.slice(-20), // Last 20 measurements
      thresholds: this.thresholds,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get current memory usage
   */
  getCurrentMemoryUsage() {
    const memoryEntries = Array.from(this.metrics.memory.values());
    if (memoryEntries.length === 0) return null;

    const latest = memoryEntries[memoryEntries.length - 1];
    return {
      rss: latest.rss,
      heapTotal: latest.heapTotal,
      heapUsed: latest.heapUsed,
      external: latest.external,
      arrayBuffers: latest.arrayBuffers,
      usage: (latest.heapUsed / latest.heapTotal) * 100
    };
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    if (this.performanceData.length < 5) return [];

    const trends = [];
    const recent = this.performanceData.slice(-5);
    const previous = this.performanceData.slice(-10, -5);

    if (previous.length > 0) {
      const recentAvg = recent.reduce((sum, p) => sum + p.avgResponseTime, 0) / recent.length;
      const previousAvg = previous.reduce((sum, p) => sum + p.avgResponseTime, 0) / previous.length;

      if (recentAvg > previousAvg * 1.2) {
        trends.push({
          type: 'degradation',
          metric: 'response_time',
          change: ((recentAvg - previousAvg) / previousAvg) * 100,
          message: 'Response time is degrading'
        });
      } else if (recentAvg < previousAvg * 0.8) {
        trends.push({
          type: 'improvement',
          metric: 'response_time',
          change: ((previousAvg - recentAvg) / previousAvg) * 100,
          message: 'Response time is improving'
        });
      }
    }

    return trends;
  }

  /**
   * Identify performance bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];
    const recent = this.performanceData.slice(-5);

    if (recent.length > 0) {
      const avgResponseTime = recent.reduce((sum, p) => sum + p.avgResponseTime, 0) / recent.length;
      const avgErrorRate = recent.reduce((sum, p) => sum + p.errorRate, 0) / recent.length;

      if (avgResponseTime > 500) {
        bottlenecks.push({
          type: 'slow_response',
          severity: 'medium',
          description: 'Average response time is above 500ms',
          recommendation: 'Optimize database queries and reduce processing time'
        });
      }

      if (avgErrorRate > 5) {
        bottlenecks.push({
          type: 'high_error_rate',
          severity: 'high',
          description: 'Error rate is above 5%',
          recommendation: 'Investigate and fix error sources'
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const recent = this.performanceData.slice(-5);

    if (recent.length > 0) {
      const avgResponseTime = recent.reduce((sum, p) => sum + p.avgResponseTime, 0) / recent.length;
      const avgThroughput = recent.reduce((sum, p) => sum + p.throughput, 0) / recent.length;

      if (avgResponseTime > 1000) {
        recommendations.push({
          priority: 'high',
          category: 'performance',
          recommendation: 'Implement caching to reduce response times',
          impact: 'High'
        });
      }

      if (avgThroughput > 100) {
        recommendations.push({
          priority: 'medium',
          category: 'scalability',
          recommendation: 'Consider load balancing for high throughput',
          impact: 'Medium'
        });
      }
    }

    return recommendations;
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('[Performance Monitor] Thresholds updated:', this.thresholds);
  }

  /**
   * Clear old data
   */
  clearOldData(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);

    // Clear old responses
    for (const [key, response] of this.metrics.responses.entries()) {
      if (response.timestamp < cutoffTime) {
        this.metrics.responses.delete(key);
      }
    }

    // Clear old errors
    for (const [key, error] of this.metrics.errors.entries()) {
      if (error.timestamp < cutoffTime) {
        this.metrics.errors.delete(key);
      }
    }

    console.log('[Performance Monitor] Old data cleared');
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;


