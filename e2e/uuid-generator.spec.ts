import { expect, test } from "@playwright/test";
test("generates secure UUID v4 batches", async ({ page }) => {
  await page.goto("/tools/uuid-generator");
  await page.locator("#uuid-count:visible").fill("3");
  await page.getByRole("button", { name: "Generate UUIDs" }).click();
  const output = page.locator('[data-testid="uuid-output"]:visible');
  await expect(output).toContainText("All 3 UUIDs are unique");
  await expect(output.locator("li")).toHaveCount(3);
});
