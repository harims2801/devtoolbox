import { describe, expect, it } from "vitest";
import {
  buildFullUrl,
  buildQueryString,
  pairsFromBulkJson,
  pairsToBulkJson,
  parseQueryString,
} from "@/lib/query-string-tools";

describe("query string tools", () => {
  it("preserves duplicates, brackets, empty keys/values, key-only rows, and order", () => {
    const rows = parseQueryString(
      "tag=one&tag=&%5Bfilter%5D=yes&=empty-key&flag&&tail=",
      "percent",
    );
    expect(rows).toEqual([
      { key: "tag", value: "one", included: true },
      { key: "tag", value: "", included: true },
      { key: "[filter]", value: "yes", included: true },
      { key: "", value: "empty-key", included: true },
      { key: "flag", value: null, included: true },
      { key: "", value: null, included: true },
      { key: "tail", value: "", included: true },
    ]);
    expect(buildQueryString(rows, "percent")).toBe(
      "tag=one&tag=&%5Bfilter%5D=yes&=empty-key&flag&&tail=",
    );
  });

  it("keeps Unicode, literal plus, and space semantics distinct", () => {
    const pairs = [{ key: "q", value: "café + tea", included: true }];
    expect(buildQueryString(pairs, "percent")).toBe("q=caf%C3%A9%20%2B%20tea");
    expect(buildQueryString(pairs, "plus")).toBe("q=caf%C3%A9+%2B+tea");
    expect(parseQueryString("q=a+b", "percent")[0]?.value).toBe("a+b");
    expect(parseQueryString("q=a+b", "plus")[0]?.value).toBe("a b");
  });

  it("round-trips canonical queries stably", () => {
    const query = "a=1&a=2&path=%2Fadmin%3Fx%3D1&flag";
    expect(
      buildQueryString(parseQueryString(query, "percent"), "percent"),
    ).toBe(query);
  });

  it("rejects malformed percent sequences", () => {
    expect(() => parseQueryString("good=1&bad=%E0%A4%A", "percent")).toThrow(
      /Pair 2/,
    );
  });

  it("round-trips duplicate-safe bulk JSON including key-only rows", () => {
    const pairs = parseQueryString("a=1&a=2&flag", "percent"),
      json = pairsToBulkJson(pairs);
    expect(pairsFromBulkJson(json)).toEqual(pairs);
    expect(() => pairsFromBulkJson('{"a":1}')).toThrow(/array/);
  });

  it("excludes toggled rows without deleting them", () => {
    const pairs = [
      { key: "a", value: "1", included: true },
      {
        key: "unsafe",
        value: "<script>alert(1)</script>",
        included: false,
      },
      { key: "b", value: "2", included: true },
    ];
    expect(buildQueryString(pairs, "percent")).toBe("a=1&b=2");
    expect(pairs[1]?.value).toContain("<script>");
  });

  it("builds but never visits an HTTP full URL", () => {
    expect(buildFullUrl("https://example.com/search#results", "q=a%20b")).toBe(
      "https://example.com/search?q=a%20b#results",
    );
    expect(() => buildFullUrl("javascript:alert(1)", "a=1")).toThrow(/HTTP/);
  });
});
