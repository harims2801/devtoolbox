import { expect, test } from "@playwright/test";

test("renders the bounded HTTP header analyzer", async ({ page }) => {
  await page.goto("/tools/http-header-analyzer");
  await expect(
    page.getByRole("heading", { name: "HTTP Header Analyzer" }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Public HTTP or HTTPS URL").first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Analyze headers" }),
  ).toBeDisabled();
  await expect(page.getByText(/pinned public DNS answers/i)).toBeVisible();
});
