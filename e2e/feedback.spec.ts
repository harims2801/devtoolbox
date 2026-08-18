import { test, expect } from "@playwright/test";
test("opens feedback from every tool without including tool content", async ({
  page,
}) => {
  await page.goto("/tools/json-formatter");
  await page.getByRole("button", { name: "Feedback" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("JSON Formatter and Validator");
  await expect(dialog).toContainText(
    "Tool input and output are never included",
  );
  await expect(
    dialog.getByRole("button", { name: "Submit feedback" }),
  ).toBeDisabled();
});
