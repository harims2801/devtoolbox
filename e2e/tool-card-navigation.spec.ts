import { expect, test } from "@playwright/test";

test("clicking anywhere on a tool card opens the tool", async ({ page }) => {
  await page.goto("/tools/category/comparison-text");

  const card = page.getByRole("article").filter({ hasText: "Case Converter" });

  await card.click({ position: { x: 220, y: 180 } });

  await expect(page).toHaveURL(/\/tools\/case-converter$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Case Converter" }),
  ).toBeVisible();
});

test("favorite buttons do not open their tool card", async ({ page }) => {
  await page.goto("/tools/category/comparison-text");

  const favorite = page.getByRole("button", {
    name: "Add Case Converter to favorites",
  });

  await favorite.click();

  await expect(page).toHaveURL(/\/tools\/category\/comparison-text$/);
  await expect(favorite).toHaveAttribute("aria-pressed", "true");
});
