import { test, expect } from "@playwright/test";

test.describe("Platform Status After Startkit Loading", () => {
  test("Capture platform state after startkit loading", async ({ page }) => {
    // Navigate to the platform
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Take initial screenshot
    await page.screenshot({
      path: "playwright-report/after-startkit-initial.png",
      fullPage: true,
    });

    // Check if OSINT Studio tab exists
    const osintTab = page.locator('button:has-text("OSINT Studio")');
    const hasOSINTStudio = await osintTab.isVisible();

    if (hasOSINTStudio) {
      console.log("✅ OSINT Studio tab found");

      // Click on OSINT Studio
      await osintTab.click();
      await page.waitForTimeout(2000);

      // Take screenshot of OSINT Studio
      await page.screenshot({
        path: "playwright-report/after-startkit-osint-studio.png",
        fullPage: true,
      });

      // Check for key elements in OSINT Studio (use more specific selectors)
      const osintStudioContent = page.locator("main");
      const dashboardTab = osintStudioContent
        .locator('button:has-text("Dashboard")')
        .first();
      const sourcesTab = osintStudioContent
        .locator('button:has-text("OSINT Sources")')
        .first();
      const toolsTab = osintStudioContent
        .locator('button:has-text("Tools")')
        .first();
      const runsTab = osintStudioContent
        .locator('button:has-text("Agent Runs")')
        .first();
      const aiModelsTab = osintStudioContent
        .locator('button:has-text("AI Models")')
        .first();

      console.log("Dashboard tab visible:", await dashboardTab.isVisible());
      console.log("Sources tab visible:", await sourcesTab.isVisible());
      console.log("Tools tab visible:", await toolsTab.isVisible());
      console.log("Runs tab visible:", await runsTab.isVisible());
      console.log("AI Models tab visible:", await aiModelsTab.isVisible());

      // Click on Dashboard tab
      if (await dashboardTab.isVisible()) {
        await dashboardTab.click();
        await page.waitForTimeout(2000);

        // Take screenshot of Dashboard
        await page.screenshot({
          path: "playwright-report/after-startkit-dashboard.png",
          fullPage: true,
        });

        // Check for status indicators
        const osintStatus = page.locator("text=OSINT Scraper Status");
        const ollamaStatus = page.locator("text=Ollama Status");
        const pendingApprovals = page.locator("text=Pending Approvals");

        console.log("OSINT Status visible:", await osintStatus.isVisible());
        console.log("Ollama Status visible:", await ollamaStatus.isVisible());
        console.log(
          "Pending Approvals visible:",
          await pendingApprovals.isVisible()
        );
      }

      // Click on OSINT Sources tab
      if (await sourcesTab.isVisible()) {
        await sourcesTab.click();
        await page.waitForTimeout(2000);

        // Take screenshot of Sources
        await page.screenshot({
          path: "playwright-report/after-startkit-sources.png",
          fullPage: true,
        });

        // Check for loaded sources
        const sourceCards = page.locator('[class*="bg-gray-800"]');
        const sourceCount = await sourceCards.count();
        console.log(`Found ${sourceCount} source cards`);
      }

      // Click on AI Models tab
      if (await aiModelsTab.isVisible()) {
        await aiModelsTab.click();
        await page.waitForTimeout(2000);

        // Take screenshot of AI Models
        await page.screenshot({
          path: "playwright-report/after-startkit-ai-models.png",
          fullPage: true,
        });

        // Check for Ollama models
        const modelCards = page.locator('[class*="bg-gray-800"]');
        const modelCount = await modelCards.count();
        console.log(`Found ${modelCount} model cards`);
      }
    } else {
      console.log("❌ OSINT Studio tab not found");

      // Check what tabs are available
      const navButtons = page.locator("nav button");
      const buttonCount = await navButtons.count();
      console.log(`Found ${buttonCount} navigation buttons`);

      for (let i = 0; i < buttonCount; i++) {
        const text = await navButtons.nth(i).textContent();
        console.log(`Tab ${i}: ${text}`);
      }
    }

    // Take final screenshot
    await page.screenshot({
      path: "playwright-report/after-startkit-final.png",
      fullPage: true,
    });

    console.log("✅ Screenshots captured successfully");
  });
});
