import { describe, expect, it } from "vitest";
import {
  calculateCalendarDifference,
  calculateDateDifference,
} from "@/lib/date-difference-tools";

const utc = (value: string) => ({ value, zone: "UTC" });

describe("date difference tools", () => {
  it("returns signed totals for reversed dates", () => {
    const result = calculateDateDifference(
      utc("2024-01-03T00:00"),
      utc("2024-01-01T00:00"),
    );
    expect(result).toMatchObject({
      milliseconds: -172_800_000,
      seconds: -172_800,
      minutes: -2_880,
      hours: -48,
      days: -2,
      calendar: { years: 0, months: 0, days: -2 },
    });
  });

  it("reports zero for the same instant in different zones", () => {
    const result = calculateDateDifference(
      { value: "2024-01-01T00:00", zone: "UTC" },
      { value: "2023-12-31T19:00", zone: "America/New_York" },
    );
    expect(result.milliseconds).toBe(0);
  });

  it("clamps month ends and leap years in calendar units", () => {
    expect(
      calculateCalendarDifference(
        { year: 2024, month: 1, day: 31 },
        { year: 2024, month: 2, day: 29 },
      ),
    ).toEqual({ years: 0, months: 1, days: 0 });
    expect(
      calculateCalendarDifference(
        { year: 2024, month: 2, day: 29 },
        { year: 2025, month: 2, day: 28 },
      ),
    ).toEqual({ years: 1, months: 0, days: 0 });
  });

  it("distinguishes a DST calendar day from elapsed hours", () => {
    const result = calculateDateDifference(
      { value: "2024-03-09T12:00", zone: "America/New_York" },
      { value: "2024-03-10T12:00", zone: "America/New_York" },
    );
    expect(result.hours).toBe(23);
    expect(result.calendar).toEqual({ years: 0, months: 0, days: 1 });
  });

  it("counts both boundary dates in date-only inclusive mode", () => {
    const forward = calculateDateDifference(
      utc("2024-02-28"),
      utc("2024-03-01"),
      {
        dateOnly: true,
        inclusive: true,
      },
    );
    expect(forward.inclusiveCalendarDays).toBe(3);
    const same = calculateDateDifference(utc("2024-02-28"), utc("2024-02-28"), {
      dateOnly: true,
      inclusive: true,
    });
    expect(same.inclusiveCalendarDays).toBe(1);
    const reversed = calculateDateDifference(
      utc("2024-03-01"),
      utc("2024-02-28"),
      {
        dateOnly: true,
        inclusive: true,
      },
    );
    expect(reversed.inclusiveCalendarDays).toBe(-3);
  });

  it("rejects invalid, nonexistent, and unresolved repeated dates", () => {
    expect(() =>
      calculateDateDifference(utc("2023-02-29T10:00"), utc("2024-01-01T00:00")),
    ).toThrow(/invalid/);
    expect(() =>
      calculateDateDifference(
        { value: "2024-03-10T02:30", zone: "America/New_York" },
        utc("2024-03-11T00:00"),
      ),
    ).toThrow(/does not exist/);
    expect(() =>
      calculateDateDifference(
        { value: "2024-11-03T01:30", zone: "America/New_York" },
        utc("2024-11-04T00:00"),
      ),
    ).toThrow(/occurs twice/);
  });

  it("handles large ranges without integer overflow", () => {
    const result = calculateDateDifference(
      utc("1900-01-01T00:00"),
      utc("2100-01-01T00:00"),
    );
    expect(result.calendar).toEqual({ years: 200, months: 0, days: 0 });
    expect(result.milliseconds).toBe(6_311_433_600_000);
  });
});
