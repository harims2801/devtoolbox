import { expect, test } from "@playwright/test";

test("builds and validates a provider structured-output schema", async ({
  page,
}) => {
  await page.goto("/tools/structured-output-schema-builder");
  await expect(
    page.getByTestId("schema-validation-success").first(),
  ).toBeVisible();
  await page
    .getByLabel("Sample JSON")
    .first()
    .fill(
      JSON.stringify({
        candidate: { name: "A", years_experience: "wrong", skills: [] },
        recommendation: "maybe",
      }),
    );
  await expect(
    page.getByTestId("schema-validation-errors").first(),
  ).toContainText("$.candidate.years_experience");
  await page.getByLabel("Export target").first().selectOption("openai");
  await expect(
    page.getByTestId("structured-output-result").first(),
  ).toContainText('"strict": true');
});
