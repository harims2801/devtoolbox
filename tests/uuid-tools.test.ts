import { describe, expect, it } from "vitest";
import {
  exportUuidBatch,
  generateUuidBatch,
  validateUuidBatch,
} from "@/lib/uuid-tools";
const values = [
  "550e8400-e29b-41d4-a716-446655440000",
  "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
];
let index = 0;
const next = () => values[index++ % values.length]!;
describe("UUID generator utilities", () => {
  it("generates requested UUID v4 values", () => {
    index = 0;
    const result = generateUuidBatch({ count: 2, randomUUID: next });
    expect(result).toHaveLength(2);
    expect(result[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });
  it("formats uppercase, hyphens, prefix, and suffix", () => {
    index = 0;
    expect(
      generateUuidBatch({
        count: 1,
        randomUUID: next,
        uppercase: true,
        removeHyphens: true,
        prefix: "ID_",
        suffix: "_X",
      })[0],
    ).toBe("ID_550E8400E29B41D4A716446655440000_X");
  });
  it("validates uniqueness", () => {
    expect(validateUuidBatch(["a", "b"]).isUnique).toBe(true);
    expect(validateUuidBatch(["a", "a"]).isUnique).toBe(false);
  });
  it("exports TXT, CSV, and JSON", () => {
    expect(exportUuidBatch(["a", "b"], "txt")).toBe("a\nb");
    expect(exportUuidBatch(["a"], "csv")).toContain('"a"');
    expect(JSON.parse(exportUuidBatch(["a"], "json"))).toEqual(["a"]);
  });
  it("enforces count limits", () => {
    expect(() => generateUuidBatch({ count: 0, randomUUID: next })).toThrow(
      /between 1 and 1,000/,
    );
    expect(() =>
      generateUuidBatch({ count: 1001, randomUUID: next }),
    ).toThrow();
  });
});
