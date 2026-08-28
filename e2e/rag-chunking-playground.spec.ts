import { expect, test } from "@playwright/test";

test("compares and exports locally generated RAG chunks", async ({ page }) => {
  await page.goto("/tools/rag-chunking-playground");
  await page
    .getByLabel("Source document")
    .first()
    .fill("First sentence. Second sentence.\n\nThird paragraph is here.");
  await page.getByLabel("Chunking strategy").first().selectOption("sentence");
  await page.getByLabel("Target chunk size").first().fill("10");
  await page.getByLabel("Chunk overlap").first().fill("2");
  await expect(page.getByTestId("rag-chunking-result").first()).toContainText(
    "Sentence-aware",
  );
  await expect(page.getByTestId("rag-chunk").first()).toContainText("chars 0–");
  await expect(
    page.getByRole("button", { name: "Download chunks JSON" }),
  ).toBeVisible();
  expect(await page.evaluate(() => JSON.stringify(localStorage))).not.toContain(
    "First sentence",
  );
});
