import { test, expect } from "@playwright/test";

test.describe("AgenticStudio UI Tests", () => {
  test("AgenticStudio tab exists and loads", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Check if AgenticStudio tab exists
    const agenticTab = page.locator('button:has-text("AgenticStudio")');
    await expect(agenticTab).toBeVisible();

    // Click on AgenticStudio tab
    await agenticTab.click();
    await page.waitForTimeout(1000);

    // Check if AgenticStudio content loads
    const agenticHeader = page.locator('h1:has-text("AgenticStudio")');
    await expect(agenticHeader).toBeVisible();

    // Check if tabs exist
    await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
    await expect(
      page.locator('button:has-text("OSINT Sources")')
    ).toBeVisible();
    await expect(page.locator('button:has-text("Tools")')).toBeVisible();
    await expect(page.locator('button:has-text("Agent Runs")')).toBeVisible();
    await expect(page.locator('button:has-text("AI Models")')).toBeVisible();
  });

  test("Dashboard shows system status", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to AgenticStudio
    await page.locator('button:has-text("AgenticStudio")').click();
    await page.waitForTimeout(1000);

    // Check system status section
    await expect(page.locator('h2:has-text("System Status")')).toBeVisible();

    // Check for OSINT Scraper status
    await expect(page.locator("text=OSINT Scraper")).toBeVisible();

    // Check for Ollama status
    await expect(page.locator("text=Ollama")).toBeVisible();

    // Check for Agentic Tools count
    await expect(page.locator("text=Agentic Tools")).toBeVisible();
  });

  test("OSINT Sources tab shows sources", async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");

    // Navigate to AgenticStudio
    await page.locator('button:has-text("AgenticStudio")').click();
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

    // Test agentic runs
    const runs = await request.get("http://localhost:3001/api/agentic/runs");
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

    // Navigate to AgenticStudio
    await page.locator('button:has-text("AgenticStudio")').click();
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
