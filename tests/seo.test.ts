import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { buildToolMetadata, toolStructuredData } from "@/lib/seo";
import { getToolById, toolRegistry } from "@/config/tool-registry";
describe("SEO", () => {
  it("includes every available tool and excludes planned placeholders from the sitemap", () => {
    const urls = sitemap().map((x) => x.url);
    for (const tool of toolRegistry.filter(
      (x) => x.availability === "available",
    ))
      expect(urls.some((url) => url.endsWith(tool.route))).toBe(true);
    for (const tool of toolRegistry.filter((x) => x.availability === "planned"))
      expect(urls.some((url) => url.endsWith(tool.route))).toBe(false);
  });
  it("creates canonical social metadata and noindexes placeholders", () => {
    const available = getToolById("json-formatter-validator")!,
      planned = { ...available, availability: "planned" as const };
    expect(buildToolMetadata(available)).toMatchObject({
      alternates: { canonical: expect.stringContaining(available.route) },
      openGraph: { title: available.name },
      twitter: { card: "summary" },
      robots: { index: true },
    });
    expect(buildToolMetadata(planned)).toMatchObject({
      robots: { index: false, follow: true },
    });
  });
  it("builds truthful application and breadcrumb structured data", () => {
    const value = toolStructuredData(getToolById("json-formatter-validator")!);
    expect(value).toMatchObject({
      "@type": "WebApplication",
      isAccessibleForFree: true,
      breadcrumb: { "@type": "BreadcrumbList" },
    });
    expect(JSON.stringify(value)).not.toContain("aggregateRating");
  });
  it("publishes robots rules and sitemap", () =>
    expect(robots()).toMatchObject({
      rules: { disallow: ["/api/", "/favorites"] },
      sitemap: expect.stringContaining("sitemap.xml"),
    }));
});
