import { test, expect } from "@playwright/test";
test("calculates a /31 subnet", async ({ page }) => {
  await page.goto("/tools/cidr-calculator");
  await expect(
    page.getByRole("heading", { name: "CIDR and IP Address Calculator" }),
  ).toBeVisible();
  await page.getByLabel("IPv4 address with prefix").fill("10.0.0.0/31");
  await expect(page.getByText(/point-to-point links/).first()).toBeVisible();
  await expect(page.getByText("10.0.0.1").first()).toBeVisible();
});
