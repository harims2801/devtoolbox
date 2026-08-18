import { expect, test } from "@playwright/test";
test("tests patterns and renders untrusted text safely", async ({ page }) => {
  await page.goto("/tools/regex-tester");
  await page.locator("#regex-pattern:visible").fill("(?<tag>img)");
  await page.locator("#regex-text:visible").fill("<img onerror=alert(1)>");
  await expect(
    page.locator('[data-testid="regex-output"]:visible'),
  ).toContainText("img");
  await expect(page.locator("img")).toHaveCount(0);
});
