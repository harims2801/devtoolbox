import { describe, expect, it, vi } from "vitest";
import {
  WebhookTester,
  parsePublicWebhookUrl,
  validateWebhookHeaders,
  type RawWebhookResponse,
  type WebhookTransport,
} from "@/lib/server/webhook-tester";
import type { HostLookup } from "@/lib/server/network-security";

const publicLookup: HostLookup = async () => [
  { address: "93.184.216.34", family: 4 },
];

function response(
  status = 200,
  headers: Array<[string, string]> = [["Content-Type", "application/json"]],
  body = '{"ok":true}',
  overrides: Partial<RawWebhookResponse> = {},
): RawWebhookResponse {
  const encoded = new TextEncoder().encode(body);
  return {
    status,
    statusText: status === 200 ? "OK" : "Temporary Redirect",
    headers,
    body: encoded,
    bytesRead: encoded.byteLength,
    truncated: false,
    ...overrides,
  };
}

describe("WebhookTester", () => {
  it("accepts only credential-free, fragment-free HTTPS on the standard port", () => {
    expect(parsePublicWebhookUrl("https://example.com/hook").href).toBe(
      "https://example.com/hook",
    );
    expect(() => parsePublicWebhookUrl("http://example.com")).toThrow(/HTTPS/);
    expect(() =>
      parsePublicWebhookUrl("https://user:pass@example.com"),
    ).toThrow(/credentials/);
    expect(() =>
      parsePublicWebhookUrl("https://example.com/hook#secret"),
    ).toThrow(/fragments/);
    expect(() => parsePublicWebhookUrl("https://example.com:8443")).toThrow(
      /standard/,
    );
  });

  it.each([
    "https://127.0.0.1/hook",
    "https://2130706433/hook",
    "https://0177.0.0.1/hook",
    "https://0x7f000001/hook",
    "https://[::ffff:127.0.0.1]/hook",
    "https://[::127.0.0.1]/hook",
    "https://[64:ff9b::7f00:1]/hook",
  ])("blocks private-address bypass form %s", async (endpoint) => {
    const transport = vi.fn<WebhookTransport>();
    await expect(
      new WebhookTester(publicLookup, transport).send(endpoint, "POST", {}, []),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(transport).not.toHaveBeenCalled();
  });

  it("rejects auth, cookie, framing, proxy, and body-control headers", () => {
    for (const name of [
      "Authorization",
      "Cookie",
      "Host",
      "Content-Length",
      "Content-Type",
      "Connection",
      "X-Forwarded-For",
      "X-HTTP-Method-Override",
      "X-Original-Host",
      "X-Proxy-URL",
    ])
      expect(() => validateWebhookHeaders([{ name, value: "secret" }])).toThrow(
        /not allowed/,
      );
    expect(
      validateWebhookHeaders([
        { name: "X-Event-Type", value: "test" },
        { name: "Idempotency-Key", value: "evt-1" },
      ]),
    ).toEqual([
      { name: "x-event-type", value: "test" },
      { name: "idempotency-key", value: "evt-1" },
    ]);
  });

  it("pins the public address, sends JSON, selects safe headers, and formats JSON", async () => {
    const transport = vi.fn<WebhookTransport>().mockResolvedValue(
        response(
          200,
          [
            ["Content-Type", "application/json"],
            ["X-Request-Id", "req-1"],
            ["Set-Cookie", "session=secret"],
          ],
          '{"received":true}',
        ),
      ),
      times = [100, 125],
      report = await new WebhookTester(
        publicLookup,
        transport,
        5_000,
        () => times.shift() ?? 125,
      ).send("https://example.com/hook", "PATCH", { value: "test" }, [
        { name: "X-Event-Type", value: "test" },
      ]);
    expect(transport).toHaveBeenCalledWith(
      expect.any(URL),
      "93.184.216.34",
      4,
      "PATCH",
      [{ name: "x-event-type", value: "test" }],
      '{"value":"test"}',
    );
    expect(report).toMatchObject({
      status: 200,
      timingMilliseconds: 25,
      preview: { kind: "json", content: '{\n  "received": true\n}' },
    });
    expect(JSON.stringify(report)).not.toContain("session=secret");
  });

  it("blocks a redirect to a private endpoint before a second request", async () => {
    const transport = vi
      .fn<WebhookTransport>()
      .mockResolvedValueOnce(
        response(307, [["Location", "https://127.0.0.1/admin"]], ""),
      );
    await expect(
      new WebhookTester(publicLookup, transport).send(
        "https://example.com/hook",
        "POST",
        {},
        [],
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("re-resolves redirects and blocks DNS rebinding", async () => {
    const lookup = vi
        .fn<HostLookup>()
        .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
        .mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]),
      transport = vi
        .fn<WebhookTransport>()
        .mockResolvedValueOnce(response(308, [["Location", "/next"]], ""));
    await expect(
      new WebhookTester(lookup, transport).send(
        "https://example.com/hook",
        "POST",
        {},
        [],
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("does not replay a payload across method-changing redirects", async () => {
    const transport = vi
        .fn<WebhookTransport>()
        .mockResolvedValue(response(302, [["Location", "/elsewhere"]], "")),
      report = await new WebhookTester(publicLookup, transport).send(
        "https://example.com/hook",
        "POST",
        {},
        [],
      );
    expect(report).toMatchObject({ status: 302, redirects: [] });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("enforces redirect and response-header limits", async () => {
    const redirecting = vi
      .fn<WebhookTransport>()
      .mockResolvedValue(response(307, [["Location", "/again"]], ""));
    await expect(
      new WebhookTester(publicLookup, redirecting).send(
        "https://example.com/hook",
        "POST",
        {},
        [],
      ),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
    expect(redirecting).toHaveBeenCalledTimes(4);

    const oversizedHeaders = vi
      .fn<WebhookTransport>()
      .mockResolvedValue(response(200, [["X-Large", "x".repeat(17 * 1024)]]));
    await expect(
      new WebhookTester(publicLookup, oversizedHeaders).send(
        "https://example.com/hook",
        "POST",
        {},
        [],
      ),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
  });

  it("pins a public IPv6 literal without DNS", async () => {
    const lookup = vi.fn<HostLookup>(),
      transport = vi.fn<WebhookTransport>().mockResolvedValue(response());
    await new WebhookTester(lookup, transport).send(
      "https://[2606:4700:4700::1111]/hook",
      "POST",
      {},
      [],
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(transport).toHaveBeenCalledWith(
      expect.any(URL),
      "2606:4700:4700::1111",
      6,
      "POST",
      [],
      "{}",
    );
  });

  it("rejects oversized payloads and truncates oversized responses", async () => {
    const tester = new WebhookTester(
      publicLookup,
      vi.fn<WebhookTransport>().mockResolvedValue(
        response(200, [["Content-Type", "text/plain"]], "preview", {
          bytesRead: 70 * 1024,
          truncated: true,
        }),
      ),
    );
    await expect(
      tester.send(
        "https://example.com",
        "POST",
        { data: "x".repeat(33 * 1024) },
        [],
      ),
    ).rejects.toMatchObject({ code: "TOO_LARGE", status: 413 });
    expect(
      await tester.send("https://example.com", "POST", {}, []),
    ).toMatchObject({ preview: { truncated: true, bytesRead: 70 * 1024 } });
  });

  it("returns non-JSON and HTML-shaped responses only as inert text", async () => {
    const report = await new WebhookTester(
      publicLookup,
      vi
        .fn<WebhookTransport>()
        .mockResolvedValue(
          response(
            200,
            [["Content-Type", "text/html"]],
            '<img src=x onerror="alert(1)">',
          ),
        ),
    ).send("https://example.com", "POST", {}, []);
    expect(report.preview).toMatchObject({
      kind: "text",
      content: '<img src=x onerror="alert(1)">',
    });
  });

  it("returns stable timeout and secret-safe provider errors", async () => {
    vi.useFakeTimers();
    const timed = new WebhookTester(
        publicLookup,
        vi.fn<WebhookTransport>().mockReturnValue(new Promise(() => {})),
        50,
      ).send("https://example.com", "POST", {}, []),
      assertion = expect(timed).rejects.toMatchObject({
        code: "TIMEOUT",
        status: 504,
      });
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    vi.useRealTimers();

    await expect(
      new WebhookTester(
        publicLookup,
        vi
          .fn<WebhookTransport>()
          .mockRejectedValue(new Error("Authorization: Bearer super-secret")),
      ).send("https://example.com", "POST", {}, []),
    ).rejects.toMatchObject({
      message: "The webhook request could not be completed safely.",
    });
  });
});
