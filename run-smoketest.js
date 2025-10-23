#!/usr/bin/env node

/**
 * CYBERSTREAMS COMPLETE SMOKETEST RUNNER
 * 
 * Dette script kører alle smoketests i rækkefølge:
 * 1. Backend API tests
 * 2. Frontend UI tests
 * 3. Integration tests
 * 4. Performance tests
 * 
 * Genererer en samlet rapport over alle tests.
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TEST_TIMEOUT = 60000; // 60 seconds total timeout

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logSection = (title) => {
  log('\n' + '=' .repeat(60), 'cyan');
  log(title, 'bold');
  log('=' .repeat(60), 'cyan');
};

// Test execution function
const runTest = (scriptName, description) => {
  return new Promise((resolve, reject) => {
    log(`\n🚀 Running ${description}...`, 'blue');
    
    const startTime = performance.now();
    const child = spawn('node', [scriptName], {
      stdio: 'inherit',
      env: { ...process.env, BASE_URL }
    });
    
    child.on('close', (code) => {
      const duration = performance.now() - startTime;
      
      if (code === 0) {
        log(`✅ ${description} PASSED (${duration.toFixed(2)}ms)`, 'green');
        resolve({ success: true, duration, exitCode: code });
      } else {
        log(`❌ ${description} FAILED (${duration.toFixed(2)}ms)`, 'red');
        resolve({ success: false, duration, exitCode: code });
      }
    });
    
    child.on('error', (error) => {
      const duration = performance.now() - startTime;
      log(`💥 ${description} CRASHED: ${error.message}`, 'red');
      resolve({ success: false, duration, exitCode: -1, error: error.message });
    });
    
    // Timeout handling
    setTimeout(() => {
      child.kill();
      log(`⏰ ${description} TIMEOUT`, 'yellow');
      resolve({ success: false, duration: TEST_TIMEOUT, exitCode: -1, error: 'Timeout' });
    }, TEST_TIMEOUT);
  });
};

// Generate comprehensive report
const generateComprehensiveReport = (results) => {
  logSection('🎯 COMPREHENSIVE SMOKETEST REPORT');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`\n📊 SUMMARY STATISTICS:`, 'bold');
  log(`Total Test Suites: ${totalTests}`, 'blue');
  log(`✅ Passed: ${passedTests}`, 'green');
  log(`❌ Failed: ${failedTests}`, 'red');
  log(`⏱️  Total Duration: ${totalDuration.toFixed(2)}ms`, 'blue');
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  log(`\n🎯 Overall Success Rate: ${successRate}%`, 
    successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');
  
  // Detailed results
  log(`\n📋 DETAILED RESULTS:`, 'bold');
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusColor = result.success ? 'green' : 'red';
    log(`${index + 1}. ${result.description}`, statusColor);
    log(`   Status: ${status}`, statusColor);
    log(`   Duration: ${result.duration.toFixed(2)}ms`, 'blue');
    if (result.error) {
      log(`   Error: ${result.error}`, 'red');
    }
    log('');
  });
  
  // Performance analysis
  log(`\n⚡ PERFORMANCE ANALYSIS:`, 'bold');
  const avgDuration = totalDuration / totalTests;
  const slowestTest = results.reduce((max, r) => r.duration > max.duration ? r : max);
  const fastestTest = results.reduce((min, r) => r.duration < min.duration ? r : min);
  
  log(`Average Test Duration: ${avgDuration.toFixed(2)}ms`, 'blue');
  log(`Slowest Test: ${slowestTest.description} (${slowestTest.duration.toFixed(2)}ms)`, 'yellow');
  log(`Fastest Test: ${fastestTest.description} (${fastestTest.duration.toFixed(2)}ms)`, 'green');
  
  // Recommendations
  log(`\n💡 RECOMMENDATIONS:`, 'bold');
  if (failedTests === 0) {
    log('🎉 All tests passed! System is ready for production.', 'green');
  } else {
    log('🔧 Issues detected that need attention:', 'yellow');
    results.filter(r => !r.success).forEach(result => {
      log(`   - Fix issues in ${result.description}`, 'yellow');
    });
  }
  
  if (avgDuration > 10000) {
    log('⚡ Consider optimizing test performance - average duration is high', 'yellow');
  }
  
  // System health assessment
  log(`\n🏥 SYSTEM HEALTH ASSESSMENT:`, 'bold');
  if (successRate >= 90) {
    log('🟢 EXCELLENT - System is in excellent condition', 'green');
  } else if (successRate >= 80) {
    log('🟡 GOOD - System is functional with minor issues', 'yellow');
  } else if (successRate >= 60) {
    log('🟠 FAIR - System has some issues that need attention', 'yellow');
  } else {
    log('🔴 POOR - System has critical issues requiring immediate attention', 'red');
  }
  
  log('\n' + '=' .repeat(60), 'cyan');
};

// Save report to file
const saveReport = async (results) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = `smoketest-report-${timestamp}.json`;
  
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      totalTests: results.length,
      passedTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      successRate: ((results.filter(r => r.success).length / results.length) * 100).toFixed(1)
    },
    results: results.map(r => ({
      description: r.description,
      success: r.success,
      duration: r.duration,
      exitCode: r.exitCode,
      error: r.error || null
    }))
  };
  
  try {
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    log(`\n📄 Report saved to: ${reportFile}`, 'cyan');
  } catch (error) {
    log(`\n⚠️  Could not save report: ${error.message}`, 'yellow');
  }
};

// Main execution
const runCompleteSmokeTest = async () => {
  log('🚀 CYBERSTREAMS COMPLETE SMOKETEST STARTING', 'bold');
  log(`Target: ${BASE_URL}`, 'blue');
  log(`Timeout: ${TEST_TIMEOUT}ms per test`, 'blue');
  
  const startTime = performance.now();
  const results = [];
  
  try {
    // Check if server is running
    logSection('🔍 PRE-FLIGHT CHECKS');
    
    try {
      const { default: fetch } = await import('node-fetch');
      const response = await fetch(`${BASE_URL}/healthz`, { timeout: 5000 });
      if (response.ok) {
        log('✅ Server is running and accessible', 'green');
      } else {
        log('⚠️  Server responded but with error status', 'yellow');
      }
    } catch (error) {
      log('❌ Server is not accessible - starting server first...', 'red');
      log('Please ensure the server is running with: npm run server', 'yellow');
    }
    
    // Run backend tests
    logSection('🔧 BACKEND TESTS');
    const backendResult = await runTest('smoketest.js', 'Backend API Smoketest');
    results.push({ ...backendResult, description: 'Backend API Tests' });
    
    // Run frontend tests
    logSection('🎨 FRONTEND TESTS');
    const frontendResult = await runTest('frontend-smoketest.js', 'Frontend UI Smoketest');
    results.push({ ...frontendResult, description: 'Frontend UI Tests' });
    
    // Run integration tests (if available)
    logSection('🔗 INTEGRATION TESTS');
    try {
      const integrationResult = await runTest('integration-smoketest.js', 'Integration Smoketest');
      results.push({ ...integrationResult, description: 'Integration Tests' });
    } catch (error) {
      log('⚠️  Integration tests not available', 'yellow');
    }
    
    // Run MCP tests (if available)
    logSection('🔗 MCP TESTS');
    try {
      const mcpResult = await runTest('mcp-smoketest.js', 'MCP Smoketest');
      results.push({ ...mcpResult, description: 'MCP Tests' });
    } catch (error) {
      log('⚠️  MCP tests not available', 'yellow');
    }
    
    // Generate final report
    const totalDuration = performance.now() - startTime;
    logSection('📊 FINAL REPORT');
    
    generateComprehensiveReport(results);
    
    // Save report
    await saveReport(results);
    
    // Exit with appropriate code
    const failedTests = results.filter(r => !r.success).length;
    if (failedTests === 0) {
      log('\n🎉 ALL SMOKETESTS PASSED - System is ready!', 'green');
      process.exit(0);
    } else {
      log(`\n⚠️  ${failedTests} TEST SUITE(S) FAILED - Review issues above`, 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 SMOKETEST RUNNER CRASHED: ${error.message}`, 'red');
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('CYBERSTREAMS COMPLETE SMOKETEST RUNNER', 'bold');
  log('\nUsage:', 'blue');
  log('  node run-smoketest.js [options]', 'cyan');
  log('\nOptions:', 'blue');
  log('  --help, -h     Show this help message', 'cyan');
  log('  --url URL      Set base URL (default: http://localhost:3002)', 'cyan');
  log('\nEnvironment Variables:', 'blue');
  log('  BASE_URL       Base URL for the application', 'cyan');
  log('\nExamples:', 'blue');
  log('  node run-smoketest.js', 'cyan');
  log('  BASE_URL=http://localhost:3001 node run-smoketest.js', 'cyan');
  process.exit(0);
}

// Run the complete smoketest
runCompleteSmokeTest();
