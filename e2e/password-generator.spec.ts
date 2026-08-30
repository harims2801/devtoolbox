import { expect, test } from "@playwright/test";

test("generates constrained passwords without persisting them", async ({
  page,
}) => {
  await page.goto("/tools/password-generator");
  await page.getByLabel("Password length").fill("24");
  await page.getByLabel("Password count").fill("3");
  await page.getByLabel("Required custom inclusions").fill('@, #, ","');
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(
    page.getByTestId("password-output").first().locator("li"),
  ).toHaveCount(3);
  await expect(page.getByTestId("entropy-summary").first()).toContainText(
    "bits per password",
  );
  for (const item of await page
    .getByTestId("password-output")
    .first()
    .locator("code")
    .allTextContents()) {
    expect(item).toHaveLength(24);
    expect(item).toMatch(/[A-Z]/);
    expect(item).toMatch(/[a-z]/);
    expect(item).toMatch(/[0-9]/);
    expect(item).toContain("@");
    expect(item).toContain("#");
    expect(item).toContain(",");
  }
  await page.reload();
  await expect(
    page.getByTestId("password-output").first().locator("li"),
  ).toHaveCount(0);
});
