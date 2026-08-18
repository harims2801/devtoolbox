import { describe, expect, it } from "vitest";
import {
  compareJsonDocuments,
  compareJsonValues,
  JsonDocumentError,
} from "@/lib/json-diff-tools";

describe("JSON diff tools", () => {
  it("compares nested objects without key-order noise", () => {
    const result = compareJsonDocuments(
      '{"user":{"name":"Ada","active":true},"count":1}',
      '{"count":1,"user":{"active":false,"name":"Ada","city":"London"}}',
    );
    expect(result.differences).toEqual([
      { path: "/user/active", kind: "changed", before: true, after: false },
      { path: "/user/city", kind: "added", after: "London" },
    ]);
    expect(result.summary).toMatchObject({ added: 1, changed: 1 });
  });

  it("preserves array order and creates safely ordered patch operations", () => {
    const result = compareJsonValues(["a", "b", "c"], ["a"]);
    expect(result.differences.map((item) => item.path)).toEqual(["/2", "/1"]);
    expect(result.patch).toEqual([
      { op: "remove", path: "/2" },
      { op: "remove", path: "/1" },
    ]);
  });

  it("distinguishes null, numbers, and strings as type changes", () => {
    const result = compareJsonDocuments('{"a":null,"b":1}', '{"a":{},"b":"1"}');
    expect(result.differences).toEqual([
      { path: "/a", kind: "type-changed", before: null, after: {} },
      { path: "/b", kind: "type-changed", before: 1, after: "1" },
    ]);
    expect(result.patch).toEqual([
      { op: "replace", path: "/a", value: {} },
      { op: "replace", path: "/b", value: "1" },
    ]);
  });

  it("escapes JSON Pointer property names", () => {
    const result = compareJsonDocuments(
      '{"a/b":1,"x~y":2}',
      '{"a/b":3,"x~y":4}',
    );
    expect(result.differences.map((item) => item.path)).toEqual([
      "/a~1b",
      "/x~0y",
    ]);
  });

  it("supports unordered arrays as multisets and disables positional patches", () => {
    expect(
      compareJsonValues([1, 2, 2], [2, 1, 2], { unorderedArrays: true })
        .differences,
    ).toHaveLength(0);
    const changed = compareJsonValues([1, 2, 2], [2, 1], {
      unorderedArrays: true,
    });
    expect(changed.differences).toHaveLength(1);
    expect(changed.patch).toBeNull();
    expect(changed.patchUnavailableReason).toContain("unordered-array");
  });

  it("reports independent parse locations", () => {
    try {
      compareJsonDocuments('{\n  "ok": true,\n  bad\n}', "{}");
      throw new Error("Expected invalid JSON");
    } catch (caught) {
      expect(caught).toBeInstanceOf(JsonDocumentError);
      const error = caught as JsonDocumentError;
      expect(error.detail.label).toBe("Original");
      expect(error.detail.line).toBe(3);
      expect(error.detail.column).toBeGreaterThan(1);
    }
    expect(() => compareJsonDocuments("{}", "{")).toThrow(/Modified/);
  });

  it("handles large objects in linear traversal", () => {
    const original = Object.fromEntries(
        Array.from({ length: 10_000 }, (_, index) => [`key-${index}`, index]),
      ),
      modified = { ...original, "key-9999": -1 };
    const result = compareJsonValues(original, modified);
    expect(result.differences).toEqual([
      { path: "/key-9999", kind: "changed", before: 9999, after: -1 },
    ]);
  });

  it("treats untrusted markup as an ordinary string value", () => {
    const payload = '<img src=x onerror="alert(1)">';
    const result = compareJsonValues({ value: "safe" }, { value: payload });
    expect(result.differences[0]?.after).toBe(payload);
    expect(result.patch?.[0]).toEqual({
      op: "replace",
      path: "/value",
      value: payload,
    });
  });
});
