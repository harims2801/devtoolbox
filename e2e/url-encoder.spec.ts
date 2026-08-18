import { expect, test } from "@playwright/test";

test("round trips a URL component and reports malformed escapes", async ({
  page,
}) => {
  await page.goto("/tools/url-encoder");
  await page.getByLabel("Value to encode").first().fill("hello world/தமிழ்");
  await page.getByRole("button", { name: "Encode value" }).click();
  await expect(page.getByTestId("url-output").first()).toContainText(
    "hello%20world%2F",
  );
  await page.getByRole("button", { name: "Swap" }).click();
  await page.getByRole("button", { name: "Decode value" }).click();
  await expect(page.getByTestId("url-output").first()).toContainText(
    "hello world/தமிழ்",
  );
  await page.getByLabel("Value to decode").first().fill("bad%2");
  await page.getByRole("button", { name: "Decode value" }).click();
  await expect(page.getByRole("alert").first()).toContainText("character 4");
});
