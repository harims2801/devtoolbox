import { expect, test } from "@playwright/test";

test("home page exposes working primary navigation", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /useful developer tools without sending your data away/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /explore tools/i }).click();
  await expect(page).toHaveURL(/\/tools$/);
  await expect(
    page.getByRole("heading", { name: /tools are coming next/i }),
  ).toBeVisible();
});
