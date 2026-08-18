import { expect, test } from "@playwright/test";

test("statically validates a Compose example", async ({ page }) => {
  await page.goto("/tools/docker-compose-validator");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: "Validate" }).click();
  await expect(page.getByTestId("compose-output").first()).toContainText(
    "Services: web, db",
  );
  await expect(page.getByTestId("compose-output").first()).toContainText(
    "Formatted YAML",
  );
});
