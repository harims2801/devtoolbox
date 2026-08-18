import { describe, expect, it } from "vitest";
import { getCanonicalRedirect } from "@/lib/deployment-tools";
describe("getCanonicalRedirect", () => {
  it("redirects alternate hosts to HTTPS while preserving the request target", () => {
    const request = new Request("http://www.example.com/tools?mode=json", {
      headers: { "x-forwarded-proto": "http" },
    });
    expect(getCanonicalRedirect(request, "example.com")?.toString()).toBe(
      "https://example.com/tools?mode=json",
    );
  });
  it("does not redirect canonical HTTPS or unsafe host configuration", () => {
    expect(
      getCanonicalRedirect(new Request("https://example.com/"), "example.com"),
    ).toBeNull();
    expect(
      getCanonicalRedirect(
        new Request("https://example.com/"),
        "https://evil.test/path",
      ),
    ).toBeNull();
  });
});
