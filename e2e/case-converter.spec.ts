import { expect, test } from "@playwright/test";

test("shows all case conversions", async ({ page }) => {
  await page.goto("/tools/case-converter");
  await page.getByLabel("Text to convert").first().fill("XMLHttpRequest v2");
  const output = page.getByTestId("case-converter-output").first();
  await expect(output).toContainText("xmlHttpRequestV2");
  await expect(output).toContainText("xml_http_request_v_2");
});
