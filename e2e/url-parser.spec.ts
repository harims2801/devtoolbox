import { expect, test } from "@playwright/test";

test("parses a URL without navigation", async ({ page }) => {
  await page.goto("/tools/url-parser");
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByTestId("url-parser-report")).toContainText(
    "ASCII hostname",
  );
  await expect(page.getByText("Yes (value hidden)").first()).toBeVisible();
  await expect(page).toHaveURL(/\/tools\/url-parser$/);
});
