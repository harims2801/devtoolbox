import { expect, test } from "@playwright/test";

import { getCategoryById, toolRegistry } from "../src/config/tool-registry";

test("every available card opens a real implemented tool", async ({ page }) => {
  test.setTimeout(240_000);

  for (const tool of toolRegistry.filter(
    (candidate) => candidate.availability === "available",
  )) {
    const category = getCategoryById(tool.category);
    expect(category, `Missing category for ${tool.id}`).toBeDefined();
    await page.goto(`/tools/category/${category!.slug}`);

    const cardLink = page.getByRole("link", { name: `Open ${tool.name}` });
    await expect(cardLink).toHaveAttribute("href", tool.route);
    await cardLink.click({ position: { x: 8, y: 8 } });

    await expect(page).toHaveURL(new RegExp(`${tool.route}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: tool.name }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tool implementation coming soon" }),
    ).toHaveCount(0);
  }
});
