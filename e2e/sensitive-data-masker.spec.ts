import { expect, test } from "@playwright/test";
test("detects and masks sensitive text safely", async ({ page }) => {
  await page.goto("/tools/sensitive-data-masker");
  await page
    .locator("#masking-input:visible")
    .fill("User <img onerror=alert(1)> ada@example.com from 192.168.1.10");
  await expect(
    page.locator('[data-testid="detection-preview"]:visible mark'),
  ).not.toHaveCount(0);
  await expect(page.locator("img")).toHaveCount(0);
  await page.getByRole("button", { name: /Mask \d+ detections/ }).click();
  const output = page.locator('[data-testid="masked-output"]:visible');
  await expect(output).toContainText("[MASKED:email]");
  await expect(output).toContainText("[MASKED:ipv4]");
});
