#!/usr/bin/env node

/**
 * CYBERSTREAMS ONLINE SMOKETEST
 * 
 * Denne smoketest er designet til at køre online i produktionslignende miljøer.
 * Den tester systemets kritiske funktioner i et miljø der spejler produktionen.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration for online testing
const ONLINE_BASE_URL = process.env.ONLINE_BASE_URL || process.env.PRODUCTION_URL || 'https://cyberstreams.dk';
const STAGING_BASE_URL = process.env.STAGING_BASE_URL || 'https://staging.cyberstreams.dk';
const TIMEOUT = 15000; // 15 seconds for online tests
const CRITICAL_THRESHOLD = 10000; // 10 seconds for critical online operations

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
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
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testName, status, duration, message = '') => {
  const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  const durationStr = duration ? ` (${duration.toFixed(2)}ms)` : '';
  
  log(`[${status}] ${testName}${durationStr}${message ? ': ' + message : ''}`, statusColor);
  
  results.tests.push({
    name: testName,
    status,
    duration,
    message
  });
  
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.warnings++;
};

// HTTP request helper with timeout and retry logic
const makeRequest = async (url, options = {}, retries = 3) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cyberstreams-Online-Smoketest/1.0',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && (error.name === 'AbortError' || error.code === 'ECONNRESET')) {
      log(`Retrying request to ${url} (${retries} retries left)`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return makeRequest(url, options, retries - 1);
    }
    
    throw error;
  }
};

// Test online connectivity
const testOnlineConnectivity = async (baseUrl, environment) => {
  log(`\n🌐 TESTING ${environment.toUpperCase()} CONNECTIVITY`, 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${baseUrl}/healthz`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      logTest(`${environment} Health Check`, 'PASS', duration, `Status: ${data.status}`);
    } else {
      logTest(`${environment} Health Check`, 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest(`${environment} Health Check`, 'FAIL', 0, error.message);
  }
};

// Test online API endpoints
const testOnlineAPIEndpoints = async (baseUrl, environment) => {
  log(`\n🔌 TESTING ${environment.toUpperCase()} API ENDPOINTS`, 'blue');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', critical: true },
    { path: '/api/stats', method: 'GET', critical: true },
    { path: '/api/threats', method: 'GET', critical: true },
    { path: '/api/pulse', method: 'GET', critical: true },
    { path: '/api/daily-pulse', method: 'GET', critical: false },
    { path: '/api/intel-scraper/status', method: 'GET', critical: true }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method
      });
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const status = endpoint.critical && duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
        logTest(`${endpoint.method} ${endpoint.path} (${environment})`, status, duration, 
          duration > CRITICAL_THRESHOLD ? 'Slow response' : `HTTP ${response.status}`);
      } else {
        logTest(`${endpoint.method} ${endpoint.path} (${environment})`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`${endpoint.method} ${endpoint.path} (${environment})`, 'FAIL', 0, error.message);
    }
  }
};

// Test online performance
const testOnlinePerformance = async (baseUrl, environment) => {
  log(`\n⚡ TESTING ${environment.toUpperCase()} PERFORMANCE`, 'blue');
  
  const performanceTests = [
    { path: '/api/stats', name: 'Stats Response Time' },
    { path: '/api/threats', name: 'Threats Response Time' },
    { path: '/api/pulse', name: 'Pulse Response Time' }
  ];
  
  for (const test of performanceTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${baseUrl}${test.path}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const status = duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
        logTest(`${test.name} (${environment})`, status, duration, 
          duration > CRITICAL_THRESHOLD ? 'Slow response' : 'Good performance');
      } else {
        logTest(`${test.name} (${environment})`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`${test.name} (${environment})`, 'FAIL', 0, error.message);
    }
  }
};

// Test online SSL/TLS
const testOnlineSSL = async (baseUrl, environment) => {
  log(`\n🔒 TESTING ${environment.toUpperCase()} SSL/TLS`, 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${baseUrl}/healthz`);
    const duration = performance.now() - startTime;
    
    if (response.ok && baseUrl.startsWith('https:')) {
      logTest(`SSL/TLS Certificate (${environment})`, 'PASS', duration, 'HTTPS connection successful');
    } else if (baseUrl.startsWith('https:')) {
      logTest(`SSL/TLS Certificate (${environment})`, 'WARN', duration, 'HTTPS connection issues');
    } else {
      logTest(`SSL/TLS Certificate (${environment})`, 'WARN', duration, 'HTTP connection (not secure)');
    }
  } catch (error) {
    logTest(`SSL/TLS Certificate (${environment})`, 'FAIL', 0, error.message);
  }
};

// Test online availability
const testOnlineAvailability = async (baseUrl, environment) => {
  log(`\n📊 TESTING ${environment.toUpperCase()} AVAILABILITY`, 'blue');
  
  const availabilityTests = 5;
  let successfulRequests = 0;
  let totalDuration = 0;
  
  for (let i = 0; i < availabilityTests; i++) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${baseUrl}/healthz`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        successfulRequests++;
        totalDuration += duration;
      }
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      // Request failed
    }
  }
  
  const availability = (successfulRequests / availabilityTests) * 100;
  const avgDuration = totalDuration / successfulRequests || 0;
  
  if (availability >= 95) {
    logTest(`Availability (${environment})`, 'PASS', avgDuration, `${availability.toFixed(1)}% uptime`);
  } else if (availability >= 80) {
    logTest(`Availability (${environment})`, 'WARN', avgDuration, `${availability.toFixed(1)}% uptime`);
  } else {
    logTest(`Availability (${environment})`, 'FAIL', avgDuration, `${availability.toFixed(1)}% uptime`);
  }
};

// Test online error handling
const testOnlineErrorHandling = async (baseUrl, environment) => {
  log(`\n🛡️ TESTING ${environment.toUpperCase()} ERROR HANDLING`, 'blue');
  
  // Test 404 handling
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${baseUrl}/api/non-existent-endpoint`);
    const duration = performance.now() - startTime;
    
    if (response.status === 404) {
      logTest(`404 Error Handling (${environment})`, 'PASS', duration, 'Proper 404 response');
    } else {
      logTest(`404 Error Handling (${environment})`, 'WARN', duration, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest(`404 Error Handling (${environment})`, 'FAIL', 0, error.message);
  }
  
  // Test rate limiting (if implemented)
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${baseUrl}/api/health`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      logTest(`Rate Limiting (${environment})`, 'PASS', duration, 'No rate limiting detected');
    } else if (response.status === 429) {
      logTest(`Rate Limiting (${environment})`, 'WARN', duration, 'Rate limiting active');
    } else {
      logTest(`Rate Limiting (${environment})`, 'WARN', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest(`Rate Limiting (${environment})`, 'FAIL', 0, error.message);
  }
};

// Test online monitoring endpoints
const testOnlineMonitoring = async (baseUrl, environment) => {
  log(`\n📈 TESTING ${environment.toUpperCase()} MONITORING`, 'blue');
  
  const monitoringEndpoints = [
    { path: '/healthz', name: 'Health Check' },
    { path: '/readyz', name: 'Readiness Check' },
    { path: '/api/health', name: 'API Health' }
  ];
  
  for (const endpoint of monitoringEndpoints) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${baseUrl}${endpoint.path}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(`${endpoint.name} (${environment})`, 'PASS', duration, 'Monitoring endpoint working');
      } else {
        logTest(`${endpoint.name} (${environment})`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`${endpoint.name} (${environment})`, 'FAIL', 0, error.message);
    }
  }
};

// Generate online report
const generateOnlineReport = () => {
  log('\n📊 ONLINE SMOKETEST REPORT', 'bold');
  log('=' .repeat(60), 'cyan');
  
  log(`\nTotal Tests: ${results.passed + results.failed + results.warnings}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  
  const successRate = ((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');
  
  // Show failed tests
  const failedTests = results.tests.filter(t => t.status === 'FAIL');
  if (failedTests.length > 0) {
    log('\n❌ FAILED TESTS:', 'red');
    failedTests.forEach(test => {
      log(`  - ${test.name}: ${test.message}`, 'red');
    });
  }
  
  // Show warnings
  const warningTests = results.tests.filter(t => t.status === 'WARN');
  if (warningTests.length > 0) {
    log('\n⚠️  WARNINGS:', 'yellow');
    warningTests.forEach(test => {
      log(`  - ${test.name}: ${test.message}`, 'yellow');
    });
  }
  
  // Online health assessment
  log('\n🏥 ONLINE HEALTH ASSESSMENT:', 'bold');
  if (successRate >= 95) {
    log('🟢 EXCELLENT - Online system is healthy and performing well', 'green');
  } else if (successRate >= 80) {
    log('🟡 GOOD - Online system is functional with minor issues', 'yellow');
  } else if (successRate >= 60) {
    log('🟠 FAIR - Online system has some issues that need attention', 'yellow');
  } else {
    log('🔴 POOR - Online system has critical issues requiring immediate attention', 'red');
  }
  
  log('\n' + '=' .repeat(60), 'cyan');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n🚨 ONLINE SMOKETEST FAILED - Critical online issues detected!', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  ONLINE SMOKETEST PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ ONLINE SMOKETEST PASSED - All online systems working!', 'green');
    process.exit(0);
  }
};

// Main execution
const runOnlineSmokeTest = async () => {
  log('🌐 CYBERSTREAMS ONLINE SMOKETEST STARTING', 'bold');
  log(`Production URL: ${ONLINE_BASE_URL}`, 'blue');
  log(`Staging URL: ${STAGING_BASE_URL}`, 'blue');
  log(`Timeout: ${TIMEOUT}ms per test`, 'blue');
  log(`Critical threshold: ${CRITICAL_THRESHOLD}ms`, 'blue');
  
  try {
    // Test production environment
    await testOnlineConnectivity(ONLINE_BASE_URL, 'production');
    await testOnlineAPIEndpoints(ONLINE_BASE_URL, 'production');
    await testOnlinePerformance(ONLINE_BASE_URL, 'production');
    await testOnlineSSL(ONLINE_BASE_URL, 'production');
    await testOnlineAvailability(ONLINE_BASE_URL, 'production');
    await testOnlineErrorHandling(ONLINE_BASE_URL, 'production');
    await testOnlineMonitoring(ONLINE_BASE_URL, 'production');
    
    // Test staging environment if different from production
    if (STAGING_BASE_URL !== ONLINE_BASE_URL) {
      await testOnlineConnectivity(STAGING_BASE_URL, 'staging');
      await testOnlineAPIEndpoints(STAGING_BASE_URL, 'staging');
      await testOnlinePerformance(STAGING_BASE_URL, 'staging');
      await testOnlineSSL(STAGING_BASE_URL, 'staging');
      await testOnlineAvailability(STAGING_BASE_URL, 'staging');
      await testOnlineErrorHandling(STAGING_BASE_URL, 'staging');
      await testOnlineMonitoring(STAGING_BASE_URL, 'staging');
    }
    
    generateOnlineReport();
  } catch (error) {
    log(`\n💥 ONLINE SMOKETEST CRASHED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run the online smoketest
runOnlineSmokeTest();


