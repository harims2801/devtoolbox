import { expect, test } from "@playwright/test";

test("decodes HTML entities as inert text", async ({ page }) => {
  await page.goto("/tools/html-entities");
  await page.getByRole("button", { name: "Decode" }).click();
  await page
    .getByLabel("Entities to decode")
    .first()
    .fill("&lt;script&gt;window.evil=true&lt;/script&gt;&#x1F680;");
  await page.getByRole("button", { name: "Decode entities" }).click();
  await expect(page.getByTestId("entity-output").first()).toContainText(
    "<script>window.evil=true</script>🚀",
  );
  await expect(
    page.locator("script").filter({ hasText: "window.evil" }),
  ).toHaveCount(0);
});
