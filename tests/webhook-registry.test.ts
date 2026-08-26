import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getToolById } from "@/config/tool-registry";
import { absoluteUrl, getToolMetadata } from "@/lib/seo";

describe("webhook tester registry alignment", () => {
  it("activates the server-assisted route", () => {
    expect(getToolById("webhook-payload-tester")).toMatchObject({
      availability: "available",
      route: "/tools/webhook-tester",
      processingType: "server-assisted",
    });
    expect(getToolMetadata("webhook-payload-tester").robots).toEqual({
      index: true,
      follow: true,
    });
    expect(sitemap().map((entry) => entry.url)).toContain(
      absoluteUrl("/tools/webhook-tester"),
    );
  });
});
