import { test, expect } from "@playwright/test";

test.describe("Console Error Detection", () => {
  test("Check for console errors that prevent AgenticStudio loading", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      } else if (msg.type() === "warning") {
        consoleWarnings.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    page.on("pageerror", (err) => {
      consoleErrors.push(`[pageerror] ${err.message}`);
    });

    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    console.log("Console errors:", consoleErrors);
    console.log("Console warnings:", consoleWarnings);

    // Check if there are any errors related to AgenticStudio
    const agenticErrors = consoleErrors.filter(
      (err) =>
        err.toLowerCase().includes("agentic") ||
        err.toLowerCase().includes("agenticstudio")
    );

    if (agenticErrors.length > 0) {
      console.log("AgenticStudio related errors:", agenticErrors);
    }

    // Take screenshot
    await page.screenshot({ path: "console-errors-debug.png", fullPage: true });
  });
});
