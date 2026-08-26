import { describe, expect, it } from "vitest";
import { MAX_USER_AGENT_LENGTH, parseUserAgent } from "@/lib/user-agent-tools";

const chrome =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const firefox =
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0";
const safari =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
const iphone =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const android =
  "Mozilla/5.0 (Linux; Android 14; Pixel 6 Build/UQ1A.240205.004) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.164 Mobile Safari/537.36";

describe("User-Agent parser", () => {
  it.each([
    [chrome, "Chrome", "Windows", "Blink"],
    [firefox, "Firefox", "Ubuntu", "Gecko"],
    [safari, "Safari", "Mac OS", "WebKit"],
  ])("parses a desktop browser", (ua, browser, os, engine) => {
    expect(parseUserAgent(ua)).toMatchObject({
      client: { family: browser },
      os: { name: os },
      engine: { name: engine },
    });
  });

  it.each([
    [iphone, "Mobile Safari", "mobile", "Apple"],
    [android, "Chrome", "mobile", "Google"],
  ])("parses a mobile browser", (ua, browser, deviceClass, vendor) => {
    expect(parseUserAgent(ua)).toMatchObject({
      client: { family: browser },
      device: { class: deviceClass, vendor },
    });
  });

  it("recognizes command-line clients", () => {
    expect(parseUserAgent("curl/8.7.1").client).toEqual({
      family: "curl",
      version: "8.7.1",
      kind: "cli",
    });
    expect(parseUserAgent("python-requests/2.32.3").client.family).toBe(
      "Python Requests",
    );
  });

  it("recognizes bots without claiming certainty", () => {
    const report = parseUserAgent(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );
    expect(report.bot).toEqual({ detected: true, indicator: "Googlebot" });
    expect(report.warnings[0]).toMatch(/best-effort/i);
  });

  it("flags reduced and conflicting spoof-shaped strings", () => {
    expect(parseUserAgent(chrome)).toMatchObject({ reduced: true });
    expect(
      parseUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Android 14) Firefox/133.0 Chrome/131.0.0.0",
      ),
    ).toMatchObject({ ambiguous: true });
  });

  it("rejects empty and overly long input predictably", () => {
    expect(() => parseUserAgent("  ")).toThrow(/Enter a User-Agent/);
    expect(() => parseUserAgent("x".repeat(MAX_USER_AGENT_LENGTH + 1))).toThrow(
      /limited/,
    );
  });
});
