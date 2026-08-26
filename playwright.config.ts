import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "edge-compatible",
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices["Desktop Edge"] },
    },
    {
      name: "firefox",
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-webkit",
      testMatch: /cross-browser\.spec\.ts/,
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer: {
    command: "pnpm exec next dev -H localhost",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
