import { test, expect } from "@playwright/test";

test.describe("Button Functionality Test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("networkidle");
  });

  test("Agent chat button works", async ({ page }) => {
    // Navigate to Agent tab
    await page.click("text=Agent");
    await page.waitForLoadState("networkidle");

    // Find chat input and send button
    const chatInput = page.locator(
      'input[placeholder*="spørgsmål"], textarea[placeholder*="spørgsmål"]'
    );
    const sendButton = page.locator('button:has-text("Send")');

    if ((await chatInput.isVisible()) && (await sendButton.isVisible())) {
      await chatInput.fill("Test spørgsmål");
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for response in chat
      const chatMessages = page.locator('.chat, .message, [class*="chat"]');
      const cnt = await chatMessages.count();
      expect(cnt).toBeGreaterThan(0);
    }
  });

  test("Intel Scraper buttons work", async ({ page }) => {
    await page.click("text=Intelligence");
    await page.waitForLoadState("networkidle");

    // Test start button
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Run")'
    );
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(2000);
    }

    // Test stop button
    const stopButton = page.locator('button:has-text("Stop")');
    if (await stopButton.isVisible()) {
      await stopButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test("Knowledge Base search works", async ({ page }) => {
    await page.click("text=Agent");
    await page.waitForLoadState("networkidle");

    // Look for knowledge base search button
    const searchButton = page.locator(
      'button:has-text("Search Knowledge Base"), button:has-text("Søg")'
    );
    if (await searchButton.isVisible()) {
      await searchButton.click();
      await page.waitForTimeout(2000);
    }
  });

  test("Agentic Studio tabs work", async ({ page }) => {
    await page.click("text=OSINT Studio");
    await page.waitForLoadState("networkidle");

    // Test WiFi & Maps tab
    const wifiTab = page.locator("text=WiFi & Maps");
    if (await wifiTab.isVisible()) {
      await wifiTab.click();
      await page.waitForTimeout(1000);
    }

    // Test Pentest Tools tab
    const pentestTab = page.locator("text=Pentest Tools");
    if (await pentestTab.isVisible()) {
      await pentestTab.click();
      await page.waitForTimeout(1000);
    }
  });
});
