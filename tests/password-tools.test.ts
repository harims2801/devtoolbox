import { describe, expect, it, vi } from "vitest";
import {
  AMBIGUOUS_PASSWORD_CHARACTERS,
  analyzePasswordOptions,
  generatePasswords,
  type PasswordOptions,
} from "@/lib/password-tools";

const base: PasswordOptions = {
  length: 16,
  count: 2,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: true,
  exclusions: "Aaz9!",
};
function deterministicSource() {
  let value = 0;
  return (bytes: Uint8Array) => {
    bytes.fill(value % 251);
    value += 17;
    return bytes;
  };
}

describe("password tools", () => {
  it("uses deterministic mocked bytes while satisfying every enabled set", () => {
    const values = generatePasswords(base, deterministicSource());
    expect(values).toHaveLength(2);
    for (const value of values) {
      expect(value).toHaveLength(16);
      expect(value).toMatch(/[A-Z]/);
      expect(value).toMatch(/[a-z]/);
      expect(value).toMatch(/[0-9]/);
      expect(value).toMatch(/[!@#$%^&*()\-_=+\[\]{};:,.?]/);
    }
  });
  it("honors ambiguous and custom exclusions", () => {
    const [value] = generatePasswords(base, deterministicSource());
    for (const excluded of AMBIGUOUS_PASSWORD_CHARACTERS + base.exclusions)
      expect(value).not.toContain(excluded);
  });
  it("rejects impossible configurations and batch limits", () => {
    expect(() =>
      generatePasswords({ ...base, length: 3 }, deterministicSource()),
    ).toThrow(/cannot include all 4/);
    expect(() =>
      generatePasswords({ ...base, count: 101 }, deterministicSource()),
    ).toThrow(/1 to 100/);
    expect(() =>
      generatePasswords(
        {
          ...base,
          uppercase: false,
          lowercase: false,
          numbers: false,
          symbols: false,
        },
        deterministicSource(),
      ),
    ).toThrow(/at least one/);
    expect(() =>
      generatePasswords(
        {
          ...base,
          uppercase: true,
          lowercase: false,
          numbers: false,
          symbols: false,
          exclusions: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        },
        deterministicSource(),
      ),
    ).toThrow(/Every uppercase/);
  });
  it("rejects out-of-range bytes instead of using modulo-biased samples", () => {
    const bytes = [255, 0, 255, 1, 2, 3, 4, 5];
    let call = 0;
    const source = (target: Uint8Array) => {
      target[0] = bytes[call++] ?? 0;
      return target;
    };
    const value = generatePasswords(
      { ...base, length: 4, count: 1, exclusions: "", excludeAmbiguous: false },
      source,
    );
    expect(value[0]).toHaveLength(4);
    expect(call).toBeGreaterThan(4);
  });
  it("reports entropy assumptions, strength, and unsafe warnings", () => {
    const strong = analyzePasswordOptions(base);
    expect(strong.entropyBits).toBeGreaterThan(60);
    expect(strong.strength).toMatch(/strong/i);
    const weak = analyzePasswordOptions({
      ...base,
      length: 6,
      uppercase: false,
      numbers: false,
      symbols: false,
      exclusions: "",
    });
    expect(weak.warnings.join(" ")).toMatch(
      /shorter than 12|fewer character categories/,
    );
  });
  it("never relies on Math.random", () => {
    const insecure = vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Math.random called");
    });
    expect(() => generatePasswords(base, deterministicSource())).not.toThrow();
    expect(insecure).not.toHaveBeenCalled();
    insecure.mockRestore();
  });
});
