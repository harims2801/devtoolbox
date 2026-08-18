import { expect, test } from "@playwright/test";

test("naturally sorts lines into a separate output", async ({ page }) => {
  await page.goto("/tools/text-sorter");
  await page.getByLabel("Lines to sort").first().fill("item10\nitem2\nitem1");
  await page.getByRole("button", { name: "Sort" }).click();
  await expect(page.getByTestId("text-sort-output").first()).toContainText(
    "item1\nitem2\nitem10",
  );
  await expect(page.getByLabel("Lines to sort").first()).toHaveValue(
    "item10\nitem2\nitem1",
  );
});
