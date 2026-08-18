import { describe, expect, it } from "vitest";
import { sortAndDeduplicateText } from "@/lib/text-sort-tools";

describe("text sort tools", () => {
  it("normalizes CRLF, LF, and CR line endings", () => {
    expect(sortAndDeduplicateText("c\r\na\nb\rd").output).toBe("a\nb\nc\nd");
  });

  it("supports lexical, natural, and numeric-only modes", () => {
    expect(
      sortAndDeduplicateText("item10\nitem2", { mode: "lexical" }).output,
    ).toBe("item10\nitem2");
    expect(
      sortAndDeduplicateText("item10\nitem2", { mode: "natural" }).output,
    ).toBe("item2\nitem10");
    expect(
      sortAndDeduplicateText("10\n2\nnot-a-number\n-1", { mode: "numeric" })
        .output,
    ).toBe("-1\n2\n10\nnot-a-number");
  });

  it("sorts Unicode using an explicit locale", () => {
    expect(
      sortAndDeduplicateText("z\nä\na", { mode: "locale", locale: "sv" })
        .output,
    ).toBe("a\nz\nä");
  });

  it("supports case-sensitive and insensitive stable comparison", () => {
    const input = "apple\nApple\nAPPLE";
    expect(sortAndDeduplicateText(input).output).toBe(input);
    expect(
      sortAndDeduplicateText(input, { caseSensitive: true }).output,
    ).not.toBe("");
  });

  it("trims for comparison without mutating retained lines", () => {
    const result = sortAndDeduplicateText(" b \na\n  a", {
      trimBeforeCompare: true,
      removeDuplicates: true,
    });
    expect(result.output).toBe("a\n b ");
    expect(result.duplicatesRemoved).toBe(1);
  });

  it("handles empty-line removal and placement", () => {
    expect(
      sortAndDeduplicateText("b\n\na", { emptyLines: "remove" }),
    ).toMatchObject({ output: "a\nb", emptyLinesRemoved: 1 });
    expect(
      sortAndDeduplicateText("b\n\na", { emptyLines: "last" }).output,
    ).toBe("a\nb\n");
    expect(
      sortAndDeduplicateText("b\n\na", {
        emptyLines: "first",
        direction: "descending",
      }).output,
    ).toBe("\nb\na");
  });

  it("preserves the first or last original duplicate", () => {
    const input = " Alpha\nbeta\nalpha \nBETA";
    expect(
      sortAndDeduplicateText(input, {
        trimBeforeCompare: true,
        removeDuplicates: true,
        duplicatePolicy: "first",
      }),
    ).toMatchObject({ output: " Alpha\nbeta", duplicatesRemoved: 2 });
    expect(
      sortAndDeduplicateText(input, {
        trimBeforeCompare: true,
        removeDuplicates: true,
        duplicatePolicy: "last",
      }),
    ).toMatchObject({ output: "alpha \nBETA", duplicatesRemoved: 2 });
  });

  it("keeps equal-key lines stable in descending sorts", () => {
    const result = sortAndDeduplicateText("a2\nA2\nb1", {
      mode: "natural",
      direction: "descending",
    });
    expect(result.output).toBe("b1\na2\nA2");
  });

  it("handles large lists without a quadratic comparison pass", () => {
    const input = Array.from({ length: 20_000 }, (_, index) =>
        String(20_000 - index),
      ).join("\n"),
      result = sortAndDeduplicateText(input, { mode: "numeric" });
    expect(result.outputLines).toBe(20_000);
    expect(result.output.startsWith("1\n2\n3\n")).toBe(true);
    expect(result.output.endsWith("\n20000")).toBe(true);
  });
});
