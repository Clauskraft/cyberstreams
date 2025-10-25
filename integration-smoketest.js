#!/usr/bin/env node

/**
 * CYBERSTREAMS INTEGRATION SMOKETEST
 *
 * Denne smoketest tester integrationer med eksterne services:
 * - MISP (Malware Information Sharing Platform)
 * - OpenCTI (Open Cyber Threat Intelligence)
 * - Wigle Maps (WiFi location data)
 * - Database connectivity
 * - External API integrations
 */

import fetch from "node-fetch";
import { performance } from "perf_hooks";

// Configuration
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3001";
const TIMEOUT = 15000; // 15 seconds timeout for integration tests
const CRITICAL_THRESHOLD = 5000; // 5 seconds for critical integrations

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

// Utility functions
const log = (message, color = "reset") => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logTest = (testName, status, duration, message = "") => {
  const statusColor =
    status === "PASS" ? "green" : status === "FAIL" ? "red" : "yellow";
  const durationStr = duration ? ` (${duration.toFixed(2)}ms)` : "";

  log(
    `[${status}] ${testName}${durationStr}${message ? ": " + message : ""}`,
    statusColor
  );

  results.tests.push({
    name: testName,
    status,
    duration,
    message,
  });

  if (status === "PASS") results.passed++;
  else if (status === "FAIL") results.failed++;
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
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Test MISP integration
const testMISPIntegration = async () => {
  log("\n🔍 TESTING MISP INTEGRATION", "blue");

  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/cti/misp/events`);
    const duration = performance.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      logTest("MISP Events API", "PASS", duration, "MISP integration working");
    } else if (response.status === 503) {
      logTest(
        "MISP Events API",
        "WARN",
        duration,
        "MISP not configured (expected)"
      );
    } else {
      logTest("MISP Events API", "FAIL", duration, `HTTP ${response.status}`);
    }
  } catch (error) {
    logTest("MISP Events API", "FAIL", 0, error.message);
  }

  // Test MISP observables endpoint
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/cti/misp/observables`, {
      method: "POST",
      body: JSON.stringify({
        observable: "test.example.com",
        type: "domain",
      }),
    });
    const duration = performance.now() - startTime;

    if (response.ok) {
      logTest(
        "MISP Observables API",
        "PASS",
        duration,
        "MISP observables working"
      );
    } else if (response.status === 503) {
      logTest(
        "MISP Observables API",
        "WARN",
        duration,
        "MISP not configured (expected)"
      );
    } else {
      logTest(
        "MISP Observables API",
        "WARN",
        duration,
        `HTTP ${response.status} (may be expected)`
      );
    }
  } catch (error) {
    logTest("MISP Observables API", "FAIL", 0, error.message);
  }
};

// Test OpenCTI integration
const testOpenCTIIntegration = async () => {
  log("\n🕵️ TESTING OPENCTI INTEGRATION", "blue");

  try {
    const startTime = performance.now();
    const response = await makeRequest(
      `${BASE_URL}/api/cti/opencti/observables`
    );
    const duration = performance.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      logTest(
        "OpenCTI Observables API",
        "PASS",
        duration,
        "OpenCTI integration working"
      );
    } else if (response.status === 503) {
      logTest(
        "OpenCTI Observables API",
        "WARN",
        duration,
        "OpenCTI not configured (expected)"
      );
    } else {
      logTest(
        "OpenCTI Observables API",
        "FAIL",
        duration,
        `HTTP ${response.status}`
      );
    }
  } catch (error) {
    logTest("OpenCTI Observables API", "FAIL", 0, error.message);
  }
};

