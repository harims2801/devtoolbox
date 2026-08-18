import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEST_DATA_SCHEMA,
  exportTestData,
  generateTestData,
  parseTestDataSchema,
  validateTestDataSchema,
} from "@/lib/test-data-tools";
describe("test data tools", () => {
  it("validates schemas and complexity limits", () => {
    expect(
      parseTestDataSchema('{"id":"uuid","nested":{"ok":"boolean"}}'),
    ).toEqual({ id: "uuid", nested: { ok: "boolean" } });
    expect(() => parseTestDataSchema('{"id":"secret"}')).toThrow(/Unsupported/);
    expect(() =>
      validateTestDataSchema({ a: { b: { c: { d: "number" } } } }),
    ).toThrow(/3 levels/);
    expect(() => parseTestDataSchema("[]")).toThrow(/objects/);
  });
  it("is deterministic and bounded", () => {
    const options = {
      count: 2,
      schema: DEFAULT_TEST_DATA_SCHEMA,
      seed: "fixture",
    };
    expect(generateTestData(options)).toEqual(generateTestData(options));
    expect(() => generateTestData({ ...options, count: 1001 })).toThrow(
      /1 to 1,000/,
    );
  });
  it("uses safe fictional values only", () => {
    const [record] = generateTestData({
      count: 1,
      schema: DEFAULT_TEST_DATA_SCHEMA,
      seed: "safe",
    });
    expect(record!.name).toBe("Test Person 001");
    expect(record!.email).toMatch(/@example\.test$/);
    expect(record!.phone).toMatch(/555-01/);
  });
  it("keeps dates in range and rejects reversed ranges", () => {
    const [record] = generateTestData({
      count: 1,
      schema: { date: "date" },
      seed: "date",
      dateStart: "2024-01-01",
      dateEnd: "2024-01-31",
    });
    expect(String(record!.date)).toMatch(/^2024-01-/);
    expect(() =>
      generateTestData({
        count: 1,
        schema: { date: "date" },
        dateStart: "2025-01-01",
        dateEnd: "2024-01-01",
      }),
    ).toThrow(/reversed/);
  });
  it("exports stable JSON Lines and correctly quoted CSV", () => {
    const schema = { name: "name", nested: { company: "company" } } as const,
      records = generateTestData({ count: 2, schema, seed: "csv" });
    const jsonl = exportTestData(records, "jsonl", schema);
    expect(jsonl.split("\n")).toHaveLength(2);
    const csv = exportTestData(
      [{ name: 'A, "B"', nested: { company: "Example" } }],
      "csv",
      schema,
    );
    expect(csv.split("\n")[0]).toBe('"name","nested"');
    expect(csv).toContain('"A, ""B"""');
    expect(csv).toContain('"{""company"":""Example""}"');
  });
});
