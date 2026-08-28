import { expect, test } from "@playwright/test";

test("exports one AI tool definition across provider formats", async ({
  page,
}) => {
  await page.goto("/tools/ai-tool-schema-builder");
  await expect(page.getByTestId("ai-tool-schema-result").first()).toContainText(
    '"type": "function"',
  );
  await page.getByLabel("Export target").first().selectOption("anthropic");
  await expect(page.getByTestId("ai-tool-schema-result").first()).toContainText(
    '"input_schema"',
  );
  await page.getByLabel("Export target").first().selectOption("mcp");
  await expect(page.getByTestId("ai-tool-schema-result").first()).toContainText(
    '"outputSchema"',
  );
  await page.getByLabel("Destructive").first().check();
  await expect(page.getByRole("alert").first()).toContainText("read-only");
});
