import { describe, expect, it } from "vitest";

import { convertNumberBases } from "@/lib/number-base-tools";

describe("number base conversion", () => {
  it("converts multiple hexadecimal values to every representation", () => {
    expect(convertNumberBases("0x48 65,6C\n6C 6F", "hexadecimal")).toEqual({
      ascii: "Hello",
      asciiAvailable: true,
      binary: "0b1001000 0b1100101 0b1101100 0b1101100 0b1101111",
      decimal: "72 101 108 108 111",
      hexadecimal: "0x48 0x65 0x6C 0x6C 0x6F",
      valueCount: 5,
    });
  });

  it("converts binary, decimal, and ASCII inputs", () => {
    expect(convertNumberBases("01000001", "binary").decimal).toBe("65");
    expect(convertNumberBases("65 66", "decimal").ascii).toBe("AB");
    expect(convertNumberBases("Az", "ascii")).toMatchObject({
      binary: "0b1000001 0b1111010",
      decimal: "65 122",
      hexadecimal: "0x41 0x7A",
    });
  });

  it("escapes ASCII control characters without changing their values", () => {
    expect(convertNumberBases("0 9 10 13 31 127", "decimal").ascii).toBe(
      "\\0\\t\\n\\r\\x1F\\x7F",
    );
  });

  it("keeps numeric conversions when values are outside ASCII", () => {
    expect(convertNumberBases("255", "decimal")).toMatchObject({
      ascii: "Unavailable: every value must be between 0 and 127.",
      asciiAvailable: false,
      hexadecimal: "0xFF",
    });
  });

  it("rejects invalid digits, non-ASCII text, empty input, and oversized values", () => {
    expect(() => convertNumberBases("102", "binary")).toThrow(
      "not valid binary",
    );
    expect(() => convertNumberBases("தமிழ்", "ascii")).toThrow(
      "ASCII input supports only",
    );
    expect(() => convertNumberBases("", "decimal")).toThrow("Enter a value");
    expect(() => convertNumberBases("F".repeat(1_025), "hexadecimal")).toThrow(
      "4,096-bit limit",
    );
  });
});
