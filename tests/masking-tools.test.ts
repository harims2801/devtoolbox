import { describe, expect, it } from "vitest";
import {
  detectSensitive,
  MASKING_RULES,
  maskingCounts,
  maskSensitiveText,
} from "@/lib/masking-tools";
const samples: Record<string, string> = {
  "private-key":
    "-----BEGIN PRIVATE KEY-----\nabc123\n-----END PRIVATE KEY-----",
  jwt: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.signature",
  "bearer-token": "Bearer abcdefghijklmnop",
  "aws-access-key": "AKIAIOSFODNN7EXAMPLE",
  "connection-string": "postgres://user:pass@localhost:5432/db",
  "credential-url": "https://user:pass@example.com/path",
  password: "password=supersecret",
  "api-key": "api_key=abcdefghijklmnop",
  "credit-card": "4111 1111 1111 1111",
  email: "ada@example.com",
  ipv4: "192.168.1.10",
  ipv6: "2001:0db8:0000:0000:0000:ff00:0042:8329",
  phone: "+1 415-555-2671",
};
describe("sensitive-data detection", () => {
  for (const rule of MASKING_RULES)
    it(`detects ${rule.category}`, () =>
      expect(
        detectSensitive(samples[rule.category]!, {
          enabled: [rule.category],
        }).map((x) => x.category),
      ).toContain(rule.category));
  it("avoids invalid IP and card false positives", () => {
    expect(
      detectSensitive("999.999.999.999", { enabled: ["ipv4"] }),
    ).toHaveLength(0);
    expect(
      detectSensitive("1234 5678 9012 3456", { enabled: ["credit-card"] }),
    ).toHaveLength(0);
  });
  it("supports custom patterns and counts", () => {
    const detections = detectSensitive("ticket ABC-123", {
      enabled: [],
      customPattern: "ABC-\\d+",
    });
    expect(detections[0]?.category).toBe("custom");
    expect(maskingCounts(detections).custom).toBe(1);
  });
  it("masks completely without exposing values", async () => {
    const text = "Email ada@example.com";
    const output = await maskSensitiveText(
      text,
      detectSensitive(text),
      "complete",
    );
    expect(output).toBe("Email [MASKED:email]");
    expect(output).not.toContain("ada@example.com");
  });
  it("preserves edge characters", async () => {
    const text = "ada@example.com";
    expect(
      await maskSensitiveText(text, detectSensitive(text), "preserve"),
    ).toMatch(/^ad\*+om$/);
  });
  it("creates stable salted pseudonyms", async () => {
    const detections = detectSensitive("ada@example.com");
    const a = await maskSensitiveText(
      "ada@example.com",
      detections,
      "pseudonym",
      "salt",
    );
    const b = await maskSensitiveText(
      "ada@example.com",
      detections,
      "pseudonym",
      "salt",
    );
    expect(a).toBe(b);
    expect(a).toMatch(/^pseudo_[0-9a-f]{16}$/);
  });
  it("rejects invalid custom patterns and oversized input", () => {
    expect(() => detectSensitive("x", { customPattern: "[" })).toThrow(/valid/);
    expect(() => detectSensitive("x".repeat(250001))).toThrow(/250,000/);
  });
});
