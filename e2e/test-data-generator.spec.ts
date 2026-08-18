import { expect, test } from "@playwright/test";
test("generates explicitly fictional CSV fixtures", async ({ page }) => {
  await page.goto("/tools/test-data-generator");
  await page.getByLabel("Record count").first().fill("2");
  await page.getByLabel("Test data seed").first().fill("fixture");
  await page.getByLabel("Export format").selectOption("csv");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByTestId("test-data-output").first()).toContainText(
    "user001@example.test",
  );
  await expect(page.getByTestId("test-data-output").first()).toContainText(
    "Test Person 002",
  );
});
