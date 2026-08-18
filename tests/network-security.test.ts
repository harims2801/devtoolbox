import { describe, expect, it, vi } from "vitest";
import {
  assertPublicIp,
  classifyIpAddress,
  normalizeHostname,
  resolvePublicHostname,
  SafeNetworkError,
  SlidingWindowRateLimiter,
  TtlCache,
  withTimeout,
} from "@/lib/server/network-security";

describe("shared network security", () => {
  it("normalizes IDNA hostnames and rejects malformed/internal names", () => {
    expect(normalizeHostname("BÜCHER.example.")).toBe("xn--bcher-kva.example");
    expect(() => normalizeHostname("localhost")).toThrow(/Local/);
    expect(() => normalizeHostname("service.internal")).toThrow(/special-use/);
    expect(() => normalizeHostname("singlelabel")).toThrow(/public hostname/);
    expect(() => normalizeHostname("bad_label.example")).toThrow(
      /valid public/,
    );
  });

  it.each([
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.31.0.1",
    "192.168.1.1",
    "192.0.2.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "fc00::1",
    "fe80::1",
    "ff02::1",
    "2001:db8::1",
    "::ffff:127.0.0.1",
  ])("blocks special-use address %s", (address) => {
    expect(classifyIpAddress(address).public).toBe(false);
    expect(() => assertPublicIp(address)).toThrow(SafeNetworkError);
  });

  it("accepts ordinary public IPv4 and IPv6 addresses", () => {
    expect(classifyIpAddress("8.8.8.8").public).toBe(true);
    expect(classifyIpAddress("2606:4700:4700::1111").public).toBe(true);
  });

  it("rejects a hostname if any resolved answer is non-public", async () => {
    await expect(
      resolvePublicHostname("example.com", async () => [
        { address: "93.184.216.34", family: 4 },
        { address: "127.0.0.1", family: 4 },
      ]),
    ).rejects.toMatchObject({ code: "BLOCKED_TARGET" });
  });

  it("bounds operations with stable timeout errors", async () => {
    vi.useFakeTimers();
    const result = withTimeout(new Promise<never>(() => {}), 50);
    const assertion = expect(result).rejects.toMatchObject({
      code: "TIMEOUT",
      status: 504,
    });
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    vi.useRealTimers();
  });

  it("expires and bounds TTL cache entries", () => {
    let now = 0;
    const cache = new TtlCache<number>(2, () => now);
    cache.set("a", 1, 10);
    cache.set("b", 2, 10);
    cache.set("c", 3, 10);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    now = 11;
    expect(cache.get("c")).toBeUndefined();
  });

  it("rate limits within a sliding window and recovers", () => {
    let now = 0;
    const limiter = new SlidingWindowRateLimiter(2, 100, () => now);
    limiter.check("client");
    limiter.check("client");
    expect(() => limiter.check("client")).toThrow(/Too many/);
    now = 101;
    expect(() => limiter.check("client")).not.toThrow();
  });
});
