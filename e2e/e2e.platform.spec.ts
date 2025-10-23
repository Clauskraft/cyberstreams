import { test, expect } from "@playwright/test";

test.describe("Platform E2E bootstrap and smoke", () => {
  test("bootstrap defaults and servers respond", async ({ page, request }) => {
    const std = await request.post(
      "http://localhost:3001/api/bootstrap/standardize",
      { data: {} }
    );
    expect(std.status()).toBeLessThan(500);

    const defaults = await request.get(
      "http://localhost:3001/api/bootstrap/defaults"
    );
    expect(defaults.ok()).toBeTruthy();
    const defaultsJson = await defaults.json();
    expect(defaultsJson.success).toBe(true);
    expect(Array.isArray(defaultsJson.data.keywords)).toBe(true);

    // Ollama prep is best-effort; should not fail the suite if unreachable
    const ollama = await request.post(
      "http://localhost:3001/api/bootstrap/ollama",
      { data: { allowPull: false } }
    );
    expect([200, 503].includes(ollama.status())).toBeTruthy();

    // Agentic minimal flow
    const runRes = await request.post(
      "http://localhost:3001/api/agentic/runs",
      { data: { goal: "Smoke end-to-end validation" } }
    );
    expect(runRes.ok()).toBeTruthy();
    const run = await runRes.json();
    const runId = run.data.id;
    const stepRes = await request.post(
      `http://localhost:3001/api/agentic/runs/${runId}/steps`,
      { data: { type: "check", input: { ping: "ok" }, status: "done" } }
    );
    expect(stepRes.ok()).toBeTruthy();

    // UI loads
    await page.goto("http://localhost:5173");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#root")).toBeVisible();
  });
});