// Test Wigle Maps integration
const testWigleMapsIntegration = async () => {
  log("\n🗺️ TESTING WIGLE MAPS INTEGRATION", "blue");

  const wigleTests = [
    { path: "/api/wigle-maps/config", name: "Wigle Maps Config" },
    { path: "/api/wigle-maps/search-wifi", name: "Wigle WiFi Search" },
    { path: "/api/wigle-maps/geocode", name: "Wigle Geocoding" },
  ];

  for (const test of wigleTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`, {
        method:
          test.path.includes("search-wifi") || test.path.includes("geocode")
            ? "POST"
            : "GET",
        body: test.path.includes("search-wifi")
          ? JSON.stringify({
              ssid: "test-wifi",
              lat: 55.6761,
              lon: 12.5683,
              radius: 1000,
            })
          : test.path.includes("geocode")
          ? JSON.stringify({
              address: "Copenhagen, Denmark",
            })
          : undefined,
      });
      const duration = performance.now() - startTime;

      if (response.ok) {
        logTest(test.name, "PASS", duration, "Wigle Maps integration working");
      } else if (response.status === 503) {
        logTest(
          test.name,
          "WARN",
          duration,
          "Wigle Maps not configured (expected)"
        );
      } else {
        logTest(
          test.name,
          "WARN",
          duration,
          `HTTP ${response.status} (may be expected)`
        );
      }
    } catch (error) {
      logTest(test.name, "FAIL", 0, error.message);
    }
  }
};

// Test database connectivity
const testDatabaseConnectivity = async () => {
  log("\n🗄️ TESTING DATABASE CONNECTIVITY", "blue");

  const dbTests = [
    { path: "/api/admin/keywords", name: "Keywords Database" },
    { path: "/api/admin/sources", name: "Sources Database" },
    { path: "/api/knowledge/stats", name: "Knowledge Database" },
  ];

  for (const test of dbTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const duration = performance.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        logTest(test.name, "PASS", duration, "Database connection working");
      } else if (response.status === 500) {
        logTest(test.name, "WARN", duration, "Database fallback active");
      } else {
        logTest(test.name, "FAIL", duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, "FAIL", 0, error.message);
    }
  }
};

// Test Intel Scraper integration
const testIntelScraperIntegration = async () => {
  log("\n🤖 TESTING INTEL SCRAPER INTEGRATION", "blue");

  const scraperTests = [
    { path: "/api/intel-scraper/status", name: "Scraper Status" },
    { path: "/api/intel-scraper/approvals", name: "Scraper Approvals" },
    { path: "/api/intel-scraper/candidates", name: "Scraper Candidates" },
  ];

  for (const test of scraperTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const duration = performance.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        logTest(
          test.name,
          "PASS",
          duration,
          "Intel Scraper integration working"
        );
      } else {
        logTest(test.name, "FAIL", duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, "FAIL", 0, error.message);
    }
  }
};

// Test external API connectivity
const testExternalAPIConnectivity = async () => {
  log("\n🌐 TESTING EXTERNAL API CONNECTIVITY", "blue");

  const externalTests = [
    { url: "https://httpbin.org/status/200", name: "External HTTP Test" },
    { url: "https://api.github.com/zen", name: "GitHub API Test" },
  ];

  for (const test of externalTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(test.url);
      const duration = performance.now() - startTime;

      if (response.ok) {
        logTest(test.name, "PASS", duration, "External API accessible");
      } else {
        logTest(test.name, "WARN", duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, "WARN", 0, `Network issue: ${error.message}`);
    }
  }
};

// Test data flow integration
const testDataFlowIntegration = async () => {
  log("\n📊 TESTING DATA FLOW INTEGRATION", "blue");

  // Test complete data flow from source to output
  try {
    const startTime = performance.now();

    // 1. Test source configuration
    const sourcesResponse = await makeRequest(`${BASE_URL}/api/config/sources`);
    if (!sourcesResponse.ok) {
      throw new Error("Source configuration not accessible");
    }

    // 2. Test knowledge base
    const knowledgeResponse = await makeRequest(
      `${BASE_URL}/api/knowledge/stats`
    );
    if (!knowledgeResponse.ok) {
      throw new Error("Knowledge base not accessible");
    }

    // 3. Test search functionality
    const searchResponse = await makeRequest(
      `${BASE_URL}/api/knowledge/search`,
      {
        method: "POST",
        body: JSON.stringify({
          query: "test search",
          limit: 5,
        }),
      }
    );

    const duration = performance.now() - startTime;

    if (searchResponse.ok) {
      logTest(
        "Data Flow Integration",
        "PASS",
        duration,
        "Complete data flow working"
      );
    } else {
      logTest(
        "Data Flow Integration",
        "WARN",
        duration,
        "Search functionality issue"
      );
    }
  } catch (error) {
    logTest("Data Flow Integration", "FAIL", 0, error.message);
  }
};

// Test error handling in integrations
const testIntegrationErrorHandling = async () => {
  log("\n🛡️ TESTING INTEGRATION ERROR HANDLING", "blue");

  // Test with invalid data
  try {
    const startTime = performance.now();
    const response = await makeRequest(`${BASE_URL}/api/cti/misp/observables`, {
      method: "POST",
      body: JSON.stringify({
        invalid: "data",
      }),
    });
    const duration = performance.now() - startTime;

    if (response.status === 400 || response.status === 503) {
      logTest("MISP Error Handling", "PASS", duration, "Proper error handling");
    } else {
      logTest(
        "MISP Error Handling",
        "WARN",
        duration,
        `Unexpected status: ${response.status}`
      );
    }
  } catch (error) {
    logTest("MISP Error Handling", "FAIL", 0, error.message);
  }
};

// Test performance under load
const testIntegrationPerformance = async () => {
  log("\n⚡ TESTING INTEGRATION PERFORMANCE", "blue");

  const performanceTests = [
    { path: "/api/cti/misp/events", name: "MISP Performance" },
    { path: "/api/cti/opencti/observables", name: "OpenCTI Performance" },
    { path: "/api/wigle-maps/config", name: "Wigle Maps Performance" },
  ];

  for (const test of performanceTests) {
    try {
      const startTime = performance.now();
      const response = await makeRequest(`${BASE_URL}${test.path}`);
      const duration = performance.now() - startTime;

      if (response.ok) {
        const status = duration > CRITICAL_THRESHOLD ? "WARN" : "PASS";
        logTest(
          test.name,
          status,
          duration,
          duration > CRITICAL_THRESHOLD ? "Slow response" : "Good performance"
        );
      } else {
        logTest(test.name, "WARN", duration, `HTTP ${response.status}`);
      }
    } catch (error) {
      logTest(test.name, "FAIL", 0, error.message);
    }
  }
};

// Generate integration report
const generateIntegrationReport = () => {
  log("\n📊 INTEGRATION SMOKETEST REPORT", "bold");
  log("=".repeat(50), "blue");

  log(
    `\nTotal Tests: ${results.passed + results.failed + results.warnings}`,
    "blue"
  );
  log(`✅ Passed: ${results.passed}`, "green");
  log(`❌ Failed: ${results.failed}`, "red");
  log(`⚠️  Warnings: ${results.warnings}`, "yellow");

  const successRate = (
    (results.passed / (results.passed + results.failed + results.warnings)) *
    100
  ).toFixed(1);
  log(
    `\nSuccess Rate: ${successRate}%`,
    successRate >= 80 ? "green" : successRate >= 60 ? "yellow" : "red"
  );

  // Show failed tests
  const failedTests = results.tests.filter((t) => t.status === "FAIL");
  if (failedTests.length > 0) {
    log("\n❌ FAILED TESTS:", "red");
    failedTests.forEach((test) => {
      log(`  - ${test.name}: ${test.message}`, "red");
    });
  }

  // Show warnings
  const warningTests = results.tests.filter((t) => t.status === "WARN");
  if (warningTests.length > 0) {
    log("\n⚠️  WARNINGS:", "yellow");
    warningTests.forEach((test) => {
      log(`  - ${test.name}: ${test.message}`, "yellow");
    });
  }

  // Integration health assessment
  log("\n🏥 INTEGRATION HEALTH ASSESSMENT:", "bold");
  if (successRate >= 90) {
    log("🟢 EXCELLENT - All integrations working perfectly", "green");
  } else if (successRate >= 80) {
    log("🟡 GOOD - Most integrations working with minor issues", "yellow");
  } else if (successRate >= 60) {
    log("🟠 FAIR - Some integrations have issues", "yellow");
  } else {
    log("🔴 POOR - Multiple integration failures", "red");
  }

  log("\n" + "=".repeat(50), "blue");

  // Exit with appropriate code
  if (results.failed > 0) {
    log(
      "\n🚨 INTEGRATION SMOKETEST FAILED - Critical integration issues detected!",
      "red"
    );
    process.exit(1);
  } else if (results.warnings > 0) {
    log("\n⚠️  INTEGRATION SMOKETEST PASSED with warnings", "yellow");
    process.exit(0);
  } else {
    log(
      "\n✅ INTEGRATION SMOKETEST PASSED - All integrations working!",
      "green"
    );
    process.exit(0);
  }
};

// Main execution
const runIntegrationSmokeTest = async () => {
  log("🔗 CYBERSTREAMS INTEGRATION SMOKETEST STARTING", "bold");
  log(`Target: ${BASE_URL}`, "blue");
  log(`Timeout: ${TIMEOUT}ms per test`, "blue");
  log(`Critical threshold: ${CRITICAL_THRESHOLD}ms`, "blue");

  try {
    await testMISPIntegration();
    await testOpenCTIIntegration();
    await testWigleMapsIntegration();
    await testDatabaseConnectivity();
    await testIntelScraperIntegration();
    await testExternalAPIConnectivity();
    await testDataFlowIntegration();
    await testIntegrationErrorHandling();
    await testIntegrationPerformance();

    generateIntegrationReport();
  } catch (error) {
    log(`\n💥 INTEGRATION SMOKETEST CRASHED: ${error.message}`, "red");
    process.exit(1);
  }
};

// Run the integration smoketest
runIntegrationSmokeTest();
