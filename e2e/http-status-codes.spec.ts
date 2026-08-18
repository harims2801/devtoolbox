import { expect, test } from "@playwright/test";

test("searches the offline status registry without URL query state", async ({
  page,
}) => {
  await page.goto("/tools/http-status-codes");
  await page
    .getByRole("combobox", { name: "Search status codes" })
    .first()
    .fill("429");
  await page
    .getByRole("option", { name: /429 Too Many Requests/ })
    .first()
    .click();
  await expect(page.getByTestId("http-status-output").first()).toContainText(
    "Retry-After",
  );
  await expect(page).toHaveURL(/\/tools\/http-status-codes$/);
});
