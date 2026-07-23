import { expect, test } from "@playwright/test";

test("formats, sorts, searches, and downloads JSON locally", async ({
  page,
}) => {
  await page.goto("/tools/json-formatter");

  const input = page.getByRole("textbox", { name: "JSON input" });
  await input.fill('{"z":1,"a":{"message":"hello"},"items":[3,1,2]}');
  await page.getByRole("button", { name: "Format", exact: true }).click();

  const output = page.getByTestId("json-output");
  await expect(output).toContainText('"message": "hello"');
  await expect(page.getByText("Objects").first()).toBeVisible();

  await page.getByRole("button", { name: "Sort Keys" }).click();
  await expect(output).toContainText(/"a"[\s\S]*"z"/);
  await expect(output).toContainText(/3,[\s\S]*1,[\s\S]*2/);

  await page.getByRole("button", { name: "Tree" }).click();
  await page.getByPlaceholder("Find keys or values...").fill("hello");
  await expect(page.getByText("1 match")).toBeVisible();
  await expect(page.locator("mark", { hasText: '"hello"' })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("formatted.json");
});

test("reports invalid JSON with an approximate line and column", async ({
  page,
}) => {
  await page.goto("/tools/json-formatter");
  await page
    .getByRole("textbox", { name: "JSON input" })
    .fill('{\n  "valid": true,\n  broken\n}');
  await page.getByRole("button", { name: "Format", exact: true }).click();

  await expect(page.getByRole("alert")).toContainText(/line \d+, column \d+/);
  await expect(page.getByText(/Problem near line/)).toBeVisible();
});

test("opens and formats a local JSON file", async ({ page }) => {
  await page.goto("/tools/json-formatter");
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "service.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"source":"local-file","enabled":true}'),
    });

  await page.getByRole("button", { name: "Format", exact: true }).click();
  await expect(page.getByTestId("json-output")).toContainText(
    '"source": "local-file"',
  );
  await expect(page.getByText(/Input size:/).first()).toBeVisible();
});
