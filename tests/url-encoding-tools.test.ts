import { describe, expect, it } from "vitest";

import {
  processUrlEncoding,
  validatePercentSequences,
} from "@/lib/url-encoding-tools";

describe("URL encoding tools", () => {
  it("round trips Unicode and spaces in component mode", () => {
    const source = "வணக்கம் world 🚀";
    const encoded = processUrlEncoding(source, "encode", "component").output;
    expect(encoded).toContain("%20");
    expect(processUrlEncoding(encoded, "decode", "component").output).toBe(
      source,
    );
  });

  it("encodes component reserved characters", () => {
    expect(
      processUrlEncoding("a/b?c=d&e#f", "encode", "component").output,
    ).toBe("a%2Fb%3Fc%3Dd%26e%23f");
  });

  it("preserves full URL separators while encoding content", () => {
    const result = processUrlEncoding(
      "https://example.com/release notes/தமிழ்?q=ready now&owner=dev#next step",
      "encode",
      "full-url",
    ).output;
    expect(result).toMatch(/^https:\/\/example\.com\//);
    expect(result).toContain("?q=ready%20now&owner=dev#next%20step");
    expect(result).not.toContain("தமிழ்");
  });

  it("preserves literal plus signs when decoding", () => {
    expect(processUrlEncoding("a+b%2Bc", "decode", "component").output).toBe(
      "a+b+c",
    );
  });

  it("warns before encoding existing escapes", () => {
    const result = processUrlEncoding(
      "already%20encoded",
      "encode",
      "component",
    );
    expect(result.output).toBe("already%2520encoded");
    expect(result.warning).toContain("already contains percent escapes");
  });

  it("warns when a decode result remains encoded", () => {
    const result = processUrlEncoding("name%2520value", "decode", "component");
    expect(result.output).toBe("name%20value");
    expect(result.warning).toContain("more than once");
  });

  it.each(["%", "%2", "%GG", "okay%20bad%Q0"])(
    "rejects malformed percent sequence %s precisely",
    (input) => {
      expect(() => validatePercentSequences(input)).toThrow(/character \d+/);
      expect(() => processUrlEncoding(input, "decode", "component")).toThrow(
        /Expected % followed by two hexadecimal digits/,
      );
    },
  );

  it("rejects percent bytes that are not valid UTF-8", () => {
    expect(() => processUrlEncoding("%FF", "decode", "component")).toThrow(
      /Invalid UTF-8.*character 1/,
    );
    expect(() => processUrlEncoding("%41%FF", "decode", "component")).toThrow(
      /Invalid UTF-8.*character 4/,
    );
  });

  it("round trips a full URL without decoding its reserved structure", () => {
    const source = "https://example.com/வணக்கம் world?q=ready now#next step";
    const encoded = processUrlEncoding(source, "encode", "full-url").output;
    expect(processUrlEncoding(encoded, "decode", "full-url").output).toBe(
      source,
    );
  });

  it("returns an empty result for empty input", () => {
    expect(processUrlEncoding("", "encode", "component")).toEqual({
      output: "",
    });
    expect(processUrlEncoding("", "decode", "full-url")).toEqual({
      output: "",
    });
  });
});
