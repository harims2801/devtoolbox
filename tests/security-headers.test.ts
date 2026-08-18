import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
describe("security headers", () => {
  it("sets browser security policies", async () => {
    const rules = await nextConfig.headers?.();
    const headers = rules?.[0]?.headers ?? [];
    const names = headers.map((x) => x.key.toLowerCase());
    for (const name of [
      "content-security-policy",
      "referrer-policy",
      "permissions-policy",
      "x-content-type-options",
      "x-frame-options",
      "cross-origin-opener-policy",
      "cross-origin-resource-policy",
    ])
      expect(names).toContain(name);
  });
});
