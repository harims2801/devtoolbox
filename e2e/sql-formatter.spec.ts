import { expect, test } from "@playwright/test";

test("formats SQL without executing it", async ({ page }) => {
  await page.goto("/tools/sql-formatter");
  await page
    .getByLabel("SQL input")
    .fill("select id,name from users where active=true order by name;");
  await page.getByRole("button", { name: "Format", exact: true }).click();
  await expect(page.getByTestId("sql-output")).toContainText("SELECT id");
  await expect(page.getByTestId("sql-output")).toContainText("ORDER BY name");
});
