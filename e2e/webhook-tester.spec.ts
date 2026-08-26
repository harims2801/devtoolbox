import { expect, test } from "@playwright/test";

test("requires explicit confirmation before webhook delivery", async ({
  page,
}) => {
  await page.goto("/tools/webhook-tester");
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(
    page.getByRole("button", { name: "Send confirmed webhook" }),
  ).toBeDisabled();
  await page.getByLabel("Confirm webhook send").check();
  await expect(
    page.getByRole("button", { name: "Send confirmed webhook" }),
  ).toBeEnabled();
});
