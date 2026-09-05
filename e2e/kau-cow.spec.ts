import { expect, test } from "@playwright/test";

test("Kau runs in the desktop header and moos without blocking navigation", async ({
  page,
}) => {
  await page.goto("/");

  const kau = page.getByRole("button", {
    name: "Kau the running cow — play moo moo",
  });
  await expect(kau).toBeVisible();
  await expect(kau.getByText("Hi Kau")).toBeVisible();
  await kau.hover();
  expect(
    await kau.evaluate(
      (element) => getComputedStyle(element).animationPlayState,
    ),
  ).toBe("running");
  await kau.click();
  await expect(page.getByText("Moo moo!", { exact: true })).toBeAttached();
  expect(
    await kau.evaluate(
      (element) => getComputedStyle(element).animationPlayState,
    ),
  ).toBe("running");

  await expect(page.getByRole("link", { name: "All tools" })).toBeVisible();
});
