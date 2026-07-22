import { expect, test } from "@playwright/test";

test("mobile navigation and theme selector are usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("dialog", { name: "Navigation" });

  await expect(
    navigation.getByText("Browse DevToolbox pages and tool categories."),
  ).toBeVisible();

  await navigation.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("desktop category navigation filters planned tools", async ({ page }) => {
  await page.goto("/tools");

  await page
    .getByRole("link", { name: /formatting & validation/i })
    .first()
    .click();
  await expect(page).toHaveURL(/category=formatting-validation/);
  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Formatting & Validation tools",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "JSON Formatter" }),
  ).toBeVisible();
});
