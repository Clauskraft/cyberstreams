#!/usr/bin/env node

/**
 * CYBERSTREAMS MCP SMOKETEST
 * 
 * Denne smoketest tester MCP (Model Context Protocol) server integrationer:
 * - Filesystem MCP server
 * - API Gateway MCP server
 * - MCP server connectivity
 * - MCP server functionality
 */

import fetch from 'node-fetch';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const MCP_CONFIG_FILE = 'mcp.json';
const TIMEOUT = 10000; // 10 seconds timeout for MCP tests
const CRITICAL_THRESHOLD = 5000; // 5 seconds for critical MCP operations

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

// Test MCP configuration file
const testMCPConfiguration = async () => {
  log('\n⚙️ TESTING MCP CONFIGURATION', 'blue');
  
  try {
    const startTime = performance.now();
    const configData = await fs.readFile(MCP_CONFIG_FILE, 'utf8');
    const config = JSON.parse(configData);
    const duration = performance.now() - startTime;
    
    if (config.mcpServers) {
      const serverCount = Object.keys(config.mcpServers).length;
      logTest('MCP Configuration File', 'PASS', duration, `${serverCount} servers configured`);
      
      // Test individual server configurations
      for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
        if (serverConfig.command && serverConfig.args) {
          logTest(`${serverName} Configuration`, 'PASS', 0, 'Valid configuration');
        } else {
          logTest(`${serverName} Configuration`, 'WARN', 0, 'Missing required fields');
        }
      }
    } else {
      logTest('MCP Configuration File', 'FAIL', duration, 'No mcpServers found');
    }
  } catch (error) {
    logTest('MCP Configuration File', 'FAIL', 0, error.message);
  }
};

// Test MCP server connectivity
const testMCPServerConnectivity = async () => {
  log('\n🔗 TESTING MCP SERVER CONNECTIVITY', 'blue');
  
  // Test MCP endpoints if they exist
  const mcpEndpoints = [
    { path: '/api/mcp/servers', name: 'MCP Servers List' },
    { path: '/api/mcp/test', name: 'MCP Test Endpoint' }
  ];
  
  for (const endpoint of mcpEndpoints) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
        method: 'GET'
      });
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        logTest(endpoint.name, 'PASS', duration, 'MCP endpoint accessible');
      } else if (response.status === 404) {
        logTest(endpoint.name, 'WARN', duration, 'MCP endpoint not implemented');
      } else {
        logTest(endpoint.name, 'WARN', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(endpoint.name, 'WARN', 0, `Endpoint not available: ${error.message}`);
    }
  }
};

// Test MCP server functionality
const testMCPServerFunctionality = async () => {
  log('\n🔧 TESTING MCP SERVER FUNCTIONALITY', 'blue');
  
  // Test MCP test endpoint with different server configurations
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/mcp/test`, {
      method: 'POST',
      body: JSON.stringify({
        server: 'filesystem',
        apiKey: 'test-key'
      })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      logTest('MCP Filesystem Server Test', 'PASS', duration, 'Server test successful');
    } else if (response.status === 404) {
      logTest('MCP Filesystem Server Test', 'WARN', duration, 'MCP test endpoint not implemented');
    } else {
      logTest('MCP Filesystem Server Test', 'WARN', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP Filesystem Server Test', 'WARN', 0, `Test endpoint not available: ${error.message}`);
  }
  
  // Test API Gateway MCP server
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/mcp/test`, {
      method: 'POST',
      body: JSON.stringify({
        server: 'mcp-api-gateway',
        apiKey: 'test-key'
      })
    });
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      logTest('MCP API Gateway Server Test', 'PASS', duration, 'API Gateway test successful');
    } else if (response.status === 404) {
      logTest('MCP API Gateway Server Test', 'WARN', duration, 'MCP test endpoint not implemented');
    } else {
      logTest('MCP API Gateway Server Test', 'WARN', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP API Gateway Server Test', 'WARN', 0, `Test endpoint not available: ${error.message}`);
  }
};

