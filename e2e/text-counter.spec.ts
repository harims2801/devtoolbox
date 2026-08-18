import { expect, test } from "@playwright/test";

test("counts a joined emoji and trailing newline", async ({ page }) => {
  await page.goto("/tools/text-counter");
  await page.getByLabel("Text to measure").first().fill("👨‍👩‍👧‍👦\n");
  const output = page.getByTestId("text-counter-output").first();
  await expect(output).toContainText("Grapheme clusters");
  await expect(output).toContainText("Lines");
  await expect(output).toContainText("UTF-8 bytes");
});
