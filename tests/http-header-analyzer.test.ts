import { describe, expect, it, vi } from "vitest";
import {
  HttpHeaderAnalyzer,
  parsePublicHttpUrl,
  type HeaderTransport,
  type RawHeaderResponse,
} from "@/lib/server/http-header-analyzer";
import type { HostLookup } from "@/lib/server/network-security";

const publicLookup: HostLookup = async () => [
  { address: "93.184.216.34", family: 4 },
];

function response(
  status = 200,
  headers: Array<[string, string]> = [],
): RawHeaderResponse {
  return { status, statusText: status === 200 ? "OK" : "Found", headers };
}

describe("HTTP header analyzer", () => {
  it("accepts only credential-free URLs on standard HTTP ports", () => {
    expect(parsePublicHttpUrl("https://Example.com/path#secret").href).toBe(
      "https://example.com/path",
    );
    expect(() => parsePublicHttpUrl("file:///etc/passwd")).toThrow(
      /Only public/,
    );
    expect(() => parsePublicHttpUrl("https://user:pass@example.com")).toThrow(
      /credentials/,
    );
    expect(() => parsePublicHttpUrl("http://example.com:8080")).toThrow(
      /standard/,
    );
  });

  it("normalizes duplicates, analyzes CSP/HSTS, and hides cookie values", async () => {
    const transport = vi.fn<HeaderTransport>().mockResolvedValue(
      response(200, [
        ["Cache-Control", "public, max-age=60"],
        ["X-Trace", "one"],
        ["x-trace", "two"],
        ["Content-Type", "text/html; charset=utf-8"],
        ["Content-Encoding", "br"],
        [
          "Content-Security-Policy",
          "default-src 'self'; frame-ancestors 'none'",
        ],
        ["Strict-Transport-Security", "max-age=31536000"],
        ["X-Content-Type-Options", "nosniff"],
        ["Authentication-Info", "nextnonce=another-secret"],
        [
          "Set-Cookie",
          "session=super-secret; Secure; HttpOnly; SameSite=Lax; Path=/",
        ],
      ]),
    );
    const report = await new HttpHeaderAnalyzer(
      publicLookup,
      transport,
    ).analyze("https://example.com");
    expect(report.headers).toContainEqual({
      name: "x-trace",
      value: "one, two",
    });
    expect(JSON.stringify(report)).not.toContain("super-secret");
    expect(JSON.stringify(report)).not.toContain("another-secret");
    expect(report.cookies).toEqual([
      expect.objectContaining({
        name: "session",
        secure: true,
        httpOnly: true,
        sameSite: "Lax",
      }),
    ]);
    expect(report.cacheDirectives).toEqual({ public: true, "max-age": "60" });
    expect(report.contentType).toBe("text/html; charset=utf-8");
    expect(report.compression).toBe("br");
    expect(report.security).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          header: "content-security-policy",
          status: "pass",
        }),
        expect.objectContaining({
          header: "strict-transport-security",
          status: "pass",
        }),
        expect.objectContaining({ header: "frame-protection", status: "pass" }),
      ]),
    );
  });

  it("blocks a redirect to a private address before the second request", async () => {
    const transport = vi
      .fn<HeaderTransport>()
      .mockResolvedValueOnce(
        response(302, [["Location", "http://127.0.0.1/admin"]]),
      );
    await expect(
      new HttpHeaderAnalyzer(publicLookup, transport).analyze(
        "https://example.com",
      ),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("re-resolves every redirect hop and blocks a rebinding answer", async () => {
    const lookup = vi
        .fn<HostLookup>()
        .mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }])
        .mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]),
      transport = vi
        .fn<HeaderTransport>()
        .mockResolvedValueOnce(response(302, [["Location", "/next"]]));
    await expect(
      new HttpHeaderAnalyzer(lookup, transport).analyze("https://example.com"),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
    expect(lookup).toHaveBeenCalledTimes(2);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("pins public IPv6 literals without consulting DNS", async () => {
    const lookup = vi.fn<HostLookup>(),
      transport = vi.fn<HeaderTransport>().mockResolvedValue(response());
    await new HttpHeaderAnalyzer(lookup, transport).analyze(
      "https://[2606:4700:4700::1111]/",
    );
    expect(lookup).not.toHaveBeenCalled();
    expect(transport).toHaveBeenCalledWith(
      expect.any(URL),
      "2606:4700:4700::1111",
      6,
      "HEAD",
    );
  });

  it("rejects oversized response headers", async () => {
    const transport = vi
      .fn<HeaderTransport>()
      .mockResolvedValue(response(200, [["X-Large", "x".repeat(33 * 1024)]]));
    await expect(
      new HttpHeaderAnalyzer(publicLookup, transport).analyze(
        "https://example.com",
      ),
    ).rejects.toMatchObject({ code: "TOO_LARGE" });
  });

  it("returns a stable timeout error", async () => {
    vi.useFakeTimers();
    const transport = vi
        .fn<HeaderTransport>()
        .mockReturnValue(new Promise(() => {})),
      result = new HttpHeaderAnalyzer(publicLookup, transport, 50).analyze(
        "https://example.com",
      ),
      assertion = expect(result).rejects.toMatchObject({
        code: "TIMEOUT",
        status: 504,
      });
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    vi.useRealTimers();
  });

  it("redacts provider failures", async () => {
    const transport = vi
      .fn<HeaderTransport>()
      .mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.9:443"));
    await expect(
      new HttpHeaderAnalyzer(publicLookup, transport).analyze(
        "https://example.com",
      ),
    ).rejects.toMatchObject({
      code: "UPSTREAM_FAILURE",
      message: "The public URL could not be analyzed safely.",
    });
  });
});
