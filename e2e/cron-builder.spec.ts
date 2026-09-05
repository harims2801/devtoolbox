import { expect, test } from "@playwright/test";

test("builds, validates, and explains a cron schedule", async ({ page }) => {
  await page.goto("/tools/cron-builder");
  await page.locator("#cron-expression:visible").fill("*/5 * * * *");
  await page.getByRole("button", { name: "Validate and explain" }).click();
  await expect(
    page.locator('[data-testid="cron-output"]:visible'),
  ).toContainText("Every 5 minutes");
  await expect(
    page.locator('[data-testid="next-runs"]:visible').locator("li"),
  ).toHaveCount(10);
});

test("rejects invalid fields and loads presets", async ({ page }) => {
  await page.goto("/tools/cron-builder");
  await page.locator("#cron-expression:visible").fill("60 * * * *");
  await page.getByRole("button", { name: "Validate and explain" }).click();
  await expect(page.locator("#cron-error:visible")).toContainText(
    "between 0 and 59",
  );
  await page.getByRole("button", { name: "Monthly" }).click();
  await expect(page.locator("#cron-expression:visible")).toHaveValue(
    "0 0 1 * *",
  );
});

test("preserves visual builder fields across sequential edits", async ({
  page,
}) => {
  await page.goto("/tools/cron-builder");
  await page.getByRole("button", { name: "Reset" }).click();

  await page.getByLabel("Builder Minute").filter({ visible: true }).fill("5");
  await page.getByLabel("Builder Hour").filter({ visible: true }).fill("44");
  await expect(page.locator("#cron-expression:visible")).toHaveValue(
    "5 44 * * *",
  );
  await expect(
    page.getByLabel("Builder Minute").filter({ visible: true }),
  ).toHaveValue("5");

  await page.getByLabel("Builder Hour").filter({ visible: true }).fill("2");
  await expect(page.locator("#cron-expression:visible")).toHaveValue(
    "5 2 * * *",
  );
});
