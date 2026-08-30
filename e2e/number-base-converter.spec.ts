import { expect, test } from "@playwright/test";

test("converts hex bytes and validates every input mode", async ({ page }) => {
  await page.goto("/tools/number-base-converter");

  await page.getByLabel("Values to convert").first().fill("48 65 6C 6C 6F");
  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page.getByTestId("ascii-output").first()).toHaveText("Hello");
  await expect(page.getByTestId("decimal-output").first()).toHaveText(
    "72 101 108 108 111",
  );

  await page.getByLabel("Input format").first().selectOption("ascii");
  await page.getByLabel("Values to convert").first().fill("AZ");
  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page.getByTestId("hexadecimal-output").first()).toHaveText(
    "0x41 0x5A",
  );

  await page.getByLabel("Values to convert").first().fill("தமிழ்");
  await page.getByRole("button", { name: "Convert" }).click();
  await expect(page.getByRole("alert")).toContainText("ASCII input supports");
});
