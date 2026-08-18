import { expect, test } from "@playwright/test";
test("hashes text and compares expected digest", async ({ page }) => {
  await page.goto("/tools/hash-generator");
  await page.locator("#hash-text:visible").fill("abc");
  await page.getByRole("button", { name: "Hash text" }).click();
  const output = page.locator('[data-testid="hash-output"]:visible');
  await expect(output).toContainText(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  await page
    .locator("#expected-hash:visible")
    .fill("BA7816BF8F01CFEA414140DE5DAE2223B00361A396177A9CB410FF61F20015AD");
  await expect(
    page.getByText("Hashes match.").filter({ visible: true }),
  ).toBeVisible();
});
