import { expect, test } from "@playwright/test";

test("builds ordered duplicate query rows locally", async ({ page }) => {
  await page.goto("/tools/query-string-builder");
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByTestId("query-builder-output")).toContainText(
    "tag=one&tag=",
  );
  await page.getByLabel("Include row 1").uncheck();
  await expect(page.getByTestId("query-builder-output")).not.toContainText(
    "tag=one&tag=",
  );
  await expect(page).toHaveURL(/\/tools\/query-string-builder$/);
});
