import { describe, expect, it } from "vitest";
import {
  highlightSegments,
  regexRiskWarning,
  replaceRegex,
  testRegex,
} from "@/lib/regex-tools";

describe("regex utilities", () => {
  it("finds global matches with indexes and flags", () => {
    const result = testRegex("cat", "gi", "Cat cat");
    expect(result.matches.map((m) => m.index)).toEqual([0, 4]);
  });
  it("captures numbered and named groups", () => {
    const match = testRegex("(?<key>\\w+)=(\\d+)", "", "port=8080").matches[0]!;
    expect(match.groups).toEqual(["port", "8080"]);
    expect(match.namedGroups.key).toBe("port");
  });
  it("handles zero-length and Unicode matches", () => {
    expect(testRegex("(?=a)", "g", "aa").matches).toHaveLength(2);
    expect(testRegex("\\p{Emoji}", "gu", "A🙂").matches[0]?.value).toBe("🙂");
  });
  it("replaces matches", () =>
    expect(replaceRegex("(\\w+)", "g", "one two", "[$1]")).toBe("[one] [two]"));
  it("rejects invalid and risky expressions", () => {
    expect(() => testRegex("[", "", "x")).toThrow();
    expect(regexRiskWarning("(a+)+$")).toMatch(/catastrophic/i);
    expect(() => testRegex("(a+)+$", "", "a")).toThrow(/catastrophic/i);
  });
  it("keeps malicious HTML as plain segments", () =>
    expect(
      highlightSegments(
        "<img onerror=x>",
        testRegex("img", "g", "<img onerror=x>").matches,
      )
        .map((x) => x.text)
        .join(""),
    ).toBe("<img onerror=x>"));
});
