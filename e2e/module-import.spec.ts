import { test, expect } from "@playwright/test";

test.describe("Module Import Test", () => {
  test("Test if AgenticStudio can be imported", async ({ page }) => {
    // Try to access the module directly
    const response = await page.goto(
      "http://localhost:5173/src/modules/AgenticStudio.tsx"
    );
    console.log("Module response status:", response?.status());

    // Check if the module content is accessible
    const content = await page.content();
    console.log("Module content length:", content.length);

    // Check for specific exports
    const hasExport = content.includes("export default AgenticStudio");
    console.log("Has export default:", hasExport);

    // Check for React component
    const hasReact = content.includes("const AgenticStudio");
    console.log("Has React component:", hasReact);
  });
});
