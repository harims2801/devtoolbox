import { expect, test } from "@playwright/test";

test("core navigation and theme controls work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Developer tools",
  );

  await page.keyboard.press("Control+k");
  const search = page.getByPlaceholder("Search tools");
  await expect(search).toBeVisible();
  await search.fill("Base64");
  await page.getByRole("option", { name: /Base64 Encoder/ }).click();
  await expect(page).toHaveURL(/base64-encoder-decoder/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Base64");

  await page.getByRole("button", { name: /theme/i }).click();
  await page.getByRole("menuitem", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
