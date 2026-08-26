import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getToolById } from "@/config/tool-registry";
import { absoluteUrl, getToolMetadata } from "@/lib/seo";

describe("query string builder registry alignment", () => {
  it("activates the implemented browser route", () => {
    expect(getToolById("query-string-builder")).toMatchObject({
      availability: "available",
      route: "/tools/query-string-builder",
      processingType: "browser",
    });
    expect(getToolMetadata("query-string-builder").robots).toEqual({
      index: true,
      follow: true,
    });
    expect(sitemap().map((entry) => entry.url)).toContain(
      absoluteUrl("/tools/query-string-builder"),
    );
  });
});
