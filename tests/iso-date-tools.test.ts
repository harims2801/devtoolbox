import { describe, expect, it } from "vitest";
import { describeRelativeInstant, parseIsoDate } from "@/lib/iso-date-tools";

describe("ISO date tools", () => {
  it("normalizes explicit offsets to UTC and preserves the offset form", () => {
    const result = parseIsoDate("2024-02-29T23:45:12+05:30");
    expect(result).toMatchObject({
      kind: "instant",
      utc: "2024-02-29T18:15:12Z",
      preservedOffset: "2024-02-29T23:45:12+05:30",
      unixSeconds: 1709230512,
      unixMilliseconds: 1709230512000,
    });
  });

  it("retains the exact supplied fractional precision", () => {
    const one = parseIsoDate("2024-01-01T00:00:00.1Z");
    const nine = parseIsoDate("2024-01-01T00:00:00.123456789Z");
    expect(one).toMatchObject({
      kind: "instant",
      utc: "2024-01-01T00:00:00.1Z",
      fractionalPrecision: 1,
    });
    expect(nine).toMatchObject({
      kind: "instant",
      utc: "2024-01-01T00:00:00.123456789Z",
      fractionalPrecision: 9,
      unixMilliseconds: 1704067200123,
    });
  });

  it("keeps date-only values separate from instants", () => {
    expect(parseIsoDate("2024-02-29")).toEqual({
      kind: "date",
      canonical: "2024-02-29",
      components: { year: 2024, month: 2, day: 29 },
    });
  });

  it("rejects invalid calendar and clock ranges", () => {
    for (const value of [
      "2023-02-29",
      "2024-13-01",
      "2024-01-01T24:00:00Z",
      "2024-01-01T12:60:00Z",
      "2024-01-01T12:00:60Z",
      "2024-01-01T12:00:00+14:30",
    ])
      expect(() => parseIsoDate(value), value).toThrow(/range|exist|offset/);
  });

  it("rejects ambiguous and non-ISO browser date input", () => {
    expect(() => parseIsoDate("2024-01-01T12:00:00")).toThrow(/ambiguous/);
    expect(() => parseIsoDate("January 1, 2024")).toThrow(/ISO 8601/);
    expect(() => parseIsoDate(" 2024-01-01Z ")).toThrow(/whitespace/);
  });

  it("supports ISO expanded years within the JavaScript date range", () => {
    expect(parseIsoDate("-000001-01-01")).toMatchObject({
      kind: "date",
      canonical: "-000001-01-01",
    });
    const result = parseIsoDate("+010000-01-01T00:00:00Z");
    expect(result).toMatchObject({
      kind: "instant",
      utc: "+010000-01-01T00:00:00Z",
    });
  });

  it("round trips canonical UTC output without changing the instant", () => {
    const first = parseIsoDate("2024-01-01T01:02:03.45-04:00");
    expect(first.kind).toBe("instant");
    if (first.kind !== "instant") return;
    const second = parseIsoDate(first.utc);
    expect(second.kind).toBe("instant");
    if (second.kind !== "instant") return;
    expect(second.unixMilliseconds).toBe(first.unixMilliseconds);
    expect(second.utc).toBe(first.utc);
  });

  it("describes whether a valid instant is past or future", () => {
    const now = Date.parse("2024-01-01T00:00:00Z");
    expect(describeRelativeInstant(now + 3_600_000, now)).toContain("hour");
    expect(describeRelativeInstant(now - 86_400_000, now)).toContain(
      "yesterday",
    );
  });
});
