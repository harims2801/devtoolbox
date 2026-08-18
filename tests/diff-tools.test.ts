import { describe, expect, it } from "vitest";
import {
  diffJson,
  diffLines,
  diffStats,
  diffWords,
  unifiedDiff,
} from "@/lib/diff-tools";

describe("diff utilities", () => {
  it("handles identical, added, and removed lines", () => {
    expect(diffLines("a", "a").every((x) => x.kind === "equal")).toBe(true);
    const stats = diffStats(diffLines("a\nb", "a\nc\nd"));
    expect(stats.changed).toBe(1);
    expect(stats.added).toBe(1);
  });
  it("supports whitespace and case options", () => {
    expect(
      diffLines("Hello   world", "hello world", {
        ignoreWhitespace: true,
        ignoreCase: true,
      })[0]?.kind,
    ).toBe("equal");
  });
  it("creates word and unified diffs", () => {
    expect(
      diffWords("hello world", "hello brave world").some(
        (x) => x.kind === "added",
      ),
    ).toBe(true);
    expect(unifiedDiff("a", "b")).toContain("--- original");
  });
  it("finds nested JSON, arrays, type changes, and null", () => {
    const result = diffJson(
      '{"user":{"city":"A"},"items":[1],"value":null}',
      '{"user":{"city":"B"},"items":[1,2],"value":"null"}',
    );
    expect(result.map((x) => x.path)).toEqual(
      expect.arrayContaining(["user.city", "items[1]", "value"]),
    );
    expect(result.find((x) => x.path === "value")?.kind).toBe("type");
  });
  it("ignores object key order and selected paths", () => {
    expect(diffJson('{"a":1,"b":2}', '{"b":2,"a":1}')).toHaveLength(0);
    expect(
      diffJson('{"a":1}', '{"a":2}', { ignoredPaths: ["a"] }),
    ).toHaveLength(0);
  });
  it("can compare arrays unordered and supports Unicode", () => {
    expect(
      diffJson('["🙂","a"]', '["a","🙂"]', { unorderedArrays: true }),
    ).toHaveLength(0);
  });
  it("reports invalid JSON", () =>
    expect(() => diffJson("{", "{}")).toThrow(/Original/));
});
