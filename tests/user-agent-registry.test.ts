import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getToolById, searchTools } from "@/config/tool-registry";
import { absoluteUrl, getToolMetadata } from "@/lib/seo";

describe("User-Agent parser registry alignment", () => {
  it("keeps registry, search, metadata, and sitemap aligned", () => {
    const tool = getToolById("user-agent-parser");
    expect(tool).toMatchObject({
      availability: "available",
      route: "/tools/user-agent-parser",
      processingType: "browser",
    });
    expect(searchTools("browser device").map((item) => item.id)).toContain(
      "user-agent-parser",
    );
    expect(getToolMetadata("user-agent-parser").robots).toEqual({
      index: true,
      follow: true,
    });
    expect(sitemap().map((entry) => entry.url)).toContain(
      absoluteUrl("/tools/user-agent-parser"),
    );
  });
});
