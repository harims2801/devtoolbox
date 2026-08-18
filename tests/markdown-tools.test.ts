import { describe, expect, it } from "vitest";

import { renderMarkdown, sanitizeMarkdownHtml } from "@/lib/markdown-tools";

describe("renderMarkdown", () => {
  it("renders common GFM, Unicode, tables, tasks, and fenced code", () => {
    const result = renderMarkdown(`# Résumé 🚀

- [x] shipped

| Name | Value |
| --- | --- |
| env | prod |

\`\`\`ts
const ready = true;
\`\`\``);
    expect(result.html).toContain("<h1>Résumé 🚀</h1>");
    expect(result.html).toContain("<table>");
    expect(result.html).toContain('type="checkbox"');
    expect(result.html).toContain('class="language-ts"');
  });

  it("renders raw HTML inertly and blocks unsafe links", () => {
    const result = renderMarkdown(
      "<script>alert(1)</script><img src=x onerror=alert(2)> [bad](javascript:alert(3))",
    );
    expect(result.html).not.toContain("<script");
    expect(result.html).not.toContain('onerror="');
    expect(result.html).not.toContain('href="javascript:');
    expect(result.html).toContain("&lt;script&gt;");
  });

  it("adds safe external link attributes", () => {
    const result = renderMarkdown("[Docs](https://example.com/guide)");
    expect(result.html).toContain('target="_blank"');
    expect(result.html).toContain('rel="noopener noreferrer external"');
  });

  it("blocks images by default and permits explicit HTTPS images", () => {
    const blocked = renderMarkdown("![diagram](https://example.com/a.png)");
    expect(blocked.blockedImages).toBe(1);
    expect(blocked.html).not.toContain("<img");
    const allowed = renderMarkdown("![diagram](https://example.com/a.png)", {
      allowRemoteImages: true,
    });
    expect(allowed.html).toContain('<img src="https://example.com/a.png"');
  });

  it("strips unsupported tags and attributes in the sanitizer", () => {
    const html = sanitizeMarkdownHtml(
      '<iframe src="https://example.com"></iframe><p onclick="x">Safe</p>',
    );
    expect(html).toBe("<p>Safe</p>");
  });
});
