import { describe, expect, it } from "vitest";

import {
  detectStructuredFormat,
  parseStructuredInput,
  renderStructuredOutput,
} from "@/lib/yaml-tools";

describe("YAML and JSON conversion utilities", () => {
  it("parses mappings, arrays, nested values, comments, and colon strings", () => {
    const result = parseStructuredInput(
      `# service config
service:
  enabled: true
  replicas: 3
  endpoints:
    - "https://example.com:443"
    - name: internal
      secure: false`,
      "yaml",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.documents).toEqual([
      {
        service: {
          enabled: true,
          replicas: 3,
          endpoints: [
            "https://example.com:443",
            { name: "internal", secure: false },
          ],
        },
      },
    ]);
  });

  it("supports multi-document YAML and renders JSON", () => {
    const result = parseStructuredInput(
      "name: first\n---\nname: second",
      "yaml",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.statistics.documentCount).toBe(2);
    expect(
      JSON.parse(renderStructuredOutput(result.documents, "json")),
    ).toEqual([{ name: "first" }, { name: "second" }]);
  });

  it("converts JSON to YAML and YAML back to JSON", () => {
    const json = parseStructuredInput(
      '{"service":{"enabled":true,"ports":[80,443]}}',
      "json",
    );
    expect(json.ok).toBe(true);
    if (!json.ok) return;

    const yaml = renderStructuredOutput(json.documents, "yaml");
    expect(yaml).toContain("enabled: true");
    expect(yaml).toContain("- 443");

    const roundTrip = parseStructuredInput(yaml, "yaml");
    expect(roundTrip.ok).toBe(true);
    if (!roundTrip.ok) return;
    expect(roundTrip.documents).toEqual(json.documents);
  });

  it("resolves bounded anchors and aliases", () => {
    const result = parseStructuredInput(
      "defaults: &defaults\n  retries: 3\nservice:\n  <<: *defaults\n  name: api",
      "yaml",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.documents[0]).toEqual({
      defaults: { retries: 3 },
      service: { "<<": { retries: 3 }, name: "api" },
    });
  });

  it("rejects duplicate keys with a source location", () => {
    const result = parseStructuredInput(
      "service: api\nservice: worker",
      "yaml",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/map keys must be unique/i);
    expect(result.error.line).toBeGreaterThan(0);
  });

  it("rejects unsafe custom tags", () => {
    const result = parseStructuredInput(
      "handler: !!js/function 'function () { return 1 }'",
      "yaml",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/tags are not allowed/i);
  });

  it("returns a useful location for malformed YAML", () => {
    const result = parseStructuredInput(
      "service:\n  - valid\n broken: value",
      "yaml",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toMatch(/line \d+, column \d+/);
  });

  it("detects JSON and YAML and sorts object keys without reordering arrays", () => {
    expect(detectStructuredFormat('{"z":1,"a":2}')).toBe("json");
    expect(detectStructuredFormat("z: 1\na: 2")).toBe("yaml");

    const parsed = parseStructuredInput(
      '{"z":1,"a":[{"z":2,"a":3},2,1]}',
      "json",
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const sorted = renderStructuredOutput(parsed.documents, "json", true);
    expect(sorted.indexOf('"a"')).toBeLessThan(sorted.indexOf('"z"'));
    expect(JSON.parse(sorted).a.slice(1)).toEqual([2, 1]);
  });
});