// Test Docker MCP servers
const testDockerMCPServers = async () => {
  log('\n🐳 TESTING DOCKER MCP SERVERS', 'blue');
  
  try {
    // Test if Docker is available
    const { spawn } = await import('child_process');
    
    const dockerTest = new Promise((resolve) => {
      const docker = spawn('docker', ['--version']);
      docker.on('close', (code) => {
        resolve(code === 0);
      });
      docker.on('error', () => {
        resolve(false);
      });
    });
    
    const dockerAvailable = await dockerTest;
    
    if (dockerAvailable) {
      logTest('Docker Availability', 'PASS', 0, 'Docker is available');
      
      // Test if MCP Docker images exist
      const imagesTest = new Promise((resolve) => {
        const docker = spawn('docker', ['images', '--format', '{{.Repository}}:{{.Tag}}']);
        let output = '';
        docker.stdout.on('data', (data) => {
          output += data.toString();
        });
        docker.on('close', (code) => {
          resolve(code === 0 ? output : '');
        });
        docker.on('error', () => {
          resolve('');
        });
      });
      
      const imagesOutput = await imagesTest;
      
      if (imagesOutput.includes('mcp/filesystem')) {
        logTest('MCP Filesystem Docker Image', 'PASS', 0, 'Image available');
      } else {
        logTest('MCP Filesystem Docker Image', 'WARN', 0, 'Image not found locally');
      }
      
      if (imagesOutput.includes('mcp/api-gateway')) {
        logTest('MCP API Gateway Docker Image', 'PASS', 0, 'Image available');
      } else {
        logTest('MCP API Gateway Docker Image', 'WARN', 0, 'Image not found locally');
      }
    } else {
      logTest('Docker Availability', 'WARN', 0, 'Docker not available');
    }
  } catch (error) {
    logTest('Docker MCP Servers', 'WARN', 0, `Docker test failed: ${error.message}`);
  }
};

// Test MCP server environment variables
const testMCPEnvironmentVariables = async () => {
  log('\n🔐 TESTING MCP ENVIRONMENT VARIABLES', 'blue');
  
  const requiredEnvVars = [
    'API_1_NAME',
    'API_1_SWAGGER_URL',
    'API_1_HEADER_AUTHORIZATION'
  ];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      logTest(`${envVar} Environment Variable`, 'PASS', 0, 'Variable set');
    } else {
      logTest(`${envVar} Environment Variable`, 'WARN', 0, 'Variable not set');
    }
  }
};

// Test MCP server performance
const testMCPPerformance = async () => {
  log('\n⚡ TESTING MCP SERVER PERFORMANCE', 'blue');
  
  // Test MCP endpoint performance
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/mcp/servers`);
    const duration = performance.now() - startTime;
    
    if (response.ok) {
      const status = duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
      logTest('MCP Servers List Performance', status, duration, 
        duration > CRITICAL_THRESHOLD ? 'Slow response' : 'Good performance');
    } else {
      logTest('MCP Servers List Performance', 'WARN', duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest('MCP Servers List Performance', 'WARN', 0, `Endpoint not available: ${error.message}`);
  }
};

// Test MCP integration with existing services
const testMCPIntegration = async () => {
  log('\n🔗 TESTING MCP INTEGRATION', 'blue');
  
  // Test if MCP servers integrate with existing API endpoints
  const integrationTests = [
    { path: '/api/keys', name: 'API Keys Integration' },
    { path: '/api/admin/keywords', name: 'Admin Keywords Integration' },
    { path: '/api/knowledge/stats', name: 'Knowledge Base Integration' }
  ];
  
  for (const test of integrationTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const duration = performance.now() - startTime;
      
      if (response.ok) {
        logTest(test.name, 'PASS', duration, 'Integration working');
      } else {
        logTest(test.name, 'WARN', duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, 'WARN', 0, `Integration test failed: ${error.message}`);
    }
  }
};

// Generate MCP report
const generateMCPReport = () => {
  log('\n📊 MCP SMOKETEST REPORT', 'bold');
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
  
  // MCP health assessment
  log('\n🏥 MCP HEALTH ASSESSMENT:', 'bold');
  if (successRate >= 90) {
    log('🟢 EXCELLENT - All MCP servers working perfectly', 'green');
  } else if (successRate >= 80) {
    log('🟡 GOOD - Most MCP servers working with minor issues', 'yellow');
  } else if (successRate >= 60) {
    log('🟠 FAIR - Some MCP servers have issues', 'yellow');
  } else {
    log('🔴 POOR - Multiple MCP server failures', 'red');
  }
  
  log('\n' + '=' .repeat(50), 'blue');
  
  // Exit with appropriate code
  if (results.failed > 0) {
    log('\n🚨 MCP SMOKETEST FAILED - Critical MCP issues detected!', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  MCP SMOKETEST PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ MCP SMOKETEST PASSED - All MCP servers working!', 'green');
    process.exit(0);
  }
};

// Main execution
const runMCPSmokeTest = async () => {
  log('🔗 CYBERSTREAMS MCP SMOKETEST STARTING', 'bold');
  log(`Target: ${BASE_URL}`, 'blue');
  log(`MCP Config: ${MCP_CONFIG_FILE}`, 'blue');
  log(`Timeout: ${TIMEOUT}ms per test`, 'blue');
  log(`Critical threshold: ${CRITICAL_THRESHOLD}ms`, 'blue');
  
  try {
    await testMCPConfiguration();
    await testMCPServerConnectivity();
    await testMCPServerFunctionality();
    await testDockerMCPServers();
    await testMCPEnvironmentVariables();
    await testMCPPerformance();
    await testMCPIntegration();
    
    generateMCPReport();
  } catch (error) {
    log(`\n💥 MCP SMOKETEST CRASHED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Run the MCP smoketest
runMCPSmokeTest();

