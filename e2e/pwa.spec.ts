import { test, expect } from "@playwright/test";
test("exposes an installable manifest and service worker", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");
  const worker = await request.get("/sw.js");
  expect(await worker.text()).toContain("devtoolbox-shell-v1");
});
