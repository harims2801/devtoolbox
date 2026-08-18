import { expect, test } from "@playwright/test";
test("generates repeatable seeded placeholder text", async ({ page }) => {
  await page.goto("/tools/lorem-ipsum");
  await page.getByLabel("Generation unit").first().selectOption("words");
  await page.getByLabel("Generation count").first().fill("12");
  await page.getByLabel("Deterministic seed").first().fill("fixture");
  await page.getByRole("button", { name: "Generate" }).click();
  const first = await page.getByTestId("lorem-output").first().textContent();
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByTestId("lorem-output").first()).toHaveText(
    first ?? "",
  );
  await expect(page.getByTestId("lorem-stats").first()).toContainText(
    "12 words",
  );
});
