import { expect, test } from "@playwright/test";

function segment(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

test("decodes the example token and shows claims without verification", async ({
  page,
}) => {
  await page.goto("/tools/jwt-decoder");
  await expect(
    page.getByText("Decoding does not verify authenticity").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load example" }).click();
  await page.getByRole("button", { name: "Decode JWT", exact: true }).click();

  await expect(page.getByTestId("jwt-inspection")).toContainText("HS256");
  await expect(page.getByTestId("jwt-inspection")).toContainText(
    "safe-demo-user",
  );
  await expect(page.getByText("active", { exact: true })).toBeVisible();
  await expect(page.getByText(/No signature verification/)).toBeVisible();
});

test("identifies expired tokens and safely renders untrusted claims", async ({
  page,
}) => {
  const jwt = `${segment({ alg: "HS256", typ: "JWT" })}.${segment({
    sub: "<img src=x onerror=alert(1)>",
    exp: 1,
  })}.unverified`;
  await page.goto("/tools/jwt-decoder");
  await page.getByRole("textbox", { name: "JWT input" }).fill(jwt);
  await page.getByRole("button", { name: "Decode JWT", exact: true }).click();

  await expect(page.getByText("expired", { exact: true })).toBeVisible();
  await expect(page.getByTestId("jwt-inspection")).toContainText(
    "<img src=x onerror=alert(1)>",
  );
  await expect(page.locator("img")).toHaveCount(0);
});

test("reports malformed token structure", async ({ page }) => {
  await page.goto("/tools/jwt-decoder");
  await page.getByRole("textbox", { name: "JWT input" }).fill("one.two");
  await page.getByRole("button", { name: "Decode JWT", exact: true }).click();
  await expect(page.locator('p[role="alert"]').first()).toContainText(
    /three non-empty segments/i,
  );
});
