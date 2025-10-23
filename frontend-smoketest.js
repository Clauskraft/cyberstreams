#!/usr/bin/env node

/**
 * CYBERSTREAMS FRONTEND SMOKETEST
 * 
 * Denne smoketest tester frontend komponenter og UI funktionalitet
 * ved at køre en headless browser og verificere at alle kritiske
 * UI elementer loader korrekt.
 */

import { chromium } from 'playwright';
import { performance } from 'perf_hooks';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
const TIMEOUT = 15000; // 15 seconds timeout for browser operations
const CRITICAL_THRESHOLD = 3000; // 3 seconds for critical UI operations

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

const testPageLoad = async (page, testName, url) => {
  try {
    const startTime = performance.now();
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: TIMEOUT 
    });
    const duration = performance.now() - startTime;
    
    if (response && response.ok()) {
      const status = duration > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
      logTest(testName, status, duration, 
        duration > CRITICAL_THRESHOLD ? 'Slow load time' : 'Page loaded successfully');
      return true;
    } else {
      logTest(testName, 'FAIL', duration, `HTTP ${response?.status() || 'No response'}`);
      return false;
    }
  } catch (error) {
    logTest(testName, 'FAIL', 0, error.message);
    return false;
  }
};

const testElementExists = async (page, selector, testName, timeout = 5000) => {
  try {
    const startTime = performance.now();
    await page.waitForSelector(selector, { timeout });
    const duration = performance.now() - startTime;
    
    logTest(testName, 'PASS', duration, 'Element found');
    return true;
  } catch (error) {
    logTest(testName, 'FAIL', 0, `Element not found: ${selector}`);
    return false;
  }
};

const testNavigation = async (page) => {
  log('\n🧭 TESTING NAVIGATION', 'blue');
  
  const navItems = [
    { selector: '[data-testid="nav-dashboard"]', name: 'Dashboard Navigation' },
    { selector: '[data-testid="nav-threats"]', name: 'Threats Navigation' },
    { selector: '[data-testid="nav-activity"]', name: 'Activity Navigation' },
    { selector: '[data-testid="nav-pulse"]', name: 'Pulse Navigation' },
    { selector: '[data-testid="nav-intelligence"]', name: 'Intelligence Navigation' },
    { selector: '[data-testid="nav-agent"]', name: 'Agent Navigation' },
    { selector: '[data-testid="nav-admin"]', name: 'Admin Navigation' }
  ];
  
  for (const navItem of navItems) {
    try {
      const startTime = performance.now();
      const element = await page.$(navItem.selector);
      const duration = performance.now() - startTime;
      
      if (element) {
        // Test if element is clickable
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();
        
        if (isVisible && isEnabled) {
          logTest(navItem.name, 'PASS', duration, 'Navigation item accessible');
        } else {
          logTest(navItem.name, 'WARN', duration, 'Navigation item not interactive');
        }
      } else {
        logTest(navItem.name, 'FAIL', duration, 'Navigation item not found');
      }
    } catch (error) {
      logTest(navItem.name, 'FAIL', 0, error.message);
    }
  }
};

const testMainComponents = async (page) => {
  log('\n🎨 TESTING MAIN COMPONENTS', 'blue');
  
  const components = [
    { selector: 'h1', name: 'Main Header', critical: true },
    { selector: '.bg-gradient-to-b', name: 'Background Gradient', critical: false },
    { selector: '[data-testid="cyberstreams-logo"]', name: 'Logo', critical: true },
    { selector: 'nav', name: 'Navigation Bar', critical: true },
    { selector: 'main', name: 'Main Content Area', critical: true },
    { selector: '.animate-spin', name: 'Loading Spinner', critical: false }
  ];
  
  for (const component of components) {
    const element = await page.$(component.selector);
    if (element) {
      const isVisible = await element.isVisible();
      const status = isVisible ? 'PASS' : (component.critical ? 'FAIL' : 'WARN');
      logTest(component.name, status, 0, 
        isVisible ? 'Component visible' : 'Component not visible');
    } else {
      const status = component.critical ? 'FAIL' : 'WARN';
      logTest(component.name, status, 0, 'Component not found');
    }
  }
};

const testDashboard = async (page) => {
  log('\n📊 TESTING DASHBOARD MODULE', 'blue');
  
  // Navigate to dashboard
  try {
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForTimeout(1000);
    
    const dashboardElements = [
      { selector: '[data-testid="dashboard-stats"]', name: 'Dashboard Stats' },
      { selector: '[data-testid="threat-overview"]', name: 'Threat Overview' },
      { selector: '[data-testid="activity-feed"]', name: 'Activity Feed' },
      { selector: '[data-testid="recent-threats"]', name: 'Recent Threats' }
    ];
    
    for (const element of dashboardElements) {
      const exists = await page.$(element.selector);
      if (exists) {
        const isVisible = await exists.isVisible();
        logTest(element.name, 'PASS', 0, isVisible ? 'Visible' : 'Hidden');
      } else {
        logTest(element.name, 'WARN', 0, 'Element not found');
      }
    }
  } catch (error) {
    logTest('Dashboard Navigation', 'FAIL', 0, error.message);
  }
};

