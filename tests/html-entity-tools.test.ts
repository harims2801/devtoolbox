import { describe, expect, it } from "vitest";
import {
  decodeHtmlEntities,
  encodeHtmlEntities,
} from "@/lib/html-entity-tools";

describe("HTML entity tools", () => {
  it("encodes reserved characters and optional quotes as named entities", () => {
    expect(
      encodeHtmlEntities(`<a title="R&D's">`, {
        format: "named",
        encodeQuotes: true,
      }),
    ).toBe("&lt;a title=&quot;R&amp;D&apos;s&quot;&gt;");
  });
  it("leaves quotes unchanged when quote encoding is disabled", () => {
    expect(
      encodeHtmlEntities(`"Tom & Jerry"`, {
        format: "named",
        encodeQuotes: false,
      }),
    ).toBe('"Tom &amp; Jerry"');
  });
  it("encodes Unicode and emoji by code point in decimal and hexadecimal", () => {
    expect(
      encodeHtmlEntities("தமிழ் 🚀", {
        format: "decimal",
        encodeNonAscii: true,
      }),
    ).toContain("&#128640;");
    expect(
      encodeHtmlEntities("🚀", { format: "hexadecimal", encodeNonAscii: true }),
    ).toBe("&#x1F680;");
  });
  it("decodes named, decimal, hexadecimal, and astral entities", () => {
    expect(decodeHtmlEntities("&lt;&copy;&#32;&#x1F680;&gt;")).toBe("<© 🚀>");
  });
  it("preserves unknown, malformed, and invalid entities", () => {
    expect(
      decodeHtmlEntities("&unknown; &amp &#xZZ; &#0; &#xD800; &#x110000;"),
    ).toBe("&unknown; &amp &#xZZ; &#0; &#xD800; &#x110000;");
  });
  it("makes double encoding explicit", () => {
    const encoded = encodeHtmlEntities("&amp;", {
      format: "named",
      encodeQuotes: true,
    });
    expect(encoded).toBe("&amp;amp;");
    expect(decodeHtmlEntities(encoded)).toBe("&amp;");
  });
  it("returns XSS-shaped decoded values as plain strings", () => {
    expect(decodeHtmlEntities("&lt;svg onload=alert(1)&gt;&lt;/svg&gt;")).toBe(
      "<svg onload=alert(1)></svg>",
    );
  });
});
