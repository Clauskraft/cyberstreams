#!/usr/bin/env node

/**
 * MCP Security Test Runner
 * Comprehensive security testing and validation
 */

import SecurityTester from './security-tests.js';
import securityMonitor from './security-monitor.js';
import fs from 'fs/promises';
import path from 'path';

class SecurityTestRunner {
  constructor() {
    this.tester = new SecurityTester();
    this.results = [];
    this.vulnerabilities = [];
  }

  /**
   * Run all security tests
   */
  async runAllTests() {
    console.log('🔒 Starting MCP Security Tests...\n');

    try {
      // Run security tests
      const testResults = await this.tester.runAllSecurityTests();
      this.results = testResults;

      // Generate security report
      const report = this.generateSecurityReport();
      
      // Save report to file
      await this.saveReport(report);
      
      // Display summary
      this.displaySummary(report);

      return report;

    } catch (error) {
      console.error('❌ Security tests failed:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive security report
   */
  generateSecurityReport() {
    const totalTests = this.results.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.results.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.results.reduce((sum, suite) => sum + suite.failed, 0);
    
    const report = {
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        passRate: (totalPassed / totalTests * 100).toFixed(2) + '%',
        vulnerabilities: this.vulnerabilities.length,
        riskLevel: this.calculateRiskLevel(totalFailed, this.vulnerabilities.length)
      },
      testSuites: this.results,
      vulnerabilities: this.vulnerabilities,
      recommendations: this.generateRecommendations(),
      securityMetrics: securityMonitor.getSecurityMetrics(),
      generatedAt: new Date().toISOString()
    };

    return report;
  }

  /**
   * Calculate overall risk level
   */
  calculateRiskLevel(failedTests, vulnerabilities) {
    if (vulnerabilities > 10 || failedTests > 20) return 'CRITICAL';
    if (vulnerabilities > 5 || failedTests > 10) return 'HIGH';
    if (vulnerabilities > 2 || failedTests > 5) return 'MEDIUM';
    if (vulnerabilities > 0 || failedTests > 0) return 'LOW';
    return 'MINIMAL';
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // High priority recommendations
    if (this.vulnerabilities.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        recommendation: 'Address identified security vulnerabilities immediately',
        action: 'Review and fix all failed security tests'
      });
    }

    // Medium priority recommendations
    const failedSuites = this.results.filter(suite => suite.failed > 0);
    if (failedSuites.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Testing',
        recommendation: 'Review and fix failed security tests',
        action: 'Implement missing security controls'
      });
    }

    // Low priority recommendations
    const passRate = (this.results.reduce((sum, suite) => sum + suite.passed, 0) / 
                     this.results.reduce((sum, suite) => sum + suite.total, 0)) * 100;
    
    if (passRate < 100) {
      recommendations.push({
        priority: 'LOW',
        category: 'Improvement',
        recommendation: 'Improve security test coverage',
        action: 'Add additional security tests and controls'
      });
    }

    return recommendations;
  }

  /**
   * Display test summary
   */
  displaySummary(report) {
    console.log('\n📊 Security Test Summary');
    console.log('========================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Vulnerabilities: ${report.summary.vulnerabilities}`);
    console.log(`Risk Level: ${report.summary.riskLevel}`);

    if (report.vulnerabilities.length > 0) {
      console.log('\n🚨 Security Vulnerabilities');
      console.log('============================');
      report.vulnerabilities.forEach((vuln, index) => {
        console.log(`${index + 1}. ${vuln.suite}: ${vuln.test}`);
        if (vuln.error) {
          console.log(`   Error: ${vuln.error}`);
        }
      });
    }

    if (report.recommendations.length > 0) {
      console.log('\n💡 Recommendations');
      console.log('==================');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.recommendation}`);
        console.log(`   Action: ${rec.action}`);
      });
    }

    console.log('\n📈 Security Metrics');
    console.log('===================');
    console.log(`Total Events: ${report.securityMetrics.totalEvents}`);
    console.log(`Events Last 24h: ${report.securityMetrics.eventsLast24Hours}`);
    console.log(`Blocked IPs: ${report.securityMetrics.blockedIPs}`);
    console.log(`Top Threat Types: ${report.securityMetrics.topThreatTypes.length}`);
    console.log(`Top Source IPs: ${report.securityMetrics.topSourceIPs.length}`);

    console.log('\n✅ Security tests completed!');
  }

  /**
   * Save report to file
   */
  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `security-report-${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'security-reports', filename);

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(filepath), { recursive: true });

    // Save report
    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Security report saved to: ${filepath}`);

    // Also save a summary file
    const summaryFilename = `security-summary-${timestamp}.md`;
    const summaryFilepath = path.join(process.cwd(), 'security-reports', summaryFilename);
    const summaryContent = this.generateMarkdownSummary(report);
    
    await fs.writeFile(summaryFilepath, summaryContent);
    console.log(`📄 Security summary saved to: ${summaryFilepath}`);
  }

  /**
   * Generate markdown summary
   */
  generateMarkdownSummary(report) {
    return `# MCP Security Test Report

## Summary

- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Pass Rate**: ${report.summary.passRate}
- **Vulnerabilities**: ${report.summary.vulnerabilities}
- **Risk Level**: ${report.summary.riskLevel}
- **Generated**: ${report.generatedAt}

## Test Suites

${report.testSuites.map(suite => `
### ${suite.suite}
- **Total**: ${suite.total}
- **Passed**: ${suite.passed}
- **Failed**: ${suite.failed}
- **Pass Rate**: ${(suite.passed / suite.total * 100).toFixed(2)}%

${suite.tests.map(test => `- ${test.passed ? '✅' : '❌'} ${test.name}`).join('\n')}
`).join('\n')}

## Vulnerabilities

${report.vulnerabilities.length > 0 ? 
  report.vulnerabilities.map((vuln, index) => `
${index + 1}. **${vuln.suite}**: ${vuln.test}
   - Severity: ${vuln.severity}
   ${vuln.error ? `- Error: ${vuln.error}` : ''}
`).join('\n') : 'No vulnerabilities found.'}

## Recommendations

${report.recommendations.map((rec, index) => `
${index + 1}. **[${rec.priority}]** ${rec.recommendation}
   - Category: ${rec.category}
   - Action: ${rec.action}
`).join('\n')}

## Security Metrics

- **Total Events**: ${report.securityMetrics.totalEvents}
- **Events Last 24h**: ${report.securityMetrics.eventsLast24Hours}
- **Blocked IPs**: ${report.securityMetrics.blockedIPs}

### Top Threat Types
${report.securityMetrics.topThreatTypes.map(tt => `- ${tt.type}: ${tt.count}`).join('\n')}

### Top Source IPs
${report.securityMetrics.topSourceIPs.map(ip => `- ${ip.ip}: ${ip.count}`).join('\n')}

---
*Generated by MCP Security Test Runner*
`;
  }
}

// Main execution
async function main() {
  try {
    const runner = new SecurityTestRunner();
    const report = await runner.runAllTests();
    
    // Exit with appropriate code
    if (report.summary.riskLevel === 'CRITICAL' || report.summary.riskLevel === 'HIGH') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Security test runner failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SecurityTestRunner;



