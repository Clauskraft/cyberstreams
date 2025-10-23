#!/usr/bin/env node

/**
 * CYBERSTREAMS MCP INTEGRATION TEST
 * 
 * Integration test der tester hele MCP systemet
 * inklusive servere, client og kommunikation.
 */

import { getMCPClient } from './lib/mcp-client.js';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

// Test configuration
const TEST_CONFIG = {
  coreServerUrl: 'http://localhost:3003',
  timeout: 10000,
  retries: 3
};

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

// Test helper functions
const makeRequest = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Cyberstreams-MCP-Integration-Test/1.0',
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
const testMCPServerAvailability = async () => {
  log('\n🔍 TESTING MCP SERVER AVAILABILITY', 'blue');
  
  const servers = [
    { name: 'Core Server', url: 'http://localhost:3003' },
    { name: 'Threat Intel Server', url: 'http://localhost:3004' },
    { name: 'WiFi Analysis Server', url: 'http://localhost:3005' }
  ];
  
  for (const server of servers) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${server.url}/health`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(`${server.name} Health Check`, 'PASS', duration, 'Server responding');
      } else {
        logTest(`${server.name} Health Check`, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(`${server.name} Health Check`, 'FAIL', 0, error.message);
    }
  }
};

const testMCPClientConnection = async () => {
  log('\n🔗 TESTING MCP CLIENT CONNECTION', 'blue');
  
  try {
    const startTime = performance.now();
    const mcpClient = getMCPClient(TEST_CONFIG);
    const connected = await mcpClient.connect();
    const duration = performance.now() - startTime;
    
    if (connected) {
      logTest('MCP Client Connection', 'PASS', duration, 'Successfully connected');
      
      // Test client functionality
      try {
        const startTime2 = performance.now();
        const status = await mcpClient.getSystemStatus();
        const duration2 = performance.now() - startTime2;
        
        if (status) {
          logTest('MCP Client System Status', 'PASS', duration2, 'Status retrieved');
        } else {
          logTest('MCP Client System Status', 'FAIL', duration2, 'No status returned');
        }
      } catch (error) {
        logTest('MCP Client System Status', 'FAIL', 0, error.message);
      }
      
    } else {
      logTest('MCP Client Connection', 'FAIL', duration, 'Failed to connect');
    }
  } catch (error) {
    logTest('MCP Client Connection', 'FAIL', 0, error.message);
  }
};

const testMCPCoreServer = async () => {
  log('\n⚙️ TESTING MCP CORE SERVER', 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${TEST_CONFIG.coreServerUrl}/mcp/health-check`, {
      method: 'POST',
      body: JSON.stringify({ component: 'all' })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        logTest('MCP Core Server Health Check', 'PASS', duration, 'Health check successful');
      } else {
        logTest('MCP Core Server Health Check', 'FAIL', duration, data.error || 'Health check failed');
      }
    } else {
      logTest('MCP Core Server Health Check', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP Core Server Health Check', 'FAIL', 0, error.message);
  }
  
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${TEST_CONFIG.coreServerUrl}/mcp/system-status`, {
      method: 'POST',
      body: JSON.stringify({ includeMetrics: true })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        logTest('MCP Core Server System Status', 'PASS', duration, 'System status retrieved');
      } else {
        logTest('MCP Core Server System Status', 'FAIL', duration, data.error || 'System status failed');
      }
    } else {
      logTest('MCP Core Server System Status', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP Core Server System Status', 'FAIL', 0, error.message);
  }
};

const testMCPThreatIntelligence = async () => {
  log('\n🛡️ TESTING MCP THREAT INTELLIGENCE', 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest('http://localhost:3004/mcp/analyze-threats', {
      method: 'POST',
      body: JSON.stringify({
        threatData: {
          type: 'malware',
          hash: 'test-hash-123',
          source: 'test'
        },
        sources: ['local'],
        correlationLevel: 'basic'
      })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        logTest('MCP Threat Intelligence Analysis', 'PASS', duration, 'Threat analysis successful');
      } else {
        logTest('MCP Threat Intelligence Analysis', 'FAIL', duration, data.error || 'Threat analysis failed');
      }
    } else {
      logTest('MCP Threat Intelligence Analysis', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP Threat Intelligence Analysis', 'FAIL', 0, error.message);
  }
};

const testMCPWiFiAnalysis = async () => {
  log('\n📶 TESTING MCP WIFI ANALYSIS', 'blue');
  
  try {
    const startTime = performance.now();
    const response = await makeRequest('http://localhost:3005/mcp/analyze-networks', {
      method: 'POST',
      body: JSON.stringify({
        networkData: {
          ssid: 'Test Network',
          bssid: '00:11:22:33:44:55',
          encryption: 'WPA2',
          signalStrength: -50
        },
        analysisType: 'security',
        includeWigleData: false
      })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        logTest('MCP WiFi Analysis', 'PASS', duration, 'WiFi analysis successful');
      } else {
        logTest('MCP WiFi Analysis', 'FAIL', duration, data.error || 'WiFi analysis failed');
      }
    } else {
      logTest('MCP WiFi Analysis', 'FAIL', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP WiFi Analysis', 'FAIL', 0, error.message);
  }
};

const testMCPPerformance = async () => {
  log('\n⚡ TESTING MCP PERFORMANCE', 'blue');
  
  const performanceTests = [
    { name: 'Core Server Response Time', url: 'http://localhost:3003/health' },
    { name: 'Threat Intel Response Time', url: 'http://localhost:3004/health' },
    { name: 'WiFi Analysis Response Time', url: 'http://localhost:3005/health' }
  ];
  
  for (const test of performanceTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(test.url);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const status = duration < 1000 ? 'PASS' : 'WARN';
        logTest(test.name, status, duration, duration < 1000 ? 'Good performance' : 'Slow response');
      } else {
        logTest(test.name, 'FAIL', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'FAIL', 0, error.message);
    }
  }
};

const testMCPIntegration = async () => {
  log('\n🔗 TESTING MCP INTEGRATION', 'blue');
  
  try {
    const mcpClient = getMCPClient(TEST_CONFIG);
    
    // Test server registration
    try {
      const startTime = performance.now();
      const result = await mcpClient.registerServer('test-server', 'test', { port: 9999 });
      const duration = performance.now() - startTime;
      
      if (result) {
        logTest('MCP Server Registration', 'PASS', duration, 'Server registered successfully');
      } else {
        logTest('MCP Server Registration', 'FAIL', duration, 'Server registration failed');
      }
    } catch (error) {
      logTest('MCP Server Registration', 'FAIL', 0, error.message);
    }
    
    // Test health check
    try {
      const startTime = performance.now();
      const health = await mcpClient.performHealthCheck('all');
      const duration = performance.now() - startTime;
      
      if (health) {
        logTest('MCP Health Check Integration', 'PASS', duration, 'Health check successful');
      } else {
        logTest('MCP Health Check Integration', 'FAIL', duration, 'Health check failed');
      }
    } catch (error) {
      logTest('MCP Health Check Integration', 'FAIL', 0, error.message);
    }
    
    // Test metrics
    try {
      const startTime = performance.now();
      const metrics = mcpClient.getMetrics();
      const duration = performance.now() - startTime;
      
      if (metrics) {
        logTest('MCP Metrics Integration', 'PASS', duration, 'Metrics retrieved successfully');
      } else {
        logTest('MCP Metrics Integration', 'FAIL', duration, 'Metrics retrieval failed');
      }
    } catch (error) {
      logTest('MCP Metrics Integration', 'FAIL', 0, error.message);
    }
    
  } catch (error) {
    logTest('MCP Integration', 'FAIL', 0, error.message);
  }
};

const generateReport = () => {
  log('\n📊 MCP INTEGRATION TEST REPORT', 'bold');
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
  
  // MCP health assessment
  log('\n🏥 MCP HEALTH ASSESSMENT:', 'bold');
  if (successRate >= 95) {
    log('🟢 EXCELLENT - MCP system is healthy and performing well', 'green');
  } else if (successRate >= 80) {
    log('🟡 GOOD - MCP system is functional with minor issues', 'yellow');
  } else if (successRate >= 60) {
    log('🟠 FAIR - MCP system has some issues that need attention', 'yellow');
  } else {
    log('🔴 POOR - MCP system has critical issues requiring immediate attention', 'red');
  }
  
  log('\n' + '=' .repeat(60), 'cyan');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n🚨 MCP INTEGRATION TEST FAILED - Critical issues detected!', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  MCP INTEGRATION TEST PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ MCP INTEGRATION TEST PASSED - All systems working!', 'green');
    process.exit(0);
  }
};

// Main execution
const runMCPIntegrationTest = async () => {
  log('🔗 CYBERSTREAMS MCP INTEGRATION TEST STARTING', 'bold');
  log(`Core Server URL: ${TEST_CONFIG.coreServerUrl}`, 'blue');
  log(`Timeout: ${TEST_CONFIG.timeout}ms per test`, 'blue');
  
  try {
    // Run all tests
    await testMCPServerAvailability();
    await testMCPClientConnection();
    await testMCPCoreServer();
    await testMCPThreatIntelligence();
    await testMCPWiFiAnalysis();
    await testMCPPerformance();
    await testMCPIntegration();
    
    generateReport();
  } catch (error) {
    log(`\n💥 MCP INTEGRATION TEST CRASHED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run the integration test
runMCPIntegrationTest();


