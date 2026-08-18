import { test, expect } from "@playwright/test";
test("validates a Kubernetes manifest locally", async ({ page }) => {
  await page.goto("/tools/kubernetes-validator");
  await expect(
    page.getByRole("heading", { name: "Kubernetes YAML Validator" }),
  ).toBeVisible();
  await expect(
    page.getByText("Opinionated recommendations").first(),
  ).toBeVisible();
  await expect(page.getByText(/Pin the image/).first()).toBeVisible();
});
