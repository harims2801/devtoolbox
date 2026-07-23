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
  await expect(page).toHaveURL(/\/tools\/category\/formatting-validation$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Formatting & Validation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      level: 3,
      name: "JSON Formatter and Validator",
    }),
  ).toBeVisible();
});

test("tool filters support processing type and empty results", async ({
  page,
}) => {
  await page.goto(
    "/tools?category=formatting-validation&processing=server-assisted",
  );

  await expect(
    page.getByRole("heading", { name: "No tools match these filters" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clear" }).click();
  await expect(page).toHaveURL(/\/tools$/);
  await expect(page.getByText("41 tools found")).toBeVisible();
});
