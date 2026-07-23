import { expect, test } from "@playwright/test";

test("formats multi-document YAML and converts it to JSON", async ({
  page,
}) => {
  await page.goto("/tools/yaml-formatter");
  const input = page.getByRole("textbox", { name: "YAML or JSON input" });
  await input.fill(
    "service:\n  enabled: true\n---\nservice:\n  enabled: false",
  );

  await page
    .getByRole("button", { name: "Format & Validate", exact: true })
    .click();
  await expect(page.getByTestId("yaml-output")).toContainText("enabled: true");

  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByTestId("yaml-output")).toContainText('"service"');
  await expect(page.getByText("Documents").first()).toBeVisible();
});

test("converts JSON to YAML, sorts keys, and renders a tree", async ({
  page,
}) => {
  await page.goto("/tools/yaml-formatter");
  await page
    .getByRole("textbox", { name: "YAML or JSON input" })
    .fill('{"z":1,"a":{"enabled":true}}');
  await page.getByLabel("Input format").selectOption("json");
  await page.getByRole("button", { name: "Convert", exact: true }).click();

  await expect(page.getByTestId("yaml-output")).toContainText("enabled: true");
  await page.getByRole("button", { name: "Sort Keys" }).click();
  await page.getByRole("button", { name: "Tree" }).click();
  await expect(page.getByTestId("yaml-tree")).toContainText("Object(2)");
});

test("reports duplicate keys and opens a local YAML file", async ({ page }) => {
  await page.goto("/tools/yaml-formatter");
  const input = page.getByRole("textbox", { name: "YAML or JSON input" });
  await input.fill("service: api\nservice: worker");
  await page
    .getByRole("button", { name: "Format & Validate", exact: true })
    .click();
  await expect(page.locator('p[role="alert"]').first()).toContainText(
    /line \d+, column \d+/,
  );

  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "service.yaml",
      mimeType: "application/yaml",
      buffer: Buffer.from("service:\n  source: local-file"),
    });
  await page
    .getByRole("button", { name: "Format & Validate", exact: true })
    .click();
  await expect(page.getByTestId("yaml-output")).toContainText(
    "source: local-file",
  );
});
