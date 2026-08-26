import { describe, expect, it } from "vitest";
import { parseUrlReference, toUnicodeHostname } from "@/lib/url-parser-tools";

describe("URL parser", () => {
  it("parses IPv4 and IPv6 hosts", () => {
    expect(parseUrlReference("http://192.0.2.10:8080/a")).toMatchObject({
      hostname: { ascii: "192.0.2.10" },
      port: "8080",
    });
    expect(parseUrlReference("https://[2001:db8::1]/a")).toMatchObject({
      hostname: { ascii: "[2001:db8::1]" },
      host: "[2001:db8::1]",
    });
  });

  it("shows both Unicode and punycode IDN forms", () => {
    const report = parseUrlReference("https://аррӏе.com/");
    expect(report.hostname.ascii).toMatch(/^xn--/);
    expect(report.hostname.unicode).toBe("аррӏе.com");
    expect(report.risks.map((risk) => risk.code)).toContain("punycode-host");
    expect(toUnicodeHostname("xn--pple-43d.com")).toBe("аpple.com");
    expect(
      parseUrlReference("https://xn--pple-43d.com").hostname.mixedScript,
    ).toBe(true);
  });

  it("redacts embedded credentials from every output URL", () => {
    const report = parseUrlReference(
      "https://demo:super-secret@example.com/path",
    );
    expect(report.credentials).toEqual({
      usernamePresent: true,
      passwordPresent: true,
    });
    expect(JSON.stringify(report)).not.toContain("super-secret");
    expect(report.canonicalUrl).toBe("https://example.com/path");
  });

  it("preserves repeated query parameters, empty values, and encoded delimiters", () => {
    const report = parseUrlReference(
      "https://example.com/a%2Fb?tag=one&tag=&next=%2Fa%3Fx%3D1&empty",
    );
    expect(report.pathSegments[1]).toEqual({ raw: "a%2Fb", decoded: "a/b" });
    expect(report.query.pairs).toEqual([
      { key: "tag", value: "one" },
      { key: "tag", value: "" },
      { key: "next", value: "/a?x=1" },
      { key: "empty", value: "" },
    ]);
  });

  it("requires an explicit base and resolves every relative reference kind", () => {
    expect(() => parseUrlReference("../api?q=1")).toThrow(/explicit base/);
    expect(
      parseUrlReference("../api?q=1", "https://example.com/docs/page"),
    ).toMatchObject({
      reference: { kind: "path-relative", relative: true },
      canonicalUrl: "https://example.com/api?q=1",
    });
    expect(
      parseUrlReference("//cdn.example.com/a", "https://example.com").reference
        .kind,
    ).toBe("protocol-relative");
    expect(
      parseUrlReference("?page=2", "https://example.com/a").reference.kind,
    ).toBe("query-relative");
  });

  it.each([
    ["file:///tmp/example.txt", "file"],
    ["mailto:dev@example.com?subject=Hello", "mailto"],
    ["custom:opaque-data", "custom"],
  ])("parses non-HTTP schemes without opening them", (input, scheme) => {
    const report = parseUrlReference(input);
    expect(report.scheme).toBe(scheme);
    expect(report.risks.map((risk) => risk.code)).toContain("non-http-scheme");
  });

  it("rejects malformed ports", () => {
    expect(() => parseUrlReference("https://example.com:99999/path")).toThrow(
      /malformed|port/,
    );
  });

  it("keeps XSS-shaped text inert data", () => {
    const report = parseUrlReference("javascript:<img src=x onerror=alert(1)>");
    expect(report.scheme).toBe("javascript");
    expect(report.pathname).toContain("<img");
    expect(report.risks.map((risk) => risk.code)).toContain("non-http-scheme");
  });
});
