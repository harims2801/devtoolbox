import { expect, test } from "@playwright/test";

test("compares semantic JSON and filters by pointer", async ({ page }) => {
  await page.goto("/tools/json-diff");
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: "Compare" }).click();
  await expect(page.getByTestId("json-diff-output").first()).toContainText(
    "/a~1b",
  );
  await page.getByLabel("Filter by JSON Pointer").first().fill("/user/city");
  await expect(page.getByTestId("json-diff-output").first()).toContainText(
    "Showing 1 of 4 differences",
  );
});
