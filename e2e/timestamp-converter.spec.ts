import { expect, test } from "@playwright/test";

test("converts Unix seconds to all date formats", async ({ page }) => {
  await page.goto("/tools/timestamp-converter");
  await page.locator("#timestamp-input:visible").fill("0");
  await page.locator("#timestamp-unit:visible").selectOption("seconds");
  await page.getByRole("button", { name: "Convert", exact: true }).click();

  const output = page.locator('[data-testid="timestamp-output"]:visible');
  await expect(output).toContainText("1970-01-01T00:00:00.000Z");
  await expect(output).toContainText("Unix milliseconds");
  await expect(output).toContainText("RFC 2822");
});

test("auto-detects milliseconds and supports negative timestamps", async ({
  page,
}) => {
  await page.goto("/tools/timestamp-converter");
  await page.locator("#timestamp-input:visible").fill("1714564800000");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(
    page.getByText("Detected as milliseconds.").filter({ visible: true }),
  ).toBeVisible();

  await page.locator("#timestamp-input:visible").fill("-1");
  await page.locator("#timestamp-unit:visible").selectOption("seconds");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(
    page.locator('[data-testid="timestamp-output"]:visible'),
  ).toContainText("1969-12-31T23:59:59.000Z");
});

test("converts zoned dates and rejects DST gaps", async ({ page }) => {
  await page.goto("/tools/timestamp-converter");
  await page.getByRole("button", { name: "Date to timestamp" }).click();
  await page.locator("#time-zone:visible").selectOption("Asia/Kolkata");
  await page.locator("#date-input:visible").fill("1970-01-01T05:30");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(
    page.locator('[data-testid="timestamp-seconds"]:visible'),
  ).toHaveText("0");

  await page.locator("#time-zone:visible").selectOption("America/New_York");
  await page.locator("#date-input:visible").fill("2024-03-10T02:30");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator('p[role="alert"]:visible')).toContainText(
    /does not exist/i,
  );
});
