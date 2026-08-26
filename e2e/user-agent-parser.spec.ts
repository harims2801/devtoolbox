import { expect, test } from "@playwright/test";

test("parses a User-Agent locally", async ({ page }) => {
  await page.goto("/tools/user-agent-parser");
  await expect(
    page.getByRole("heading", { name: "User-Agent Parser" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load example" }).click();
  await expect(page.getByTestId("user-agent-report")).toContainText(
    "Mobile Safari",
  );
  await expect(page.getByText(/Best-effort only/)).toBeVisible();
  await page.getByRole("tab", { name: "Raw" }).click();
  await expect(page.getByText(/CPU iPhone OS 17_5/)).toBeVisible();
});
