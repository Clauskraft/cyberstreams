import { test, expect } from "@playwright/test";

test.describe("AgenticStudio UI Tests", () => {
  test("AgenticStudio tab exists and loads", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Check if Agentic/OSINT Studio tab exists (support both labels)
    const agenticTab = page.locator(
      'button:has-text("OSINT Studio"), button:has-text("AgenticStudio")'
    );
    await expect(agenticTab).toBeVisible();

    // Click on AgenticStudio tab
    await agenticTab.click();
    await page.waitForTimeout(1000);

    // Check if Agentic/OSINT Studio content loads
    const agenticHeader = page.locator(
      'h1:has-text("OSINT Studio"), h1:has-text("AgenticStudio")'
    );
    await expect(agenticHeader).toBeVisible();

    // Check if tabs exist (disambiguate duplicates)
    await expect(
      page.getByRole("button", { name: "Dashboard" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "OSINT Sources" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Tools" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Agent Runs" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "AI Models" }).first()
    ).toBeVisible();
  });

  test("Dashboard shows system status", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Agentic/OSINT Studio
    await page
      .locator(
        'button:has-text("OSINT Studio"), button:has-text("AgenticStudio")'
      )
      .click();
    await page.waitForTimeout(1000);

    // Ensure Dashboard tab is active
    await page.getByRole("button", { name: "Dashboard" }).first().click();

    // Check dashboard tiles that exist in UI
    await expect(
      page.locator('h2:has-text("OSINT Scraper Status")')
    ).toBeVisible();
    await expect(page.locator('h2:has-text("Ollama Status")')).toBeVisible();
    await expect(
      page.locator('h2:has-text("Pending Approvals")')
    ).toBeVisible();
  });

  test("OSINT Sources tab shows sources", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Agentic/OSINT Studio
    await page
      .locator(
        'button:has-text("OSINT Studio"), button:has-text("AgenticStudio")'
      )
      .click();
    await page.waitForTimeout(1000);

    // Click OSINT Sources tab
    await page.locator('button:has-text("OSINT Sources")').click();
    await page.waitForTimeout(1000);

    // Check if sources section exists
    await expect(
      page.locator('h2:has-text("Active OSINT Sources")')
    ).toBeVisible();

    // Check for Add Source button
    await expect(page.locator('button:has-text("Add Source")')).toBeVisible();

    // Check for Search Keywords section
    await expect(page.locator('h2:has-text("Search Keywords")')).toBeVisible();
  });

  test("API endpoints respond correctly", async ({ page, request }) => {
    // Test bootstrap defaults
    const defaults = await request.get(
      "http://localhost:3001/api/bootstrap/defaults"
    );
    expect(defaults.ok()).toBeTruthy();
    const defaultsData = await defaults.json();
    expect(defaultsData.success).toBe(true);
    expect(Array.isArray(defaultsData.data.keywords)).toBe(true);

    // Test agentic tools
    const tools = await request.get("http://localhost:3001/api/agentic/tools");
    expect(tools.ok()).toBeTruthy();
    const toolsData = await tools.json();
    expect(toolsData.success).toBe(true);

    // Test orchestrator runs (namespace updated)
    const runs = await request.get(
      "http://localhost:3001/api/orchestrator/runs"
    );
    expect(runs.ok()).toBeTruthy();
    const runsData = await runs.json();
    expect(runsData.success).toBe(true);

    // Test intel scraper status
    const scraper = await request.get(
      "http://localhost:3001/api/intel-scraper/status"
    );
    expect(scraper.ok()).toBeTruthy();
    const scraperData = await scraper.json();
    expect(scraperData.success).toBe(true);
  });

  test("Create agent run functionality", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to Agentic/OSINT Studio
    await page
      .locator(
        'button:has-text("OSINT Studio"), button:has-text("AgenticStudio")'
      )
      .click();
    await page.waitForTimeout(1000);

    // Check if create run section exists
    await expect(page.locator('h2:has-text("Create Agent Run")')).toBeVisible();

    // Check for input field
    const goalInput = page.locator(
      'input[placeholder*="Describe what you want"]'
    );
    await expect(goalInput).toBeVisible();

    // Check for start run button
    await expect(page.locator('button:has-text("Start Run")')).toBeVisible();
  });
});
