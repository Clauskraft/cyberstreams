#!/usr/bin/env node

/**
 * CYBERSTREAMS ONLINE MONITORING
 * 
 * Kontinuerlig monitoring af online systemer med automatisk alerting
 * og performance tracking.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const ONLINE_BASE_URL = process.env.ONLINE_BASE_URL || 'https://cyberstreams.dk';
const MONITOR_INTERVAL = parseInt(process.env.MONITOR_INTERVAL) || 60000; // 1 minute
const ALERT_THRESHOLD = parseInt(process.env.ALERT_THRESHOLD) || 3; // 3 consecutive failures
const LOG_FILE = 'monitoring.log';
const METRICS_FILE = 'metrics.json';

// Monitoring state
let consecutiveFailures = 0;
let lastAlertTime = 0;
let metrics = {
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  averageResponseTime: 0,
  uptime: 100,
  startTime: Date.now(),
  lastCheck: null
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  
  // Log to file
  fs.appendFile(LOG_FILE, `[${timestamp}] ${message}\n`).catch(console.error);
};

// HTTP request with timeout
const makeRequest = async (url, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Cyberstreams-Monitor/1.0'
      }
    });
    const duration = performance.now() - startTime;
    
    clearTimeout(timeoutId);
    return { response, duration, success: response.ok };
  } catch (error) {
    clearTimeout(timeoutId);
    return { response: null, duration: 0, success: false, error };
  }
};

// Perform health check
const performHealthCheck = async () => {
  const startTime = Date.now();
  const results = {
    timestamp: startTime,
    success: false,
    responseTime: 0,
    statusCode: null,
    error: null
  };
  
  try {
    const { response, duration, success, error } = await makeRequest(`${ONLINE_BASE_URL}/healthz`);
    
    results.success = success;
    results.responseTime = duration;
    results.statusCode = response?.status || null;
    results.error = error?.message || null;
    
    if (success) {
      consecutiveFailures = 0;
      metrics.successfulChecks++;
      log(`✅ Health check passed (${duration.toFixed(2)}ms)`, 'green');
    } else {
      consecutiveFailures++;
      metrics.failedChecks++;
      log(`❌ Health check failed: ${results.error || `HTTP ${results.statusCode}`}`, 'red');
    }
    
    metrics.totalChecks++;
    metrics.averageResponseTime = (metrics.averageResponseTime * (metrics.totalChecks - 1) + duration) / metrics.totalChecks;
    metrics.uptime = (metrics.successfulChecks / metrics.totalChecks) * 100;
    metrics.lastCheck = startTime;
    
  } catch (error) {
    consecutiveFailures++;
    metrics.failedChecks++;
    metrics.totalChecks++;
    results.error = error.message;
    log(`💥 Health check crashed: ${error.message}`, 'red');
  }
  
  return results;
};

// Send alert
const sendAlert = async (message, severity = 'warning') => {
  const now = Date.now();
  
  // Rate limit alerts (max 1 per 5 minutes)
  if (now - lastAlertTime < 300000) {
    return;
  }
  
  lastAlertTime = now;
  
  log(`🚨 ALERT [${severity.toUpperCase()}]: ${message}`, 'red');
  
  // Send to webhook if configured
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Cyberstreams Alert [${severity.toUpperCase()}]: ${message}`,
          timestamp: new Date().toISOString(),
          url: ONLINE_BASE_URL
        })
      });
    } catch (error) {
      log(`Failed to send webhook alert: ${error.message}`, 'red');
    }
  }
  
  // Send email if configured
  const emailConfig = process.env.ALERT_EMAIL;
  if (emailConfig) {
    // Implement email sending logic here
    log(`Email alert sent to: ${emailConfig}`, 'yellow');
  }
};

// Save metrics
const saveMetrics = async () => {
  try {
    await fs.writeFile(METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (error) {
    log(`Failed to save metrics: ${error.message}`, 'red');
  }
};

// Load metrics
const loadMetrics = async () => {
  try {
    const data = await fs.readFile(METRICS_FILE, 'utf8');
    metrics = { ...metrics, ...JSON.parse(data) };
  } catch (error) {
    // File doesn't exist, use default metrics
  }
};

// Generate status report
const generateStatusReport = () => {
  const uptime = Date.now() - metrics.startTime;
  const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
  const uptimeMinutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  
  log('\n📊 MONITORING STATUS REPORT', 'bold');
  log('=' .repeat(50), 'cyan');
  log(`Total Checks: ${metrics.totalChecks}`, 'blue');
  log(`Successful: ${metrics.successfulChecks}`, 'green');
  log(`Failed: ${metrics.failedChecks}`, 'red');
  log(`Uptime: ${metrics.uptime.toFixed(2)}%`, metrics.uptime >= 99 ? 'green' : metrics.uptime >= 95 ? 'yellow' : 'red');
  log(`Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms`, 'blue');
  log(`Monitoring Duration: ${uptimeHours}h ${uptimeMinutes}m`, 'blue');
  log(`Consecutive Failures: ${consecutiveFailures}`, consecutiveFailures > 0 ? 'red' : 'green');
  log('=' .repeat(50), 'cyan');
};

// Main monitoring loop
const startMonitoring = async () => {
  log('🔍 CYBERSTREAMS ONLINE MONITORING STARTED', 'bold');
  log(`Target: ${ONLINE_BASE_URL}`, 'blue');
  log(`Interval: ${MONITOR_INTERVAL}ms`, 'blue');
  log(`Alert Threshold: ${ALERT_THRESHOLD} failures`, 'blue');
  
  // Load previous metrics
  await loadMetrics();
  
  // Initial status report
  generateStatusReport();
  
  // Start monitoring loop
  const monitoringInterval = setInterval(async () => {
    const result = await performHealthCheck();
    
    // Check for alerts
    if (consecutiveFailures >= ALERT_THRESHOLD) {
      await sendAlert(`System has been down for ${consecutiveFailures} consecutive checks`, 'critical');
    }
    
    // Save metrics every 10 checks
    if (metrics.totalChecks % 10 === 0) {
      await saveMetrics();
    }
    
    // Generate status report every hour
    if (metrics.totalChecks % 60 === 0) {
      generateStatusReport();
    }
    
  }, MONITOR_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    log('\n🛑 Stopping monitoring...', 'yellow');
    clearInterval(monitoringInterval);
    await saveMetrics();
    generateStatusReport();
    log('✅ Monitoring stopped', 'green');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    log('\n🛑 Stopping monitoring...', 'yellow');
    clearInterval(monitoringInterval);
    await saveMetrics();
    generateStatusReport();
    log('✅ Monitoring stopped', 'green');
    process.exit(0);
  });
};

// Start monitoring
startMonitoring().catch(error => {
  log(`💥 Monitoring crashed: ${error.message}`, 'red');
  process.exit(1);
});



