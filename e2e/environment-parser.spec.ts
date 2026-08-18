import { expect, test } from "@playwright/test";
test("converts and masks environment values", async ({ page }) => {
  await page.goto("/tools/environment-parser");
  const output = page.locator('[data-testid="environment-output"]:visible');
  await expect(output).toContainText('"PORT": "3000"');
  await expect(output).toContainText("••••••••");
  await expect(output).not.toContainText("demo-token");
  await page.getByRole("button", { name: "Show sensitive" }).click();
  await expect(output).toContainText("demo-token");
});
