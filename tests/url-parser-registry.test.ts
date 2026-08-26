import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getToolById } from "@/config/tool-registry";
import { absoluteUrl, getToolMetadata } from "@/lib/seo";

describe("URL parser registry alignment", () => {
  it("activates the implemented route for search engines and navigation", () => {
    expect(getToolById("url-parser")).toMatchObject({
      availability: "available",
      route: "/tools/url-parser",
      processingType: "browser",
    });
    expect(getToolMetadata("url-parser").robots).toEqual({
      index: true,
      follow: true,
    });
    expect(sitemap().map((entry) => entry.url)).toContain(
      absoluteUrl("/tools/url-parser"),
    );
  });
});
