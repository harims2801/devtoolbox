import { describe, expect, it } from "vitest";
import {
  detectLogFormat,
  filterLogs,
  logStats,
  parseLogs,
} from "@/lib/log-tools";
describe("log tools", () => {
  it("detects and parses JSON Lines while skipping malformed lines", () => {
    const result = parseLogs(
      '{"level":"info","message":"ok","service":"api"}\nnot-json\n{"severity":"ERROR","msg":"failed"}',
    );
    expect(result.format).toBe("jsonl");
    expect(result.entries).toHaveLength(2);
    expect(result.skipped).toBe(1);
    expect(result.entries[1]?.level).toBe("error");
  });
  it("parses arrays, key-value, and plain logs", () => {
    expect(parseLogs('[{"message":"one"}]').entries[0]?.message).toBe("one");
    expect(detectLogFormat('level=warn message="slow" service=web')).toBe(
      "key-value",
    );
    expect(parseLogs("2026-08-18 INFO ready").entries[0]?.level).toBe("info");
  });
  it("filters and aggregates", () => {
    const entries = parseLogs(
      '[{"level":"error","message":"same","service":"api"},{"level":"info","message":"same","service":"web"}]',
    ).entries;
    expect(filterLogs(entries, { level: "error" })).toHaveLength(1);
    expect(logStats(entries).groups[0]).toEqual({ message: "same", count: 2 });
  });
  it("guards oversized input", () =>
    expect(() => parseLogs("x".repeat(2_000_001))).toThrow(/2 MB/));
});
