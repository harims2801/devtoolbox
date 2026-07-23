import { expect, test } from "@playwright/test";

test("encodes and decodes Unicode text with URL-safe options", async ({
  page,
}) => {
  await page.goto("/tools/base64");
  const input = page.getByRole("textbox", { name: "Text to encode" });
  await input.fill("வணக்கம் 👋");
  await page.getByLabel("Base64 variant").selectOption("url-safe");
  await page.getByLabel("Include padding").uncheck();
  await page.getByRole("button", { name: "Encode", exact: true }).click();

  const encoded = await page.getByTestId("base64-output").textContent();
  expect(encoded).not.toMatch(/[+/=]/);
  await page.getByRole("button", { name: "Swap" }).click();
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByTestId("base64-output")).toContainText("வணக்கம் 👋");
});

test("reports invalid Base64 input", async ({ page }) => {
  await page.goto("/tools/base64");
  await page.getByLabel("Operation").selectOption("decode");
  await page
    .getByRole("textbox", { name: "Base64 to decode" })
    .fill("invalid@base64");
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.locator('p[role="alert"]').first()).toContainText(
    /not valid/i,
  );
});

test("encodes a local image and offers safe metadata and download", async ({
  page,
}) => {
  await page.goto("/tools/base64");
  await page.getByRole("button", { name: "File mode" }).click();
  await page
    .locator('input[type="file"]')
    .first()
    .setInputFiles({
      name: "pixel.png",
      mimeType: "image/png",
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    });

  await expect(page.getByText("pixel.png")).toBeVisible();
  await expect(page.getByText("image/png")).toBeVisible();
  await expect(page.getByTestId("file-base64")).toContainText("iVBORw0KGgo=");
  await expect(page.getByAltText("Preview of pixel.png")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download decoded file" }),
  ).toBeEnabled();
});
