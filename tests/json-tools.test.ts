import { describe, expect, it } from "vitest";

import {
  calculateJsonStatistics,
  formatJson,
  getByteSize,
  getJsonSizeState,
  JSON_MAX_BYTES,
  minifyJson,
  parseJson,
  searchJson,
  sortJsonKeys,
} from "@/lib/json-tools";

describe("JSON utilities", () => {
  it("parses and formats valid JSON with selectable indentation", () => {
    const result = parseJson('{"name":"DevToolbox","active":true}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(formatJson(result.value, 2)).toContain('\n  "name"');
    expect(formatJson(result.value, 4)).toContain('\n    "name"');
    expect(formatJson(result.value, "tab")).toContain('\n\t"name"');
    expect(minifyJson(result.value)).toBe(
      '{"name":"DevToolbox","active":true}',
    );
  });

  it("returns an understandable invalid JSON location and context", () => {
    const result = parseJson('{\n  "name": "DevToolbox",\n  invalid\n}');
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.line).toBeGreaterThanOrEqual(3);
    expect(result.error.column).toBeGreaterThan(0);
    expect(result.error.message).toMatch(/line \d+, column \d+/);
    expect(result.error.contextLine).toContain("invalid");
  });

  it("sorts nested object keys while preserving array order", () => {
    const sorted = sortJsonKeys({
      z: { beta: 2, alpha: 1 },
      a: [{ z: 3, a: 4 }, "first", "second"],
    });

    expect(Object.keys(sorted as object)).toEqual(["a", "z"]);
    expect(Object.keys((sorted as { z: object }).z)).toEqual(["alpha", "beta"]);
    expect((sorted as { a: unknown[] }).a.slice(1)).toEqual([
      "first",
      "second",
    ]);
  });

  it("calculates nested JSON statistics", () => {
    const statistics = calculateJsonStatistics({
      service: "api",
      replicas: 3,
      healthy: true,
      metadata: null,
      regions: ["india", { code: "ca" }],
    });

    expect(statistics).toEqual({
      objectCount: 2,
      arrayCount: 1,
      keyCount: 6,
      stringCount: 3,
      numberCount: 1,
      booleanCount: 1,
      nullCount: 1,
      maximumDepth: 4,
    });
  });

  it("supports large finite numbers", () => {
    const result = parseJson('{"large":1e100,"safeInteger":9007199254740991}');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect((result.value as { large: number }).large).toBe(1e100);
    expect((result.value as { safeInteger: number }).safeInteger).toBe(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it("preserves Unicode and escaped characters", () => {
    const result = parseJson(
      '{"greeting":"வணக்கம் 👋","quoted":"line 1\\n\\"line 2\\""}',
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const formatted = formatJson(result.value);
    expect(formatted).toContain("வணக்கம் 👋");
    expect(formatted).toContain('\\"line 2\\"');
  });

  it("treats malicious-looking content as an ordinary string", () => {
    const malicious = "<script>globalThis.compromised=true</script>";
    const result = parseJson(JSON.stringify({ content: malicious }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect((result.value as { content: string }).content).toBe(malicious);
    expect(
      (globalThis as { compromised?: boolean }).compromised,
    ).toBeUndefined();
  });

  it("finds matching keys and values by path", () => {
    const matches = searchJson(
      { service: { name: "payments", port: 3000 }, owner: "platform" },
      "pay",
    );
    expect(matches.map((match) => match.path)).toEqual(["service.name"]);
  });

  it("measures UTF-8 bytes and limits extremely large input", () => {
    expect(getByteSize("👋")).toBe(4);
    expect(getJsonSizeState("small").level).toBe("ok");
    expect(getJsonSizeState("x".repeat(1_000_001)).level).toBe("warning");
    expect(getJsonSizeState("x".repeat(JSON_MAX_BYTES + 1)).level).toBe(
      "error",
    );
  });
});
