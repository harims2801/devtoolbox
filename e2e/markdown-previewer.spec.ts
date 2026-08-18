import { expect, test } from "@playwright/test";

test("previews Markdown safely across layouts and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tools/markdown-previewer");
  await page
    .getByLabel("Markdown editor")
    .last()
    .fill(
      "# Mobile preview\n\n<script>window.evil = true</script>\n\n[unsafe](javascript:alert(1))",
    );
  await page.getByRole("tab", { name: "Preview" }).click();
  await expect(
    page.getByRole("heading", { name: "Mobile preview" }),
  ).toBeVisible();
  await expect(
    page.locator("script").filter({ hasText: "window.evil" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Preview only" }).click();
  await expect(page.getByLabel("Rendered Markdown preview")).toBeVisible();
});
