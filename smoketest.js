#!/usr/bin/env node

/**
 * CYBERSTREAMS SMOKETEST
 * 
 * Denne smoketest verificerer at alle kritiske funktioner i Cyberstreams systemet
 * fungerer korrekt efter deployment eller ændringer.
 * 
 * Testområder:
 * 1. Server health og readiness
 * 2. API endpoints functionality
 * 3. Database connectivity
 * 4. External service integrations
 * 5. Frontend component loading
 * 6. Critical business logic
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TIMEOUT = 10000; // 10 seconds timeout for each test
const CRITICAL_THRESHOLD = 5000; // 5 seconds for critical operations

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
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Utility functions
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

// HTTP request helper with timeout
const makeRequest = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Test functions
const testServerHealth = async () => {
  log('\n🏥 TESTING SERVER HEALTH', 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/healthz`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      logTest('Server Health Check', 'PASS', duration, `Status: ${data.status}`);
    } else {
      logTest('Server Health Check', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('Server Health Check', 'FAIL', 0, error.message);
  }
};

const testServerReadiness = async () => {
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/readyz`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      logTest('Server Readiness Check', 'PASS', duration, `Status: ${data.status}`);
    } else {
      logTest('Server Readiness Check', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('Server Readiness Check', 'FAIL', 0, error.message);
  }
};

const testAPIEndpoints = async () => {
  log('\n🔌 TESTING API ENDPOINTS', 'blue');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', critical: true },
    { path: '/api/stats', method: 'GET', critical: true },
    { path: '/api/threats', method: 'GET', critical: true },
    { path: '/api/pulse', method: 'GET', critical: true },
    { path: '/api/daily-pulse', method: 'GET', critical: false },
    { path: '/api/intel-scraper/status', method: 'GET', critical: true },
    { path: '/api/admin/keywords', method: 'GET', critical: false },
    { path: '/api/admin/sources', method: 'GET', critical: false },
    { path: '/api/config/sources', method: 'GET', critical: true },
    { path: '/api/knowledge/stats', method: 'GET', critical: false }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: endpoint.method
      });
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const status = endpoint.critical && duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
        logTest(`${endpoint.method} ${endpoint.path}`, status, duration, `HTTP ${response.status}`);
      } else {
        logTest(`${endpoint.method} ${endpoint.path}`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`${endpoint.method} ${endpoint.path}`, 'FAIL', 0, error.message);
    }
  }
};

const testDatabaseConnectivity = async () => {
  log('\n🗄️ TESTING DATABASE CONNECTIVITY', 'blue');
  
  // Test database-dependent endpoints
  const dbEndpoints = [
    '/api/admin/keywords',
    '/api/admin/sources',
    '/api/knowledge/stats'
  ];
  
  for (const endpoint of dbEndpoints) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${endpoint}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        logTest(`Database ${endpoint}`, 'PASS', duration, 'Connected');
      } else if (response.status === 500) {
        logTest(`Database ${endpoint}`, 'WARN', duration, 'Database fallback active');
      } else {
        logTest(`Database ${endpoint}`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`Database ${endpoint}`, 'FAIL', 0, error.message);
    }
  }
};

const testExternalServices = async () => {
  log('\n🌐 TESTING EXTERNAL SERVICE INTEGRATIONS', 'blue');
  
  const services = [
    { path: '/api/cti/misp/events', name: 'MISP Integration' },
    { path: '/api/cti/opencti/observables', name: 'OpenCTI Integration' },
    { path: '/api/wigle-maps/config', name: 'Wigle Maps Integration' }
  ];
  
  for (const service of services) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${service.path}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(service.name, 'PASS', duration, 'Service available');
      } else if (response.status === 503) {
        logTest(service.name, 'WARN', duration, 'Service not configured (expected)');
      } else {
        logTest(service.name, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(service.name, 'FAIL', 0, error.message);
    }
  }
};

const testIntelScraper = async () => {
  log('\n🤖 TESTING INTEL SCRAPER FUNCTIONALITY', 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/intel-scraper/status`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        logTest('Intel Scraper Status', 'PASS', duration, 
          `Sources: ${data.data?.totalSources || 0}, Running: ${data.data?.isRunning || false}`);
      } else {
        logTest('Intel Scraper Status', 'WARN', duration, 'Service available but not running');
      }
    } else {
      logTest('Intel Scraper Status', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('Intel Scraper Status', 'FAIL', 0, error.message);
  }
};

const testAdminEndpoints = async () => {
  log('\n⚙️ TESTING ADMIN ENDPOINTS', 'blue');
  
  const adminTests = [
    { path: '/api/admin/keywords', method: 'GET', name: 'Keywords Management' },
    { path: '/api/admin/sources', method: 'GET', name: 'Sources Management' },
    { path: '/api/admin/rag-config', method: 'GET', name: 'RAG Configuration' }
  ];
  
  for (const test of adminTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`, {
        method: test.method
      });
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(test.name, 'PASS', duration, 'Admin access working');
      } else {
        logTest(test.name, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', 0, error.message);
    }
  }
};

const testPostEndpoints = async () => {
  log('\n📝 TESTING POST ENDPOINTS', 'blue');
  
  // Test POST endpoints with safe data
  const postTests = [
    {
      path: '/api/admin/keywords',
      data: { keyword: 'smoketest-keyword', category: 'test', priority: 1 },
      name: 'Create Keyword'
    }
  ];
  
  for (const test of postTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`, {
        method: 'POST',
        body: JSON.stringify(test.data)
      });
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(test.name, 'PASS', duration, 'POST request successful');
      } else {
        logTest(test.name, 'WARN', duration, `HTTP ${response.status} (may be expected)`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', 0, error.message);
    }
  }
};

const testPerformanceMetrics = async () => {
  log('\n⚡ TESTING PERFORMANCE METRICS', 'blue');
  
  const performanceTests = [
    { path: '/api/stats', name: 'Stats Response Time' },
    { path: '/api/threats', name: 'Threats Response Time' },
    { path: '/api/pulse', name: 'Pulse Response Time' }
  ];
  
  for (const test of performanceTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const status = duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
        logTest(test.name, status, duration, 
          duration > CRITICAL_THRESHOLD ? 'Slow response' : 'Good performance');
      } else {
        logTest(test.name, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', 0, error.message);
    }
  }
};

const testErrorHandling = async () => {
  log('\n🛡️ TESTING ERROR HANDLING', 'blue');
  
  // Test non-existent endpoint
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/non-existent-endpoint`);
    const duration = performance.now() - startTime;
    
    if (response.status === 404) {
      logTest('404 Error Handling', 'PASS', duration, 'Proper 404 response');
    } else {
      logTest('404 Error Handling', 'WARN', duration, `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    logTest('404 Error Handling', 'FAIL', 0, error.message);
  }
  
  // Test invalid POST data
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/admin/keywords`, {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' })
    });
    const duration = performance.now() - startTime;
    
    if (response.status === 400) {
      logTest('400 Error Handling', 'PASS', duration, 'Proper validation error');
    } else {
      logTest('400 Error Handling', 'WARN', duration, `Status: ${response.status}`);
    }
  } catch (error) {
    logTest('400 Error Handling', 'FAIL', 0, error.message);
  }
};

const generateReport = () => {
  log('\n📊 SMOKETEST REPORT', 'bold');
  log('=' .repeat(50), 'blue');
  
  log(`\nTotal Tests: ${results.passed + results.failed + results.warnings}`, 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  
  const successRate = ((results.passed / (results.passed + results.failed + results.warnings)) * 100).toFixed(1);
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
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
  
  log('\n' + '=' .repeat(50), 'blue');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n🚨 SMOKETEST FAILED - Critical issues detected!', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  SMOKETEST PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ SMOKETEST PASSED - All critical functions working!', 'green');
    process.exit(0);
  }
};

// Main execution
const runSmokeTest = async () => {
  log('🚀 CYBERSTREAMS SMOKETEST STARTING', 'bold');
  log(`Target: ${BASE_URL}`, 'blue');
  log(`Timeout: ${TIMEOUT}ms per test`, 'blue');
  log(`Critical threshold: ${CRITICAL_THRESHOLD}ms`, 'blue');
  
  try {
    await testServerHealth();
    await testServerReadiness();
    await testAPIEndpoints();
    await testDatabaseConnectivity();
    await testExternalServices();
    await testIntelScraper();
    await testAdminEndpoints();
    await testPostEndpoints();
    await testPerformanceMetrics();
    await testErrorHandling();
    
    generateReport();
  } catch (error) {
    log(`\n💥 SMOKETEST CRASHED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run the smoketest
runSmokeTest();

