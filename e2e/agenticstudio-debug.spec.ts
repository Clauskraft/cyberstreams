import { test, expect } from "@playwright/test";

test.describe("AgenticStudio Module Test", () => {
  test("Check if AgenticStudio tab appears in navigation", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Check all navigation buttons
    const navButtons = page.locator("nav button");
    const buttonCount = await navButtons.count();
    console.log(`Found ${buttonCount} navigation buttons`);

    // Get all button texts
    const buttonTexts = [];
    for (let i = 0; i < buttonCount; i++) {
      const text = await navButtons.nth(i).textContent();
      buttonTexts.push(text?.trim());
    }
    console.log("Navigation buttons:", buttonTexts);

    // Check if OSINT Studio is in the list
    const hasOSINTStudio = buttonTexts.includes("OSINT Studio");
    console.log("Has OSINT Studio:", hasOSINTStudio);

    if (hasOSINTStudio) {
      // Try to click on OSINT Studio
      await page.locator('button:has-text("OSINT Studio")').click();
      await page.waitForTimeout(1000);

      // Check if OSINT Studio content loads
      const osintHeader = page.locator('h1:has-text("OSINT Studio")');
      const headerVisible = await osintHeader.isVisible();
      console.log("OSINT Studio header visible:", headerVisible);

      if (headerVisible) {
        console.log("✅ OSINT Studio is working!");
      } else {
        console.log("❌ OSINT Studio tab exists but content not loading");
      }
    } else {
      console.log("❌ OSINT Studio tab not found in navigation");
    }

    // Take screenshot for debugging
    await page.screenshot({ path: "agenticstudio-debug.png", fullPage: true });
  });
});
