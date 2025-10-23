import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "line",
  use: {
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node server.js",
      url: "http://localhost:3001/healthz",
      reuseExistingServer: !process.env.CI,
      env: { PORT: "3001", NODE_ENV: "development" },
    },
    {
      command: "vite --host --port 5173",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
