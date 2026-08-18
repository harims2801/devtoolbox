import { expect, test } from "@playwright/test";

test("formats and validates XML locally", async ({ page }) => {
  await page.goto("/tools/xml-formatter");
  await page.getByLabel("XML input").fill("<root><item>value</item></root>");
  await page.getByRole("button", { name: "Format", exact: true }).click();
  await expect(page.getByTestId("xml-output")).toContainText("<item>");

  await page.getByLabel("XML input").fill("<root><item></root>");
  await page.getByRole("button", { name: "Validate", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Malformed XML");
});
