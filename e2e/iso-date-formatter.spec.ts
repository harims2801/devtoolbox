import { expect, test } from "@playwright/test";

test("normalizes a zoned ISO instant", async ({ page }) => {
  await page.goto("/tools/iso-date-formatter");
  await page
    .getByLabel("ISO 8601 value")
    .first()
    .fill("2024-02-29T23:45:12.123456+05:30");
  await page.getByRole("button", { name: "Parse" }).click();
  await expect(page.getByTestId("iso-date-output").first()).toContainText(
    "2024-02-29T18:15:12.123456Z",
  );
});
