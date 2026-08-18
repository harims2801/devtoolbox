import { describe, expect, it } from "vitest";

import {
  dateToTimestamps,
  detectTimestampUnit,
  formatDateOutputs,
  timestampToDate,
  toDateTimeLocalValue,
  zonedDateTimeToDate,
} from "@/lib/timestamp-tools";

describe("Unix timestamp and date utilities", () => {
  it("converts seconds and milliseconds with automatic detection", () => {
    expect(timestampToDate("0").date.toISOString()).toBe(
      "1970-01-01T00:00:00.000Z",
    );
    expect(timestampToDate("1714564800000").detectedUnit).toBe("milliseconds");
    expect(timestampToDate("1714564800").detectedUnit).toBe("seconds");
    expect(detectTimestampUnit(100_000_000_000)).toBe("milliseconds");
  });

  it("handles negative timestamps before 1970", () => {
    expect(timestampToDate("-1", "seconds").date.toISOString()).toBe(
      "1969-12-31T23:59:59.000Z",
    );
  });

  it("converts UTC and selected time zones", () => {
    expect(dateToTimestamps("1970-01-01T00:00:00", "UTC").seconds).toBe(0);
    expect(
      dateToTimestamps("1970-01-01T05:30:00", "Asia/Kolkata").seconds,
    ).toBe(0);
  });

  it("validates leap years and impossible dates", () => {
    expect(
      dateToTimestamps("2024-02-29T12:00:00", "UTC").date.toISOString(),
    ).toBe("2024-02-29T12:00:00.000Z");
    expect(() => dateToTimestamps("2023-02-29T12:00:00", "UTC")).toThrow(
      /impossible/i,
    );
  });

  it("rejects DST gaps and handles a post-transition time", () => {
    expect(() =>
      zonedDateTimeToDate("2024-03-10T02:30:00", "America/New_York"),
    ).toThrow(/does not exist/i);
    expect(
      zonedDateTimeToDate(
        "2024-11-03T03:30:00",
        "America/New_York",
      ).toISOString(),
    ).toBe("2024-11-03T08:30:00.000Z");
  });

  it("round-trips a date through Unix milliseconds", () => {
    const original = dateToTimestamps("2026-08-04T16:00:00", "Asia/Kolkata");
    const roundTrip = timestampToDate(
      String(original.milliseconds),
      "milliseconds",
    ).date;
    expect(toDateTimeLocalValue(roundTrip, "Asia/Kolkata")).toBe(
      "2026-08-04T16:00:00",
    );
  });

  it("formats local, UTC, selected-zone, ISO, RFC, and relative outputs", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const outputs = formatDateOutputs(
      date,
      "Asia/Kolkata",
      new Date("2025-12-31T23:00:00.000Z"),
    );
    expect(outputs.iso).toBe("2026-01-01T00:00:00.000Z");
    expect(outputs.utc).toContain("01 Jan 2026");
    expect(outputs.rfc2822).toContain("GMT");
    expect(outputs.selectedZone).toMatch(/5:30|05:30/);
    expect(outputs.relative).toMatch(/1 hour|in an hour/i);
  });

  it("rejects invalid and out-of-range input", () => {
    expect(() => timestampToDate("not-a-timestamp")).toThrow(/valid Unix/i);
    expect(() => timestampToDate("999999999999999999999")).toThrow(
      /supported|range/i,
    );
  });
});
