import { test, expect } from "@playwright/test";
test("analyzes logs and exposes filters", async ({ page }) => {
  await page.goto("/tools/log-analyzer");
  await expect(
    page.getByRole("heading", { name: "Log Formatter and Analyzer" }),
  ).toBeVisible();
  await expect(page.getByText(/1 skipped/).first()).toBeVisible();
  await page.getByLabel("Log level").selectOption("error");
  await expect(
    page.getByRole("cell", { name: "Database timeout" }),
  ).toBeVisible();
});
