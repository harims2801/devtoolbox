import { describe, expect, it } from "vitest";
import { isSafeAnalyticsEvent, redactErrorReport } from "@/lib/privacy-tools";
describe("privacy controls", () => {
  it("redacts sensitive error content", () => {
    const value = redactErrorReport(
      new Error(
        "token=secret123 email admin@example.com ip 192.168.1.10 key ghp_abcdefghijklmnopqrstuvwxyz",
      ),
    );
    expect(value).not.toContain("secret123");
    expect(value).not.toContain("admin@example.com");
    expect(value).not.toContain("192.168.1.10");
    expect(value).not.toContain("ghp_");
  });
  it("allows only generic analytics event names", () => {
    expect(isSafeAnalyticsEvent("page_view")).toBe(true);
    expect(isSafeAnalyticsEvent("format_clicked")).toBe(true);
    expect(isSafeAnalyticsEvent("input_hello-secret")).toBe(false);
  });
});
