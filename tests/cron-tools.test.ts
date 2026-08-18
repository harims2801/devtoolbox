import { describe, expect, it } from "vitest";

import {
  cronMatches,
  explainCron,
  nextCronRuns,
  parseCron,
  simpleCronFields,
} from "@/lib/cron-tools";

describe("standard Unix cron utilities", () => {
  it("parses wildcards, steps, ranges, and lists", () => {
    expect(parseCron("*/5 9-17 * * 1,3,5").fields[0].values.has(55)).toBe(true);
    expect(parseCron("*/5 9-17 * * 1,3,5").fields[1].values.has(18)).toBe(
      false,
    );
    expect(parseCron("*/5 9-17 * * 1,3,5").fields[4].values.has(3)).toBe(true);
  });

  it("rejects malformed and out-of-range fields", () => {
    expect(() => parseCron("60 * * * *")).toThrow(/between 0 and 59/i);
    expect(() => parseCron("* * * *")).toThrow(/exactly five/i);
    expect(() => parseCron("*/0 * * * *")).toThrow(/positive integer/i);
    expect(() => nextCronRuns("0 0 31 2 *")).toThrow(/impossible/i);
  });

  it("uses Unix day-of-month/day-of-week OR semantics", () => {
    const parsed = parseCron("0 9 15 * 1");
    expect(cronMatches(parsed, new Date("2026-06-08T09:00:00Z"))).toBe(true);
    expect(cronMatches(parsed, new Date("2026-06-15T09:00:00Z"))).toBe(true);
    expect(cronMatches(parsed, new Date("2026-06-16T09:00:00Z"))).toBe(false);
  });

  it("handles month boundaries, weekdays, and leap years", () => {
    const monthly = nextCronRuns("0 0 1 * *", {
      from: new Date("2026-01-31T23:59:00Z"),
      count: 2,
    });
    expect(monthly.map((date) => date.toISOString())).toEqual([
      "2026-02-01T00:00:00.000Z",
      "2026-03-01T00:00:00.000Z",
    ]);
    const leap = nextCronRuns("0 0 29 2 *", {
      from: new Date("2023-03-01T00:00:00Z"),
      count: 1,
    });
    expect(leap[0]?.toISOString()).toBe("2024-02-29T00:00:00.000Z");
  });

  it("explains presets and identifies complex visual-builder input", () => {
    expect(explainCron("0 9 * * 1-5").summary).toMatch(/Monday through Friday/);
    expect(simpleCronFields("0 9 * * *")).toEqual(["0", "9", "*", "*", "*"]);
    expect(simpleCronFields("*/5 * * * *")).toBeUndefined();
  });
});
