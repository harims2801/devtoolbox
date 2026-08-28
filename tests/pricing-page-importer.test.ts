import { describe, expect, it, vi } from "vitest";
import {
  PricingPageImporter,
  extractPricingPlans,
  type PricingTransport,
} from "@/lib/server/pricing-page-importer";
import type { HostLookup } from "@/lib/server/network-security";

const lookup: HostLookup = async () => [
  { address: "93.184.216.34", family: 4 },
];
const html = `
  <html><body><table>
    <tr><th>Model</th><th>Input per 1M tokens</th><th>Cached input per 1M tokens</th><th>Output per 1M tokens</th></tr>
    <tr><td>Model &lt;Fast&gt;</td><td>$1.25</td><td>$0.25</td><td>$5.00</td></tr>
    <tr><td>Model Pro</td><td>$10</td><td>Unavailable</td><td>$30</td></tr>
  </table><script>secret()</script></body></html>`;

describe("pricing page importer", () => {
  it("extracts conventional model/input/cache/output tables as review drafts", () => {
    const result = extractPricingPlans(
      html,
      "https://openai.com/api/pricing/",
      "2026-08-28T00:00:00.000Z",
    );
    expect(result.provider).toBe("OpenAI");
    expect(result.plans).toHaveLength(2);
    expect(result.plans[0]).toMatchObject({
      model: "Model <Fast>",
      unitTokens: 1_000_000,
      inputPrice: 1.25,
      cachedInputPrice: 0.25,
      outputPrice: 5,
      confidence: "high",
    });
    expect(result.warnings.join(" ")).toMatch(/review/i);
    expect(JSON.stringify(result)).not.toContain("secret()");
  });

  it("fails closed to manual review when a page has no complete table", () => {
    const result = extractPricingPlans(
      "<h1>Pricing</h1><p>Contact sales</p>",
      "https://pricing.example.com",
    );
    expect(result.plans).toEqual([]);
    expect(result.warnings.join(" ")).toMatch(/manually/i);
  });

  it("pins a public address and revalidates redirects", async () => {
    const transport = vi
      .fn<PricingTransport>()
      .mockResolvedValueOnce({
        status: 302,
        headers: { location: "https://cdn.example.com/prices" },
        body: "",
      })
      .mockResolvedValueOnce({
        status: 200,
        headers: { "content-type": "text/html" },
        body: html,
      });
    const importer = new PricingPageImporter(lookup, transport);
    const result = await importer.import(
      "https://example.com/pricing#private-fragment",
    );
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0]?.[1]).toBe("93.184.216.34");
    expect(result.sourceUrl).toBe("https://example.com/pricing");
    expect(result.finalUrl).toBe("https://cdn.example.com/prices");
  });

  it("blocks private redirects and DNS rebinding before another request", async () => {
    const privateRedirect = vi.fn<PricingTransport>().mockResolvedValue({
      status: 302,
      headers: { location: "https://127.0.0.1/admin" },
      body: "",
    });
    await expect(
      new PricingPageImporter(lookup, privateRedirect).import(
        "https://example.com",
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(privateRedirect).toHaveBeenCalledTimes(1);

    const rebindingLookup = vi
      .fn<HostLookup>()
      .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
      .mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]);
    const redirect = vi.fn<PricingTransport>().mockResolvedValue({
      status: 302,
      headers: { location: "/next" },
      body: "",
    });
    await expect(
      new PricingPageImporter(rebindingLookup, redirect).import(
        "https://example.com",
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it("accepts only HTTPS HTML pages and bounded redirects", async () => {
    await expect(
      new PricingPageImporter(lookup, vi.fn()).import(
        "http://example.com/pricing",
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    const transport = vi.fn<PricingTransport>().mockResolvedValue({
      status: 200,
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    await expect(
      new PricingPageImporter(lookup, transport).import(
        "https://example.com/pricing",
      ),
    ).rejects.toMatchObject({ status: 415 });
  });
});
