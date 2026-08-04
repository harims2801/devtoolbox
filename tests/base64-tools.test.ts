import { describe, expect, it } from "vitest";

import {
  base64ToBytes,
  bytesToBase64,
  createDataUrl,
  decodeBase64ToUtf8,
  decodeDataUrl,
  encodeUtf8ToBase64,
  parseDataUrl,
} from "@/lib/base64-tools";

describe("Base64 utilities", () => {
  it("encodes and decodes ASCII", () => {
    expect(encodeUtf8ToBase64("Hello")).toBe("SGVsbG8=");
    expect(decodeBase64ToUtf8("SGVsbG8=")).toBe("Hello");
  });

  it("round-trips Unicode and emojis as UTF-8", () => {
    const source = "வணக்கம் 👋 café";
    const encoded = encodeUtf8ToBase64(source);
    expect(decodeBase64ToUtf8(encoded)).toBe(source);
  });

  it("supports empty input", () => {
    expect(encodeUtf8ToBase64("")).toBe("");
    expect(decodeBase64ToUtf8("")).toBe("");
  });

  it("supports URL-safe output and optional padding", () => {
    const source = "subjects?_/";
    const encoded = encodeUtf8ToBase64(source, {
      variant: "url-safe",
      padding: false,
    });
    expect(encoded).not.toMatch(/[+/=]/);
    expect(decodeBase64ToUtf8(encoded, "url-safe")).toBe(source);
  });

  it("adds missing padding and rejects invalid input", () => {
    expect(decodeBase64ToUtf8("SGVsbG8")).toBe("Hello");
    expect(() => decodeBase64ToUtf8("not@base64")).toThrow(/not valid/i);
    expect(() => decodeBase64ToUtf8("a")).toThrow(/invalid length/i);
    expect(() => decodeBase64ToUtf8("SGVsbG8==")).toThrow(/invalid.*padding/i);
    expect(() => decodeBase64ToUtf8("TQ=")).toThrow(/invalid.*padding/i);
    expect(() => decodeBase64ToUtf8("AAAA==")).toThrow(/invalid.*padding/i);
  });

  it("round-trips binary files without text conversion", () => {
    const binary = Uint8Array.from([0, 1, 2, 127, 128, 254, 255]);
    const encoded = bytesToBase64(binary);
    expect(base64ToBytes(encoded)).toEqual(binary);
  });

  it("creates and decodes safe data URLs", () => {
    const base64 = bytesToBase64(Uint8Array.from([137, 80, 78, 71]));
    const dataUrl = createDataUrl("image/png", base64);
    expect(parseDataUrl(dataUrl)).toEqual({ mimeType: "image/png", base64 });
    expect(decodeDataUrl(dataUrl).bytes).toEqual(
      Uint8Array.from([137, 80, 78, 71]),
    );
  });

  it("rejects malformed data URLs and MIME types", () => {
    expect(() => parseDataUrl("data:text/html,<script>")).toThrow(/malformed/i);
    expect(() => parseDataUrl("javascript:alert(1)")).toThrow(/malformed/i);
    expect(() => createDataUrl("not a mime", "SGVsbG8=")).toThrow(/MIME/i);
  });
});
