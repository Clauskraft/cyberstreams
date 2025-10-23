import crypto from 'crypto';
import fetch from 'node-fetch';

/**
 * MCP Security Tests
 * Comprehensive security testing and validation system
 */

class SecurityTester {
  constructor(baseUrl = 'http://localhost:3003') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.securityVulnerabilities = [];
  }

  /**
   * Run all security tests
   */
  async runAllSecurityTests() {
    console.log('[Security Tester] Starting comprehensive security tests...');

    const tests = [
      this.testAuthentication(),
      this.testAuthorization(),
      this.testInputValidation(),
      this.testRateLimiting(),
      this.testSecurityHeaders(),
      this.testSQLInjection(),
      this.testXSSProtection(),
      this.testCSRFProtection(),
      this.testDataEncryption(),
      this.testSessionSecurity(),
      this.testAPISecurity(),
      this.testNetworkSecurity(),
    ];

    const results = await Promise.allSettled(tests);
    
    this.generateSecurityReport();
    return this.testResults;
  }

  /**
   * Test authentication mechanisms
   */
  async testAuthentication() {
    console.log('[Security Test] Testing authentication...');
    
    const tests = [
      {
        name: 'Missing token should return 401',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/secure-endpoint`);
          return response.status === 401;
        }
      },
      {
        name: 'Invalid token should return 403',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/secure-endpoint`, {
            headers: { 'Authorization': 'Bearer invalid-token' }
          });
          return response.status === 403;
        }
      },
      {
        name: 'Valid token should allow access',
        test: async () => {
          const token = this.generateTestToken();
          const response = await fetch(`${this.baseUrl}/api/secure-endpoint`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return response.status === 200;
        }
      }
    ];

    await this.runTestSuite('Authentication', tests);
  }

  /**
   * Test authorization mechanisms
   */
  async testAuthorization() {
    console.log('[Security Test] Testing authorization...');
    
    const tests = [
      {
        name: 'User role should not access admin endpoints',
        test: async () => {
          const userToken = this.generateTestToken({ role: 'user' });
          const response = await fetch(`${this.baseUrl}/api/admin-only`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          return response.status === 403;
        }
      },
      {
        name: 'Admin role should access admin endpoints',
        test: async () => {
          const adminToken = this.generateTestToken({ role: 'admin' });
          const response = await fetch(`${this.baseUrl}/api/admin-only`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
          });
          return response.status === 200;
        }
      }
    ];

    await this.runTestSuite('Authorization', tests);
  }

  /**
   * Test input validation
   */
  async testInputValidation() {
    console.log('[Security Test] Testing input validation...');
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'DROP TABLE users;',
      '../../../etc/passwd',
      '${7*7}',
      '{{7*7}}',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
    ];

    const tests = maliciousInputs.map(input => ({
      name: `Malicious input should be sanitized: ${input.substring(0, 20)}...`,
      test: async () => {
        const response = await fetch(`${this.baseUrl}/api/input-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input })
        });
        return response.status === 400 || response.status === 422;
      }
    }));

    await this.runTestSuite('Input Validation', tests);
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    console.log('[Security Test] Testing rate limiting...');
    
    const tests = [
      {
        name: 'Rate limit should be enforced',
        test: async () => {
          const promises = Array(110).fill().map(() => 
            fetch(`${this.baseUrl}/api/rate-limited`)
          );
          
          const responses = await Promise.all(promises);
          const rateLimitedResponses = responses.filter(r => r.status === 429);
          
          return rateLimitedResponses.length > 0;
        }
      }
    ];

    await this.runTestSuite('Rate Limiting', tests);
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders() {
    console.log('[Security Test] Testing security headers...');
    
    const tests = [
      {
        name: 'X-Frame-Options should be set',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          return response.headers.get('X-Frame-Options') === 'DENY';
        }
      },
      {
        name: 'X-Content-Type-Options should be set',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          return response.headers.get('X-Content-Type-Options') === 'nosniff';
        }
      },
      {
        name: 'X-XSS-Protection should be set',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          return response.headers.get('X-XSS-Protection') === '1; mode=block';
        }
      },
      {
        name: 'Strict-Transport-Security should be set',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          return response.headers.get('Strict-Transport-Security')?.includes('max-age');
        }
      }
    ];

    await this.runTestSuite('Security Headers', tests);
  }

  /**
   * Test SQL injection protection
   */
  async testSQLInjection() {
    console.log('[Security Test] Testing SQL injection protection...');
    
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' OR 1=1 --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
    ];

    const tests = sqlInjectionPayloads.map(payload => ({
      name: `SQL injection should be blocked: ${payload.substring(0, 20)}...`,
      test: async () => {
        const response = await fetch(`${this.baseUrl}/api/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: payload })
        });
        return response.status === 400 || response.status === 422;
      }
    }));

    await this.runTestSuite('SQL Injection Protection', tests);
  }

  /**
   * Test XSS protection
   */
  async testXSSProtection() {
    console.log('[Security Test] Testing XSS protection...');
    
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
    ];

    const tests = xssPayloads.map(payload => ({
      name: `XSS payload should be sanitized: ${payload.substring(0, 20)}...`,
      test: async () => {
        const response = await fetch(`${this.baseUrl}/api/comment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: payload })
        });
        return response.status === 400 || response.status === 422;
      }
    }));

    await this.runTestSuite('XSS Protection', tests);
  }

  /**
   * Test CSRF protection
   */
  async testCSRFProtection() {
    console.log('[Security Test] Testing CSRF protection...');
    
    const tests = [
      {
        name: 'CSRF token should be required for state-changing operations',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/update-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'test' })
          });
          return response.status === 403;
        }
      }
    ];

    await this.runTestSuite('CSRF Protection', tests);
  }

  /**
   * Test data encryption
   */
  async testDataEncryption() {
    console.log('[Security Test] Testing data encryption...');
    
    const tests = [
      {
        name: 'Sensitive data should be encrypted',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/user-data`);
          const data = await response.json();
          
          // Check if sensitive fields are encrypted
          return data.password === undefined || data.password.startsWith('$2b$');
        }
      }
    ];

    await this.runTestSuite('Data Encryption', tests);
  }

  /**
   * Test session security
   */
  async testSessionSecurity() {
    console.log('[Security Test] Testing session security...');
    
    const tests = [
      {
        name: 'Session cookies should be httpOnly',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' })
          });
          
          const setCookie = response.headers.get('Set-Cookie');
          return setCookie?.includes('HttpOnly');
        }
      },
      {
        name: 'Session cookies should be secure in production',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password' })
          });
          
          const setCookie = response.headers.get('Set-Cookie');
          return setCookie?.includes('Secure') || process.env.NODE_ENV !== 'production';
        }
      }
    ];

    await this.runTestSuite('Session Security', tests);
  }

  /**
   * Test API security
   */
  async testAPISecurity() {
    console.log('[Security Test] Testing API security...');
    
    const tests = [
      {
        name: 'API should require authentication',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/secure-data`);
          return response.status === 401;
        }
      },
      {
        name: 'API should validate content type',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/data`, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: 'invalid data'
          });
          return response.status === 400 || response.status === 415;
        }
      }
    ];

    await this.runTestSuite('API Security', tests);
  }

  /**
   * Test network security
   */
  async testNetworkSecurity() {
    console.log('[Security Test] Testing network security...');
    
    const tests = [
      {
        name: 'Server should not expose sensitive information in headers',
        test: async () => {
          const response = await fetch(`${this.baseUrl}/api/health`);
          const headers = response.headers;
          
          const sensitiveHeaders = ['server', 'x-powered-by', 'x-aspnet-version'];
          return !sensitiveHeaders.some(header => headers.get(header));
        }
      }
    ];

    await this.runTestSuite('Network Security', tests);
  }

  /**
   * Run a test suite
   */
  async runTestSuite(suiteName, tests) {
    const suiteResults = {
      suite: suiteName,
      tests: [],
      passed: 0,
      failed: 0,
      total: tests.length
    };

    for (const test of tests) {
      try {
        const result = await test.test();
        const testResult = {
          name: test.name,
          passed: result,
          error: null
        };
        
        suiteResults.tests.push(testResult);
        if (result) {
          suiteResults.passed++;
        } else {
          suiteResults.failed++;
          this.securityVulnerabilities.push({
            suite: suiteName,
            test: test.name,
            severity: 'medium'
          });
        }
      } catch (error) {
        suiteResults.tests.push({
          name: test.name,
          passed: false,
          error: error.message
        });
        suiteResults.failed++;
        this.securityVulnerabilities.push({
          suite: suiteName,
          test: test.name,
          severity: 'high',
          error: error.message
        });
      }
    }

    this.testResults.push(suiteResults);
    console.log(`[Security Test] ${suiteName}: ${suiteResults.passed}/${suiteResults.total} tests passed`);
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const totalTests = this.testResults.reduce((sum, suite) => sum + suite.total, 0);
    const totalPassed = this.testResults.reduce((sum, suite) => sum + suite.passed, 0);
    const totalFailed = this.testResults.reduce((sum, suite) => sum + suite.failed, 0);
    
    const report = {
      summary: {
        totalTests,
        passed: totalPassed,
        failed: totalFailed,
        passRate: (totalPassed / totalTests * 100).toFixed(2) + '%',
        vulnerabilities: this.securityVulnerabilities.length
      },
      testSuites: this.testResults,
      vulnerabilities: this.securityVulnerabilities,
      recommendations: this.generateRecommendations(),
      generatedAt: new Date().toISOString()
    };

    console.log('\n[Security Report]');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`Vulnerabilities: ${this.securityVulnerabilities.length}`);

    return report;
  }

  /**
   * Generate security recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    if (this.securityVulnerabilities.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        recommendation: 'Address identified security vulnerabilities immediately'
      });
    }

    const failedSuites = this.testResults.filter(suite => suite.failed > 0);
    if (failedSuites.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'testing',
        recommendation: 'Review and fix failed security tests'
      });
    }

    return recommendations;
  }

  /**
   * Generate test token
   */
  generateTestToken(payload = {}) {
    const defaultPayload = {
      userId: 'test-user',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    const tokenPayload = { ...defaultPayload, ...payload };
    return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
  }
}

export default SecurityTester;


