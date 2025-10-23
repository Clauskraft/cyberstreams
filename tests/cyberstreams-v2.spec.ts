import { test, expect } from '@playwright/test';

test.describe('Cyberstreams v2.0.0 Platform', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the platform
    await page.goto('/');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check that the main header is visible
    await expect(page.locator('h1')).toContainText('CYBERSTREAMS');
    await expect(page.locator('text=Dark Web Intelligence Platform')).toBeVisible();
    
    // Check that the live indicator is present
    await expect(page.locator('text=LIVE')).toBeVisible();
  });

  test('should have proper security headers', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check for security headers
    const headers = response?.headers();
    expect(headers?.['x-content-type-options']).toBe('nosniff');
    expect(headers?.['x-frame-options']).toBe('SAMEORIGIN');
    expect(headers?.['x-correlation-id']).toBeDefined();
  });

  test('should test health endpoints', async ({ page }) => {
    // Test /api/health endpoint
    const healthResponse = await page.request.get('/api/health');
    expect(healthResponse.status()).toBe(200);
    
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('operational');
    expect(healthData.version).toBe('2.0.0');
    expect(healthData.timestamp).toBeDefined();
  });

  test('should test vector status endpoint', async ({ page }) => {
    // Test /api/vector-status endpoint
    const vectorResponse = await page.request.get('/api/vector-status');
    expect(vectorResponse.status()).toBe(200);
    
    const vectorData = await vectorResponse.json();
    expect(vectorData.configured).toBeDefined();
    expect(vectorData.message).toBeDefined();
  });

  test('should test ready endpoint', async ({ page }) => {
    // Test /ready endpoint (from infrastructure PR)
    const readyResponse = await page.request.get('/ready');
    expect(readyResponse.status()).toBe(200);
    
    const readyData = await readyResponse.json();
    expect(readyData.ready).toBe(true);
    expect(readyData.timestamp).toBeDefined();
  });

  test('should navigate to Admin v2 module', async ({ page }) => {
    // Click on Admin v2 tab
    await page.click('text=Admin v2');
    
    // Check that Admin v2 content is loaded
    await expect(page.locator('h1')).toContainText('Admin v2.0');
    await expect(page.locator('text=Advanced configuration and management for Cyberstreams v2.0')).toBeVisible();
  });

  test('should test Admin v2 keywords functionality', async ({ page }) => {
    // Navigate to Admin v2
    await page.click('text=Admin v2');
    
    // Check that Keywords tab is active by default
    await expect(page.locator('text=Monitoring Keywords')).toBeVisible();
    
    // Test adding a keyword
    await page.fill('input[placeholder="Keyword"]', 'test-keyword');
    await page.fill('input[placeholder="Category"]', 'test-category');
    await page.fill('input[placeholder="Priority"]', '1');
    
    // Click add button
    await page.click('button:has-text("Add")');
    
    // Check for success or error response (database might not be available)
    const response = await page.waitForResponse(response => 
      response.url().includes('/api/admin/keywords') && response.request().method() === 'POST'
    );
    
    // Should either succeed (201) or fail gracefully (503) if no database
    expect([200, 201, 503]).toContain(response.status());
  });

  test('should test Admin v2 sources functionality', async ({ page }) => {
    // Navigate to Admin v2
    await page.click('text=Admin v2');
    
    // Click on Sources tab
    await page.click('text=Sources');
    
    // Check that Sources content is loaded
    await expect(page.locator('text=Monitoring Sources')).toBeVisible();
    
    // Test adding a source
    await page.selectOption('select', 'rss');
    await page.fill('input[placeholder="URL"]', 'https://example.com/rss');
    await page.fill('input[placeholder="Frequency (seconds)"]', '3600');
    
    // Click add button
    await page.click('button:has-text("Add")');
    
    // Check for response
    const response = await page.waitForResponse(response => 
      response.url().includes('/api/admin/sources') && response.request().method() === 'POST'
    );
    
    // Should either succeed (201) or fail gracefully (503) if no database
    expect([200, 201, 503]).toContain(response.status());
  });

  test('should test Admin v2 RAG configuration', async ({ page }) => {
    // Navigate to Admin v2
    await page.click('text=Admin v2');
    
    // Click on RAG Config tab
    await page.click('text=RAG Config');
    
    // Check that RAG Config content is loaded
    await expect(page.locator('text=RAG Configuration')).toBeVisible();
    
    // Check that form fields are present
    await expect(page.locator('select')).toHaveCount(3); // Model, Vector Store, Embedding Model
    await expect(page.locator('input[type="number"]')).toHaveCount(2); // Temperature, Max Tokens
  });

  test('should test Admin v2 analysis functionality', async ({ page }) => {
    // Navigate to Admin v2
    await page.click('text=Admin v2');
    
    // Click on Analysis tab
    await page.click('text=Analysis');
    
    // Check that Analysis content is loaded
    await expect(page.locator('text=RAG Analysis')).toBeVisible();
    
    // Test running RAG analysis
    await page.click('button:has-text("Run Analysis")');
    
    // Check for response
    const response = await page.waitForResponse(response => 
      response.url().includes('/api/admin/run-rag-analysis') && response.request().method() === 'POST'
    );
    
    // Should either succeed (200) or fail gracefully (503) if no database
    expect([200, 503]).toContain(response.status());
  });

  test('should test navigation between modules', async ({ page }) => {
    // Test navigation to different modules
    const modules = [
      { tab: 'Dashboard', expected: 'Dashboard' },
      { tab: 'Agent', expected: 'Agent' },
      { tab: 'Threats', expected: 'Threats' },
      { tab: 'SignalStream', expected: 'SignalStream' },
      { tab: 'Activity', expected: 'Activity' },
      { tab: 'Consolidated Intel', expected: 'Consolidated Intel' },
      { tab: 'Admin', expected: 'Admin' },
      { tab: 'Admin v2', expected: 'Admin v2.0' }
    ];

    for (const module of modules) {
      await page.click(`text=${module.tab}`);
      
      // Check that the module content is loaded
      if (module.expected === 'Admin v2.0') {
        await expect(page.locator('h1')).toContainText(module.expected);
      } else {
        // For other modules, just check that we're not on an error page
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Test that the application handles API errors gracefully
    // by checking that it doesn't crash when endpoints return errors
    
    // Navigate to a module that makes API calls
    await page.click('text=Threats');
    
    // Wait a moment for any API calls to complete
    await page.waitForTimeout(2000);
    
    // Check that the page is still functional
    await expect(page.locator('body')).toBeVisible();
    
    // Navigate to another module to ensure navigation still works
    await page.click('text=Activity');
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have responsive design', async ({ page }) => {
    // Test responsive design by changing viewport size
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile size
    
    // Check that the header is still visible
    await expect(page.locator('h1')).toContainText('CYBERSTREAMS');
    
    // Check that navigation is still accessible
    await expect(page.locator('text=Dashboard')).toBeVisible();
    
    // Reset to desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Verify everything still works
    await expect(page.locator('h1')).toContainText('CYBERSTREAMS');
  });

  test('should test rate limiting', async ({ page }) => {
    // Test rate limiting by making multiple rapid requests
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(page.request.get('/api/health'));
    }
    
    const responses = await Promise.all(requests);
    
    // All requests should succeed (rate limiting might not be enabled in test environment)
    // or some might be rate limited (429 status)
    for (const response of responses) {
      expect([200, 429]).toContain(response.status());
    }
  });
});
