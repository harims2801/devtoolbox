import { expect, test } from "@playwright/test";
test("requires DST overlap disambiguation", async ({ page }) => {
  await page.goto("/tools/time-zone-converter");
  await page.getByLabel("Local date and time").first().fill("2024-11-03T01:30");
  await page.getByLabel("Source time zone").first().fill("America/New_York");
  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page.getByRole("alert").first()).toContainText("occurs twice");
  await page.getByLabel("Later offset").check();
  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page.getByTestId("time-zone-output").first()).toContainText(
    "2024-11-03T06:30:00.000Z",
  );
});
