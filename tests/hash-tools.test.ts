import { describe, expect, it } from "vitest";
import { compareHash, hashBytes, hashText } from "@/lib/hash-tools";
describe("hash utilities", () => {
  it("matches known SHA-256 vectors", async () => {
    expect((await hashText("abc", "SHA-256")).hexLower).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect((await hashText("", "SHA-256")).hexLower).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
  it("hashes Unicode and file bytes", async () => {
    const text = await hashText("🙂", "SHA-512");
    const file = await hashBytes(new TextEncoder().encode("🙂"), "SHA-512");
    expect(file.hexLower).toBe(text.hexLower);
  });
  it("returns upper and Base64 representations", async () => {
    const result = await hashText("abc", "SHA-1");
    expect(result.hexUpper).toBe(result.hexLower.toUpperCase());
    expect(result.base64).toBe("qZk+NkcGgWq6PiVxeFDCbJzQ2J0=");
  });
  it("compares case-insensitive hex", async () => {
    const result = await hashText("abc", "SHA-256");
    expect(compareHash(result, result.hexUpper)).toBe(true);
    expect(compareHash(result, "0".repeat(64))).toBe(false);
  });
  it("rejects invalid expected hashes", async () => {
    const result = await hashText("abc", "SHA-256");
    expect(() => compareHash(result, "abcd")).toThrow(/64 characters/);
    expect(() => compareHash(result, "%%%")).toThrow(/valid/);
  });
});
