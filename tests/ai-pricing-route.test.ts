import { describe, expect, it, vi } from "vitest";
import { createAiPricingPost } from "@/app/api/ai-pricing/route";
import { SafeNetworkError } from "@/lib/server/network-security";

function request(body: unknown, headers: HeadersInit = {}) {
  const serialized = JSON.stringify(body);
  return new Request("https://devtoolbox.test/api/ai-pricing", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(serialized.length),
      ...headers,
    },
    body: serialized,
  });
}

describe("AI pricing import route", () => {
  it("forwards a bounded same-origin request without caching", async () => {
    const imported = {
        sourceUrl: "https://example.com/",
        finalUrl: "https://example.com/",
        retrievedAt: "now",
        provider: "example.com",
        plans: [],
        warnings: [],
      },
      runImport = vi.fn().mockResolvedValue(imported),
      response = await createAiPricingPost({
        importer: { import: runImport },
        limiter: { check: vi.fn() },
      })(request({ url: "https://example.com" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(runImport).toHaveBeenCalledWith("https://example.com");
  });

  it("rejects cross-origin, unknown fields, and rate limits", async () => {
    const post = createAiPricingPost({
      importer: { import: vi.fn() },
      limiter: { check: vi.fn() },
    });
    expect(
      (
        await post(
          request(
            { url: "https://example.com" },
            { origin: "https://evil.test" },
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (await post(request({ url: "https://example.com", extra: true }))).status,
    ).toBe(400);
    const limited = createAiPricingPost({
      importer: { import: vi.fn() },
      limiter: {
        check: () => {
          throw new SafeNetworkError("RATE_LIMITED", "Too many imports.", 429);
        },
      },
    });
    expect(
      (await limited(request({ url: "https://example.com" }))).status,
    ).toBe(429);
  });

  it("does not leak upstream error details", async () => {
    const response = await createAiPricingPost({
      importer: {
        import: vi.fn().mockRejectedValue(new Error("secret 10.0.0.1")),
      },
      limiter: { check: vi.fn() },
    })(request({ url: "https://example.com" }));
    expect(response.status).toBe(502);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});
