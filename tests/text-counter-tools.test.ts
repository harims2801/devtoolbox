import { describe, expect, it } from "vitest";
import { countText, formatTextMetrics } from "@/lib/text-counter-tools";

describe("text counter tools", () => {
  it("counts empty text as zero metrics", () => {
    expect(countText("")).toMatchObject({
      codePoints: 0,
      utf16Units: 0,
      graphemeClusters: 0,
      words: 0,
      sentences: 0,
      lines: 0,
      utf8Bytes: 0,
    });
  });

  it("treats CRLF as one break and counts a trailing line", () => {
    expect(countText("one\r\ntwo\r\n")).toMatchObject({
      lines: 3,
      lineBreaks: 2,
      words: 2,
    });
  });

  it("distinguishes emoji code points, UTF-16 units, graphemes, and bytes", () => {
    expect(countText("👨‍👩‍👧‍👦")).toMatchObject({
      codePoints: 7,
      utf16Units: 11,
      graphemeClusters: 1,
      utf8Bytes: 25,
    });
  });

  it("handles combining marks as one grapheme", () => {
    expect(countText("e\u0301")).toMatchObject({
      codePoints: 2,
      utf16Units: 2,
      graphemeClusters: 1,
      utf8Bytes: 3,
    });
  });

  it("segments CJK text without requiring ASCII spaces", () => {
    const metrics = countText("你好世界。下一句！");
    expect(metrics.codePoints).toBe(9);
    expect(metrics.words).toBeGreaterThan(1);
    expect(metrics.sentences).toBe(2);
  });

  it("reports tabs, multiple spaces, and non-whitespace", () => {
    expect(countText("a\t  b")).toMatchObject({
      codePoints: 5,
      whitespace: 3,
      spaces: 2,
      tabs: 1,
      nonWhitespace: 2,
    });
  });

  it("calculates configurable reading time and a copyable summary", () => {
    const metrics = countText("one two three four", 2);
    expect(metrics.readingMinutes).toBe(2);
    expect(formatTextMetrics(metrics)).toContain(
      "Reading time (2 WPM): 2.00 minutes",
    );
  });

  it("rejects invalid reading speeds", () => {
    expect(() => countText("hello", 0)).toThrow(/greater than zero/);
  });

  it("handles large inputs", () => {
    const text = "word ".repeat(100_000).trim(),
      metrics = countText(text);
    expect(metrics.words).toBe(100_000);
    expect(metrics.utf8Bytes).toBe(text.length);
  });
});
