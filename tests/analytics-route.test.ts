import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/analytics/route";
describe("analytics route", () => {
  it("accepts allowlisted generic events", async () =>
    expect(
      (
        await POST(
          new Request("http://localhost/api/analytics", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              origin: "http://localhost",
            },
            body: JSON.stringify({
              event: "tool_open",
              toolId: "json-formatter-validator",
            }),
          }),
        )
      ).status,
    ).toBe(204));
  it("rejects extra values and unknown events", async () => {
    expect(
      (
        await POST(
          new Request("http://localhost/api/analytics", {
            method: "POST",
            body: JSON.stringify({ event: "page_view", input: "secret" }),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          new Request("http://localhost/api/analytics", {
            method: "POST",
            body: JSON.stringify({ event: "hostname_example.com" }),
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("rejects cross-origin posts", async () =>
    expect(
      (
        await POST(
          new Request("http://localhost/api/analytics", {
            method: "POST",
            headers: { origin: "https://attacker.test" },
            body: JSON.stringify({ event: "page_view" }),
          }),
        )
      ).status,
    ).toBe(403));
});
