#!/usr/bin/env node

/**
 * CYBERSTREAMS QUICK SMOKETEST
 * 
 * En hurtig smoketest der tester de mest kritiske funktioner
 * på under 30 sekunder. Perfekt til CI/CD pipelines og
 * hurtige health checks.
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const QUICK_TIMEOUT = 5000; // 5 seconds timeout for quick tests

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testName, success, duration, message = '') => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  const statusColor = success ? 'green' : 'red';
  const durationStr = duration ? ` (${duration.toFixed(2)}ms)` : '';
  
  log(`${status} ${testName}${durationStr}${message ? ': ' + message : ''}`, statusColor);
};

// Quick test function
const quickTest = async (url, testName, method = 'GET', body = null) => {
  try {
    const startTime = performance.now();
    const response = await fetch(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(QUICK_TIMEOUT)
    });
    const duration = performance.now() - startTime;
    
    const success = response.ok || response.status === 503; // 503 is OK for unconfigured services
    logTest(testName, success, duration, `HTTP ${response.status}`);
    return success;
  } catch (error) {
    logTest(testName, false, 0, error.message);
    return false;
  }
};

// Main quick smoketest
const runQuickSmokeTest = async () => {
  log('⚡ CYBERSTREAMS QUICK SMOKETEST', 'bold');
  log(`Target: ${BASE_URL}`, 'blue');
  log(`Timeout: ${QUICK_TIMEOUT}ms per test`, 'blue');
  
  const startTime = performance.now();
  let passedTests = 0;
  let totalTests = 0;
  
  // Critical health checks
  log('\n🏥 CRITICAL HEALTH CHECKS:', 'blue');
  totalTests += 2;
  if (await quickTest(`${BASE_URL}/healthz`, 'Server Health')) passedTests++;
  if (await quickTest(`${BASE_URL}/readyz`, 'Server Readiness')) passedTests++;
  
  // Essential API endpoints
  log('\n🔌 ESSENTIAL API ENDPOINTS:', 'blue');
  totalTests += 4;
  if (await quickTest(`${BASE_URL}/api/health`, 'API Health')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/stats`, 'API Stats')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/threats`, 'Threats API')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/pulse`, 'Pulse API')) passedTests++;
  
  // Database connectivity
  log('\n🗄️ DATABASE CONNECTIVITY:', 'blue');
  totalTests += 2;
  if (await quickTest(`${BASE_URL}/api/admin/keywords`, 'Keywords DB')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/config/sources`, 'Sources DB')) passedTests++;
  
  // Intel Scraper
  log('\n🤖 INTEL SCRAPER:', 'blue');
  totalTests += 1;
  if (await quickTest(`${BASE_URL}/api/intel-scraper/status`, 'Scraper Status')) passedTests++;
  
  // External services (optional)
  log('\n🌐 EXTERNAL SERVICES (Optional):', 'blue');
  totalTests += 3;
  if (await quickTest(`${BASE_URL}/api/cti/misp/events`, 'MISP Integration')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/cti/opencti/observables`, 'OpenCTI Integration')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/wigle-maps/config`, 'Wigle Maps Integration')) passedTests++;
  
  // MCP servers (optional)
  log('\n🔗 MCP SERVERS (Optional):', 'blue');
  totalTests += 2;
  if (await quickTest(`${BASE_URL}/api/mcp/servers`, 'MCP Servers List')) passedTests++;
  if (await quickTest(`${BASE_URL}/api/mcp/test`, 'MCP Test Endpoint')) passedTests++;
  
  // Generate quick report
  const totalDuration = performance.now() - startTime;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  log('\n📊 QUICK SMOKETEST REPORT:', 'bold');
  log(`Total Tests: ${totalTests}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${totalTests - passedTests}`, 'red');
  log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`, 'blue');
  log(`🎯 Success Rate: ${successRate}%`, 
    successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // System health assessment
  log('\n🏥 SYSTEM HEALTH:', 'bold');
  if (successRate >= 90) {
    log('🟢 EXCELLENT - System is healthy and ready!', 'green');
  } else if (successRate >= 80) {
    log('🟡 GOOD - System is functional with minor issues', 'yellow');
  } else if (successRate >= 60) {
    log('🟠 FAIR - System has some issues that need attention', 'yellow');
  } else {
    log('🔴 POOR - System has critical issues requiring immediate attention', 'red');
  }
  
  // Exit with appropriate code
  if (passedTests === totalTests) {
    log('\n✅ QUICK SMOKETEST PASSED - All critical functions working!', 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  QUICK SMOKETEST FAILED - ${totalTests - passedTests} test(s) failed`, 'yellow');
    process.exit(1);
  }
};

// Run the quick smoketest
runQuickSmokeTest().catch(error => {
  log(`\n💥 QUICK SMOKETEST CRASHED: ${error.message}`, 'red');
  process.exit(1);
});
