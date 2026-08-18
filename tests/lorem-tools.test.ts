import { describe, expect, it } from "vitest";
import {
  countTextStats,
  generateLorem,
  toLoremHtml,
  validateLoremOptions,
} from "@/lib/lorem-tools";
describe("lorem tools", () => {
  it("generates exact word counts with the traditional opening", () => {
    const result = generateLorem({
      unit: "words",
      count: 7,
      format: "text",
      startWithLorem: true,
      seed: "words",
    });
    expect(result.text.split(" ")).toHaveLength(7);
    expect(result.text).toMatch(/^lorem ipsum /);
  });
  it("generates punctuated sentences", () => {
    const result = generateLorem({
      unit: "sentences",
      count: 4,
      format: "text",
      seed: "sentences",
    });
    expect(result.text.match(/\./g)).toHaveLength(4);
    expect(result.text).toMatch(/^[A-Z]/);
  });
  it("generates distinct HTML paragraphs from app text", () => {
    const result = generateLorem({
      unit: "paragraphs",
      count: 3,
      format: "html",
      seed: "paragraphs",
    });
    expect(result.paragraphs).toHaveLength(3);
    expect(result.output.match(/<p>/g)).toHaveLength(3);
  });
  it("is repeatable for a seed and variable in injected normal mode", () => {
    const options = {
      unit: "sentences" as const,
      count: 2,
      format: "text" as const,
      seed: "fixture",
    };
    expect(generateLorem(options).output).toBe(generateLorem(options).output);
    expect(generateLorem({ ...options, seed: "other" }).output).not.toBe(
      generateLorem(options).output,
    );
  });
  it.each([
    ["words", 0],
    ["words", 1001],
    ["sentences", 101],
    ["paragraphs", 51],
  ] as const)("rejects invalid %s count %s", (unit, count) =>
    expect(() => validateLoremOptions({ unit, count, format: "text" })).toThrow(
      /whole number/,
    ),
  );
  it("escapes HTML without interpreting it", () =>
    expect(toLoremHtml(['<img onerror="x"> & safe'])).toBe(
      "<p>&lt;img onerror=&quot;x&quot;&gt; &amp; safe</p>",
    ));
  it("counts Unicode code points and handles empty text", () => {
    expect(countTextStats("café 🚀")).toEqual({ words: 2, characters: 6 });
    expect(countTextStats("")).toEqual({ words: 0, characters: 0 });
  });
});
