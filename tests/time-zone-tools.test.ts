import { describe, expect, it } from "vitest";
import {
  assertTimeZone,
  formatZonedInstant,
  resolveZonedDateTime,
} from "@/lib/time-zone-tools";
describe("time zone tools", () => {
  it("converts positive, negative, half-hour offsets and date rollover", () => {
    const instant = Date.parse("2024-01-01T23:30:00.000Z");
    expect(formatZonedInstant(instant, "Asia/Kolkata")).toMatchObject({
      local: "2024-01-02 05:00:00",
      offset: "UTC+05:30",
    });
    expect(formatZonedInstant(instant, "America/New_York")).toMatchObject({
      local: "2024-01-01 18:30:00",
      offset: "UTC-05:00",
    });
    expect(formatZonedInstant(instant, "Asia/Tokyo").local).toBe(
      "2024-01-02 08:30:00",
    );
  });
  it("detects a DST gap", () =>
    expect(
      resolveZonedDateTime("2024-03-10T02:30", "America/New_York"),
    ).toMatchObject({ status: "nonexistent", candidates: [] }));
  it("requires explicit choice for a DST overlap", () => {
    const unresolved = resolveZonedDateTime(
      "2024-11-03T01:30",
      "America/New_York",
    );
    expect(unresolved.status).toBe("ambiguous");
    expect(unresolved.candidates).toHaveLength(2);
    const earlier = resolveZonedDateTime(
        "2024-11-03T01:30",
        "America/New_York",
        "earlier",
      ),
      later = resolveZonedDateTime(
        "2024-11-03T01:30",
        "America/New_York",
        "later",
      );
    expect(later.instant! - earlier.instant!).toBe(3600000);
  });
  it("supports leap-day wall times", () => {
    const result = resolveZonedDateTime("2024-02-29T12:15", "UTC");
    expect(result.status).toBe("valid");
    expect(new Date(result.instant!).toISOString()).toBe(
      "2024-02-29T12:15:00.000Z",
    );
  });
  it("rejects invalid zones and dates", () => {
    expect(() => assertTimeZone("Mars/Olympus")).toThrow(/Unsupported/);
    expect(() => resolveZonedDateTime("2023-02-29T10:00", "UTC")).toThrow(
      /invalid/,
    );
  });
});
