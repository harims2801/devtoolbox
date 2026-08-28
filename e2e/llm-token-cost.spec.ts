import { expect, test } from "@playwright/test";

test("manually compares reviewed LLM pricing without persisting prompt text", async ({
  page,
}) => {
  await page.goto("/tools/llm-token-cost-calculator");
  await page
    .getByLabel(/System instructions/)
    .first()
    .fill("private prompt");
  await page.getByLabel("Provider").first().fill("Example AI");
  await page.getByLabel("Model / tier").first().fill("Model A");
  await page.getByLabel("Input price").first().fill("1");
  await page.getByLabel("Output price").first().fill("4");
  await page
    .getByLabel(/I verified/)
    .first()
    .check();
  await page.getByRole("button", { name: "Save for comparison" }).click();
  await expect(page.getByTestId("llm-cost-comparison").first()).toContainText(
    "Model A",
  );
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "private prompt",
  );
});
