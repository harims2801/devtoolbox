import { expect, test } from "@playwright/test";
test("compares text and JSON", async ({ page }) => {
  await page.goto("/tools/text-diff");
  await expect(
    page.locator('[data-testid="text-diff-output"]:visible'),
  ).toContainText("Changed 1");
  await page.getByRole("button", { name: "JSON semantic" }).click();
  await expect(
    page.locator('[data-testid="json-diff-output"]:visible'),
  ).toContainText("user.active");
});
