import { test, expect } from "@playwright/test";
test("validates certificate hostnames before submission", async ({ page }) => {
  await page.goto("/tools/certificate-checker");
  await expect(
    page.getByRole("heading", { name: "Certificate Expiry Checker" }),
  ).toBeVisible();
  await page.getByLabel("Hostname").fill("https://example.com/path");
  await page.getByRole("button", { name: "Check certificate" }).click();
  await expect(page.getByRole("alert").first()).toContainText(
    "valid public hostname",
  );
});
