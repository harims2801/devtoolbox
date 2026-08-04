import { expect, test } from "@playwright/test";

test("converts Unix seconds to all date formats", async ({ page }) => {
  await page.goto("/tools/timestamp-converter");
  await page.getByLabel("Unix timestamp").fill("0");
  await page.getByLabel("Timestamp unit").selectOption("seconds");
  await page.getByRole("button", { name: "Convert", exact: true }).click();

  const output = page.getByTestId("timestamp-output");
  await expect(output).toContainText("1970-01-01T00:00:00.000Z");
  await expect(output).toContainText("Unix milliseconds");
  await expect(output).toContainText("RFC 2822");
});

test("auto-detects milliseconds and supports negative timestamps", async ({
  page,
}) => {
  await page.goto("/tools/timestamp-converter");
  await page.getByLabel("Unix timestamp").fill("1714564800000");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByText("Detected as milliseconds.")).toBeVisible();

  await page.getByLabel("Unix timestamp").fill("-1");
  await page.getByLabel("Timestamp unit").selectOption("seconds");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByTestId("timestamp-output")).toContainText(
    "1969-12-31T23:59:59.000Z",
  );
});

test("converts zoned dates and rejects DST gaps", async ({ page }) => {
  await page.goto("/tools/timestamp-converter");
  await page.getByRole("button", { name: "Date to timestamp" }).click();
  await page.getByLabel("Preview time zone").selectOption("Asia/Kolkata");
  await page
    .getByLabel("Date and time in selected zone")
    .fill("1970-01-01T05:30:00");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByTestId("timestamp-output")).toContainText(
    "Unix seconds0",
  );

  await page.getByLabel("Preview time zone").selectOption("America/New_York");
  await page
    .getByLabel("Date and time in selected zone")
    .fill("2024-03-10T02:30:00");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator('p[role="alert"]').first()).toContainText(
    /does not exist/i,
  );
});
