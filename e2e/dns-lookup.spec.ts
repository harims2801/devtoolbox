import { expect, test } from "@playwright/test";

test("renders the bounded DNS lookup workspace", async ({ page }) => {
  await page.goto("/tools/dns-lookup");
  await expect(page.getByRole("heading", { name: "DNS Lookup" })).toBeVisible();
  await page
    .getByLabel("Public hostname or IP for PTR")
    .first()
    .fill("example.com");
  await expect(page.getByRole("button", { name: "Look up" })).toBeEnabled();
  await expect(
    page.getByText(/recursive, not proof of an authoritative response/).first(),
  ).toBeVisible();
});
