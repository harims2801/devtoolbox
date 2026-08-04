import { expect, test } from "@playwright/test";

test("builds, validates, and explains a cron schedule", async ({ page }) => {
  await page.goto("/tools/cron-builder");
  await page.locator("#cron-expression").fill("*/5 * * * *");
  await page.getByRole("button", { name: "Validate and explain" }).click();
  await expect(page.getByTestId("cron-output")).toContainText(
    "Every 5 minutes",
  );
  await expect(page.getByTestId("next-runs").locator("li")).toHaveCount(10);
});

test("rejects invalid fields and loads presets", async ({ page }) => {
  await page.goto("/tools/cron-builder");
  await page.locator("#cron-expression").fill("60 * * * *");
  await page.getByRole("button", { name: "Validate and explain" }).click();
  await expect(page.getByRole("alert")).toContainText("between 0 and 59");
  await page.getByRole("button", { name: "Monthly" }).click();
  await expect(page.locator("#cron-expression")).toHaveValue("0 0 1 * *");
});
