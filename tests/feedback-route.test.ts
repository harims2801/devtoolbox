import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, resetFeedbackRateLimits } from "@/app/api/feedback/route";
const body = () => ({
  category: "suggestion",
  message: "Please add another useful formatting mode.",
  email: "",
  toolId: "json-formatter-validator",
  toolName: "JSON Formatter and Validator",
  browser: "Test Browser",
  appVersion: "0.1.0",
  consent: true,
  website: "",
  startedAt: Date.now() - 3000,
});
const request = (value: unknown = body(), ip = "1.2.3.4") =>
  new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(value),
  });
beforeEach(() => {
  resetFeedbackRateLimits();
  process.env.FEEDBACK_WEBHOOK_URL = "https://feedback.example.test/submit";
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 202 })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.FEEDBACK_WEBHOOK_URL;
});
describe("feedback route", () => {
  it("submits validated feedback", async () =>
    expect((await POST(request())).status).toBe(200));
  it("rejects input/output metadata", async () =>
    expect((await POST(request({ ...body(), input: "secret" }))).status).toBe(
      400,
    ));
  it("rate limits repeated submissions", async () => {
    for (let i = 0; i < 5; i++)
      expect((await POST(request(body(), "5.6.7.8"))).status).toBe(200);
    expect((await POST(request(body(), "5.6.7.8"))).status).toBe(429);
  });
  it("returns a safe provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("provider secret");
      }),
    );
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: "Feedback could not be delivered. Please try again later.",
    });
  });
});
