import { describe, expect, it, vi } from "vitest";
import { createWebhookPost } from "@/app/api/webhook-test/route";
import { SafeNetworkError } from "@/lib/server/network-security";

const report = {
  endpoint: "https://example.com/hook",
  method: "POST" as const,
  status: 200,
  statusText: "OK",
  timingMilliseconds: 10,
  redirects: [],
  responseHeaders: [],
  preview: {
    kind: "json" as const,
    content: "{}",
    truncated: false,
    bytesRead: 2,
  },
};

function request(body: unknown, headers: HeadersInit = {}) {
  const serialized = JSON.stringify(body);
  return new Request("https://devtoolbox.test/api/webhook-test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(serialized.length),
      ...headers,
    },
    body: serialized,
  });
}

const valid = {
  endpoint: "https://example.com/hook",
  method: "POST",
  payload: { ok: true },
  headers: [{ name: "X-Test", value: "one" }],
  consent: true,
};

describe("webhook test route", () => {
  it("requires consent and forwards a bounded valid request", async () => {
    const send = vi.fn().mockResolvedValue(report),
      post = createWebhookPost({
        tester: { send },
        limiter: { check: vi.fn() },
      }),
      response = await post(request(valid));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(send).toHaveBeenCalledWith(
      valid.endpoint,
      "POST",
      valid.payload,
      valid.headers,
    );
    expect((await post(request({ ...valid, consent: false }))).status).toBe(
      400,
    );
  });

  it("rejects cross-origin and oversized API requests", async () => {
    const post = createWebhookPost({
      tester: { send: vi.fn() },
      limiter: { check: vi.fn() },
    });
    expect(
      (await post(request(valid, { origin: "https://attacker.example" })))
        .status,
    ).toBe(403);
    const oversized = new Request("https://devtoolbox.test/api/webhook-test", {
      method: "POST",
      body: "x".repeat(49 * 1024),
    });
    expect((await post(oversized)).status).toBe(413);
  });

  it("applies rate limits and hides provider internals", async () => {
    const limited = createWebhookPost({
      tester: { send: vi.fn() },
      limiter: {
        check: () => {
          throw new SafeNetworkError("RATE_LIMITED", "Too many requests.", 429);
        },
      },
    });
    expect((await limited(request(valid))).status).toBe(429);

    const failed = createWebhookPost({
      tester: {
        send: vi
          .fn()
          .mockRejectedValue(new Error("Bearer secret and 10.0.0.1")),
      },
      limiter: { check: vi.fn() },
    });
    const response = await failed(request(valid)),
      text = JSON.stringify(await response.json());
    expect(response.status).toBe(502);
    expect(text).not.toContain("secret");
    expect(text).not.toContain("10.0.0.1");
  });
});
