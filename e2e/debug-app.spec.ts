import { test, expect } from "@playwright/test";

test.describe("Debug React App Loading", () => {
  test("Check console errors and React rendering", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000); // Wait for React to load

    // Check if root div exists
    const root = page.locator("#root");
    await expect(root).toBeVisible();

    // Check if any content is rendered
    const content = await root.textContent();
    console.log("Root content:", content);

    // Check for navigation
    const nav = page.locator("nav");
    if ((await nav.count()) > 0) {
      const navText = await nav.textContent();
      console.log("Navigation content:", navText);
    }

    // Log console errors
    if (consoleErrors.length > 0) {
      console.log("Console errors:", consoleErrors);
    }

    // Take screenshot for debugging
    await page.screenshot({ path: "debug-app-loading.png", fullPage: true });
  });
});
