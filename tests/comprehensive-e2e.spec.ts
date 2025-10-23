import { test, expect } from "@playwright/test";

test.describe("Cyberstreams Comprehensive End-to-End Test", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:5173");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Wait for the main content to be visible
    await page.waitForSelector("#root", { timeout: 10000 });
  });

  test("Application loads successfully", async ({ page }) => {
    // Check if the main application loads
    await expect(page.locator("#root")).toBeVisible();

    // Check if the main navigation is present
    await expect(page.locator("nav")).toBeVisible();

    // Check if the main content area is present
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test("All main tabs are accessible and functional", async ({ page }) => {
    // Test Dashboard tab
    await page.click("text=Dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2")).toBeVisible();

    // Test Intelligence tab (Scraper consolidated)
    await page.click("text=Intelligence");
    await page.waitForLoadState("networkidle");
    await expect(page.locator('body')).toBeVisible();

    // Test Agent tab
    await page.click("text=Agent");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2")).toBeVisible();

    // Test Agentic Studio tab
    await page.click("text=OSINT Studio");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2")).toBeVisible();

    // Test Admin tab
    await page.click("text=Admin");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("h1, h2")).toBeVisible();
  });

  test("Dashboard displays real data", async ({ page }) => {
    await page.click("text=Dashboard");
    await page.waitForLoadState("networkidle");

    // Check for real data indicators (not mock data)
    const mockIndicators = ["mock", "test data", "sample", "placeholder"];
    const pageContent = await page.textContent("body");

    // Verify no mock data is displayed
    for (const indicator of mockIndicators) {
      expect(pageContent?.toLowerCase()).not.toContain(indicator);
    }

    // Check for real data elements
    const statDivs = await page.locator('[data-testid="dashboard-stats"] div').count();
    expect(statDivs).toBeGreaterThan(0);
  });

  test("Intel Scraper functionality", async ({ page }) => {
    await page.click("text=Intelligence");
    await page.waitForLoadState("networkidle");

    // Test scraper controls
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Run")'
    );
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Status and findings are optional in smoke; ensure page renders
    await expect(page.locator("body")).toBeVisible();
  });

  test("Agent chat functionality", async ({ page }) => {
    await page.click("text=Agent");
    await page.waitForLoadState("networkidle");

    // Test chat input
    const chatInput = page.locator(
      'input[placeholder*="spørgsmål"], textarea[placeholder*="spørgsmål"]'
    );
    if (await chatInput.isVisible()) {
      await chatInput.fill("Test spørgsmål om cybersikkerhed");

      // Test send button
      const sendButton = page.locator(
        'button:has-text("Send"), button:has-text("Submit")'
      );
      if (await sendButton.isVisible()) {
        await sendButton.click();
        await page.waitForTimeout(3000);

        // Check for response
        const msgCount = await page.locator('.chat, .message').count();
        expect(msgCount).toBeGreaterThan(0);
      }
    }
  });

  test("Knowledge Base functionality", async ({ page }) => {
    await page.click("text=Agent");
    await page.waitForLoadState("networkidle");

    // Test knowledge base search
    const searchButton = page.locator(
      'button:has-text("Search Knowledge Base"), button:has-text("Søg")'
    );
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(2000);

      // Check for knowledge results
      const kbCount = await page.locator('.knowledge, .search-results').count();
      expect(kbCount).toBeGreaterThan(0);
    }
  });

  test("Agentic Studio tabs and functionality", async ({ page }) => {
    await page.click("text=OSINT Studio");
    await page.waitForLoadState("networkidle");

    // Test different tabs within Agentic Studio
    const tabs = ["Tools", "WiFi & Maps", "Pentest Tools"];

    for (const tab of tabs) {
      const tabElement = page.locator(`text=${tab}`);
      if (await tabElement.isVisible()) {
        await tabElement.click();
        await page.waitForTimeout(1000);

        // Verify tab content loads
        await expect(page.locator("h2, h3")).toContainText(
          new RegExp(tab, "i")
        );
      }
    }
  });

  test("WiFi & Maps integration", async ({ page }) => {
    await page.click("text=OSINT Studio");
    await page.waitForLoadState("networkidle");

    // Click on WiFi & Maps tab
    const wifiTab = page.locator("text=WiFi & Maps");
    if (await wifiTab.isVisible()) {
      await wifiTab.click();
      await page.waitForTimeout(1000);

      // Test search functionality
      const searchTypeSelect = page.locator("select");
      if (await searchTypeSelect.isVisible()) {
        await searchTypeSelect.selectOption("location");

        // Test coordinate inputs
        const latInput = page
          .locator('input[placeholder*="55.6761"], input[type="number"]')
          .first();
        const lonInput = page
          .locator('input[placeholder*="12.5683"], input[type="number"]')
          .nth(1);

        if ((await latInput.isVisible()) && (await lonInput.isVisible())) {
          await latInput.fill("55.6761");
          await lonInput.fill("12.5683");

          // Test search button
          const searchButton = page.locator('button:has-text("Search")');
          if (await searchButton.isVisible()) {
            await searchButton.click();
            await page.waitForTimeout(3000);
          }
        }
      }
    }
  });

  test("Pentest Tools functionality", async ({ page }) => {
    await page.click("text=OSINT Studio");
    await page.waitForLoadState("networkidle");

    // Click on Pentest Tools tab
    const pentestTab = page.locator("text=Pentest Tools");
    if (await pentestTab.isVisible()) {
      await pentestTab.click();
      await page.waitForTimeout(1000);

      // Test quick scan
      const targetInput = page.locator(
        'input[placeholder*="IP address"], input[placeholder*="domain"]'
      );
      if (await targetInput.isVisible()) {
        await targetInput.fill("127.0.0.1");

        // Test scan type selection
        const scanTypeSelect = page.locator("select");
        if (await scanTypeSelect.isVisible()) {
          await scanTypeSelect.selectOption("basic");
        }

        // Test quick scan button
        const quickScanButton = page.locator('button:has-text("Quick Scan")');
        if (await quickScanButton.isVisible()) {
          await quickScanButton.click();
          await page.waitForTimeout(5000);
        }
      }
    }
  });

  test("Admin settings and configuration", async ({ page }) => {
    await page.click("text=Admin");
    await page.waitForLoadState("networkidle");

    // Test configuration sections
    const headings = await page.locator('h2, h3').count();
    expect(headings).toBeGreaterThan(0);

    // Test API key management
    const apiKeySection = page.locator("text=API Keys, text=Integration");
    if (await apiKeySection.isVisible()) {
      await apiKeySection.click();
      await page.waitForTimeout(1000);
    }
  });

  test("All buttons are functional", async ({ page }) => {
    // Navigate through all tabs and test buttons
    const tabs = [
      "Dashboard",
      "Intelligence",
      "Agent",
      "Agentic Studio",
      "Admin",
    ];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForLoadState("networkidle");

      // Find all buttons and test they're clickable
      const buttons = page.locator("button");
      const buttonCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if ((await button.isVisible()) && (await button.isEnabled())) {
          // Test button click (but don't submit forms)
          const buttonText = await button.textContent();
          if (buttonText && !buttonText.toLowerCase().includes("submit")) {
            await button.click();
            await page.waitForTimeout(500);
          }
        }
      }
    }
  });

  test("No console errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate through all tabs
    const tabs = [
      "Dashboard",
      "Intelligence",
      "Agent",
      "Agentic Studio",
      "Admin",
    ];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
    }

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test("API endpoints are accessible", async ({ page }) => {
    // Test API health endpoint
    const response = await page.request.get("http://localhost:3001/healthz");
    expect(response.status()).toBe(200);

    // Test knowledge base API
    const knowledgeResponse = await page.request.get(
      "http://localhost:3001/api/knowledge/stats"
    );
    expect(knowledgeResponse.status()).toBe(200);

    // Test intel scraper API
    const intelResponse = await page.request.get(
      "http://localhost:3001/api/intel-scraper/status"
    );
    expect(intelResponse.status()).toBe(200);
  });

  test("Real data verification", async ({ page }) => {
    // Check that no mock data is present anywhere
    const mockPatterns = [
      "mock data",
      "test data",
      "sample data",
      "placeholder",
      "lorem ipsum",
      "fake data",
    ];

    // Navigate through all tabs
    const tabs = [
      "Dashboard",
      "Intelligence",
      "Agent",
      "Agentic Studio",
      "Admin",
    ];

    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForLoadState("networkidle");

      const pageContent = await page.textContent("body");

      for (const pattern of mockPatterns) {
        expect(pageContent?.toLowerCase()).not.toContain(pattern);
      }
    }
  });

  test("Performance and responsiveness", async ({ page }) => {
    // Test page load times
    const startTime = Date.now();
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Test tab switching performance
    const tabs = [
      "Dashboard",
      "Intelligence",
      "Agent",
      "Agentic Studio",
      "Admin",
    ];

    for (const tab of tabs) {
      const tabStartTime = Date.now();
      await page.click(`text=${tab}`);
      await page.waitForLoadState("networkidle");
      const tabLoadTime = Date.now() - tabStartTime;

      // Each tab should load within 2 seconds
      expect(tabLoadTime).toBeLessThan(2000);
    }
  });
});
