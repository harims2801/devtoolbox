import { test, expect } from "@playwright/test";
test("generates Terraform variable files", async ({ page }) => {
  await page.goto("/tools/terraform-variable-generator");
  await expect(
    page.getByRole("heading", { name: "Terraform Variable Generator" }),
  ).toBeVisible();
  await expect(page.getByTestId("terraform-output").first()).toContainText(
    'variable "service_name"',
  );
  await page.getByRole("button", { name: "terraform.tfvars" }).first().click();
  await expect(page.getByTestId("terraform-output").first()).toContainText(
    "replicas = 3",
  );
});
