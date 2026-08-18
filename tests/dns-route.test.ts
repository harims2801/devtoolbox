import { describe, expect, it, vi } from "vitest";
import { createDnsPost } from "@/app/api/dns/route";
import { SafeNetworkError } from "@/lib/server/network-security";

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request("http://localhost/api/dns", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("DNS API route", () => {
  it("returns results and cache metadata from an injected resolver service", async () => {
    const service = {
      lookupRecords: vi.fn(async () => ({
        query: "example.com",
        normalizedName: "example.com",
        records: [
          {
            type: "A" as const,
            name: "example.com",
            value: "93.184.216.34",
            ttl: 60,
          },
        ],
        resolver: {
          kind: "recursive" as const,
          name: "test",
          authoritative: false as const,
        },
        cached: true,
        queriedAt: "2026-08-18T00:00:00.000Z",
      })),
    };
    const response = await createDnsPost({ service })(
      request({ query: "example.com", recordTypes: ["A"] }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("X-Cache")).toBe("HIT");
    expect(service.lookupRecords).toHaveBeenCalledWith("example.com", ["A"]);
  });

  it("enforces origin, body shape, size, rate limits, and safe errors", async () => {
    const service = { lookupRecords: vi.fn() },
      blocked = createDnsPost({ service });
    expect(
      (await blocked(request({}, { origin: "https://evil.example" }))).status,
    ).toBe(403);
    expect(
      (await blocked(request({ query: "x", recordTypes: ["BAD"] }))).status,
    ).toBe(400);
    expect(
      (await blocked(request({}, { "content-length": "3000" }))).status,
    ).toBe(413);
    const limited = createDnsPost({
      service,
      limiter: {
        check: () => {
          throw new SafeNetworkError(
            "RATE_LIMITED",
            "Too many requests. Please wait and try again.",
            429,
          );
        },
      },
    });
    expect(
      (await limited(request({ query: "example.com", recordTypes: ["A"] })))
        .status,
    ).toBe(429);
    const failed = createDnsPost({
      service: {
        lookupRecords: async () => {
          throw new Error("provider credential abc");
        },
      },
      limiter: { check: () => undefined },
    });
    const response = await failed(
      request({ query: "example.com", recordTypes: ["A"] }),
    );
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("credential abc");
  });
});
