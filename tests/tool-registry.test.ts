import { describe, expect, it } from "vitest";

import {
  filterTools,
  getCategoryBySlug,
  getFeaturedTools,
  getPopularTools,
  getRecentlyAddedTools,
  getRelatedTools,
  getToolById,
  getToolBySlug,
  getToolsByCategory,
  searchTools,
  sortTools,
  toolCategories,
  toolRegistry,
} from "@/config/tool-registry";

describe("tool registry", () => {
  it("contains every planned tool with unique routes and valid references", () => {
    expect(toolRegistry).toHaveLength(43);

    const ids = toolRegistry.map((tool) => tool.id);
    const slugs = toolRegistry.map((tool) => tool.slug);
    const routes = toolRegistry.map((tool) => tool.route);

    expect(new Set(ids)).toHaveLength(ids.length);
    expect(new Set(slugs)).toHaveLength(slugs.length);
    expect(new Set(routes)).toHaveLength(routes.length);

    for (const tool of toolRegistry) {
      expect(tool.route).toBe(`/tools/${tool.slug}`);
      expect(toolCategories.some((item) => item.id === tool.category)).toBe(
        true,
      );
      for (const relatedId of tool.relatedToolIds) {
        expect(
          getToolById(relatedId),
          `${tool.id} -> ${relatedId}`,
        ).toBeDefined();
      }
    }
  });

  it("looks up tools and categories by stable identifiers", () => {
    expect(getToolBySlug("json-formatter")?.id).toBe(
      "json-formatter-validator",
    );
    expect(getToolById("jwt-decoder-inspector")?.slug).toBe("jwt-decoder");
    expect(getCategoryBySlug("devops-sre")?.name).toBe("DevOps & SRE");
    expect(getCategoryBySlug("ai-engineering")?.name).toBe("AI Engineering");
    expect(getToolBySlug("missing")).toBeUndefined();
  });

  it("filters by category and processing type", () => {
    expect(getToolsByCategory("generators")).toHaveLength(5);
    expect(filterTools({ processingType: "server-assisted" })).toHaveLength(5);
    expect(
      filterTools({
        category: "formatting-validation",
        processingType: "server-assisted",
      }),
    ).toEqual([]);
  });

  it("searches names, descriptions, categories, and keywords", () => {
    expect(searchTools("oauth").map((tool) => tool.id)).toContain(
      "jwt-decoder-inspector",
    );
    expect(searchTools("subnet").map((tool) => tool.id)).toEqual([
      "cidr-ip-calculator",
    ]);
    expect(searchTools("   ")).toHaveLength(toolRegistry.length);
  });

  it("returns deterministic featured, popular, recent, and related tools", () => {
    expect(getFeaturedTools()).not.toHaveLength(0);
    expect(getPopularTools(1)[0]?.id).toBe("json-formatter-validator");
    expect(getRecentlyAddedTools(3)).toHaveLength(3);
    expect(getRelatedTools("json-formatter-validator")[0]?.id).toBe(
      "yaml-formatter-converter",
    );
  });

  it("sorts alphabetically and by popularity without mutating the registry", () => {
    const originalFirst = toolRegistry[0];
    const alphabetical = sortTools(toolRegistry, "alphabetical");
    const popular = sortTools(toolRegistry, "popularity");

    expect(alphabetical[0]?.name).toBe("Base64 Encoder and Decoder");
    expect(popular[0]?.id).toBe("json-formatter-validator");
    expect(toolRegistry[0]).toBe(originalFirst);
  });
});
