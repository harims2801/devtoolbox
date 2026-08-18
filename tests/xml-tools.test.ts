import { describe, expect, it } from "vitest";
import { formatXml, minifyXml, validateXml } from "@/lib/xml-tools";

describe("XML tools", () => {
  it("formats declarations, namespaces, comments, CDATA, attributes, and Unicode", () => {
    const input = `<?xml version="1.0"?><root xmlns:x="urn:test" label="வணக்கம்"><!--note--><x:item><![CDATA[A & B]]></x:item></root>`;
    const result = formatXml(input, 2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain('<?xml version="1.0"?>');
      expect(result.output).toContain('xmlns:x="urn:test"');
      expect(result.output).toContain("<![CDATA[A & B]]>");
      expect(result.output).toContain("வணக்கம்");
      expect(result.output).toContain("\n  <!--note-->");
    }
  });

  it("preserves mixed content without inserting destructive whitespace", () => {
    const result = formatXml("<p>Hello <strong>world</strong>!</p>");
    expect(result).toEqual({
      ok: true,
      output: "<p>Hello <strong>world</strong>!</p>",
    });
  });

  it("minifies insignificant whitespace", () => {
    const result = minifyXml('<root>\n  <item id="1">value</item>\n</root>');
    expect(result).toEqual({
      ok: true,
      output: '<root><item id="1">value</item></root>',
    });
  });

  it("reports malformed XML", () => {
    const result = validateXml("<root><item></root>");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/Malformed XML/i);
  });

  it.each([
    "<!DOCTYPE root><root />",
    '<!DOCTYPE root [<!ENTITY x SYSTEM "file:///etc/passwd">]><root>&x;</root>',
  ])("blocks unsafe declarations: %s", (input) => {
    const result = formatXml(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/blocked/i);
  });
});
