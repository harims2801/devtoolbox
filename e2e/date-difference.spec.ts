import { expect, test } from "@playwright/test";

test("calculates an inclusive date-only range", async ({ page }) => {
  await page.goto("/tools/date-difference");
  await page.getByLabel("Date-only inputs").first().check();
  await page.getByLabel("Start date").first().fill("2024-02-28");
  await page.getByLabel("End date").first().fill("2024-03-01");
  await page.getByLabel("Include both boundary dates").first().check();
  await page.getByRole("button", { name: "Calculate" }).click();
  await expect(
    page.getByTestId("date-difference-output").first(),
  ).toContainText("Inclusive calendar span: 3 days");
});
