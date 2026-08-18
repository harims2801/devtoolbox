import { describe, expect, it, vi } from "vitest";
import { createHttpHeadersPost } from "@/app/api/http-headers/route";
import type { HttpHeaderReport } from "@/lib/http-header-shared";
import { SafeNetworkError } from "@/lib/server/network-security";

const report: HttpHeaderReport = {
  requestedUrl: "https://example.com/",
  finalUrl: "https://example.com/",
  method: "HEAD",
  status: 200,
  statusText: "OK",
  redirects: [],
  headers: [],
  cacheDirectives: {},
  cookies: [],
  security: [],
  analyzedAt: "2026-08-18T00:00:00.000Z",
};

function request(body: unknown, headers: HeadersInit = {}) {
  const serialized = JSON.stringify(body);
  return new Request("https://devtoolbox.test/api/http-headers", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(serialized.length),
      ...headers,
    },
    body: serialized,
  });
}

describe("HTTP header route", () => {
  it("validates and forwards a bounded request", async () => {
    const analyze = vi.fn().mockResolvedValue(report),
      response = await createHttpHeadersPost({
        analyzer: { analyze },
        limiter: { check: vi.fn() },
      })(request({ url: "https://example.com", method: "HEAD" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(analyze).toHaveBeenCalledWith("https://example.com", "HEAD");
  });

  it("rejects cross-origin and malformed requests", async () => {
    const post = createHttpHeadersPost({
      analyzer: { analyze: vi.fn() },
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
  });

  it("applies rate limits and stable errors", async () => {
    const limited = createHttpHeadersPost({
      analyzer: { analyze: vi.fn() },
      limiter: {
        check: () => {
          throw new SafeNetworkError("RATE_LIMITED", "Too many requests.", 429);
        },
      },
    });
    const response = await limited(request({ url: "https://example.com" }));
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests." });

    const failed = createHttpHeadersPost({
      analyzer: {
        analyze: vi.fn().mockRejectedValue(new Error("secret upstream")),
      },
      limiter: { check: vi.fn() },
    });
    const failure = await failed(request({ url: "https://example.com" }));
    expect(failure.status).toBe(502);
    expect(JSON.stringify(await failure.json())).not.toContain(
      "secret upstream",
    );
  });
});
