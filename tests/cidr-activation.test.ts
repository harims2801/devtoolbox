import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getToolById, searchTools } from "@/config/tool-registry";
import { absoluteUrl, getToolMetadata } from "@/lib/seo";

describe("CIDR activation alignment", () => {
  it("keeps registry, search, metadata, and sitemap aligned to the implemented route", () => {
    const tool = getToolById("cidr-ip-calculator");
    expect(tool).toMatchObject({
      availability: "available",
      route: "/tools/cidr-calculator",
      addedAt: "2026-08-18",
      isNew: true,
      isFeatured: false,
    });
    expect(searchTools("subnet").map((item) => item.id)).toContain(
      "cidr-ip-calculator",
    );
    expect(getToolMetadata("cidr-ip-calculator").robots).toEqual({
      index: true,
      follow: true,
    });
    expect(sitemap().map((entry) => entry.url)).toContain(
      absoluteUrl("/tools/cidr-calculator"),
    );
  });
});