const testThreatsModule = async (page) => {
  log('\n⚠️ TESTING THREATS MODULE', 'blue');
  
  try {
    await page.click('[data-testid="nav-threats"]');
    await page.waitForTimeout(1000);
    
    const threatsElements = [
      { selector: '[data-testid="threat-list"]', name: 'Threat List' },
      { selector: '[data-testid="threat-filters"]', name: 'Threat Filters' },
      { selector: '[data-testid="severity-indicator"]', name: 'Severity Indicator' },
      { selector: '[data-testid="threat-details"]', name: 'Threat Details' }
    ];
    
    for (const element of threatsElements) {
      const exists = await page.$(element.selector);
      if (exists) {
        const isVisible = await exists.isVisible();
        logTest(element.name, 'PASS', 0, isVisible ? 'Visible' : 'Hidden');
      } else {
        logTest(element.name, 'WARN', 0, 'Element not found');
      }
    }
  } catch (error) {
    logTest('Threats Navigation', 'FAIL', 0, error.message);
  }
};

const testActivityModule = async (page) {
  log('\n📈 TESTING ACTIVITY MODULE', 'blue');
  
  try {
    await page.click('[data-testid="nav-activity"]');
    await page.waitForTimeout(1000);
    
    const activityElements = [
      { selector: '[data-testid="activity-timeline"]', name: 'Activity Timeline' },
      { selector: '[data-testid="activity-filters"]', name: 'Activity Filters' },
      { selector: '[data-testid="activity-stats"]', name: 'Activity Stats' }
    ];
    
    for (const element of activityElements) {
      const exists = await page.$(element.selector);
      if (exists) {
        const isVisible = await exists.isVisible();
        logTest(element.name, 'PASS', 0, isVisible ? 'Visible' : 'Hidden');
      } else {
        logTest(element.name, 'WARN', 0, 'Element not found');
      }
    }
  } catch (error) {
    logTest('Activity Navigation', 'FAIL', 0, error.message);
  }
};

const testResponsiveDesign = async (page) => {
  log('\n📱 TESTING RESPONSIVE DESIGN', 'blue');
  
  const viewports = [
    { width: 1920, height: 1080, name: 'Desktop' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 375, height: 667, name: 'Mobile' }
  ];
  
  for (const viewport of viewports) {
    try {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      // Check if main header is still visible
      const header = await page.$('h1');
      if (header) {
        const isVisible = await header.isVisible();
        logTest(`${viewport.name} Viewport`, 'PASS', 0, 
          isVisible ? 'Header visible' : 'Header hidden');
      } else {
        logTest(`${viewport.name} Viewport`, 'FAIL', 0, 'Header not found');
      }
    } catch (error) {
      logTest(`${viewport.name} Viewport`, 'FAIL', 0, error.message);
    }
  }
};

const testErrorBoundary = async (page) => {
  log('\n🛡️ TESTING ERROR HANDLING', 'blue');
  
  // Try to navigate to a non-existent route
  try {
    await page.goto(`${BASE_URL}/non-existent-route`);
    await page.waitForTimeout(1000);
    
    // Check if error boundary is shown
    const errorElement = await page.$('[data-testid="error-boundary"]');
    if (errorElement) {
      logTest('Error Boundary', 'PASS', 0, 'Error boundary displayed');
    } else {
      // Check if 404 page is shown
      const notFoundElement = await page.$('text=404');
      if (notFoundElement) {
        logTest('404 Page', 'PASS', 0, '404 page displayed');
      } else {
        logTest('Error Handling', 'WARN', 0, 'No error handling detected');
      }
    }
  } catch (error) {
    logTest('Error Handling', 'FAIL', 0, error.message);
  }
};

const testPerformance = async (page) => {
  log('\n⚡ TESTING PERFORMANCE', 'blue');
  
  // Measure page load performance
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
    };
  });
  
  // Test load time
  const loadTime = performanceMetrics.loadTime;
  const status = loadTime > CRITICAL_THRESHOLD ? 'WARN' : 'PASS';
  logTest('Page Load Time', status, loadTime, 
    loadTime > CRITICAL_THRESHOLD ? 'Slow load' : 'Good performance');
  
  // Test DOM content loaded
  const domTime = performanceMetrics.domContentLoaded;
  const domStatus = domTime > 2000 ? 'WARN' : 'PASS';
  logTest('DOM Content Loaded', domStatus, domTime, 
    domTime > 2000 ? 'Slow DOM processing' : 'Good DOM performance');
};

const generateReport = () => {
  log('\n📊 FRONTEND SMOKETEST REPORT', 'bold');
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
    log('\n🚨 FRONTEND SMOKETEST FAILED - Critical UI issues detected!', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  FRONTEND SMOKETEST PASSED with warnings', 'yellow');
    process.exit(0);
  } else {
    log('\n✅ FRONTEND SMOKETEST PASSED - All UI components working!', 'green');
    process.exit(0);
  }
};

// Main execution
const runFrontendSmokeTest = async () => {
  log('🎨 CYBERSTREAMS FRONTEND SMOKETEST STARTING', 'bold');
  log(`Target: ${BASE_URL}`, 'blue');
  log(`Timeout: ${TIMEOUT}ms per test`, 'blue');
  log(`Critical threshold: ${CRITICAL_THRESHOLD}ms`, 'blue');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Run tests
    await testPageLoad(page, 'Main Page Load', BASE_URL);
    await testMainComponents(page);
    await testNavigation(page);
    await testDashboard(page);
    await testThreatsModule(page);
    await testActivityModule(page);
    await testResponsiveDesign(page);
    await testErrorBoundary(page);
    await testPerformance(page);
    
    generateReport();
  } catch (error) {
    log(`\n💥 FRONTEND SMOKETEST CRASHED: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

// Run the frontend smoketest
runFrontendSmokeTest();

